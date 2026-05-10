import { existsSync, readFileSync } from 'node:fs';
import { config as appConfig } from '../../config.js';

class MissingApiKeyError extends Error {
  constructor() {
    super(
      'OPENAI_API_KEY is not set. Provide it via environment variable or config file.',
    );
    this.name = 'MissingApiKeyError';
  }
}

const readApiKeyFromConfig = (): string | null => {
  const file = appConfig.storage.configFile;
  if (!existsSync(file)) return null;

  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as {
      openaiApiKey?: unknown;
    };
    if (typeof parsed.openaiApiKey === 'string' && parsed.openaiApiKey.trim()) {
      return parsed.openaiApiKey.trim();
    }
  } catch {}
  return null;
};

const resolveOpenAiApiKey = (): string => {
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  const fromConfig = readApiKeyFromConfig();
  if (fromConfig) return fromConfig;

  console.info(
    `[wps] no OPENAI_API_KEY in env or ${appConfig.storage.configFile}`,
  );
  throw new MissingApiKeyError();
};

export { MissingApiKeyError, resolveOpenAiApiKey };
