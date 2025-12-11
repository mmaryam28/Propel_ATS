-- UC-056: AI Cover Letter Content Generation - Save generated cover letters
-- Run this in Supabase SQL editor

-- Table to store generated cover letters linked to jobs
CREATE TABLE IF NOT EXISTS public.saved_cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "jobId" uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  "templateSlug" text,
  tone text,
  company text,
  "jobDescription" text,
  "profileSummary" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_job FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON DELETE CASCADE
);

-- Index for faster queries by user and job
CREATE INDEX IF NOT EXISTS idx_saved_cover_letters_user_id ON public.saved_cover_letters("userId");
CREATE INDEX IF NOT EXISTS idx_saved_cover_letters_job_id ON public.saved_cover_letters("jobId");
CREATE INDEX IF NOT EXISTS idx_saved_cover_letters_created_at ON public.saved_cover_letters("createdAt" DESC);

-- Enable RLS
ALTER TABLE public.saved_cover_letters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cover letters
CREATE POLICY "Users can view their own cover letters"
  ON public.saved_cover_letters
  FOR SELECT
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Users can insert their own cover letters"
  ON public.saved_cover_letters
  FOR INSERT
  WITH CHECK ("userId"::text = auth.uid()::text);

CREATE POLICY "Users can update their own cover letters"
  ON public.saved_cover_letters
  FOR UPDATE
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Users can delete their own cover letters"
  ON public.saved_cover_letters
  FOR DELETE
  USING ("userId"::text = auth.uid()::text);

-- Trigger to update updatedAt automatically
CREATE OR REPLACE FUNCTION update_saved_cover_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_cover_letters_updated_at_trigger
  BEFORE UPDATE ON public.saved_cover_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_cover_letters_updated_at();

COMMENT ON TABLE public.saved_cover_letters IS 'Stores AI-generated cover letters linked to job applications';
COMMENT ON COLUMN public.saved_cover_letters."userId" IS 'User who created the cover letter';
COMMENT ON COLUMN public.saved_cover_letters."jobId" IS 'Job application this cover letter is for';
COMMENT ON COLUMN public.saved_cover_letters.title IS 'User-defined title for this cover letter';
COMMENT ON COLUMN public.saved_cover_letters.content IS 'The full generated/edited cover letter text';
COMMENT ON COLUMN public.saved_cover_letters."templateSlug" IS 'Template used to generate this letter';
COMMENT ON COLUMN public.saved_cover_letters.tone IS 'Tone used (formal, friendly, concise)';
