-- Add 'tpo' to the user_role enum
-- Run this BEFORE running prisma db push, or use prisma db push directly.
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'tpo';
