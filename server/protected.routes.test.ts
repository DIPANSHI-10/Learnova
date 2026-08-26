import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected NovaMind routes", () => {
  it("rejects anonymous access to task data", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.productivity.tasks.list({ filter: "all" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous access to saved documents and conversations", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.learning.documents.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.learning.chat.list({ conversationId: "primary" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous access to learning analytics", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.dashboard.analytics()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous access to profile updates and activity history", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.productivity.profile.updateName({ name: "Unauthorised change" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.productivity.activity.list({ limit: 10 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
