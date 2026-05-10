import type { OAuthHandle } from './lib/auth/oauth-launcher.js';

let oauthHandle: OAuthHandle | null = null;

const setOAuthHandle = (handle: OAuthHandle | null): void => {
  oauthHandle = handle;
};

const getOAuthHandle = (): OAuthHandle | null => oauthHandle;

export { getOAuthHandle, setOAuthHandle };
