import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { OAuthHandle } from '../server/lib/auth/oauth-launcher.js';
import type { ApiError } from '../shared/types.js';

const testRoot = mkdtempSync(
  join(tmpdir(), 'codex-webtoon-generate-reference-'),
);

process.env.CODEX_WEBTOON_PROJECTS_ROOT = join(testRoot, 'projects');
process.env.CODEX_WEBTOON_CONFIG_DIR = join(testRoot, 'config');
process.env.CODEX_WEBTOON_OAUTH = 'off';

const jsonHeaders = { 'content-type': 'application/json' };
const publicReferenceHost = '93.184.216.34';
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
const tinyPngBuffer = Buffer.from(tinyPngBase64, 'base64');

interface ExternalFetchContext {
  url: URL;
  init?: RequestInit;
}

interface OAuthRequest {
  body: string;
}

interface SavedCandidateResponse {
  id: string;
  imageUrl: string;
}

interface OAuthPayloadContentItem {
  type?: string;
  image_url?: string;
}

interface OAuthPayloadInput {
  content?: OAuthPayloadContentItem[];
}

interface OAuthPayload {
  input?: OAuthPayloadInput[];
}

let server: Server;
let oauthServer: Server;
let baseUrl: string;
let oauthBaseUrl: string;
let projectIndex = 0;
let setOAuthHandle: (handle: OAuthHandle | null) => void;
let externalFetch:
  | ((context: ExternalFetchContext) => Response | Promise<Response>)
  | null = null;
const oauthRequests: OAuthRequest[] = [];
const originalFetch = globalThis.fetch;

const getFetchUrl = (input: Parameters<typeof fetch>[0]): URL => {
  if (typeof input === 'string' || input instanceof URL) {
    return new URL(input);
  }

  return new URL(input.url);
};

const installFetchInterceptor = (): void => {
  globalThis.fetch = ((input, init) => {
    const url = getFetchUrl(input);
    if (url.hostname !== publicReferenceHost) {
      return originalFetch(input, init);
    }
    if (!externalFetch) {
      return Promise.reject(
        new Error(`Unexpected external reference fetch: ${url.href}`),
      );
    }

    return Promise.resolve(externalFetch({ url, init }));
  }) as typeof fetch;
};

const readRequestBody = async (req: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
};

const handleOAuthRequest = async (req: IncomingMessage): Promise<Response> => {
  if (req.method !== 'POST' || req.url !== '/v1/responses') {
    return new Response('Not found', { status: 404 });
  }

  oauthRequests.push({ body: await readRequestBody(req) });
  const payload = {
    type: 'response.completed',
    response: {
      model: 'test-image-model',
      output: [
        {
          type: 'image_generation_call',
          result: tinyPngBase64,
          revised_prompt: null,
        },
      ],
    },
  };

  return new Response(`data: ${JSON.stringify(payload)}\n\n`, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
};

const writeNodeResponse = async (
  response: Response,
  res: import('node:http').ServerResponse,
): Promise<void> => {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
};

const createReadyOAuthHandle = (url: string): OAuthHandle => ({
  state: 'ready',
  url,
  port: Number(new URL(url).port),
  lastError: null,
  readyPromise: Promise.resolve(),
  stop: () => undefined,
});

const createProject = async (): Promise<string> => {
  projectIndex += 1;
  const name = `Remote Reference Project ${projectIndex}`;
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  });
  assert.equal(res.status, 201);

  return name;
};

const generateWithExternalReference = async (
  imageUrl: string,
): Promise<Response> => {
  const projectName = await createProject();

  return fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      projectName,
      panelId: 'panel-1',
      prompt: 'Draw a small test panel.',
      height: 600,
      provider: 'oauth',
      referenceImages: [{ source: 'external', imageUrl }],
    }),
  });
};

const readError = async (res: Response): Promise<ApiError> =>
  (await res.json()) as ApiError;

before(async () => {
  installFetchInterceptor();

  const [{ buildApp }, runtime] = await Promise.all([
    import('../server/server.js'),
    import('../server/runtime-context.js'),
  ]);
  setOAuthHandle = runtime.setOAuthHandle;

  oauthServer = createServer((req, res) => {
    void handleOAuthRequest(req)
      .then((response) => writeNodeResponse(response, res))
      .catch((err: unknown) => {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end(err instanceof Error ? err.message : 'OAuth test error');
      });
  });

  await new Promise<void>((resolve) => {
    oauthServer.listen(0, '127.0.0.1', resolve);
  });
  const oauthAddress = oauthServer.address() as AddressInfo;
  oauthBaseUrl = `http://127.0.0.1:${oauthAddress.port}`;
  setOAuthHandle(createReadyOAuthHandle(oauthBaseUrl));

  const app = buildApp({ startedAt: 1234567890, version: 'test-version' });
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(() => {
  externalFetch = null;
  oauthRequests.length = 0;
});

after(async () => {
  setOAuthHandle?.(null);
  globalThis.fetch = originalFetch;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  await new Promise<void>((resolve, reject) => {
    oauthServer.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  rmSync(testRoot, { recursive: true, force: true });
});

test('generate blocks localhost external reference URLs', async () => {
  const res = await generateWithExternalReference(
    'http://localhost:1234/reference.png',
  );
  const body = await readError(res);

  assert.equal(res.status, 400);
  assert.equal(body.error, 'invalid_request');
  assert.match(body.message, /public http\(s\)/);
  assert.equal(oauthRequests.length, 0);
});

test('generate blocks private IP external reference URLs', async () => {
  const res = await generateWithExternalReference(
    'http://10.0.0.8/reference.png',
  );
  const body = await readError(res);

  assert.equal(res.status, 400);
  assert.equal(body.error, 'invalid_request');
  assert.match(body.message, /public http\(s\)/);
  assert.equal(oauthRequests.length, 0);
});

test('generate blocks private IPv6 external reference URLs', async () => {
  const res = await generateWithExternalReference(
    'http://[fc00::1]/reference.png',
  );
  const body = await readError(res);

  assert.equal(res.status, 400);
  assert.equal(body.error, 'invalid_request');
  assert.match(body.message, /public http\(s\)/);
  assert.equal(oauthRequests.length, 0);
});

test('generate blocks redirects to localhost external reference URLs', async () => {
  let fetchCount = 0;
  externalFetch = ({ init }) => {
    fetchCount += 1;
    assert.equal(init?.redirect, 'manual');

    return new Response(null, {
      status: 302,
      headers: { location: 'http://127.0.0.1/private.png' },
    });
  };

  const res = await generateWithExternalReference(
    `http://${publicReferenceHost}/redirect.png`,
  );
  const body = await readError(res);

  assert.equal(res.status, 400);
  assert.equal(body.error, 'invalid_request');
  assert.match(body.message, /public http\(s\)/);
  assert.equal(fetchCount, 1);
  assert.equal(oauthRequests.length, 0);
});

test('generate aborts oversized external reference streams', async () => {
  const state = { aborted: false, canceled: false, pulls: 0 };
  externalFetch = ({ init }) => {
    init?.signal?.addEventListener('abort', () => {
      state.aborted = true;
    });

    return new Response(
      new ReadableStream<Uint8Array>({
        pull: (controller) => {
          state.pulls += 1;
          controller.enqueue(new Uint8Array(1024 * 1024));
        },
        cancel: () => {
          state.canceled = true;
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'image/png' },
      },
    );
  };

  const res = await generateWithExternalReference(
    `http://${publicReferenceHost}/oversized.png`,
  );
  const body = await readError(res);

  assert.equal(res.status, 400);
  assert.equal(body.error, 'invalid_request');
  assert.match(body.message, /10MB/);
  assert.equal(state.aborted, true);
  assert.equal(state.canceled, true);
  assert.equal(state.pulls >= 11, true);
  assert.equal(state.pulls <= 12, true);
  assert.equal(oauthRequests.length, 0);
});

test('generate accepts a small valid external reference image response', async () => {
  externalFetch = ({ init }) => {
    assert.equal(init?.redirect, 'manual');

    return new Response(tinyPngBuffer, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  };

  const res = await generateWithExternalReference(
    `http://${publicReferenceHost}/small.png`,
  );
  const body = (await res.json()) as SavedCandidateResponse[];

  assert.equal(res.status, 201);
  assert.equal(body.length, 1);
  assert.match(body[0]?.imageUrl ?? '', /\/projects\//);
  assert.equal(oauthRequests.length, 1);
  const oauthPayload = JSON.parse(
    oauthRequests[0]?.body ?? '{}',
  ) as OAuthPayload;
  const referenceImage = oauthPayload.input?.[0]?.content?.find(
    (item) => item.type === 'input_image',
  );
  assert.equal(
    referenceImage?.image_url,
    `data:image/png;base64,${tinyPngBuffer.toString('base64')}`,
  );
});
