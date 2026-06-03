import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CONFIG_DIR = join(HOME, '.config', 'codex-webtoon');
const LEGACY_CONFIG_DIR = join(HOME, '.config', 'webtoon-panel-studio');

interface FileConfig {
  server?: {
    host?: unknown;
    port?: unknown;
  };
  storage?: {
    projectsRoot?: unknown;
  };
  oauth?: {
    mode?: unknown;
    proxyPort?: unknown;
    startupTimeoutMs?: unknown;
  };
}

const readEnv = (primaryKey: string, legacyKey: string): string | undefined => {
  return process.env[primaryKey] ?? process.env[legacyKey];
};

const resolveConfigDir = (): string => {
  const configured = readEnv('CODEX_WEBTOON_CONFIG_DIR', 'WPS_CONFIG_DIR');
  if (configured) return configured;
  if (existsSync(LEGACY_CONFIG_DIR) && !existsSync(CONFIG_DIR)) {
    return LEGACY_CONFIG_DIR;
  }

  return CONFIG_DIR;
};

type OAuthMode = 'auto' | 'on' | 'off';

const parseOAuthMode = (raw: string | undefined): OAuthMode => {
  if (raw === 'on' || raw === 'off') return raw;
  return 'auto';
};

const configDir = resolveConfigDir();
const configFile = join(configDir, 'config.json');

const readFileConfig = (): FileConfig => {
  if (!existsSync(configFile)) return {};

  try {
    const parsed = JSON.parse(readFileSync(configFile, 'utf-8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as FileConfig;
  } catch {
    return {};
  }
};

const fileConfig = readFileConfig();

const pickString = (
  envValue: string | undefined,
  fileValue: unknown,
  fallback: string,
): string => {
  if (envValue) return envValue;
  if (typeof fileValue === 'string' && fileValue.trim()) return fileValue;
  return fallback;
};

const pickNumber = (
  envValue: string | undefined,
  fileValue: unknown,
  fallback: number,
): number => {
  const raw = envValue ?? fileValue;
  if (raw === undefined || raw === null || raw === '') return fallback;

  const value = Number(raw);
  if (Number.isFinite(value)) return value;
  return fallback;
};

const config = {
  server: {
    host: pickString(
      readEnv('CODEX_WEBTOON_HOST', 'WPS_HOST'),
      fileConfig.server?.host,
      '127.0.0.1',
    ),
    port: pickNumber(
      readEnv('CODEX_WEBTOON_PORT', 'WPS_PORT'),
      fileConfig.server?.port,
      4321,
    ),
  },
  storage: {
    configDir,
    configFile,
    advertiseFile: join(configDir, 'server.json'),
    projectsRoot: pickString(
      readEnv('CODEX_WEBTOON_PROJECTS_ROOT', 'WPS_PROJECTS_ROOT'),
      fileConfig.storage?.projectsRoot,
      join(HOME, 'WebtoonProjects'),
    ),
  },
  oauth: {
    mode: parseOAuthMode(
      readEnv('CODEX_WEBTOON_OAUTH', 'WPS_OAUTH') ??
        (typeof fileConfig.oauth?.mode === 'string'
          ? fileConfig.oauth.mode
          : undefined),
    ),
    proxyPort: pickNumber(
      readEnv('CODEX_WEBTOON_OAUTH_PROXY_PORT', 'WPS_OAUTH_PROXY_PORT'),
      fileConfig.oauth?.proxyPort,
      10531,
    ),
    restartDelayMs: 3000,
    maxRestarts: 3,
    startupTimeoutMs: pickNumber(
      readEnv(
        'CODEX_WEBTOON_OAUTH_STARTUP_TIMEOUT_MS',
        'WPS_OAUTH_STARTUP_TIMEOUT_MS',
      ),
      fileConfig.oauth?.startupTimeoutMs,
      20000,
    ),
  },
} as const;

export { config };
