import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isWin } from './platform.js';

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

const codexAuthPaths = (): CodexAuthPaths => {
  const codexHome = process.env.CODEX_HOME ?? join(HOME, '.codex');
  return {
    codex: join(codexHome, 'auth.json'),
    chatgpt: join(HOME, '.chatgpt-local', 'auth.json'),
    xdgCodex: join(HOME, '.config', 'codex', 'auth.json'),
  };
};

const codexLoginStatus = (
  timeoutMs = 2000,
): 'authed' | 'unauthed' | 'missing' => {
  const candidates = isWin
    ? ['codex.cmd', 'codex.exe', 'codex']
    : ['codex'];

  for (const bin of candidates) {
    try {
      execFileSync(bin, ['login', 'status'], {
        stdio: 'ignore',
        timeout: timeoutMs,
        windowsHide: true,
      });
      return 'authed';
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT') continue;
      const status = (err as { status?: unknown })?.status;
      if (typeof status === 'number') return 'unauthed';
    }
  }
  return 'missing';
};

const detectCodexAuth = (): CodexAuthInfo => {
  const files = codexAuthPaths();
  const fileHits = {
    codex: existsSync(files.codex),
    chatgpt: existsSync(files.chatgpt),
    xdgCodex: existsSync(files.xdgCodex),
  };
  const probe = codexLoginStatus();
  const authed =
    probe === 'authed' ||
    fileHits.codex ||
    fileHits.chatgpt ||
    fileHits.xdgCodex;

  return {
    authed,
    probe,
    files,
    fileHits,
    platform: process.platform,
  };
};

export { codexAuthPaths, codexLoginStatus, detectCodexAuth };
export type { CodexAuthInfo, CodexAuthPaths };
