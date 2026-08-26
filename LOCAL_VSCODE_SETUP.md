# Run Learnova AI Locally in VS Code

This project is configured for **MySQL 8+ / MySQL Shell** and Node.js 22+. The exported package has a local multi-user mode. Each name-and-email combination entered from the Learnova landing page creates or reopens one private MySQL account, and uploads are stored in `local_uploads/`. This lets the main product experience run without Manus OAuth, cloud storage, or an external AI key.

> Keep `LOCAL_DEV_BYPASS_AUTH=true` for personal local development only. Set it to `false` before using a hosted deployment with real authentication.

## Before you start: what connects to what

Learnova runs on `http://localhost:3000` and connects to your own MySQL Server at `127.0.0.1:3306`. It uses the local database account `novamind_user`, the database `novamind_ai`, and the password `NovaMind2026`. MySQL Server must be running before you use **Begin learning**, because each local name-and-email account is saved to the `users` table.

## 1. Install required software

Install [Node.js 22 LTS](https://nodejs.org/), VS Code, and MySQL Server 8+. MySQL Shell is only a client; the MySQL Server service must also be running.

Open the downloaded folder in VS Code. Complete the MySQL steps below before starting the project.

## 2. Create your MySQL database with SQL Shell

Open **MySQL Shell**. The commands below use JavaScript mode only to establish the connection, then switch to SQL mode. Replace `root` with your MySQL administrator account.

```text
\connect root@localhost:3306
\sql
```

When prompted, enter your MySQL root password. Then run the local bootstrap script from the project folder. In MySQL Shell, use `\source` (not `USE novamind-ai`) and use the real absolute Windows path with forward slashes.

```text
\source C:/Users/YourWindowsName/Downloads/Learnova-AI-MultiUser-Windows-MySQL/novamind-ai/sql/01_create_local_database.mysql.sql
```

The script creates a `novamind_ai` database and the `novamind_user` local database account for both `localhost` and `127.0.0.1` using the requested local password `NovaMind2026`. Do not create any Learnova tables manually; the Drizzle migration command creates them in the correct order.

To check that it worked, run:

```sql
USE novamind_ai;
SHOW TABLES;
SELECT user, host FROM mysql.user WHERE user = 'novamind_user';
```

## 3. Create local environment configuration **before running migrations**

In the VS Code Explorer, copy `local.env.template` and name the copy exactly `.env`. This creates your private local configuration. Edit these fields:

| Setting | What to enter |
|---|---|
| `DATABASE_URL` | The same MySQL username, password, host, port, and database you created in SQL Shell. |
| `JWT_SECRET` | A long random value; keep it private. |
| `LOCAL_DEV_USER_NAME` | Optional fallback display name. You normally choose this on the landing page. |
| `LOCAL_DEV_USER_EMAIL` | Optional fallback email. You normally choose this on the landing page. |

For the included local password `NovaMind2026`, the connection string is:

```text
DATABASE_URL=mysql://novamind_user:NovaMind2026@127.0.0.1:3306/novamind_ai
```

If your password includes URL-reserved characters such as `@`, `:`, `/`, or `#`, URL-encode them. For example, `My@Pass` becomes `My%40Pass` in the connection string.

## 4. Create the application tables

With `.env` saved, open a new VS Code PowerShell terminal and install dependencies once:

```powershell
pnpm install
```

For a new empty `novamind_ai` database, run this once next:

```powershell
pnpm drizzle-kit migrate
```

This applies the saved Drizzle migration files for tasks, notes, documents, plans, conversations, quizzes, flashcards, calendar events, analytics, settings, and profile images. Confirm in MySQL Shell:

```sql
USE novamind_ai;
SHOW TABLES;
```

## 5. Run Learnova

```powershell
pnpm dev
```

The `dev` command is cross-platform and works in Windows PowerShell. If you pulled an earlier copy of the ZIP, use the replacement ZIP provided after this fix because earlier copies used a Unix-only command.

Open the local address shown in the terminal, normally `http://localhost:3000`. Click **Begin learning**, enter a name and email, and select **Enter your workspace**. The app creates that account in MySQL, signs it in, and opens the dashboard. To add another person, use **Logout**, then enter a different email. The same email always returns to its own saved workspace.

If `SHOW TABLES;` already shows the Learnova tables, do **not** run the migration again. Simply run `pnpm dev`. If the account form reports that Learnova cannot save to MySQL, check that the MySQL Server service is running, check the exact `DATABASE_URL` shown above in `.env`, then stop `pnpm dev` with `Ctrl+C` and run `pnpm dev` again.

## Useful commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Starts the local development server. |
| `pnpm test` | Runs the automated test suite. |
| `pnpm check` | Runs TypeScript validation. |
| `pnpm drizzle-kit migrate` | Applies saved database migrations. |
| `pnpm build` | Produces a production build. |

## Local AI and file behavior

The main application uses a deterministic study-coach and summary fallback if no external AI provider is configured. Documents and profile images are stored in the local `local_uploads/` directory when local mode is active. The optional `python_service/` can also be run separately for Python-based fallback AI and PDF/TXT extraction; see `python_service/README.md`.

## If your SQL Shell is PostgreSQL instead

This exported project is currently built for **MySQL** because its database adapter and Drizzle schema use MySQL types. Do not run these MySQL migrations in PostgreSQL. If your SQL Shell is `psql`, tell me which PostgreSQL version you use and I can provide a PostgreSQL-specific Drizzle schema and migration package.
