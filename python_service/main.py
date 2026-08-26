"""NovaMind AI Python companion service.

This standalone FastAPI service provides a clean, environment-configured Python
layer for local AI experimentation and document extraction. The main NovaMind
web application retains secure server-side fallbacks, so the product remains
usable if this optional service or an external AI provider is not configured.
"""

from __future__ import annotations

import io
import os
import re
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - only used when dependency is absent
    PdfReader = None  # type: ignore[assignment,misc]

app = FastAPI(title="NovaMind AI service", version="1.0.0")

MAX_DOCUMENT_BYTES = int(os.getenv("NOVAMIND_MAX_DOCUMENT_BYTES", str(5 * 1024 * 1024)))
SUPPORTED_TYPES = {
    "application/pdf",
    "text/plain",
}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    context: list[str] = Field(default_factory=list, max_length=8)


class SummaryRequest(BaseModel):
    source: str = Field(min_length=1, max_length=12_000)
    length: Literal["short", "medium", "detailed"] = "medium"


def clean_text(value: str, limit: int = 12_000) -> str:
    """Remove unsafe control characters and enforce service-side size limits."""
    return value.replace("\x00", "").strip()[:limit]


def local_coach_response(message: str) -> str:
    """Provide a useful no-key fallback that never pretends to be an LLM."""
    topic = re.sub(r"\s+", " ", message).strip() or "your topic"
    return (
        f"Here is a focused way to approach **{topic}**:\n\n"
        "1. Identify the core definition or learning objective.\n"
        "2. Work through one concrete example in your own words.\n"
        "3. Test recall without notes, then record the part that felt uncertain.\n\n"
        "Share a course level or a short passage for a more targeted explanation."
    )


def local_summary(source: str, length: str) -> str:
    words = clean_text(source).split()
    limits = {"short": 55, "medium": 125, "detailed": 220}
    excerpt = " ".join(words[: limits[length]])
    terms = ", ".join(dict.fromkeys(word for word in words if len(word) > 6))[:180] or "the central concepts"
    suffix = "…" if len(words) > limits[length] else ""
    return (
        f"## Summary\n{excerpt}{suffix}\n\n"
        "## Key points\n- Identify the central idea and why it matters.\n"
        "- Connect the material to a concrete example.\n"
        "- Revisit any step that cannot yet be recalled unaided.\n\n"
        f"## Important terms\n{terms}\n\n"
        "## Revision questions\n1. What is the main idea?\n2. How would you explain it simply?\n3. Which detail needs another review?"
    )


def validate_upload(upload: UploadFile, content: bytes) -> None:
    extension = Path(upload.filename or "").suffix.lower()
    if upload.content_type not in SUPPORTED_TYPES or extension not in {".pdf", ".txt"}:
        raise HTTPException(status_code=415, detail="Only PDF and TXT documents are accepted by the Python service.")
    if not content or len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail=f"Documents must be between 1 byte and {MAX_DOCUMENT_BYTES} bytes.")


def extract_text(content: bytes, content_type: str) -> str:
    if content_type == "text/plain":
        return clean_text(content.decode("utf-8", errors="replace"), 50_000)
    if PdfReader is None:
        raise HTTPException(status_code=503, detail="PDF extraction is unavailable. Install the optional pypdf dependency.")
    try:
        reader = PdfReader(io.BytesIO(content))
        return clean_text("\n".join(page.extract_text() or "" for page in reader.pages), 50_000)
    except Exception as exc:  # noqa: BLE001 - translated into a safe API response
        raise HTTPException(status_code=422, detail="The PDF could not be read as text.") from exc


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "external_ai_configured": bool(os.getenv("NOVAMIND_LLM_API_KEY")),
        "mode": "local-fallback-ready",
    }


@app.post("/v1/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    # External provider calls intentionally live behind environment configuration.
    # Until a provider adapter is configured, the safe local study-coach fallback
    # keeps the product usable without committing credentials or hardcoding keys.
    return {"response": local_coach_response(clean_text(request.message, 4_000)), "mode": "local-fallback"}


@app.post("/v1/summarize")
def summarize(request: SummaryRequest) -> dict[str, str]:
    return {"summary": local_summary(request.source, request.length), "mode": "local-fallback"}


@app.post("/v1/documents/extract")
async def extract_document(file: UploadFile = File(...)) -> dict[str, str | int]:
    content = await file.read(MAX_DOCUMENT_BYTES + 1)
    validate_upload(file, content)
    text = extract_text(content, file.content_type or "")
    if not text:
        raise HTTPException(status_code=422, detail="No readable text could be extracted from this document.")
    return {"filename": file.filename or "document", "text": text, "characters": len(text)}
