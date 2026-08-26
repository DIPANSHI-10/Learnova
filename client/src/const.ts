import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function isLocalDevelopmentMode() {
  if (import.meta.env.VITE_LOCAL_DEV_BYPASS_AUTH === "true") return true;
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}
export const startLogin = (localUser?: { name?: string; email?: string }) => {
  if (isLocalDevelopmentMode()) {
    const params = new URLSearchParams();
    if (localUser?.name) params.set("name", localUser.name);
    if (localUser?.email) params.set("email", localUser.email);
    window.location.assign(`/api/local-login${params.size ? `?${params.toString()}` : ""}`);
    return;
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
