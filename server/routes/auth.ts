import { Router } from 'express';
import { detectCodexAuth } from '../lib/auth/codex-detect.js';
import { resolveOpenAiApiKey } from '../lib/provider/api-key.js';
import { getOAuthHandle } from '../runtime-context.js';

interface AuthStatusBody {
  codex: {
    authed: boolean;
    probe: 'authed' | 'unauthed' | 'missing';
    platform: NodeJS.Platform;
  };
  oauth: {
    state: 'disabled' | 'pending' | 'ready' | 'failed';
    lastError: string | null;
  };
  apiKey: {
    available: boolean;
  };
  recommendedProvider: 'oauth' | 'openai' | null;
  loginCommand: string;
}

const checkApiKey = (): boolean => {
  try {
    resolveOpenAiApiKey();
    return true;
  } catch {
    return false;
  }
};

const authRouter = Router();

authRouter.get('/status', async (_req, res) => {
  const codex = await detectCodexAuth();
  const handle = getOAuthHandle();
  const apiKeyAvailable = checkApiKey();

  let recommendedProvider: AuthStatusBody['recommendedProvider'] = null;
  if (handle && handle.state === 'ready') recommendedProvider = 'oauth';
  else if (apiKeyAvailable) recommendedProvider = 'openai';

  const body: AuthStatusBody = {
    codex: {
      authed: codex.authed,
      probe: codex.probe,
      platform: codex.platform,
    },
    oauth: {
      state: handle?.state ?? 'disabled',
      lastError: handle?.lastError ?? null,
    },
    apiKey: { available: apiKeyAvailable },
    recommendedProvider,
    loginCommand: 'npx @openai/codex login',
  };
  res.json(body);
});

export { authRouter };
export type { AuthStatusBody };
