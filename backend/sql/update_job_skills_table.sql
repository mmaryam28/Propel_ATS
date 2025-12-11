-- Script to update job_skills table to store skill data directly without foreign key
-- This denormalizes the data so job_skills contains skill information directly

-- Drop existing table and all its dependencies (triggers, constraints, etc.)
DROP TABLE IF EXISTS public.job_skills CASCADE;

-- Recreate job_skills table with skill data stored directly
CREATE TABLE IF NOT EXISTS public.job_skills (
  job_id uuid NOT NULL,
  skill_name text NOT NULL,
  skill_category text NULL,
  req_level integer NULL,
  weight double precision NULL DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_name),
  CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) 
    REFERENCES public.jobs (id) ON DELETE CASCADE,
  CONSTRAINT job_skills_req_level_check CHECK (
    (req_level >= 0) AND (req_level <= 5)
  ),
  CONSTRAINT job_skills_weight_check CHECK (
    (weight > 0) AND (weight <= 10)
  )
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_skills_job_id 
  ON public.job_skills USING btree (job_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_job_skills_skill_name 
  ON public.job_skills USING btree (skill_name) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON TABLE public.job_skills IS 'Table storing required skills for each job with skill data denormalized';
COMMENT ON COLUMN public.job_skills.job_id IS 'Reference to the job posting';
COMMENT ON COLUMN public.job_skills.skill_name IS 'Name of the required skill';
COMMENT ON COLUMN public.job_skills.skill_category IS 'Category of the skill (e.g., Technical, Soft Skills, Languages)';
COMMENT ON COLUMN public.job_skills.req_level IS 'Required proficiency level (0-5): 0=Beginner, 1=Basic, 2=Intermediate, 3=Advanced, 4=Expert, 5=Master';
COMMENT ON COLUMN public.job_skills.weight IS 'Importance weight for matching algorithm (1.0=normal, higher=more important)';

-- Optional: Add some sample data for testing (uncomment if needed)
/*
-- Add skills directly to a job:
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
VALUES 
  ('your-job-id-here'::uuid, 'JavaScript', 'Technical', 3, 1.5),
  ('your-job-id-here'::uuid, 'React', 'Technical', 4, 2.0),
  ('your-job-id-here'::uuid, 'Node.js', 'Technical', 3, 1.0),
  ('your-job-id-here'::uuid, 'Communication', 'Soft Skills', 3, 1.0)
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;
*/

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_job_skills_updated_at ON public.job_skills;
CREATE TRIGGER trigger_update_job_skills_updated_at
  BEFORE UPDATE ON public.job_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_job_skills_updated_at();

-- Verify the structure
SELECT 
  'job_skills table structure:' AS info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'job_skills'
ORDER BY ordinal_position;
