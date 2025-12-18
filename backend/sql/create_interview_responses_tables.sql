-- UC-126: Interview Question Response Library
-- Tables to store interview responses with versioning, tagging, and outcome tracking

-- Main interview responses table
CREATE TABLE IF NOT EXISTS public.interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  -- Question details
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('behavioral', 'technical', 'situational')),
  question_category TEXT, -- 'leadership', 'problem-solving', 'system-design', 'conflict-resolution', etc.
  
  -- Current response (denormalized for quick access)
  current_response TEXT NOT NULL,
  current_version_id UUID,
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT false,
  practice_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- % that led to positive outcomes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Response versions (edit history)
CREATE TABLE IF NOT EXISTS public.response_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.interview_responses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  version_number INTEGER NOT NULL,
  response_text TEXT NOT NULL,
  
  -- AI feedback
  ai_feedback JSONB, -- {clarity_score, star_method_score, suggestions: [...], strengths: [...]}
  word_count INTEGER,
  estimated_duration INTEGER, -- seconds
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(response_id, version_number)
);

-- Tags for responses (skills, experiences, companies)
CREATE TABLE IF NOT EXISTS public.response_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.interview_responses(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL, -- 'skill', 'experience', 'company', 'industry', 'role'
  tag_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(response_id, tag_type, tag_value)
);

-- Track response usage and outcomes
CREATE TABLE IF NOT EXISTS public.response_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.interview_responses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  
  interview_date DATE,
  company TEXT,
  position TEXT,
  
  -- Outcome
  outcome TEXT NOT NULL CHECK (outcome IN ('offer', 'next_round', 'rejected', 'pending')),
  interviewer_reaction TEXT CHECK (interviewer_reaction IN ('positive', 'neutral', 'negative')),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practice sessions with AI feedback
CREATE TABLE IF NOT EXISTS public.response_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  response_id UUID NOT NULL REFERENCES public.interview_responses(id) ON DELETE CASCADE,
  
  practice_text TEXT NOT NULL,
  delivery_time INTEGER, -- seconds
  
  -- AI evaluation
  ai_score DECIMAL(5,2),
  ai_feedback JSONB, -- {strengths: [], improvements: [], score_breakdown: {clarity, structure, content}}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON public.interview_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_type ON public.interview_responses(question_type);
CREATE INDEX IF NOT EXISTS idx_responses_category ON public.interview_responses(question_category);
CREATE INDEX IF NOT EXISTS idx_responses_favorite ON public.interview_responses(is_favorite);

CREATE INDEX IF NOT EXISTS idx_response_versions_response_id ON public.response_versions(response_id);
CREATE INDEX IF NOT EXISTS idx_response_versions_user_id ON public.response_versions(user_id);

CREATE INDEX IF NOT EXISTS idx_response_tags_response_id ON public.response_tags(response_id);
CREATE INDEX IF NOT EXISTS idx_response_tags_value ON public.response_tags(tag_value);
CREATE INDEX IF NOT EXISTS idx_response_tags_type ON public.response_tags(tag_type);

CREATE INDEX IF NOT EXISTS idx_response_outcomes_response_id ON public.response_outcomes(response_id);
CREATE INDEX IF NOT EXISTS idx_response_outcomes_user_id ON public.response_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_response_outcomes_outcome ON public.response_outcomes(outcome);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_response_id ON public.response_practice_sessions(response_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.response_practice_sessions(user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_responses_updated_at
  BEFORE UPDATE ON public.interview_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_responses_updated_at();

-- Function to update success rate when outcomes change
CREATE OR REPLACE FUNCTION update_response_success_rate()
RETURNS TRIGGER AS $$
DECLARE
  v_success_count INTEGER;
  v_total_uses INTEGER;
  v_success_rate DECIMAL(5,2);
BEGIN
  -- Count successful outcomes (offer or next_round)
  SELECT 
    COUNT(*) FILTER (WHERE outcome IN ('offer', 'next_round')),
    COUNT(*)
  INTO v_success_count, v_total_uses
  FROM public.response_outcomes
  WHERE response_id = COALESCE(NEW.response_id, OLD.response_id);
  
  -- Calculate success rate
  IF v_total_uses > 0 THEN
    v_success_rate := (v_success_count::DECIMAL / v_total_uses) * 100;
  ELSE
    v_success_rate := NULL;
  END IF;
  
  -- Update the response
  UPDATE public.interview_responses
  SET 
    success_count = v_success_count,
    total_uses = v_total_uses,
    success_rate = v_success_rate,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.response_id, OLD.response_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_response_success_rate
  AFTER INSERT OR UPDATE OR DELETE ON public.response_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_response_success_rate();

-- Comments
COMMENT ON TABLE public.interview_responses IS 'Library of interview question responses with versioning and success tracking';
COMMENT ON TABLE public.response_versions IS 'Version history of response edits with AI feedback';
COMMENT ON TABLE public.response_tags IS 'Tags for categorizing responses by skills, companies, experiences';
COMMENT ON TABLE public.response_outcomes IS 'Track real-world usage and outcomes of responses';
COMMENT ON TABLE public.response_practice_sessions IS 'Practice sessions with AI feedback for improvement';
