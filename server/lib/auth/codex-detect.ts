import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { isWin } from './platform.js';

const execFileAsync = promisify(execFile);

interface CodexAuthPaths {
  codex: string;
  chatgpt: string;
  xdgCodex: string;
}

interface CodexAuthInfo {
  authed: boolean;
  probe: 'authed' | 'unauthed' | 'missing';
  files: CodexAuthPaths;
  fileHits: { codex: boolean; chatgpt: boolean; xdgCodex: boolean };
  platform: NodeJS.Platform;
}

const HOME = homedir();
const DETECT_TTL_MS = 10_000;

const codexAuthPaths = (): CodexAuthPaths => {
  const codexHome = process.env.CODEX_HOME ?? join(HOME, '.codex');
  return {
    codex: join(codexHome, 'auth.json'),
    chatgpt: join(HOME, '.chatgpt-local', 'auth.json'),
    xdgCodex: join(HOME, '.config', 'codex', 'auth.json'),
  };
};

const codexLoginStatus = async (
  timeoutMs = 2000,
): Promise<'authed' | 'unauthed' | 'missing'> => {
  const candidates = isWin
    ? ['codex.cmd', 'codex.exe', 'codex']
    : ['codex'];

  for (const bin of candidates) {
    try {
      await execFileAsync(bin, ['login', 'status'], {
        timeout: timeoutMs,
        windowsHide: true,
      });
      return 'authed';
    } catch (err) {
      const e = err as { code?: unknown; killed?: boolean };
      if (e.code === 'ENOENT') continue;
      // Timed out (killed by SIGTERM) — the binary exists but did not answer;
      // mirror the previous behavior of falling through to "missing".
      if (e.killed) return 'missing';
      // Ran but exited non-zero -> not logged in.
      if (typeof e.code === 'number') return 'unauthed';
    }
  }
  return 'missing';
};

let detectCache: { value: CodexAuthInfo; expiresAt: number } | null = null;
let detectInflight: Promise<CodexAuthInfo> | null = null;

const detectCodexAuth = async (): Promise<CodexAuthInfo> => {
  const now = Date.now();
  if (detectCache && detectCache.expiresAt > now) return detectCache.value;
  if (detectInflight) return detectInflight;

  detectInflight = (async (): Promise<CodexAuthInfo> => {
    try {
      const files = codexAuthPaths();
      const fileHits = {
        codex: existsSync(files.codex),
        chatgpt: existsSync(files.chatgpt),
        xdgCodex: existsSync(files.xdgCodex),
      };
      const probe = await codexLoginStatus();
      const authed =
        probe === 'authed' ||
        fileHits.codex ||
        fileHits.chatgpt ||
        fileHits.xdgCodex;

      const value: CodexAuthInfo = {
        authed,
        probe,
        files,
        fileHits,
        platform: process.platform,
      };
      detectCache = { value, expiresAt: Date.now() + DETECT_TTL_MS };
      return value;
    } finally {
      detectInflight = null;
    }
  })();

  return detectInflight;
};

export { detectCodexAuth };
export type { CodexAuthInfo, CodexAuthPaths };
