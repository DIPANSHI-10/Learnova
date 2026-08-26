import { describe, expect, it, vi } from "vitest";

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockRejectedValue(new Error("Model unavailable in local fallback test")),
}));

import { createSummary } from "./aiService";

describe("Learnova summaries", () => {
  it("creates source-grounded summaries for different study materials", async () => {
    const dbms = await createSummary("A primary key uniquely identifies every row. A foreign key connects related tables. Normalization reduces data redundancy.", "medium");
    const networks = await createSummary("TCP provides reliable ordered delivery. UDP has lower overhead but does not guarantee delivery. DNS maps domain names to IP addresses.", "medium");

    expect(dbms).toContain("primary key");
    expect(dbms).toContain("foreign key");
    expect(networks).toContain("TCP");
    expect(networks).toContain("DNS");
    expect(dbms).not.toBe(networks);
  });

  it("rejects an empty source before generating a summary", async () => {
    await expect(createSummary("   ", "short")).rejects.toThrow("Text or an uploaded document is required.");
  });
});
