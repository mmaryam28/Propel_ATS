-- Create a clean user_profile_skills table for profile completeness tracking
-- This replaces the fragmented skills/user_skills tables for profile tracking

-- Drop existing table if you want a fresh start (BE CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS public.user_profile_skills CASCADE;

CREATE TABLE IF NOT EXISTS public.user_profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Technical', 'Soft Skills', 'Languages', 'Industry-Specific')),
  proficiency text CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  years_experience integer CHECK (years_experience >= 0),
  display_order integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT user_profile_skills_unique UNIQUE (user_id, skill_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profile_skills_user_id 
  ON public.user_profile_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profile_skills_category 
  ON public.user_profile_skills(user_id, category);

-- Add RLS policies
ALTER TABLE public.user_profile_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own skills" ON public.user_profile_skills;
CREATE POLICY "Users can view their own skills" 
  ON public.user_profile_skills FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON public.user_profile_skills;
CREATE POLICY "Users can insert their own skills" 
  ON public.user_profile_skills FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON public.user_profile_skills;
CREATE POLICY "Users can update their own skills" 
  ON public.user_profile_skills FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON public.user_profile_skills;
CREATE POLICY "Users can delete their own skills" 
  ON public.user_profile_skills FOR DELETE 
  USING (auth.uid() = user_id);

-- Migrate existing data from skills table (if it exists)
-- This will copy your current 10 skills into the new table
INSERT INTO public.user_profile_skills (user_id, skill_name, category, proficiency, display_order)
SELECT 
  CAST("userId" AS uuid),
  name,
  category,
  proficiency,
  "order"
FROM public.skills
WHERE "userId" IS NOT NULL
ON CONFLICT (user_id, skill_name) DO UPDATE
SET 
  category = EXCLUDED.category,
  proficiency = EXCLUDED.proficiency,
  display_order = EXCLUDED.display_order;

-- Add helpful comment
COMMENT ON TABLE public.user_profile_skills IS 'User skills for profile completeness tracking and job matching';
COMMENT ON COLUMN public.user_profile_skills.user_id IS 'Reference to the user who owns this skill';
COMMENT ON COLUMN public.user_profile_skills.skill_name IS 'Name of the skill (e.g., JavaScript, Communication)';
COMMENT ON COLUMN public.user_profile_skills.category IS 'Skill category: Technical, Soft Skills, Languages, or Industry-Specific';
COMMENT ON COLUMN public.user_profile_skills.proficiency IS 'Proficiency level: Beginner, Intermediate, Advanced, or Expert';
COMMENT ON COLUMN public.user_profile_skills.years_experience IS 'Number of years of experience with this skill';
COMMENT ON COLUMN public.user_profile_skills.display_order IS 'Order for displaying skills in the UI';
