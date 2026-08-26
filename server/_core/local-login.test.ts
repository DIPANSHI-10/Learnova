import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../../shared/const";

const upsertUser = vi.hoisted(() => vi.fn());
const createSessionToken = vi.hoisted(() => vi.fn());
const endLocalSession = vi.hoisted(() => vi.fn());

vi.mock("../db", () => ({ upsertUser }));
vi.mock("./sdk", () => ({ sdk: { createSessionToken, endLocalSession } }));

import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";

describe("local Learnova entry route", () => {
  beforeEach(() => {
    process.env.LOCAL_DEV_BYPASS_AUTH = "true";
    process.env.LOCAL_DEV_USER_NAME = "Dipanshi";
    process.env.LOCAL_DEV_USER_EMAIL = "dipanshi@example.local";
    upsertUser.mockReset().mockResolvedValue(undefined);
    createSessionToken.mockReset().mockResolvedValue("local-session-token");
    endLocalSession.mockReset();
  });

  it("creates the local session cookie and sends the entry action to the dashboard", async () => {
    const routes = new Map<string, Function>();
    const app = { get: vi.fn((path: string, handler: Function) => routes.set(path, handler)) };
    registerOAuthRoutes(app as any);
    const handler = routes.get("/api/local-login");
    const cookie = vi.fn();
    const redirect = vi.fn();

    await handler?.({ hostname: "localhost", protocol: "http", headers: {}, query: { name: "Dipanshi Gaur", email: "dipanshi@example.local" } }, { cookie, redirect, status: vi.fn().mockReturnThis(), end: vi.fn(), json: vi.fn() });

    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: expect.stringMatching(/^local_[a-f0-9]{40}$/), name: "Dipanshi Gaur", email: "dipanshi@example.local" }));
    expect(createSessionToken).toHaveBeenCalledWith(expect.stringMatching(/^local_[a-f0-9]{40}$/), expect.objectContaining({ name: "Dipanshi Gaur" }));
    expect(cookie).toHaveBeenCalledWith(COOKIE_NAME, "local-session-token", expect.objectContaining({ httpOnly: true, path: "/", secure: false, sameSite: "lax" }));
    expect(redirect).toHaveBeenCalledWith(302, "/dashboard");
  });

  it("clears user A's local session before starting a distinct signed session for user B", async () => {
    const routes = new Map<string, Function>();
    const app = { get: vi.fn((path: string, handler: Function) => routes.set(path, handler)) };
    registerOAuthRoutes(app as any);
    const handler = routes.get("/api/local-login");
    const response = () => ({ cookie: vi.fn(), redirect: vi.fn(), status: vi.fn().mockReturnThis(), end: vi.fn(), json: vi.fn() });
    await handler?.({ hostname: "localhost", protocol: "http", headers: {}, query: { name: "Asha", email: "asha@example.local" } }, response());
    const firstOpenId = upsertUser.mock.calls[0]?.[0]?.openId;
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: firstOpenId,
        email: "asha@example.local",
        name: "Asha",
        loginMethod: "local",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { hostname: "localhost", protocol: "http", headers: {} },
      res: { clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }) },
    } as any);
    await caller.auth.logout();
    await handler?.({ hostname: "localhost", protocol: "http", headers: {}, query: { name: "Ravi", email: "ravi@example.local" } }, response());
    const secondOpenId = upsertUser.mock.calls[1]?.[0]?.openId;
    expect(firstOpenId).not.toBe(secondOpenId);
    expect(endLocalSession).toHaveBeenCalledOnce();
    expect(clearedCookies).toEqual([expect.objectContaining({ name: COOKIE_NAME, options: expect.objectContaining({ maxAge: -1, secure: false, sameSite: "lax", path: "/" }) })]);
    expect(createSessionToken).toHaveBeenNthCalledWith(1, firstOpenId, expect.objectContaining({ name: "Asha" }));
    expect(createSessionToken).toHaveBeenNthCalledWith(2, secondOpenId, expect.objectContaining({ name: "Ravi" }));
  });

  it("allows a localhost development run to use local login even if the browser Vite flag was not loaded", async () => {
    const routes = new Map<string, Function>();
    const app = { get: vi.fn((path: string, handler: Function) => routes.set(path, handler)) };
    const handler = (registerOAuthRoutes(app as any), routes.get("/api/local-login"));
    process.env.LOCAL_DEV_BYPASS_AUTH = "false";
    process.env.NODE_ENV = "development";
    const cookie = vi.fn();
    const redirect = vi.fn();

    await handler?.({ hostname: "localhost", protocol: "http", headers: {}, query: { name: "Asha", email: "asha@example.local" } }, { cookie, redirect, status: vi.fn().mockReturnThis(), end: vi.fn(), json: vi.fn() });

    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ name: "Asha", email: "asha@example.local" }));
    expect(redirect).toHaveBeenCalledWith(302, "/dashboard");
  });

  it("returns the local account dialog with a database hint when MySQL cannot store a new user", async () => {
    const routes = new Map<string, Function>();
    const app = { get: vi.fn((path: string, handler: Function) => routes.set(path, handler)) };
    const handler = (registerOAuthRoutes(app as any), routes.get("/api/local-login"));
    upsertUser.mockRejectedValueOnce(new Error("connection refused"));
    const redirect = vi.fn();

    await handler?.({ hostname: "localhost", protocol: "http", headers: {}, query: { name: "Asha", email: "asha@example.local" } }, { cookie: vi.fn(), redirect, status: vi.fn().mockReturnThis(), end: vi.fn(), json: vi.fn() });

    expect(redirect).toHaveBeenCalledWith(302, "/?localAuthError=database");
  });
});
