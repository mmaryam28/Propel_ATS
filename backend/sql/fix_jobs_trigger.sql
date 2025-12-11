-- Fix the jobs table trigger issue
-- The trigger is trying to set updated_at field which doesn't exist

-- Option 1: Drop the trigger if you don't need auto-updating timestamps
DROP TRIGGER IF EXISTS update_jobs_timestamp ON jobs;
DROP TRIGGER IF EXISTS set_jobs_updated_at ON jobs;

-- Option 2: If you want to keep the trigger, first add the updated_at column
-- Uncomment the lines below if you want to add the updated_at field:
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
-- 
-- -- Then recreate the trigger
-- CREATE OR REPLACE FUNCTION set_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER update_jobs_timestamp 
-- BEFORE UPDATE ON jobs 
-- FOR EACH ROW 
-- EXECUTE FUNCTION set_updated_at();
