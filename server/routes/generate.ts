import { Router, type Request, type Response } from 'express';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  generateImageViaOAuth,
  OAuthGenerateError,
} from '../lib/auth/oauth-runtime.js';
import {
  ImageStoreError,
  readCandidatePng,
  saveCandidate,
} from '../lib/image-store.js';
import {
  ProjectError,
  getProjectDir,
  touchProject,
} from '../lib/project-store.js';
import { getOAuthHandle } from '../runtime-context.js';
import {
  getReferenceImageKey,
  isExternalReferenceImage,
  normalizeExternalReferenceImage,
} from '../../shared/reference-images.js';
import type { ApiError, ReferenceImageRef } from '../../shared/types.js';

type ProviderRequest = 'auto' | 'oauth';
type ProviderResolved = 'oauth';

interface GenerateRequestBody {
  projectName?: unknown;
  panelId?: unknown;
  prompt?: unknown;
  height?: unknown;
  provider?: unknown;
  count?: unknown;
  referenceImages?: unknown;
}

interface ParsedRequest {
  projectName: string;
  panelId: string;
  prompt: string;
  height: number;
  provider: ProviderRequest;
  count: number;
  referenceImages: ReferenceImageRef[];
}

const MAX_COUNT = 4;
const MAX_REFERENCE_IMAGES = 4;
const GENERATION_TIMEOUT_MS = 180_000;
const EXTERNAL_REFERENCE_FETCH_TIMEOUT_MS = 15_000;
const MAX_EXTERNAL_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_EXTERNAL_REFERENCE_REDIRECTS = 3;
const DATA_REFERENCE_IMAGE_PATTERN =
  /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i;
const SUPPORTED_REFERENCE_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

class GenerateValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = 'GenerateValidationError';
  }
}

interface DnsAddress {
  address: string;
  family: number;
}

class GenerationTimeoutError extends Error {
  constructor() {
    super(
      `Image generation timed out after ${Math.round(GENERATION_TIMEOUT_MS / 1000)} seconds.`,
    );
    this.name = 'GenerationTimeoutError';
  }
}

class GenerationAbortError extends Error {
  constructor() {
    super('Image generation was canceled.');
    this.name = 'GenerationAbortError';
  }
}

const abortWithGenerationCancel = (controller: AbortController): void => {
  if (controller.signal.aborted) return;

  controller.abort(new GenerationAbortError());
};

const throwIfGenerationAborted = (signal: AbortSignal): void => {
  if (!signal.aborted) return;

  if (signal.reason instanceof GenerationAbortError) {
    throw signal.reason;
  }

  throw new GenerationAbortError();
};

const linkAbortSignal = (
  source: AbortSignal,
  target: AbortController,
): (() => void) => {
  if (source.aborted) {
    abortWithGenerationCancel(target);
    return () => undefined;
  }

  const handleAbort = (): void => abortWithGenerationCancel(target);
  source.addEventListener('abort', handleAbort, { once: true });

  return () => source.removeEventListener('abort', handleAbort);
};

const withGenerationTimeout = async <Result>(
  task: (signal: AbortSignal) => Promise<Result>,
  signal: AbortSignal,
): Promise<Result> => {
  const controller = new AbortController();
  const unlinkAbortSignal = linkAbortSignal(signal, controller);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new GenerationTimeoutError());
  }, GENERATION_TIMEOUT_MS);

  try {
    throwIfGenerationAborted(signal);
    return await task(controller.signal);
  } catch (err) {
    if (signal.aborted) {
      throw new GenerationAbortError();
    }
    if (timedOut && controller.signal.aborted) {
      throw new GenerationTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    unlinkAbortSignal();
  }
};

const referenceImageValidationError = (
  message: string,
): GenerateValidationError =>
  new GenerateValidationError('referenceImages', message);

const normalizeUrlHostname = (hostname: string): string => {
  const withoutBrackets = hostname.replace(/^\[(.*)]$/, '$1');
  return withoutBrackets.replace(/\.$/, '').toLowerCase();
};

const isLocalhostHostname = (hostname: string): boolean => {
  const normalized = normalizeUrlHostname(hostname);
  return normalized === 'localhost' || normalized.endsWith('.localhost');
};

const getIpv4Octets = (
  address: string,
): [number, number, number, number] | null => {
  const normalized = normalizeUrlHostname(address);
  if (isIP(normalized) !== 4) return null;

  const octets = normalized.split('.').map((part) => Number(part));
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return null;
  }

  return [octets[0] ?? 0, octets[1] ?? 0, octets[2] ?? 0, octets[3] ?? 0];
};

const isBlockedIpv4Address = (address: string): boolean => {
  const octets = getIpv4Octets(address);
  if (!octets) return false;

  const [first, second, third] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
};

const normalizeEmbeddedIpv4InIpv6 = (address: string): string => {
  const match = address.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (!match) return address;

  const [, prefix, ipv4Address] = match;
  if (!prefix || !ipv4Address) return address;

  const octets = getIpv4Octets(ipv4Address);
  if (!octets) return address;

  const high = (octets[0] << 8) + octets[1];
  const low = (octets[2] << 8) + octets[3];
  return `${prefix}${high.toString(16)}:${low.toString(16)}`;
};

const parseIpv6ToBigInt = (address: string): bigint | null => {
  const normalized = normalizeEmbeddedIpv4InIpv6(
    normalizeUrlHostname(address).split('%')[0] ?? '',
  );
  if (isIP(normalized) !== 6) return null;

  const compactParts = normalized.split('::');
  if (compactParts.length > 2) return null;

  const left = compactParts[0] ? compactParts[0].split(':') : [];
  const right = compactParts[1] ? compactParts[1].split(':') : [];
  const missingGroupCount = 8 - left.length - right.length;

  if (compactParts.length === 1 && missingGroupCount !== 0) return null;
  if (compactParts.length === 2 && missingGroupCount < 1) return null;

  const groups = [
    ...left,
    ...Array<string>(missingGroupCount).fill('0'),
    ...right,
  ];
  if (groups.length !== 8) return null;

  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    value = (value << 16n) + BigInt(Number.parseInt(group, 16));
  }

  return value;
};

const ipv4AddressFromIpv6LowBits = (value: bigint): string => {
  const lower = value & 0xffff_ffffn;
  return [
    Number((lower >> 24n) & 0xffn),
    Number((lower >> 16n) & 0xffn),
    Number((lower >> 8n) & 0xffn),
    Number(lower & 0xffn),
  ].join('.');
};

const ipv6MatchesPrefix = (
  value: bigint,
  prefix: string,
  prefixLength: number,
): boolean => {
  const prefixValue = parseIpv6ToBigInt(prefix);
  if (prefixValue === null) return false;

  const shift = BigInt(128 - prefixLength);
  return value >> shift === prefixValue >> shift;
};

const isBlockedIpv6Address = (address: string): boolean => {
  const value = parseIpv6ToBigInt(address);
  if (value === null) return false;

  if (
    ipv6MatchesPrefix(value, '::ffff:0:0', 96) &&
    isBlockedIpv4Address(ipv4AddressFromIpv6LowBits(value))
  ) {
    return true;
  }

  if (
    value > 1n &&
    value >> 32n === 0n &&
    isBlockedIpv4Address(ipv4AddressFromIpv6LowBits(value))
  ) {
    return true;
  }

  return (
    value === 0n ||
    value === 1n ||
    ipv6MatchesPrefix(value, 'fc00::', 7) ||
    ipv6MatchesPrefix(value, 'fe80::', 10) ||
    ipv6MatchesPrefix(value, 'ff00::', 8)
  );
};

const isBlockedIpAddress = (address: string): boolean => {
  const normalized = normalizeUrlHostname(address);
  const version = isIP(normalized);
  if (version === 4) return isBlockedIpv4Address(normalized);
  if (version === 6) return isBlockedIpv6Address(normalized);

  return false;
};

const isSafeExternalReferenceHttpUrl = (url: URL): boolean => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const hostname = normalizeUrlHostname(url.hostname);
  if (!hostname || isLocalhostHostname(hostname)) return false;
  if (isIP(hostname) && isBlockedIpAddress(hostname)) return false;

  return true;
};

const assertSafeExternalReferenceHttpUrl = async (url: URL): Promise<void> => {
  if (!isSafeExternalReferenceHttpUrl(url)) {
    throw referenceImageValidationError(
      'External reference image URLs must use public http(s) URLs.',
    );
  }

  const hostname = normalizeUrlHostname(url.hostname);
  if (isIP(hostname)) return;

  let addresses: DnsAddress[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw referenceImageValidationError(
      'External reference image host could not be resolved.',
    );
  }

  if (addresses.length === 0) {
    throw referenceImageValidationError(
      'External reference image host could not be resolved.',
    );
  }
  if (addresses.some((address) => isBlockedIpAddress(address.address))) {
    throw referenceImageValidationError(
      'External reference image URLs must resolve to public IP addresses.',
    );
  }
};

const parseReferenceImages = (value: unknown): ReferenceImageRef[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new GenerateValidationError(
      'referenceImages',
      'referenceImages must be an array.',
    );
  }
  if (value.length > MAX_REFERENCE_IMAGES) {
    throw new GenerateValidationError(
      'referenceImages',
      `referenceImages must contain ${MAX_REFERENCE_IMAGES} images or fewer.`,
    );
  }

  const references: ReferenceImageRef[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      throw new GenerateValidationError(
        'referenceImages',
        'referenceImages entries must be objects.',
      );
    }

    const reference = item as Record<string, unknown>;
    let parsedReference: ReferenceImageRef;
    if (reference.source === 'external') {
      if (
        typeof reference.imageUrl !== 'string' ||
        !reference.imageUrl.trim()
      ) {
        throw new GenerateValidationError(
          'referenceImages',
          'external reference images must include imageUrl.',
        );
      }

      const imageUrl = reference.imageUrl.trim();
      if (!isSupportedExternalReferenceImageUrl(imageUrl)) {
        throw new GenerateValidationError(
          'referenceImages',
          'external reference image URLs must be public http(s) URLs or png/jpeg/webp data URLs.',
        );
      }

      parsedReference = normalizeExternalReferenceImage({
        id: typeof reference.id === 'string' ? reference.id : undefined,
        imageUrl,
        title:
          typeof reference.title === 'string' ? reference.title : undefined,
        createdAt:
          typeof reference.createdAt === 'string'
            ? reference.createdAt
            : undefined,
      });
    } else if (
      typeof reference.panelId === 'string' &&
      reference.panelId.trim() &&
      typeof reference.candidateId === 'string' &&
      reference.candidateId.trim()
    ) {
      parsedReference = {
        source: 'candidate',
        panelId: reference.panelId.trim(),
        candidateId: reference.candidateId.trim(),
      };
    } else {
      throw new GenerateValidationError(
        'referenceImages',
        'referenceImages entries must include panelId and candidateId or external imageUrl.',
      );
    }

    const key = getReferenceImageKey(parsedReference);
    if (seen.has(key)) continue;

    references.push(parsedReference);
    seen.add(key);
  }

  return references;
};

const isSupportedExternalReferenceImageUrl = (imageUrl: string): boolean => {
  if (DATA_REFERENCE_IMAGE_PATTERN.test(imageUrl)) return true;

  try {
    const url = new URL(imageUrl);
    return isSafeExternalReferenceHttpUrl(url);
  } catch {
    return false;
  }
};

const parseRequest = (body: GenerateRequestBody): ParsedRequest => {
  if (typeof body.projectName !== 'string' || !body.projectName.trim()) {
    throw new GenerateValidationError(
      'projectName',
      'projectName must be a non-empty string.',
    );
  }
  if (typeof body.panelId !== 'string' || !body.panelId.trim()) {
    throw new GenerateValidationError(
      'panelId',
      'panelId must be a non-empty string.',
    );
  }
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
    throw new GenerateValidationError(
      'prompt',
      'prompt must be a non-empty string.',
    );
  }
  if (
    typeof body.height !== 'number' ||
    !Number.isFinite(body.height) ||
    body.height <= 0
  ) {
    throw new GenerateValidationError(
      'height',
      'height must be a positive number.',
    );
  }

  let provider: ProviderRequest = 'auto';
  if (typeof body.provider === 'string') {
    if (body.provider === 'auto' || body.provider === 'oauth') {
      provider = body.provider;
    } else {
      throw new GenerateValidationError(
        'provider',
        'provider must be one of: auto, oauth.',
      );
    }
  }

  let count = 1;
  if (body.count !== undefined) {
    if (
      typeof body.count !== 'number' ||
      !Number.isInteger(body.count) ||
      body.count < 1 ||
      body.count > MAX_COUNT
    ) {
      throw new GenerateValidationError(
        'count',
        `count must be an integer between 1 and ${MAX_COUNT}.`,
      );
    }
    count = body.count;
  }

  return {
    projectName: body.projectName.trim(),
    panelId: body.panelId.trim(),
    prompt: body.prompt.trim(),
    height: body.height,
    provider,
    count,
    referenceImages: parseReferenceImages(body.referenceImages),
  };
};

type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';

const PANEL_WIDTH = 720;

const pickSize = (height: number): ImageSize => {
  const ratio = height / PANEL_WIDTH;
  if (ratio < 0.85) return '1536x1024';
  if (ratio > 1.15) return '1024x1536';
  return '1024x1024';
};

const resolveProvider = (
  requested: ProviderRequest,
): { provider: ProviderResolved; oauthUrl: string } => {
  if (requested === 'oauth' || requested === 'auto') {
    const handle = getOAuthHandle();
    if (handle && handle.state === 'ready' && handle.url) {
      return { provider: 'oauth', oauthUrl: handle.url };
    }
  }

  throw new OAuthGenerateError(
    'oauth_unavailable',
    503,
    getOAuthHandle()?.lastError ?? 'OAuth proxy is not ready.',
  );
};

interface GeneratedPng {
  buffer: Buffer;
  model: string;
}

interface ReferenceImageBuffer {
  reference: ReferenceImageRef;
  buffer: Buffer;
  mediaType: string;
}

const assertReferenceImageSize = (buffer: Buffer): void => {
  if (buffer.length === 0) {
    throw referenceImageValidationError('External reference image is empty.');
  }
  if (buffer.length > MAX_EXTERNAL_REFERENCE_IMAGE_BYTES) {
    throw referenceImageValidationError(
      'External reference image must be 10MB or smaller.',
    );
  }
};

const parseDataReferenceImage = (
  imageUrl: string,
): { buffer: Buffer; mediaType: string } | null => {
  const match = imageUrl.match(DATA_REFERENCE_IMAGE_PATTERN);
  if (!match) return null;

  const [, mediaType, base64] = match;
  if (!mediaType || !base64) return null;

  const buffer = Buffer.from(base64.replace(/\s/g, ''), 'base64');
  assertReferenceImageSize(buffer);
  return { buffer, mediaType: mediaType.toLowerCase() };
};

const isRedirectResponse = (response: globalThis.Response): boolean =>
  REDIRECT_STATUS_CODES.has(response.status);

const cancelResponseBody = async (
  response: globalThis.Response,
): Promise<void> => {
  try {
    await response.body?.cancel();
  } catch {}
};

const getRedirectUrl = (
  response: globalThis.Response,
  currentUrl: URL,
): URL => {
  const location = response.headers.get('location');
  if (!location) {
    throw referenceImageValidationError(
      'External reference image redirect is missing a location.',
    );
  }

  try {
    return new URL(location, currentUrl);
  } catch {
    throw referenceImageValidationError(
      'External reference image redirect location is invalid.',
    );
  }
};

const fetchExternalReferenceResponse = async (
  url: URL,
  signal: AbortSignal,
  redirectCount = 0,
): Promise<globalThis.Response> => {
  await assertSafeExternalReferenceHttpUrl(url);

  const response = await fetch(url, {
    signal,
    redirect: 'manual',
  });

  if (!isRedirectResponse(response)) return response;

  await cancelResponseBody(response);
  if (redirectCount >= MAX_EXTERNAL_REFERENCE_REDIRECTS) {
    throw referenceImageValidationError(
      'External reference image redirected too many times.',
    );
  }

  return fetchExternalReferenceResponse(
    getRedirectUrl(response, url),
    signal,
    redirectCount + 1,
  );
};

const readExternalReferenceBody = async (
  response: globalThis.Response,
  abortFetch: () => void,
): Promise<Buffer> => {
  if (!response.body) {
    throw referenceImageValidationError(
      'External reference image returned no body.',
    );
  }

  const contentLength = response.headers.get('content-length');
  if (
    contentLength &&
    Number(contentLength) > MAX_EXTERNAL_REFERENCE_IMAGE_BYTES
  ) {
    abortFetch();
    await cancelResponseBody(response);
    throw referenceImageValidationError(
      'External reference image must be 10MB or smaller.',
    );
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    const chunk = Buffer.from(value);
    totalBytes += chunk.length;
    if (totalBytes > MAX_EXTERNAL_REFERENCE_IMAGE_BYTES) {
      await reader.cancel().catch(() => undefined);
      abortFetch();
      throw referenceImageValidationError(
        'External reference image must be 10MB or smaller.',
      );
    }

    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks, totalBytes);
  assertReferenceImageSize(buffer);
  return buffer;
};

const fetchExternalReferenceImage = async (
  imageUrl: string,
  signal: AbortSignal,
): Promise<{ buffer: Buffer; mediaType: string }> => {
  const controller = new AbortController();
  const unlinkAbortSignal = linkAbortSignal(signal, controller);
  const timeout = setTimeout(
    () => controller.abort(),
    EXTERNAL_REFERENCE_FETCH_TIMEOUT_MS,
  );

  try {
    throwIfGenerationAborted(signal);
    const response = await fetchExternalReferenceResponse(
      new URL(imageUrl),
      controller.signal,
    );
    if (!response.ok) {
      await cancelResponseBody(response);
      throw referenceImageValidationError(
        `External reference image returned ${response.status}.`,
      );
    }

    const mediaType = response.headers
      .get('content-type')
      ?.split(';')[0]
      ?.trim()
      .toLowerCase();
    if (!mediaType || !SUPPORTED_REFERENCE_IMAGE_TYPES.has(mediaType)) {
      await cancelResponseBody(response);
      throw referenceImageValidationError(
        'External reference image must be png, jpeg, or webp.',
      );
    }

    const buffer = await readExternalReferenceBody(response, () =>
      controller.abort(),
    );
    return { buffer, mediaType };
  } catch (err) {
    if (err instanceof GenerateValidationError) throw err;
    if (signal.aborted) {
      throw new GenerationAbortError();
    }
    if (controller.signal.aborted) {
      throw referenceImageValidationError(
        'External reference image request was aborted.',
      );
    }

    throw referenceImageValidationError(
      err instanceof Error
        ? err.message
        : 'External reference image could not be loaded.',
    );
  } finally {
    clearTimeout(timeout);
    unlinkAbortSignal();
  }
};

const readExternalReferenceImage = async (
  reference: ReferenceImageRef,
  signal: AbortSignal,
): Promise<ReferenceImageBuffer> => {
  throwIfGenerationAborted(signal);
  if (!reference.imageUrl) {
    throw new Error('External reference image is missing imageUrl.');
  }

  const dataImage = parseDataReferenceImage(reference.imageUrl);
  const image =
    dataImage ??
    (await fetchExternalReferenceImage(reference.imageUrl, signal));

  return {
    reference,
    buffer: image.buffer,
    mediaType: image.mediaType,
  };
};

const readReferenceImage = async (
  projectDir: string,
  reference: ReferenceImageRef,
  signal: AbortSignal,
): Promise<ReferenceImageBuffer> => {
  throwIfGenerationAborted(signal);
  if (isExternalReferenceImage(reference)) {
    return readExternalReferenceImage(reference, signal);
  }

  if (!reference.panelId || !reference.candidateId) {
    throw new Error('Candidate reference image is missing identifiers.');
  }

  return {
    reference,
    buffer: readCandidatePng({
      projectDir,
      panelId: reference.panelId,
      candidateId: reference.candidateId,
    }),
    mediaType: 'image/png',
  };
};

const readReferenceImages = async (
  projectDir: string,
  references: ReferenceImageRef[],
  signal: AbortSignal,
): Promise<ReferenceImageBuffer[]> =>
  Promise.all(
    references.map((reference) =>
      readReferenceImage(projectDir, reference, signal),
    ),
  );

const generatePng = async (
  resolved: ReturnType<typeof resolveProvider>,
  prompt: string,
  size: ImageSize,
  referenceImages: ReferenceImageBuffer[],
  signal: AbortSignal,
): Promise<GeneratedPng> =>
  withGenerationTimeout(async (timeoutSignal) => {
    const result = await generateImageViaOAuth({
      oauthUrl: resolved.oauthUrl,
      prompt,
      size,
      referenceImageDataUrls: referenceImages.map(
        (reference) =>
          `data:${reference.mediaType};base64,${reference.buffer.toString('base64')}`,
      ),
      signal: timeoutSignal,
    });
    return { buffer: Buffer.from(result.b64, 'base64'), model: result.model };
  }, signal);

const sendGenerationError = (res: Response, err: unknown): void => {
  if (err instanceof GenerationAbortError) {
    if (!res.headersSent && !res.destroyed) {
      const body: ApiError = {
        error: 'generation_canceled',
        message: err.message,
      };
      res.status(499).json(body);
    }
    return;
  }
  if (err instanceof GenerateValidationError) {
    const body: ApiError = { error: 'invalid_request', message: err.message };
    res.status(400).json(body);
    return;
  }
  if (err instanceof ImageStoreError) {
    const body: ApiError = { error: err.code, message: err.message };
    res.status(400).json(body);
    return;
  }
  if (err instanceof OAuthGenerateError) {
    const body: ApiError = { error: err.code, message: err.message };
    res.status(err.status).json(body);
    return;
  }
  if (err instanceof GenerationTimeoutError) {
    const body: ApiError = {
      error: 'generation_timeout',
      message: err.message,
    };
    res.status(504).json(body);
    return;
  }
  const message = err instanceof Error ? err.message : 'Generation failed.';
  const body: ApiError = { error: 'generation_failed', message };
  res.status(502).json(body);
};

const createRequestAbortController = (
  req: Request,
  res: Response,
): AbortController => {
  const controller = new AbortController();
  let responseFinished = false;

  const handleRequestAborted = (): void =>
    abortWithGenerationCancel(controller);
  const cleanup = (): void => {
    req.off('aborted', handleRequestAborted);
    res.off('finish', handleFinish);
    res.off('close', handleClose);
  };
  const handleFinish = (): void => {
    responseFinished = true;
    cleanup();
  };
  const handleClose = (): void => {
    if (!responseFinished) {
      abortWithGenerationCancel(controller);
    }
    cleanup();
  };

  req.once('aborted', handleRequestAborted);
  res.once('finish', handleFinish);
  res.once('close', handleClose);

  return controller;
};

const generateRouter = Router();

generateRouter.post('/', async (req, res) => {
  const requestAbortController = createRequestAbortController(req, res);
  const requestSignal = requestAbortController.signal;

  let parsed: ParsedRequest;
  try {
    parsed = parseRequest((req.body ?? {}) as GenerateRequestBody);
  } catch (err) {
    const body: ApiError = {
      error: 'invalid_request',
      message: err instanceof Error ? err.message : 'Invalid request body.',
    };
    res.status(400).json(body);
    return;
  }

  let projectDir: string;
  try {
    projectDir = getProjectDir(parsed.projectName);
  } catch (err) {
    if (err instanceof ProjectError) {
      const status = err.code === 'project_not_found' ? 404 : 400;
      const body: ApiError = { error: err.code, message: err.message };
      res.status(status).json(body);
      return;
    }
    const body: ApiError = {
      error: 'internal',
      message: err instanceof Error ? err.message : 'Unknown error.',
    };
    res.status(500).json(body);
    return;
  }

  let resolved: ReturnType<typeof resolveProvider>;
  try {
    resolved = resolveProvider(parsed.provider);
  } catch (err) {
    if (err instanceof OAuthGenerateError) {
      const body: ApiError = { error: err.code, message: err.message };
      res.status(err.status).json(body);
      return;
    }
    throw err;
  }

  const size = pickSize(parsed.height);

  let referenceImages: ReferenceImageBuffer[];
  try {
    referenceImages = await readReferenceImages(
      projectDir,
      parsed.referenceImages,
      requestSignal,
    );
  } catch (err) {
    if (requestSignal.aborted) return;
    sendGenerationError(res, err);
    return;
  }

  if (requestSignal.aborted) return;

  const outcomes = await Promise.allSettled(
    Array.from({ length: parsed.count }, () =>
      generatePng(
        resolved,
        parsed.prompt,
        size,
        referenceImages,
        requestSignal,
      ),
    ),
  );

  if (requestSignal.aborted) return;

  const fulfilled = outcomes.filter(
    (outcome): outcome is PromiseFulfilledResult<GeneratedPng> =>
      outcome.status === 'fulfilled',
  );
  const firstRejection = outcomes.find(
    (outcome): outcome is PromiseRejectedResult =>
      outcome.status === 'rejected',
  );

  if (fulfilled.length === 0) {
    if (requestSignal.aborted) return;
    sendGenerationError(res, firstRejection?.reason);
    return;
  }
  if (firstRejection) {
    const reason =
      firstRejection.reason instanceof Error
        ? firstRejection.reason.message
        : String(firstRejection.reason);
    console.warn(
      `[codex-webtoon] generate: ${parsed.count - fulfilled.length}/${parsed.count} variants failed (${reason}); returning ${fulfilled.length}.`,
    );
  }

  try {
    const saved = fulfilled.map(({ value: { buffer, model } }) => {
      throwIfGenerationAborted(requestSignal);

      return saveCandidate({
        projectName: parsed.projectName,
        projectDir,
        panelId: parsed.panelId,
        pngBuffer: buffer,
        metadata: {
          promptSnapshot: parsed.prompt,
          height: parsed.height,
          provider: resolved.provider,
          model,
          size,
          referenceImages: parsed.referenceImages,
        },
      });
    });

    throwIfGenerationAborted(requestSignal);
    touchProject(parsed.projectName);
    res.status(201).json(saved);
  } catch (err) {
    sendGenerationError(res, err);
  }
});

export { generateRouter };
