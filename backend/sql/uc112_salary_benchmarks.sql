-- UC-112: Salary Data Integration
-- Create table to store salary benchmark data from free sources

CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job identification
  job_title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  
  -- Salary data (in USD)
  p25_percentile INTEGER,
  p50_percentile INTEGER,  -- median/typical salary
  p75_percentile INTEGER,
  
  -- Additional metrics
  mean_salary INTEGER,
  annual_openings INTEGER,
  
  -- Data source tracking
  data_source VARCHAR(100) NOT NULL, -- 'BLS', 'Glassdoor', etc.
  source_url VARCHAR(1000),
  
  -- Caching & updates
  last_updated_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP, -- When to refetch (e.g., 30 days later)
  cache_hit_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Unique constraint: only store one benchmark per title/location combo
  UNIQUE(job_title, location, data_source)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_title_location 
  ON salary_benchmarks(job_title, location);

CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_expires_at 
  ON salary_benchmarks(expires_at);

-- Table to track API calls to avoid rate limits
CREATE TABLE IF NOT EXISTS salary_api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(500),
  request_at TIMESTAMP DEFAULT now(),
  status_code INTEGER,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_api_calls_request_at 
  ON salary_api_calls(request_at);
