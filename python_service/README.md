# NovaMind AI Python Companion Service

This optional FastAPI companion service provides a Python-first home for AI and document-processing workflows. It uses **environment variables** for any future external provider adapter, rejects unsupported files and overlarge uploads, and returns useful local fallback responses when no provider configuration is available.

## Run locally

Create and activate a virtual environment, then install the pinned dependencies.

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Use `config.example.txt` as a reference when exporting environment variables for a provider adapter. Do not commit populated environment files or API keys.

| Endpoint | Purpose |
|---|---|
| `GET /health` | Reports readiness and whether a provider key is present. |
| `POST /v1/chat` | Returns a safe study-coach response. |
| `POST /v1/summarize` | Produces a structured learning summary. |
| `POST /v1/documents/extract` | Validates and extracts text from PDF or TXT uploads. |

The production web app has its own server-side integration and fallbacks, so the public interface remains functional when this optional local service is not running.
