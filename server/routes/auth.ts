import { Router } from 'express';
import { detectCodexAuth } from '../lib/auth/codex-detect.js';
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
  recommendedProvider: 'oauth' | null;
  loginCommand: string;
}

const authRouter = Router();

authRouter.get('/status', async (_req, res) => {
  const codex = await detectCodexAuth();
  const handle = getOAuthHandle();

  let recommendedProvider: AuthStatusBody['recommendedProvider'] = null;
  if (handle && handle.state === 'ready') recommendedProvider = 'oauth';

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
    recommendedProvider,
    loginCommand: 'npx @openai/codex login',
  };
  res.json(body);
});

export { authRouter };
export type { AuthStatusBody };
