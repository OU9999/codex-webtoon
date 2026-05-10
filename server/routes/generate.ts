import { Router } from 'express';
import OpenAI from 'openai';
import { generateImageViaOAuth, OAuthGenerateError } from '../lib/auth/oauth-runtime.js';
import {
  MissingApiKeyError,
  resolveOpenAiApiKey,
} from '../lib/provider/api-key.js';
import { ImageStoreError, saveCandidate } from '../lib/image-store.js';
import {
  ProjectError,
  getProjectDir,
  touchProject,
} from '../lib/project-store.js';
import { getOAuthHandle } from '../runtime-context.js';
import type { ApiError } from '../../shared/types.js';

type ProviderRequest = 'auto' | 'openai' | 'oauth';
type ProviderResolved = 'openai' | 'oauth';

interface GenerateRequestBody {
  projectName?: unknown;
  panelId?: unknown;
  prompt?: unknown;
  height?: unknown;
  provider?: unknown;
}

interface ParsedRequest {
  projectName: string;
  panelId: string;
  prompt: string;
  height: number;
  provider: ProviderRequest;
}

class GenerateValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = 'GenerateValidationError';
  }
}

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
    if (body.provider === 'auto' || body.provider === 'openai' || body.provider === 'oauth') {
      provider = body.provider;
    } else {
      throw new GenerateValidationError(
        'provider',
        'provider must be one of: auto, openai, oauth.',
      );
    }
  }

  return {
    projectName: body.projectName.trim(),
    panelId: body.panelId.trim(),
    prompt: body.prompt.trim(),
    height: body.height,
    provider,
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

const generatePng = async (
  resolved: ReturnType<typeof resolveProvider>,
  prompt: string,
  size: ImageSize,
): Promise<GeneratedPng> => {
  if (resolved.provider === 'oauth') {
    const result = await generateImageViaOAuth({
      oauthUrl: resolved.oauthUrl ?? '',
      prompt,
      size,
    });
    return { buffer: Buffer.from(result.b64, 'base64'), model: result.model };
  }

  const model = 'gpt-image-1';
  const client = new OpenAI({ apiKey: resolved.apiKey });
  const response = await client.images.generate({
    model,
    prompt,
    size,
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('Image provider returned no data.');
  }
  return { buffer: Buffer.from(b64, 'base64'), model };
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

  try {
    const { buffer, model } = await generatePng(resolved, parsed.prompt, size);

    const saved = saveCandidate({
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
      },
    });

    touchProject(parsed.projectName);
    res.status(201).json(saved);
  } catch (err) {
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
    const message = err instanceof Error ? err.message : 'Generation failed.';
    const body: ApiError = { error: 'generation_failed', message };
    res.status(502).json(body);
  }
});

export { generateRouter };
