-- UC-043: Company Information Display - schema changes
-- Run this in Supabase SQL editor (or your Postgres) connected to the same database used by the backend.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS "companySize" text,
  ADD COLUMN IF NOT EXISTS "companyWebsite" text,
  ADD COLUMN IF NOT EXISTS "companyDescription" text,
  ADD COLUMN IF NOT EXISTS "companyMission" text,
  ADD COLUMN IF NOT EXISTS "companyLogoUrl" text,
  ADD COLUMN IF NOT EXISTS "companyContactEmail" text,
  ADD COLUMN IF NOT EXISTS "companyContactPhone" text,
  ADD COLUMN IF NOT EXISTS "glassdoorRating" numeric,
  ADD COLUMN IF NOT EXISTS "glassdoorUrl" text;

-- Optional: create a basic GIN trigram index to speed up company name searches if needed (requires pg_trgm extension)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON public.jobs USING gin (company gin_trgm_ops);

COMMENT ON COLUMN public.jobs."companySize" IS 'Company size band (e.g., 1-10, 11-50, 51-200, 1000+).';
COMMENT ON COLUMN public.jobs."companyWebsite" IS 'Company website URL.';
COMMENT ON COLUMN public.jobs."companyDescription" IS 'Company description/bio.';
COMMENT ON COLUMN public.jobs."companyMission" IS 'Company mission statement.';
COMMENT ON COLUMN public.jobs."companyLogoUrl" IS 'Public logo URL.';
COMMENT ON COLUMN public.jobs."companyContactEmail" IS 'General company contact email.';
COMMENT ON COLUMN public.jobs."companyContactPhone" IS 'General company contact phone.';
COMMENT ON COLUMN public.jobs."glassdoorRating" IS 'Glassdoor rating 0-5 if known.';
COMMENT ON COLUMN public.jobs."glassdoorUrl" IS 'Link to company page on Glassdoor if available.';
