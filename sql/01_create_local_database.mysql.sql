-- Learnova AI local MySQL / MySQL Shell bootstrap
-- The Windows local password is intentionally NovaMind2026 to preserve the existing setup.

CREATE DATABASE IF NOT EXISTS novamind_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'novamind_user'@'localhost'
  IDENTIFIED BY 'NovaMind2026';

CREATE USER IF NOT EXISTS 'novamind_user'@'127.0.0.1'
  IDENTIFIED BY 'NovaMind2026';

GRANT ALL PRIVILEGES ON novamind_ai.* TO 'novamind_user'@'localhost';
GRANT ALL PRIVILEGES ON novamind_ai.* TO 'novamind_user'@'127.0.0.1';
FLUSH PRIVILEGES;

USE novamind_ai;

-- Do not create application tables here. Run `pnpm drizzle-kit migrate`
-- from VS Code after creating `.env`; Drizzle creates users and every
-- Learnova application table in the correct order.
