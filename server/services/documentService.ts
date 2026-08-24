import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]);

export function validateDocument(filename: string, mimeType: string, size: number) {
  const extension = filename.toLowerCase().split(".").pop();
  const acceptedExtension = extension === "pdf" || extension === "docx" || extension === "txt";
  if (!SUPPORTED_TYPES.has(mimeType) || !acceptedExtension) throw new Error("Only PDF, DOCX, and TXT study materials are supported.");
  if (size <= 0 || size > MAX_FILE_SIZE) throw new Error("Documents must be between 1 byte and 5 MB.");
}

export async function extractDocumentText(buffer: Buffer, mimeType: string) {
  if (mimeType === "text/plain") return buffer.toString("utf8").replace(/\0/g, "").slice(0, 50000);
  if (mimeType.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\0/g, "").slice(0, 50000);
  }
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/\0/g, "").slice(0, 50000);
  } finally {
    await parser.destroy();
  }
}
