-- ============================================
-- Multi-Platform Application Tracker Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- Track which platform each application came from
CREATE TABLE IF NOT EXISTS application_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'linkedin', 'indeed', 'glassdoor', 'company_site', 'other'
  platform_job_id VARCHAR(255), -- External job ID if available
  application_url TEXT, -- Link to the application on that platform
  platform_status VARCHAR(50), -- Platform-specific status
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_job_platform UNIQUE(job_id, platform)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_platforms_job_id ON application_platforms(job_id);
CREATE INDEX IF NOT EXISTS idx_application_platforms_platform ON application_platforms(platform);

-- Track potential duplicates
CREATE TABLE IF NOT EXISTS job_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id_1 UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_id_2 UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2), -- 0.0 to 1.0
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'merged', 'dismissed'
  merged_into_job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_job_pair UNIQUE(job_id_1, job_id_2),
  CONSTRAINT check_different_jobs CHECK (job_id_1 != job_id_2)
);

CREATE INDEX IF NOT EXISTS idx_job_duplicates_status ON job_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_job_duplicates_job1 ON job_duplicates(job_id_1);
CREATE INDEX IF NOT EXISTS idx_job_duplicates_job2 ON job_duplicates(job_id_2);

-- Add columns to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS primary_platform VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS platform_count INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS merged_into_job_id UUID REFERENCES jobs(id);

-- Create trigger for updated_at on application_platforms
CREATE OR REPLACE FUNCTION update_application_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS application_platforms_updated_at ON application_platforms;
CREATE TRIGGER application_platforms_updated_at
  BEFORE UPDATE ON application_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_application_platforms_updated_at();

-- Enable Row Level Security
ALTER TABLE application_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_duplicates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for application_platforms
CREATE POLICY "Users can manage their own job platforms" ON application_platforms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = application_platforms.job_id 
      AND jobs."userId" = auth.uid()
    )
  );

-- Create RLS policies for job_duplicates
CREATE POLICY "Users can view their own job duplicates" ON job_duplicates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE (jobs.id = job_duplicates.job_id_1 OR jobs.id = job_duplicates.job_id_2)
      AND jobs."userId" = auth.uid()
    )
  );

-- Success message
SELECT 'Platform tracking tables created successfully!' as message;
