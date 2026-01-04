-- Add new fields to employment table for industry best practices
-- Migration: Add employment_type, responsibilities (jsonb array), and skills fields

-- Add employment_type column
ALTER TABLE public.employment 
ADD COLUMN IF NOT EXISTS employment_type text;

-- Add responsibilities column (stored as jsonb array of bullet points)
ALTER TABLE public.employment 
ADD COLUMN IF NOT EXISTS responsibilities jsonb DEFAULT '[]'::jsonb;

-- Add skills column (stored as jsonb array)
ALTER TABLE public.employment 
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- Add display_order column for manual reordering
ALTER TABLE public.employment 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing records to have empty arrays
UPDATE public.employment 
SET responsibilities = '[]'::jsonb 
WHERE responsibilities IS NULL;

UPDATE public.employment 
SET skills = '[]'::jsonb 
WHERE skills IS NULL;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_employment_display_order 
ON public.employment(user_id, display_order DESC);

COMMENT ON COLUMN public.employment.employment_type IS 'Type of employment: Full-time, Part-time, Contract, Internship, Freelance';
COMMENT ON COLUMN public.employment.responsibilities IS 'Array of responsibility bullet points (jsonb)';
COMMENT ON COLUMN public.employment.skills IS 'Array of skills/technologies used (jsonb)';
COMMENT ON COLUMN public.employment.display_order IS 'Manual ordering (higher = appears first)';
