interface GenerateViaOAuthInput {
  oauthUrl: string;
  prompt: string;
  size: string;
  referenceImageDataUrls?: string[];
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

interface ResponsesInputContentItem {
  type: 'input_text' | 'input_image';
  text?: string;
  image_url?: string;
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

interface ResponsesImageGenerationCall {
  type: string;
  result?: unknown;
  revised_prompt?: unknown;
}

interface ResponsesStreamResponse {
  model?: unknown;
  output?: ResponsesImageGenerationCall[];
  error?: { message?: unknown };
}

interface ResponsesStreamPayload {
  type: string;
  item?: ResponsesImageGenerationCall;
  partial_image_b64?: unknown;
  response?: ResponsesStreamResponse;
  revised_prompt?: unknown;
}

interface ExtractedImage {
  b64: string | null;
  revisedPrompt: string | null;
}

const extractGeneratedImage = (
  output: ResponsesImageGenerationCall[] | undefined,
): ExtractedImage => {
  for (const item of output ?? []) {
    if (item.type !== 'image_generation_call') continue;
    if (typeof item.result !== 'string') continue;

    return {
      b64: item.result,
      revisedPrompt:
        typeof item.revised_prompt === 'string' ? item.revised_prompt : null,
    };
  }

  return { b64: null, revisedPrompt: null };
};

const readOAuthError = async (res: Response): Promise<string> => {
  const text = await res.text().catch(() => '');
  if (!text) return `OAuth proxy returned ${res.status}.`;

  try {
    const payload = JSON.parse(text) as { error?: { message?: unknown } };
    if (typeof payload.error?.message === 'string') {
      return payload.error.message;
    }
  } catch {}

  return text;
};

const parseSsePayload = (block: string): ResponsesStreamPayload | null => {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, ''))
    .join('\n');

  if (!data || data === '[DONE]') return null;

  try {
    return JSON.parse(data) as ResponsesStreamPayload;
  } catch {
    return null;
  }
};

const consumeImageStream = async (
  body: ReadableStream<Uint8Array>,
): Promise<{
  b64: string | null;
  model: string | null;
  revisedPrompt: string | null;
}> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let b64: string | null = null;
  let model: string | null = null;
  let revisedPrompt: string | null = null;
  let errorMessage: string | null = null;

  const useImage = (image: ExtractedImage): void => {
    if (!image.b64) return;
    b64 = image.b64;
    revisedPrompt = image.revisedPrompt ?? revisedPrompt;
  };

  const handleEvent = (block: string): void => {
    const payload = parseSsePayload(block);
    if (!payload) return;

    if (typeof payload.response?.model === 'string') {
      model = payload.response.model;
    }

    if (
      payload.type === 'response.image_generation_call.partial_image' &&
      typeof payload.partial_image_b64 === 'string'
    ) {
      b64 = payload.partial_image_b64;
      revisedPrompt =
        typeof payload.revised_prompt === 'string'
          ? payload.revised_prompt
          : revisedPrompt;
      return;
    }

    if (payload.type === 'response.output_item.done') {
      useImage(
        extractGeneratedImage(payload.item ? [payload.item] : undefined),
      );
      return;
    }

    if (payload.type === 'response.completed') {
      useImage(extractGeneratedImage(payload.response?.output));
      return;
    }

    if (
      payload.type === 'response.failed' ||
      payload.type === 'response.incomplete'
    ) {
      errorMessage =
        typeof payload.response?.error?.message === 'string'
          ? payload.response.error.message
          : 'OAuth proxy image generation failed.';
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

  if (errorMessage) {
    throw new OAuthGenerateError('oauth_stream_failed', 502, errorMessage);
  }

  return { b64, model, revisedPrompt };
};

const generateImageViaOAuth = async (
  input: GenerateViaOAuthInput,
): Promise<OAuthGenerateResult> => {
  const requestedModel = input.model ?? DEFAULT_MODEL;
  const quality = input.quality ?? 'medium';
  const moderation = input.moderation ?? 'low';
  const referenceContent = (input.referenceImageDataUrls ?? []).map(
    (imageUrl): ResponsesInputContentItem => ({
      type: 'input_image',
      image_url: imageUrl,
    }),
  );
  const content: ResponsesInputContentItem[] = [
    { type: 'input_text', text: input.prompt },
    ...referenceContent,
  ];

  const res = await fetch(`${input.oauthUrl}/v1/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    signal: input.signal,
    body: JSON.stringify({
      model: requestedModel,
      input: [
        {
          role: 'user',
          content,
        },
      ],
      tools: [
        {
          type: 'image_generation',
          action: 'generate',
          size: input.size,
          quality,
          moderation,
        },
      ],
      tool_choice: 'required',
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new OAuthGenerateError(
      'oauth_http_error',
      res.status,
      await readOAuthError(res),
    );
  }

  if (!res.body) {
    throw new OAuthGenerateError(
      'oauth_no_stream',
      502,
      'OAuth proxy returned no streaming body.',
    );
  }

  const { b64, model, revisedPrompt } = await consumeImageStream(res.body);

  if (!b64) {
    throw new OAuthGenerateError(
      'oauth_no_image',
      502,
      'OAuth proxy returned no image data.',
    );
  }

  return {
    b64,
    model: model ?? requestedModel,
    revisedPrompt,
  };
};

export { OAuthGenerateError, generateImageViaOAuth };
export type { GenerateViaOAuthInput, OAuthGenerateResult };
