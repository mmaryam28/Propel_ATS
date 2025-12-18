-- ============================================
-- EXECUTE THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/isnkdobfeftngvxwtrve/sql
-- Copy all this text, paste it, and click RUN
-- ============================================

-- Create interview_responses table
CREATE TABLE IF NOT EXISTS interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('behavioral', 'technical', 'situational')),
  question_category VARCHAR(100),
  current_response TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  success_rate DECIMAL(5,2) DEFAULT 0,
  times_practiced INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create response_versions table
CREATE TABLE IF NOT EXISTS response_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES interview_responses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  response_text TEXT NOT NULL,
  ai_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create response_tags table
CREATE TABLE IF NOT EXISTS response_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES interview_responses(id) ON DELETE CASCADE,
  tag_type VARCHAR(50) NOT NULL,
  tag_value VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(response_id, tag_type, tag_value)
);

-- Create response_outcomes table
CREATE TABLE IF NOT EXISTS response_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES interview_responses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  company_name VARCHAR(255),
  outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('passed', 'failed', 'pending')),
  interview_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create response_practice_sessions table
CREATE TABLE IF NOT EXISTS response_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES interview_responses(id) ON DELETE CASCADE,
  practice_response TEXT NOT NULL,
  time_taken_seconds INTEGER,
  ai_feedback JSONB,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON interview_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_type ON interview_responses(question_type);
CREATE INDEX IF NOT EXISTS idx_responses_category ON interview_responses(question_category);
CREATE INDEX IF NOT EXISTS idx_responses_favorite ON interview_responses(is_favorite);
CREATE INDEX IF NOT EXISTS idx_response_tags_response_id ON response_tags(response_id);
CREATE INDEX IF NOT EXISTS idx_response_tags_tag_value ON response_tags(tag_value);
CREATE INDEX IF NOT EXISTS idx_response_outcomes_response_id ON response_outcomes(response_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_response_id ON response_practice_sessions(response_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_interview_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interview_responses_updated_at ON interview_responses;
CREATE TRIGGER interview_responses_updated_at
  BEFORE UPDATE ON interview_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_responses_updated_at();

-- Create trigger to auto-update success rate
CREATE OR REPLACE FUNCTION update_response_success_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE interview_responses
  SET success_rate = (
    SELECT CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE outcome = 'passed')::DECIMAL / COUNT(*) * 100)
    END
    FROM response_outcomes
    WHERE response_id = COALESCE(NEW.response_id, OLD.response_id)
  )
  WHERE id = COALESCE(NEW.response_id, OLD.response_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS response_outcomes_success_rate ON response_outcomes;
CREATE TRIGGER response_outcomes_success_rate
  AFTER INSERT OR UPDATE OR DELETE ON response_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_response_success_rate();

-- Grant permissions (adjust if needed)
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (these allow authenticated users to access their own data)
CREATE POLICY "Users can manage their own responses" ON interview_responses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own response versions" ON response_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM interview_responses 
      WHERE interview_responses.id = response_versions.response_id 
      AND interview_responses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own response tags" ON response_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM interview_responses 
      WHERE interview_responses.id = response_tags.response_id 
      AND interview_responses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own response outcomes" ON response_outcomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM interview_responses 
      WHERE interview_responses.id = response_outcomes.response_id 
      AND interview_responses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own practice sessions" ON response_practice_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM interview_responses 
      WHERE interview_responses.id = response_practice_sessions.response_id 
      AND interview_responses.user_id = auth.uid()
    )
  );

-- Verify tables were created
SELECT 'SUCCESS! All tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  AND tablename IN ('interview_responses', 'response_versions', 'response_tags', 'response_outcomes', 'response_practice_sessions')
ORDER BY tablename;
