-- ===============================
-- ADD EMPLOYMENT TABLE COLUMNS
-- ===============================

-- Drop existing columns to ensure clean slate
ALTER TABLE public.employment DROP COLUMN IF EXISTS employment_type CASCADE;
ALTER TABLE public.employment DROP COLUMN IF EXISTS responsibilities CASCADE;
ALTER TABLE public.employment DROP COLUMN IF EXISTS skills CASCADE;
ALTER TABLE public.employment DROP COLUMN IF EXISTS display_order CASCADE;

-- Add employment_type column
ALTER TABLE public.employment 
ADD COLUMN employment_type text;

-- Add responsibilities column (stored as jsonb array of bullet points)
ALTER TABLE public.employment 
ADD COLUMN responsibilities jsonb DEFAULT '[]'::jsonb;

-- Add skills column (stored as jsonb array)
ALTER TABLE public.employment 
ADD COLUMN skills jsonb DEFAULT '[]'::jsonb;

-- Add display_order column for manual reordering
ALTER TABLE public.employment 
ADD COLUMN display_order integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_employment_display_order 
ON public.employment(user_id, display_order DESC);

-- Add comments
COMMENT ON COLUMN public.employment.employment_type IS 'Type of employment: Full-time, Part-time, Contract, Internship, Freelance';
COMMENT ON COLUMN public.employment.responsibilities IS 'Array of responsibility bullet points (jsonb)';
COMMENT ON COLUMN public.employment.skills IS 'Array of skills/technologies used (jsonb)';
COMMENT ON COLUMN public.employment.display_order IS 'Manual ordering (higher = appears first)';

-- ===============================
-- EMPLOYMENT TABLE RLS FIX
-- ===============================

-- Enable RLS (if not already enabled)
ALTER TABLE public.employment ENABLE ROW LEVEL SECURITY;

-- --------------------------------
-- DROP EXISTING POLICIES
-- --------------------------------
DROP POLICY IF EXISTS "Users can insert their own employment" ON public.employment;
DROP POLICY IF EXISTS "Users can view their own employment" ON public.employment;
DROP POLICY IF EXISTS "Users can update their own employment" ON public.employment;
DROP POLICY IF EXISTS "Users can delete their own employment" ON public.employment;

-- --------------------------------
-- SELECT POLICY
-- --------------------------------
CREATE POLICY "Users can view their own employment"
ON public.employment
FOR SELECT
USING (
  auth.uid() = user_id
);

-- --------------------------------
-- INSERT POLICY (THIS WAS THE BUG)
-- --------------------------------
CREATE POLICY "Users can insert their own employment"
ON public.employment
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- --------------------------------
-- UPDATE POLICY
-- --------------------------------
CREATE POLICY "Users can update their own employment"
ON public.employment
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- --------------------------------
-- DELETE POLICY
-- --------------------------------
CREATE POLICY "Users can delete their own employment"
ON public.employment
FOR DELETE
USING (
  auth.uid() = user_id
);
