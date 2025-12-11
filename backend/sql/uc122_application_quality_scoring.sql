-- UC-122: Application Package Quality Scoring
-- Track quality scores and improvement history for job applications

-- Main quality scores table
CREATE TABLE IF NOT EXISTS public.application_quality_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  alignment_score integer CHECK (alignment_score >= 0 AND alignment_score <= 100),
  formatting_score integer CHECK (formatting_score >= 0 AND formatting_score <= 100),
  consistency_score integer CHECK (consistency_score >= 0 AND consistency_score <= 100),
  missing_keywords text[],
  formatting_issues text[],
  suggestions jsonb,
  can_submit boolean DEFAULT false,
  resume_content text,
  cover_letter_content text,
  linkedin_profile text,
  job_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_quality_scores_pkey PRIMARY KEY (id),
  CONSTRAINT application_quality_scores_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_quality_scores_user_id ON public.application_quality_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_job_id ON public.application_quality_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_created_at ON public.application_quality_scores(created_at DESC);

-- RLS Policies
ALTER TABLE public.application_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quality scores"
  ON public.application_quality_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quality scores"
  ON public.application_quality_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quality scores"
  ON public.application_quality_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quality scores"
  ON public.application_quality_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quality_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quality_scores_updated_at
  BEFORE UPDATE ON public.application_quality_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_scores_updated_at();

-- View for score statistics by user
CREATE OR REPLACE VIEW public.user_quality_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_scores,
  ROUND(AVG(score)) as average_score,
  MAX(score) as highest_score,
  MIN(score) as lowest_score,
  ROUND(AVG(alignment_score)) as avg_alignment,
  ROUND(AVG(formatting_score)) as avg_formatting,
  ROUND(AVG(consistency_score)) as avg_consistency,
  SUM(CASE WHEN can_submit THEN 1 ELSE 0 END) as submittable_count,
  ROUND(SUM(CASE WHEN can_submit THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) as submittable_percentage
FROM public.application_quality_scores
GROUP BY user_id;

-- Grant permissions
GRANT SELECT ON public.user_quality_statistics TO authenticated;
