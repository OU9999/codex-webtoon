import type { OAuthHandle } from './oauth-launcher.js';

interface GenerateViaOAuthInput {
  oauthUrl: string;
  prompt: string;
  size: string;
  quality?: string;
  moderation?: string;
  model?: string;
  signal?: AbortSignal;
}

interface OAuthGenerateResult {
  b64: string;
  model: string;
  revisedPrompt: string | null;
}

const DEFAULT_MODEL = 'gpt-5.4-mini';

class OAuthGenerateError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'OAuthGenerateError';
  }
}

const waitForReady = async (
  handle: OAuthHandle,
  timeoutMs = 8000,
): Promise<void> => {
  if (handle.state === 'ready') return;
  if (handle.state === 'failed' || handle.state === 'disabled') {
    throw new OAuthGenerateError(
      'oauth_unavailable',
      503,
      handle.lastError ?? 'OAuth proxy is unavailable.',
    );
  }
  await Promise.race([
    handle.readyPromise.catch((err: unknown) => {
      throw new OAuthGenerateError(
        'oauth_unavailable',
        503,
        err instanceof Error ? err.message : 'OAuth proxy failed to start.',
      );
    }),
    new Promise<void>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new OAuthGenerateError(
              'oauth_timeout',
              504,
              `OAuth proxy did not become ready within ${timeoutMs}ms.`,
            ),
          ),
        timeoutMs,
      ),
    ),
  ]);
};

interface SsePayload {
  type: string;
  partial_image_b64?: string;
  revised_prompt?: string;
  response?: { model?: string };
}

const consumeImageStream = async (
  body: ReadableStream<Uint8Array>,
): Promise<{ b64: string | null; revisedPrompt: string | null; model: string | null }> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let latest: string | null = null;
  let revisedPrompt: string | null = null;
  let model: string | null = null;

  const handleEvent = (block: string): void => {
    const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
    if (!dataLine) return;

    let payload: SsePayload;
    try {
      payload = JSON.parse(dataLine.slice(6)) as SsePayload;
    } catch {
      return;
    }

    if (
      payload.type === 'response.image_generation_call.partial_image' &&
      typeof payload.partial_image_b64 === 'string'
    ) {
      latest = payload.partial_image_b64;
      if (typeof payload.revised_prompt === 'string') {
        revisedPrompt = payload.revised_prompt;
      }
    } else if (
      payload.type === 'response.created' &&
      typeof payload.response?.model === 'string'
    ) {
      model = payload.response.model;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let separator = buffer.indexOf('\n\n');
    while (separator !== -1) {
      const block = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      if (block.trim()) handleEvent(block);
      separator = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) handleEvent(buffer);
  return { b64: latest, revisedPrompt, model };
};

const generateImageViaOAuth = async (
  input: GenerateViaOAuthInput,
): Promise<OAuthGenerateResult> => {
  const requestedModel = input.model ?? DEFAULT_MODEL;
  const quality = input.quality ?? 'medium';
  const moderation = input.moderation ?? 'low';

  const res = await fetch(`${input.oauthUrl}/v1/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    signal: input.signal,
    body: JSON.stringify({
      model: requestedModel,
      input: [{ role: 'user', content: input.prompt }],
      tools: [
        { type: 'image_generation', size: input.size, quality, moderation },
      ],
      tool_choice: 'required',
      reasoning: { effort: 'none' },
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OAuthGenerateError(
      'oauth_http_error',
      res.status,
      text || `OAuth proxy returned ${res.status}.`,
    );
  }

  if (!res.body) {
    throw new OAuthGenerateError(
      'oauth_no_stream',
      502,
      'OAuth proxy returned no streaming body.',
    );
  }

  const { b64, revisedPrompt, model } = await consumeImageStream(res.body);

  if (!b64) {
    throw new OAuthGenerateError(
      'oauth_no_image',
      502,
      'OAuth proxy returned no image data.',
    );
  }

  return { b64, model: model ?? requestedModel, revisedPrompt };
};

export { OAuthGenerateError, generateImageViaOAuth, waitForReady };
export type { GenerateViaOAuthInput, OAuthGenerateResult };
