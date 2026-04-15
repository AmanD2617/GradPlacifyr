-- Migration: Add security hardening fields
-- Run this against your PostgreSQL database manually if prisma db push fails.

-- User: token versioning (JWT invalidation on logout), per-account lockout
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version        INTEGER   NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until         TIMESTAMPTZ;

-- OTP: track failed verification attempts (brute-force protection)
ALTER TABLE otps
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
