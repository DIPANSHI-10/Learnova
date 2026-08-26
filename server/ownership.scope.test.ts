import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const productivitySource = readFileSync(new URL("./routers/productivity.ts", import.meta.url), "utf8");
const learningSource = readFileSync(new URL("./routers/learning.ts", import.meta.url), "utf8");

describe("Learnova protected resource ownership", () => {
  it("scopes task and note mutations to both the resource identifier and authenticated user", () => {
    expect(productivitySource).toContain("and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id))");
    expect(productivitySource).toContain("and(eq(notes.id, id), eq(notes.userId, ctx.user.id))");
  });

  it("scopes documents, study plans, quizzes, and flashcards to the authenticated user", () => {
    expect(learningSource).toContain("and(eq(documents.id, input.id), eq(documents.userId, ctx.user.id))");
    expect(learningSource).toContain("and(eq(studyPlans.id, input.id), eq(studyPlans.userId, ctx.user.id))");
    expect(learningSource).toContain("and(eq(quizzes.id, input.id), eq(quizzes.userId, ctx.user.id))");
    expect(learningSource).toContain("and(eq(flashcards.id, input.id), eq(flashcards.userId, ctx.user.id))");
  });

  it("persists each selected flashcard revision status through the protected update path", () => {
    expect(learningSource).toContain("set({ status: input.status })");
    expect(learningSource).toContain("status: z.enum([\"new\", \"known\", \"review\"])");
    expect(learningSource).toContain("and(eq(flashcards.id, input.id), eq(flashcards.userId, ctx.user.id))");
  });
});
