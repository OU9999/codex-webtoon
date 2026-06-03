#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../server/config.js';
import { detectCodexAuth } from '../server/lib/auth/codex-detect.js';
import { rootFromMetaUrl } from '../server/lib/find-root.js';
import { isWin, resolveBin } from '../server/lib/auth/platform.js';

const rootDir = rootFromMetaUrl(import.meta.url);

interface CliConfig {
  oauth?: {
    mode?: 'auto' | 'on' | 'off';
    proxyPort?: number;
    startupTimeoutMs?: number;
  };
  storage?: {
    projectsRoot?: string;
  };
}

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

const loadCliConfig = (): CliConfig => {
  if (!existsSync(config.storage.configFile)) return {};

  try {
    const parsed = JSON.parse(
      readFileSync(config.storage.configFile, 'utf-8'),
    ) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as CliConfig;
  } catch {
    return {};
  }
};

const saveCliConfig = (nextConfig: CliConfig): void => {
  mkdirSync(config.storage.configDir, { recursive: true });
  writeFileSync(config.storage.configFile, JSON.stringify(nextConfig, null, 2));
};

const packageBinPath = (name: string): string =>
  join(rootDir, 'node_modules', '.bin', isWin ? `${name}.cmd` : name);

const resolveCodexLoginCommand = (): { command: string; args: string[] } => {
  const packagedBin = packageBinPath('codex');
  if (existsSync(packagedBin)) {
    return { command: packagedBin, args: ['login'] };
  }

  return {
    command: resolveBin('npx'),
    args: ['--yes', '@openai/codex', 'login'],
  };
};

const runCodexLogin = (): void => {
  const { command, args } = resolveCodexLoginCommand();
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env },
    shell: isWin,
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const reason = result.signal
      ? `signal ${result.signal}`
      : `code ${result.status ?? 'unknown'}`;
    throw new Error(`codex login exited with ${reason}`);
  }
};

const setup = async (): Promise<void> => {
  console.log(`\ncodex-webtoon setup\n`);
  console.log(`Config file: ${config.storage.configFile}`);

  const before = await detectCodexAuth({ force: true });
  if (!before.authed) {
    if (before.platform === 'win32') {
      console.log(
        'Windows note: Codex CLI works best from WSL2 if native login fails.\n',
      );
    }
    console.log('Starting Codex OAuth login. Follow the browser prompt.\n');
    runCodexLogin();
  } else {
    console.log('Existing Codex OAuth session found.');
  }

  const after = await detectCodexAuth({ force: true });
  if (!after.authed) {
    console.error('\nCodex OAuth is still not authenticated.');
    console.error('Retry with: codex-webtoon setup');
    process.exit(1);
  }

  const nextConfig = loadCliConfig();
  nextConfig.oauth = {
    ...nextConfig.oauth,
    mode:
      nextConfig.oauth?.mode === 'off'
        ? 'auto'
        : (nextConfig.oauth?.mode ?? 'auto'),
  };
  saveCliConfig(nextConfig);

  console.log('\nCodex OAuth configured.');
  console.log(`Run: codex-webtoon serve`);
  console.log(`Open: http://${config.server.host}:${config.server.port}/\n`);
};

const status = async (): Promise<void> => {
  console.log(`codex-webtoon v${readVersion()}`);
  console.log(`config dir : ${config.storage.configDir}`);
  console.log(`config file: ${config.storage.configFile}`);
  console.log(`projects   : ${config.storage.projectsRoot}`);
  console.log(`oauth mode : ${config.oauth.mode}`);

  const auth = await detectCodexAuth();
  console.log(
    `codex     : ${auth.authed ? 'authenticated' : `not authenticated (${auth.probe})`}`,
  );

  const ad = config.storage.advertiseFile;
  if (existsSync(ad)) {
    console.log(`server     : ${readFileSync(ad, 'utf-8').trim()}`);
    return;
  }

  console.log(`server     : not running`);
};

const serve = (): void => {
  const builtEntry = join(rootDir, 'build', 'server', 'server.js');
  const sourceEntry = join(rootDir, 'server', 'server.ts');
  let cmd: string;
  let args: string[];

  if (existsSync(builtEntry)) {
    cmd = 'node';
    args = [builtEntry];
  } else if (existsSync(sourceEntry)) {
    cmd = resolveBin('pnpm');
    args = ['tsx', sourceEntry];
  } else {
    console.error(`could not locate server entry under ${rootDir}`);
    process.exit(1);
  }

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    cwd: rootDir,
    shell: isWin,
    windowsHide: true,
  });

  child.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
};

const help = (): void => {
  console.log(`codex-webtoon v${readVersion()}

Commands:
  setup     Configure Codex OAuth for local image generation.
  serve     Start the local server (default).
  status    Show config paths and running server info.
  help      Show this help.
`);
};

const cmd = process.argv[2] ?? 'serve';

const main = async (): Promise<void> => {
  switch (cmd) {
    case 'setup':
      await setup();
      break;
    case 'serve':
      serve();
      break;
    case 'status':
      await status();
      break;
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    default:
      console.error(`unknown command: ${cmd}`);
      help();
      process.exit(1);
  }
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[codex-webtoon] ${message}`);
  process.exit(1);
});
