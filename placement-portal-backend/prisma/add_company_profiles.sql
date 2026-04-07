-- Run this manually OR use: npx prisma db push
-- Creates the company_profiles table for the enhanced profile feature.

CREATE TABLE IF NOT EXISTS "company_profiles" (
    "user_id"      INTEGER      NOT NULL,
    "company_name" VARCHAR(255),
    "about"        TEXT,
    "website"      VARCHAR(500),
    "industry"     VARCHAR(255),
    "location"     VARCHAR(255),
    "logo_url"     VARCHAR(500),
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "company_profiles_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
