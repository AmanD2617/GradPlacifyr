-- Adds recruiter/admin ownership on job postings for access scoping (PostgreSQL).

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS created_by INT;

-- Add foreign key only if it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_jobs_created_by_users'
      AND table_name = 'jobs'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT fk_jobs_created_by_users
      FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END
$$;
