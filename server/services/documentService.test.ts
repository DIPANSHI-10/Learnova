import { describe, expect, it } from "vitest";
import { extractDocumentText, validateDocument } from "./documentService";

describe("NovaMind document service", () => {
  it("extracts normalized text from a supported TXT document", async () => {
    const text = await extractDocumentText(Buffer.from("Study\u0000 notes\nare ready."), "text/plain");
    expect(text).toBe("Study notes\nare ready.");
  });

  it("rejects unsupported file types before processing", () => {
    expect(() => validateDocument("archive.zip", "application/zip", 50)).toThrow("Only PDF, DOCX, and TXT");
  });

  it("rejects oversized uploads", () => {
    expect(() => validateDocument("material.pdf", "application/pdf", 5 * 1024 * 1024 + 1)).toThrow("between 1 byte and 5 MB");
  });
});
