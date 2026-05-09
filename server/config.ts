import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CONFIG_DIR =
  process.env.WPS_CONFIG_DIR ?? join(HOME, '.config', 'webtoon-panel-studio');

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
} as const;

export { config };
