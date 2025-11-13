-- UC-045: Job Archiving and Management - schema changes
-- Run this in Supabase SQL editor to add archiving support

-- Add archivedAt column to track when a job was archived
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz;

-- Add archiveReason column to track why a job was archived
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS "archiveReason" text;

-- Add index for efficient querying of archived jobs
CREATE INDEX IF NOT EXISTS idx_jobs_archived_at ON public.jobs ("archivedAt");

-- Add comments for documentation
COMMENT ON COLUMN public.jobs."archivedAt" IS 'Timestamp when the job was archived. NULL means not archived.';
COMMENT ON COLUMN public.jobs."archiveReason" IS 'Optional reason for archiving (e.g., "Position filled", "Not interested", "Company not hiring").';
