import type { ChildProcess } from 'node:child_process';
import { spawnBin } from './platform.js';

type OAuthState = 'disabled' | 'pending' | 'ready' | 'failed';

interface OAuthHandle {
  readonly state: OAuthState;
  readonly url: string | null;
  readonly port: number | null;
  readonly lastError: string | null;
  readonly readyPromise: Promise<void>;
  stop: () => void;
}

interface OAuthLauncherOptions {
  port: number;
  restartDelayMs?: number;
  maxRestarts?: number;
  startupTimeoutMs?: number;
}

const READY_REGEX = /https?:\/\/(?:127\.0\.0\.1|localhost):\d+(?:\/v1)?/i;

const stripTrailingV1 = (url: string): string => url.replace(/\/v1\/?$/, '');

const parseReadyUrl = (line: string): string | null => {
  const match = String(line ?? '').match(READY_REGEX);
  return match ? stripTrailingV1(match[0]) : null;
};

const parseLocalhostPort = (url: string): number | null => {
  try {
    const parsed = new URL(url);
    const port = Number(parsed.port);
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
};

const startOAuthProxy = (options: OAuthLauncherOptions): OAuthHandle => {
  const restartDelayMs = options.restartDelayMs ?? 3000;
  const maxRestarts = options.maxRestarts ?? 3;
  const startupTimeoutMs = options.startupTimeoutMs ?? 20_000;

  let child: ChildProcess | null = null;
  let stopping = false;
  let restarts = 0;
  let restartTimer: NodeJS.Timeout | null = null;
  let startupTimer: NodeJS.Timeout | null = null;

  let state: OAuthState = 'pending';
  let url: string | null = null;
  let port: number | null = null;
  let lastError: string | null = null;

  let resolveReady: () => void = () => {};
  let rejectReady: (err: Error) => void = () => {};
  const readyPromise = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const clearStartupTimer = (): void => {
    if (startupTimer) {
      clearTimeout(startupTimer);
      startupTimer = null;
    }
  };

  const fail = (reason: string): void => {
    clearStartupTimer();
    state = 'failed';
    lastError = reason;
    rejectReady(new Error(reason));
  };

  const handleStdoutLine = (line: string): void => {
    const detected = parseReadyUrl(line);
    if (!detected) return;

    url = detected;
    port = parseLocalhostPort(detected) ?? options.port;
    if (state !== 'ready') {
      state = 'ready';
      clearStartupTimer();
      resolveReady();
    }
  };

  const spawnProxy = (): void => {
    console.log(`[wps] starting openai-oauth on port ${options.port}…`);
    const proc = spawnBin(
      'npx',
      ['openai-oauth', '--port', String(options.port)],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      },
    );
    child = proc;

    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (!text.trim()) return;
      console.log(`[oauth] ${text.trim()}`);
      for (const line of text.split(/\r?\n/)) handleStdoutLine(line);
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text && !text.includes('npm warn')) {
        console.error(`[oauth] ${text}`);
        lastError = text;
      }
    });

    proc.on('error', (err) => {
      console.error(`[oauth] spawn error: ${err.message}`);
      lastError = err.message;
    });

    proc.on('exit', (code) => {
      if (child === proc) child = null;
      if (stopping || state === 'failed') return;

      if (state === 'ready') {
        console.log(`[oauth] proxy exited (code ${code}), state degraded.`);
        state = 'pending';
      }

      if (restarts >= maxRestarts) {
        fail(`openai-oauth exited ${restarts + 1} times (last code ${code}).`);
        return;
      }

      restarts += 1;
      console.log(
        `[oauth] restarting in ${Math.round(restartDelayMs / 1000)}s (attempt ${restarts}/${maxRestarts})`,
      );
      restartTimer = setTimeout(spawnProxy, restartDelayMs);
    });
  };

  if (startupTimeoutMs > 0) {
    startupTimer = setTimeout(() => {
      startupTimer = null;
      if (stopping || state === 'ready' || state === 'failed') return;
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
      try {
        child?.kill('SIGTERM');
      } catch {}
      fail(
        `openai-oauth did not become ready within ${Math.round(startupTimeoutMs / 1000)}s.`,
      );
    }, startupTimeoutMs);
    startupTimer.unref();
  }

  spawnProxy();

  return {
    get state() {
      return state;
    },
    get url() {
      return url;
    },
    get port() {
      return port;
    },
    get lastError() {
      return lastError;
    },
    readyPromise,
    stop() {
      stopping = true;
      clearStartupTimer();
      if (restartTimer) clearTimeout(restartTimer);
      try {
        child?.kill('SIGTERM');
      } catch {}
    },
  };
};

const disabledHandle = (reason: string): OAuthHandle => {
  const readyPromise = Promise.reject(new Error(reason));
  readyPromise.catch(() => {});
  return {
    state: 'disabled',
    url: null,
    port: null,
    lastError: reason,
    readyPromise,
    stop: () => {},
  };
};

export { disabledHandle, parseLocalhostPort, parseReadyUrl, startOAuthProxy };
export type { OAuthHandle, OAuthLauncherOptions, OAuthState };
