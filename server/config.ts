import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CONFIG_DIR =
  process.env.WPS_CONFIG_DIR ?? join(HOME, '.config', 'webtoon-panel-studio');

type OAuthMode = 'auto' | 'on' | 'off';

const parseOAuthMode = (raw: string | undefined): OAuthMode => {
  if (raw === 'on' || raw === 'off') return raw;
  return 'auto';
};

const config = {
  server: {
    host: process.env.WPS_HOST ?? '127.0.0.1',
    port: Number(process.env.WPS_PORT ?? 4321),
  },
  storage: {
    configDir: CONFIG_DIR,
    configFile: join(CONFIG_DIR, 'config.json'),
    advertiseFile: join(CONFIG_DIR, 'server.json'),
    projectsRoot:
      process.env.WPS_PROJECTS_ROOT ?? join(HOME, 'WebtoonProjects'),
  },
  oauth: {
    mode: parseOAuthMode(process.env.WPS_OAUTH),
    proxyPort: Number(process.env.WPS_OAUTH_PROXY_PORT ?? 10531),
    restartDelayMs: 3000,
    maxRestarts: 3,
    startupTimeoutMs: Number(process.env.WPS_OAUTH_STARTUP_TIMEOUT_MS ?? 20000),
  },
} as const;

export { config };
