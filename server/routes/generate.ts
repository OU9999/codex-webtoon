import { Router, type Response } from 'express';
import OpenAI, { toFile } from 'openai';
import {
  generateImageViaOAuth,
  OAuthGenerateError,
} from '../lib/auth/oauth-runtime.js';
import {
  MissingApiKeyError,
  resolveOpenAiApiKey,
} from '../lib/provider/api-key.js';
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
import type { ApiError, ReferenceImageRef } from '../../shared/types.js';

type ProviderRequest = 'auto' | 'openai' | 'oauth';
type ProviderResolved = 'openai' | 'oauth';

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

class GenerateValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = 'GenerateValidationError';
  }
}

class GenerationTimeoutError extends Error {
  constructor() {
    super(
      `Image generation timed out after ${Math.round(GENERATION_TIMEOUT_MS / 1000)} seconds.`,
    );
    this.name = 'GenerationTimeoutError';
  }
}

const withGenerationTimeout = async <Result>(
  task: (signal: AbortSignal) => Promise<Result>,
): Promise<Result> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    return await task(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new GenerationTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
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
    if (
      typeof reference.panelId !== 'string' ||
      !reference.panelId.trim() ||
      typeof reference.candidateId !== 'string' ||
      !reference.candidateId.trim()
    ) {
      throw new GenerateValidationError(
        'referenceImages',
        'referenceImages entries must include panelId and candidateId.',
      );
    }

    const panelId = reference.panelId.trim();
    const candidateId = reference.candidateId.trim();
    const key = `${panelId}:${candidateId}`;
    if (seen.has(key)) continue;

    references.push({ panelId, candidateId });
    seen.add(key);
  }

  return references;
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
    if (
      body.provider === 'auto' ||
      body.provider === 'openai' ||
      body.provider === 'oauth'
    ) {
      provider = body.provider;
    } else {
      throw new GenerateValidationError(
        'provider',
        'provider must be one of: auto, openai, oauth.',
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
): { provider: ProviderResolved; apiKey?: string; oauthUrl?: string } => {
  if (requested === 'oauth' || requested === 'auto') {
    const handle = getOAuthHandle();
    if (handle && handle.state === 'ready' && handle.url) {
      return { provider: 'oauth', oauthUrl: handle.url };
    }
    if (requested === 'oauth') {
      throw new OAuthGenerateError(
        'oauth_unavailable',
        503,
        handle?.lastError ?? 'OAuth proxy is not ready.',
      );
    }
  }

  const apiKey = resolveOpenAiApiKey();
  return { provider: 'openai', apiKey };
};

interface GeneratedPng {
  buffer: Buffer;
  model: string;
}

interface ReferenceImageBuffer extends ReferenceImageRef {
  buffer: Buffer;
}

const readReferenceImages = (
  projectDir: string,
  references: ReferenceImageRef[],
): ReferenceImageBuffer[] =>
  references.map((reference) => ({
    ...reference,
    buffer: readCandidatePng({
      projectDir,
      panelId: reference.panelId,
      candidateId: reference.candidateId,
    }),
  }));

const generatePng = async (
  resolved: ReturnType<typeof resolveProvider>,
  prompt: string,
  size: ImageSize,
  referenceImages: ReferenceImageBuffer[],
): Promise<GeneratedPng> =>
  withGenerationTimeout(async (signal) => {
    if (resolved.provider === 'oauth') {
      const result = await generateImageViaOAuth({
        oauthUrl: resolved.oauthUrl ?? '',
        prompt,
        size,
        referenceImageDataUrls: referenceImages.map(
          (reference) =>
            `data:image/png;base64,${reference.buffer.toString('base64')}`,
        ),
        signal,
      });
      return { buffer: Buffer.from(result.b64, 'base64'), model: result.model };
    }

    const model = 'gpt-image-1';
    const client = new OpenAI({ apiKey: resolved.apiKey });
    if (referenceImages.length > 0) {
      const image = await Promise.all(
        referenceImages.map((reference, index) =>
          toFile(reference.buffer, `reference-${index + 1}.png`, {
            type: 'image/png',
          }),
        ),
      );
      const response = await client.images.edit(
        {
          model,
          prompt,
          size,
          n: 1,
          image,
          input_fidelity: 'high',
        },
        { signal },
      );

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) {
        throw new Error('Image provider returned no data.');
      }
      return { buffer: Buffer.from(b64, 'base64'), model };
    }

    const response = await client.images.generate(
      {
        model,
        prompt,
        size,
        n: 1,
      },
      { signal },
    );

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('Image provider returned no data.');
    }
    return { buffer: Buffer.from(b64, 'base64'), model };
  });

const sendGenerationError = (res: Response, err: unknown): void => {
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

const generateRouter = Router();

generateRouter.post('/', async (req, res) => {
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
    if (err instanceof MissingApiKeyError) {
      const body: ApiError = { error: 'missing_api_key', message: err.message };
      res.status(400).json(body);
      return;
    }
    throw err;
  }

  const size = pickSize(parsed.height);

  let referenceImages: ReferenceImageBuffer[];
  try {
    referenceImages = readReferenceImages(projectDir, parsed.referenceImages);
  } catch (err) {
    sendGenerationError(res, err);
    return;
  }

  const outcomes = await Promise.allSettled(
    Array.from({ length: parsed.count }, () =>
      generatePng(resolved, parsed.prompt, size, referenceImages),
    ),
  );

  const fulfilled = outcomes.filter(
    (outcome): outcome is PromiseFulfilledResult<GeneratedPng> =>
      outcome.status === 'fulfilled',
  );
  const firstRejection = outcomes.find(
    (outcome): outcome is PromiseRejectedResult =>
      outcome.status === 'rejected',
  );

  if (fulfilled.length === 0) {
    sendGenerationError(res, firstRejection?.reason);
    return;
  }
  if (firstRejection) {
    const reason =
      firstRejection.reason instanceof Error
        ? firstRejection.reason.message
        : String(firstRejection.reason);
    console.warn(
      `[wps] generate: ${parsed.count - fulfilled.length}/${parsed.count} variants failed (${reason}); returning ${fulfilled.length}.`,
    );
  }

  try {
    const saved = fulfilled.map(({ value: { buffer, model } }) =>
      saveCandidate({
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
      }),
    );

    touchProject(parsed.projectName);
    res.status(201).json(saved);
  } catch (err) {
    sendGenerationError(res, err);
  }
});

export { generateRouter };
