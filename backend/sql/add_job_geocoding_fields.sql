-- Add latitude and longitude columns to jobs table for geocoding feature
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comment for documentation
COMMENT ON COLUMN jobs.latitude IS 'Latitude coordinate for job location geocoding';
COMMENT ON COLUMN jobs.longitude IS 'Longitude coordinate for job location geocoding';