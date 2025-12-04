-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_team_tasks_timestamp ON team_tasks;

-- Create or replace the set_updated_at function with correct field name
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_team_tasks_timestamp 
BEFORE UPDATE ON team_tasks 
FOR EACH ROW 
EXECUTE FUNCTION set_updated_at();
