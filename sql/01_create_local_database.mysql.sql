-- NovaMind AI local MySQL / MySQL Shell bootstrap
-- Change the password below before running this file.

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

-- This table is supplied by the hosted identity system in the managed version.
-- It must exist locally before Drizzle applies the application migrations.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT NOT NULL,
  openId VARCHAR(64) NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_id PRIMARY KEY (id),
  CONSTRAINT users_openId_unique UNIQUE (openId)
);
