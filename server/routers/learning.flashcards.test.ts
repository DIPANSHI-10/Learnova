import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const flashcardRows = vi.hoisted(() => [
  { id: 1, userId: 42, topic: "DBMS", question: "What is a key?", answer: "A unique identifier.", status: "new" as const, createdAt: new Date() },
]);

const mockDb = vi.hoisted(() => ({
  select: () => ({
    from: () => ({
      where: () => ({
        orderBy: async () => flashcardRows.map((card) => ({ ...card })),
      }),
    }),
  }),
  update: () => ({
    set: (values: { status: "new" | "known" | "review" }) => ({
      where: async () => {
        flashcardRows[0] = { ...flashcardRows[0], ...values };
      },
    }),
  }),
}));

vi.mock("../db", () => ({ getDb: async () => mockDb }));

import { learningRouter } from "./learning";

function authenticatedContext(): TrpcContext {
  return {
    user: { id: 42, openId: "local-test-user", name: "Dipanshi", email: "dipanshi@example.local", loginMethod: "local-development", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("learning.flashcards status persistence", () => {
  it("saves known and review status and returns the saved state on the next protected list call", async () => {
    const caller = learningRouter.createCaller(authenticatedContext());

    await caller.flashcards.updateStatus({ id: 1, status: "known" });
    expect((await caller.flashcards.list({}))[0]?.status).toBe("known");

    await caller.flashcards.updateStatus({ id: 1, status: "review" });
    expect((await caller.flashcards.list({}))[0]?.status).toBe("review");
  });
});
