import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CONFIG_DIR = join(HOME, '.config', 'codex-webtoon');
const LEGACY_CONFIG_DIR = join(HOME, '.config', 'webtoon-panel-studio');

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

const config = {
  server: {
    host: readEnv('CODEX_WEBTOON_HOST', 'WPS_HOST') ?? '127.0.0.1',
    port: Number(readEnv('CODEX_WEBTOON_PORT', 'WPS_PORT') ?? 4321),
  },
  storage: {
    configDir,
    configFile: join(configDir, 'config.json'),
    advertiseFile: join(configDir, 'server.json'),
    projectsRoot:
      readEnv('CODEX_WEBTOON_PROJECTS_ROOT', 'WPS_PROJECTS_ROOT') ??
      join(HOME, 'WebtoonProjects'),
  },
  oauth: {
    mode: parseOAuthMode(readEnv('CODEX_WEBTOON_OAUTH', 'WPS_OAUTH')),
    proxyPort: Number(
      readEnv('CODEX_WEBTOON_OAUTH_PROXY_PORT', 'WPS_OAUTH_PROXY_PORT') ??
        10531,
    ),
    restartDelayMs: 3000,
    maxRestarts: 3,
    startupTimeoutMs: Number(
      readEnv(
        'CODEX_WEBTOON_OAUTH_STARTUP_TIMEOUT_MS',
        'WPS_OAUTH_STARTUP_TIMEOUT_MS',
      ) ?? 20000,
    ),
  },
} as const;

export { config };
