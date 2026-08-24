import { describe, expect, it } from "vitest";
import { buildFlashcards, buildQuiz, buildStudyPlan } from "./aiService";

describe("NovaMind local AI builders", () => {
  it("creates a structured study plan with trackable days", () => {
    const plan = buildStudyPlan({
      subject: "DBMS",
      topics: "ER model, Relational algebra, Normalization",
      availableHours: 2,
    });

    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan[0]).toMatchObject({ day: 1, focus: "ER model", duration: "120 min", complete: false });
  });

  it("creates bounded, answerable local quiz questions", () => {
    const quiz = buildQuiz("Python basics", "medium", 5, "mcq");
    expect(quiz).toHaveLength(5);
    expect(quiz[0]?.options).toHaveLength(4);
    expect(quiz[0]?.answer).toBe(0);
    expect(quiz[0]?.explanation).toContain("Active recall");
  });

  it("derives revision cards from a supplied topic and source text", () => {
    const cards = buildFlashcards("Normalization", "First normal form. Second normal form. Third normal form.");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0]?.question).toContain("Normalization");
    expect(cards[0]?.answer).toContain("learning objective");
  });
});
