import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isLocalDevelopmentRequest(req: Request) {
  if (process.env.LOCAL_DEV_BYPASS_AUTH === "true") return true;
  const hostname = req.hostname?.toLowerCase();
  return process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function localIdentity(req: Request) {
  const fallbackName = process.env.LOCAL_DEV_USER_NAME?.trim() || "Local Student";
  const fallbackEmail = process.env.LOCAL_DEV_USER_EMAIL?.trim() || "student@local.learnova";
  const suppliedName = getQueryParam(req, "name")?.trim().replace(/\s+/g, " ");
  const suppliedEmail = getQueryParam(req, "email")?.trim().toLowerCase();
  const name = suppliedName && suppliedName.length >= 2 && suppliedName.length <= 80 ? suppliedName : fallbackName;
  const email = suppliedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suppliedEmail) && suppliedEmail.length <= 320 ? suppliedEmail : fallbackEmail;
  const openId = `local_${createHash("sha256").update(email).digest("hex").slice(0, 40)}`;
  return { openId, name, email };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/local-login", async (req: Request, res: Response) => {
    if (!isLocalDevelopmentRequest(req)) {
      res.status(404).end();
      return;
    }
    try {
      const { openId, name, email } = localIdentity(req);
      await db.upsertUser({ openId, name, email, loginMethod: "local-development", lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Local auth] Sign-in failed", error);
      res.redirect(302, "/?localAuthError=database");
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
