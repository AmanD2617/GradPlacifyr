-- Placement Portal Database Schema (PostgreSQL)
--
-- HOW TO USE:
-- 1. First, create the database manually in your SQL tool or run create-db.sql
-- 2. Then connect to the "placement_portal" database
-- 3. Run THIS script to create all tables, types, and triggers
--
-- This script is idempotent — safe to run multiple times without errors.

-- ============================================================
-- 1. Custom ENUM types (wrapped in DO blocks so re-runs don't fail)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'admin', 'recruiter', 'hod');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('open', 'closed');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM (
      'applied',
      'eligible',
      'shortlisted',
      'test_scheduled',
      'interview_scheduled',
      'selected',
      'rejected'
    );
  END IF;
END
$$;

-- ============================================================
-- 2. Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  name VARCHAR(255),
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expire TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  created_by INT REFERENCES users(id),
  ctc VARCHAR(50),
  location VARCHAR(255),
  description TEXT,
  requirements TEXT,
  status job_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES jobs(id),
  student_id INT NOT NULL REFERENCES users(id),
  status application_status DEFAULT 'applied',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id INT PRIMARY KEY REFERENCES users(id),
  tenth_percentage DECIMAL(5,2),
  twelfth_percentage DECIMAL(5,2),
  backlogs INT,
  graduation_year INT,
  programming_languages TEXT,
  frameworks TEXT,
  tools TEXT,
  certifications TEXT,
  projects_json TEXT,
  internship_experience TEXT,
  achievements TEXT,
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  ai_resume_json TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Trigger to auto-update updated_at on student_profiles
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to make this idempotent
DROP TRIGGER IF EXISTS set_student_profiles_updated_at ON student_profiles;

CREATE TRIGGER set_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
