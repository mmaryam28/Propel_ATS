-- Profile Completeness Metrics Table
-- This table stores calculated profile completeness data for each user

CREATE TABLE IF NOT EXISTS profile_completeness_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score integer DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  section_scores jsonb DEFAULT '{}'::jsonb,
  badges_earned text[] DEFAULT '{}',
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_completeness_user_id 
ON profile_completeness_metrics(user_id);

-- Create index on overall_score for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profile_completeness_score 
ON profile_completeness_metrics(overall_score DESC);

-- Add comments for documentation
COMMENT ON TABLE profile_completeness_metrics IS 'Stores profile completeness analysis and scores for each user';
COMMENT ON COLUMN profile_completeness_metrics.user_id IS 'Reference to the user this completeness data belongs to';
COMMENT ON COLUMN profile_completeness_metrics.overall_score IS 'Overall profile completeness percentage (0-100)';
COMMENT ON COLUMN profile_completeness_metrics.section_scores IS 'Detailed scores for each profile section (Basic Info, Employment, Education, Skills, Projects, Certifications)';
COMMENT ON COLUMN profile_completeness_metrics.badges_earned IS 'Array of badge names earned by the user based on completion thresholds';
COMMENT ON COLUMN profile_completeness_metrics.last_calculated_at IS 'Timestamp of when this completeness was last calculated';

-- Example section_scores JSON structure:
-- {
--   "basicInfo": {
--     "name": "Basic Information",
--     "score": 55,
--     "maxScore": 75,
--     "percentage": 73,
--     "completed": true,
--     "requiredFields": [
--       {"field": "firstname", "present": true, "required": true},
--       {"field": "email", "present": true, "required": true}
--     ]
--   },
--   "employment": { ... },
--   "education": { ... },
--   "skills": { ... },
--   "projects": { ... },
--   "certifications": { ... }
-- }

-- Example badges_earned array:
-- ['Getting Started', 'Profile Builder', 'Profile Expert']
