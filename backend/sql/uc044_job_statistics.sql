-- UC-044: Job Statistics and Analytics - schema changes
-- Run this in Supabase SQL editor

-- Add indexes to optimize statistics queries
CREATE INDEX IF NOT EXISTS idx_jobs_userid_status ON public.jobs (userId, status);
CREATE INDEX IF NOT EXISTS idx_jobs_userid_createdat ON public.jobs (userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_jobs_userid_statusupdatedat ON public.jobs (userId, statusUpdatedAt);
CREATE INDEX IF NOT EXISTS idx_jobs_userid_deadline ON public.jobs (userId, deadline);

-- Create a view for easy statistics queries
CREATE OR REPLACE VIEW public.job_statistics AS
SELECT 
  userId,
  COUNT(*) FILTER (WHERE status = 'Interested') as interested_count,
  COUNT(*) FILTER (WHERE status = 'Applied') as applied_count,
  COUNT(*) FILTER (WHERE status = 'Phone Screen') as phone_screen_count,
  COUNT(*) FILTER (WHERE status = 'Interview') as interview_count,
  COUNT(*) FILTER (WHERE status = 'Offer') as offer_count,
  COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status IN ('Phone Screen', 'Interview', 'Offer')) as interview_stage_count,
  COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= CURRENT_DATE) as upcoming_deadlines,
  COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline < CURRENT_DATE AND status = 'Interested') as missed_deadlines
FROM public.jobs
WHERE "archivedAt" IS NULL
GROUP BY userId;

COMMENT ON VIEW public.job_statistics IS 'Aggregated job statistics per user for UC-044 analytics dashboard';
