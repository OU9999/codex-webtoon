import express, { type ErrorRequestHandler } from 'express';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { detectCodexAuth } from './lib/auth/codex-detect.js';
import { rootFromMetaUrl } from './lib/find-root.js';
import {
  disabledHandle,
  startOAuthProxy,
} from './lib/auth/oauth-launcher.js';
import type { OAuthHandle } from './lib/auth/oauth-launcher.js';
import { projectsStaticRoot } from './lib/image-store.js';
import { createRateLimiter, requireJsonBody } from './lib/middleware.js';
import { authRouter } from './routes/auth.js';
import { generateRouter } from './routes/generate.js';
import { projectsRouter } from './routes/projects.js';
import { setOAuthHandle } from './runtime-context.js';
import type {
  ApiError,
  HealthResponse,
  ServerAdvertisement,
} from '../shared/types.js';

const rootDir = rootFromMetaUrl(import.meta.url);

const readVersion = (): string => {
  try {
    const pkg = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf-8'),
    ) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
};

const advertise = (ad: ServerAdvertisement): void => {
  mkdirSync(dirname(config.storage.advertiseFile), { recursive: true });
  writeFileSync(config.storage.advertiseFile, JSON.stringify(ad, null, 2));
};

const unadvertise = (): void => {
  try {
    if (!existsSync(config.storage.advertiseFile)) return;

    const cur = JSON.parse(
      readFileSync(config.storage.advertiseFile, 'utf-8'),
    ) as { pid?: number };
    if (cur.pid === process.pid) {
      unlinkSync(config.storage.advertiseFile);
    }
  } catch {}
};

const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const detail = (err ?? {}) as { type?: unknown };

  if (detail.type === 'entity.too.large') {
    const body: ApiError = {
      error: 'payload_too_large',
      message: 'Request body is too large.',
    };
    res.status(413).json(body);
    return;
  }

  if (
    detail.type === 'entity.parse.failed' ||
    (err instanceof SyntaxError && 'body' in err)
  ) {
    const body: ApiError = {
      error: 'invalid_json',
      message: 'Request body is not valid JSON.',
    };
    res.status(400).json(body);
    return;
  }

  console.error('[wps] unhandled error:', err);
  const body: ApiError = {
    error: 'internal',
    message: err instanceof Error ? err.message : 'Internal server error.',
  };
  res.status(500).json(body);
};

const buildApp = (opts: { startedAt: number; version: string }) => {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', requireJsonBody);
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = {
      ok: true,
      version: opts.version,
      startedAt: opts.startedAt,
    };
    res.json(body);
  });

  const generateLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

  app.use('/api/projects', projectsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/generate', generateLimiter, generateRouter);
  app.use(
    '/projects',
    express.static(projectsStaticRoot(), { fallthrough: false }),
  );

  const distDir = join(rootDir, 'dist');
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(distDir, 'index.html'));
    });
  }

  app.use(jsonErrorHandler);

  return app;
};

const initOAuth = async (): Promise<OAuthHandle> => {
  const mode = config.oauth.mode;
  if (mode === 'off') {
    return disabledHandle('OAuth disabled via WPS_OAUTH=off.');
  }

  if (mode === 'auto') {
    const codex = await detectCodexAuth();
    if (!codex.authed) {
      return disabledHandle(
        codex.probe === 'missing'
          ? 'Codex CLI not found. Install with: npm i -g @openai/codex'
          : 'Codex not authenticated. Run: npx @openai/codex login',
      );
    }
  }

  return startOAuthProxy({
    port: config.oauth.proxyPort,
    restartDelayMs: config.oauth.restartDelayMs,
    maxRestarts: config.oauth.maxRestarts,
    startupTimeoutMs: config.oauth.startupTimeoutMs,
  });
};

const startServer = async () => {
  const startedAt = Date.now();
  const version = readVersion();

  const oauthHandle = await initOAuth();
  setOAuthHandle(oauthHandle);
  if (oauthHandle.state === 'disabled') {
    console.log(`[wps] oauth: disabled — ${oauthHandle.lastError}`);
  } else {
    oauthHandle.readyPromise
      .then(() =>
        console.log(`[wps] oauth: ready at ${oauthHandle.url}`),
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[wps] oauth: failed — ${msg}`);
      });
  }

  const app = buildApp({ startedAt, version });

  const server = app.listen(config.server.port, config.server.host, () => {
    const url = `http://${config.server.host}:${config.server.port}`;
    advertise({
      port: config.server.port,
      url,
      pid: process.pid,
      startedAt,
      version,
    });
    console.log(`[wps] server listening at ${url}`);
  });

  const shutdown = (): void => {
    unadvertise();
    oauthHandle.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', unadvertise);

  return { app, server };
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer().catch((err: unknown) => {
    console.error('[wps] failed to start:', err);
    process.exit(1);
  });
}

export { buildApp, startServer };
