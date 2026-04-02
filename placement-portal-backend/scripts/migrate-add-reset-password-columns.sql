-- Adds reset password columns to users table (PostgreSQL).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_password_expire TIMESTAMPTZ DEFAULT NULL;
