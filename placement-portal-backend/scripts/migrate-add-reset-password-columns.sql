USE placement_portal;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_password_expire DATETIME DEFAULT NULL;
