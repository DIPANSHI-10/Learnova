import { describe, expect, it } from "vitest";
import { buildFlashcards, buildQuiz, buildStudyPlan } from "./aiService";

describe("Learnova local AI builders", () => {
  it("creates a structured study plan with trackable days", () => {
    const plan = buildStudyPlan({
      subject: "DBMS",
      topics: "ER model, Relational algebra, Normalization",
      availableHours: 2,
    });

    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan[0]).toMatchObject({ day: 1, focus: "ER model", duration: "120 min", complete: false });
  });

  it("creates topic-specific quiz questions with varied answers and distinct options", () => {
    const quiz = buildQuiz("DBMS normalization", "medium", 5, "mcq");
    expect(quiz).toHaveLength(5);
    expect(quiz.every((question) => question.options.length === 4)).toBe(true);
    expect(quiz.every((question) => new Set(question.options).size === 4)).toBe(true);
    expect(new Set(quiz.map((question) => question.answer)).size).toBeGreaterThan(1);
    expect(new Set(quiz.map((question) => question.prompt)).size).toBeGreaterThan(1);
    expect(quiz.every((question) => question.explanation.length > 40)).toBe(true);
    expect(quiz.some((question) => question.prompt.toLowerCase().includes("normal"))).toBe(true);
  });

  it("derives distinct, source-grounded revision cards instead of numbered templates", () => {
    const cards = buildFlashcards("Normalization", "First normal form. Second normal form. Third normal form.");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards[0]?.question).toContain("Normalization");
    expect(cards.some((card) => card.answer.includes("First normal form"))).toBe(true);
    expect(new Set(cards.map((card) => card.question)).size).toBe(cards.length);
    expect(cards.every((card) => !card.question.includes("Card "))).toBe(true);
  });

  it("uses different subject knowledge for different local revision sets", () => {
    const dbms = buildFlashcards("DBMS", "Primary keys identify rows. Foreign keys connect tables.");
    const python = buildFlashcards("Python", "Functions group reusable instructions. Lists are ordered collections.");
    expect(dbms.some((card) => card.answer.toLowerCase().includes("primary key"))).toBe(true);
    expect(python.some((card) => card.answer.toLowerCase().includes("function"))).toBe(true);
    expect(dbms.map((card) => card.question).join(" ")).not.toBe(python.map((card) => card.question).join(" "));
  });

  it("uses the actual number of days until the selected exam date", () => {
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 2);
    const plan = buildStudyPlan({ subject: "DBMS", topics: "Normalization, SQL", availableHours: 1, examDate });
    expect(plan).toHaveLength(2);
  });
});
