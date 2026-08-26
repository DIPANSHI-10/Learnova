# NovaMind AI

NovaMind AI is a secure, AI-assisted study and productivity workspace. It provides a responsive public marketing experience and a protected personal workspace for tasks, notes, documents, study plans, chat history, quizzes, flashcards, calendar events, and learning analytics.

## Product capabilities

| Area | Delivered capability |
|---|---|
| Personal workspace | Secure sign-in, user-scoped data access, profile controls, visual preferences, and reminder preferences. |
| Productivity | Full task CRUD, priorities, deadlines, completion states, note CRUD, tags, categories, and search. |
| AI learning | Persistent study chat, resilient study-coach fallback, a summarizer, study-plan creation, quiz generation, and flashcard generation. |
| Material workspace | PDF, DOCX, and TXT upload validation, storage, text extraction, document questions, and document management. |
| Learning insight | Study sessions, calendar events, weekly trends, task completion, quiz averages, subject focus, and streak reporting. |

## Architecture

The production web application uses **React, TypeScript, Express, tRPC, Drizzle ORM, and MySQL-compatible storage**. The managed project template provides secure OAuth session handling, a user table, protected procedure middleware, persistent data, server-side credentials, and object storage. Every application query and mutation is scoped to the authenticated user ID.

`server/services/aiService.ts` contains the production AI service wrapper. It calls the server-only language-model helper when available and falls back to deterministic, useful study-coach and summary outputs when no external model is configured. `server/services/documentService.ts` validates files and extracts readable text from PDF, DOCX, and TXT uploads before stored metadata is saved.

The `python_service/` folder is an optional FastAPI companion implementation for local Python-based AI and document workflows. It is intentionally independent from the managed Node deployment and uses the same safe local fallback approach.

## Project structure

```text
client/                 Responsive React experience and product views
server/                 Protected tRPC procedures and service layer
server/services/        AI and document extraction services
drizze/                  Schema and generated SQL migration history
python_service/         Optional FastAPI AI/document-processing companion
```

## Local web application setup

The managed project includes the required Node dependencies and environment configuration. For a local clone, install Node.js 22+ and pnpm, then run:

```bash
pnpm install
pnpm drizzle-kit generate
pnpm dev
```

The server expects platform-managed database, OAuth, storage, and AI gateway variables in the hosted environment. Do not hardcode or expose them in frontend code.

## Windows commands

From PowerShell in the project folder:

```powershell
corepack enable
pnpm install
pnpm drizzle-kit generate
pnpm dev
```

To run the optional Python companion locally:

```powershell
cd python_service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Security model

NovaMind never places an API key in the browser. Protected procedures require an authenticated session, and database reads, updates, and deletions use the current user ID in their predicates. Upload validation restricts document type and size before extraction or object storage. Document bytes are kept in object storage; the database only stores metadata, object references, and extracted text.

## Future improvements

Future iterations can add provider-specific AI adapters, richer calendar views, role-specific education workflows, native spaced-repetition scheduling, deeper document citation support, and user-configured reminder schedules.
