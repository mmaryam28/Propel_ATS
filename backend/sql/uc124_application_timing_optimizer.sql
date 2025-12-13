-- UC-124: Application Timing Optimizer
-- SQL migration for application submission timing optimization tables in Supabase

-- Main table for industry and company size timing patterns
CREATE TABLE IF NOT EXISTS industry_timing_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry TEXT NOT NULL,
    company_size TEXT NOT NULL CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    
    -- Optimal timing data (day of week, hour)
    best_day_of_week TEXT, -- 'Monday', 'Tuesday', etc.
    best_hour_of_day INT CHECK (best_hour_of_day >= 0 AND best_hour_of_day < 24),
    best_hour_range TEXT, -- e.g., '9-11 AM'
    
    -- Statistical data
    avg_response_rate DECIMAL(5, 2),
    avg_response_time_hours INT,
    submission_count INT DEFAULT 0,
    response_count INT DEFAULT 0,
    
    -- Bad timing patterns to avoid
    bad_days_of_week TEXT[], -- Days to avoid
    bad_hours INT[], -- Hours to avoid
    avoid_reasons TEXT[], -- Why to avoid (e.g., 'Friday evenings', 'End of month')
    
    -- Time zone considerations
    recommended_timezone TEXT,
    timezone_adjustments JSONB DEFAULT '{}', -- e.g., {"PST": -3, "EST": 0, "CST": -1}
    
    -- Metadata
    data_freshness TIMESTAMPTZ DEFAULT NOW(),
    sample_size INT DEFAULT 0,
    confidence_level DECIMAL(3, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(industry, company_size)
);

-- Table for tracking actual application submissions and their metrics
CREATE TABLE IF NOT EXISTS application_submission_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INT NOT NULL,
    job_id INT,
    
    -- Submission timing details
    submitted_at TIMESTAMPTZ NOT NULL,
    day_of_week TEXT,
    hour_of_day INT CHECK (hour_of_day >= 0 AND hour_of_day < 24),
    user_timezone TEXT,
    
    -- Company and job details
    company_name TEXT,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    is_remote BOOLEAN DEFAULT false,
    
    -- Response tracking
    first_response_at TIMESTAMPTZ,
    response_time_hours INT,
    response_type TEXT CHECK (response_type IN ('interview', 'rejection', 'follow_up', 'none')),
    got_interview BOOLEAN DEFAULT false,
    
    -- Quality scoring
    application_quality_score INT CHECK (application_quality_score >= 0 AND application_quality_score <= 100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for personalized timing recommendations
CREATE TABLE IF NOT EXISTS timing_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommended_day_of_week TEXT NOT NULL,
    recommended_time_range TEXT NOT NULL, -- e.g., "9-11 AM"
    recommended_hour_start INT CHECK (recommended_hour_start >= 0 AND recommended_hour_start < 24),
    recommended_hour_end INT CHECK (recommended_hour_end >= 0 AND recommended_hour_end < 24),
    
    -- Based on analysis
    based_on_industry TEXT,
    based_on_company_size TEXT,
    
    -- Real-time recommendation
    current_recommendation TEXT, -- "Submit now" vs "Wait until Tuesday morning"
    time_until_optimal INT, -- Minutes until optimal submission time
    
    -- Reasoning and warnings
    reasoning TEXT,
    warnings TEXT[], -- Bad timing warnings
    confidence_level DECIMAL(3, 2),
    
    -- Impact data
    estimated_response_rate_improvement DECIMAL(5, 2), -- Percentage improvement
    historical_success_rate DECIMAL(5, 2),
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for application submission scheduling
CREATE TABLE IF NOT EXISTS application_timing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INT NOT NULL,
    
    -- Scheduled submission details
    scheduled_submit_time TIMESTAMPTZ NOT NULL,
    is_rescheduled BOOLEAN DEFAULT false,
    previous_scheduled_time TIMESTAMPTZ,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'submitted', 'cancelled', 'failed')),
    actual_submit_time TIMESTAMPTZ,
    
    -- Notification settings
    send_reminder BOOLEAN DEFAULT true,
    reminder_sent_at TIMESTAMPTZ,
    reminder_minutes_before INT DEFAULT 30,
    
    -- Metadata
    scheduling_reason TEXT, -- Why this time was chosen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for A/B test results on submission timing
CREATE TABLE IF NOT EXISTS timing_ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Test configuration
    test_name TEXT NOT NULL,
    test_duration_days INT,
    control_timing TEXT NOT NULL, -- e.g., "Anytime" or specific time
    variant_timing TEXT NOT NULL, -- e.g., "Tuesday 9-11 AM"
    
    -- Control group metrics
    control_submissions INT DEFAULT 0,
    control_responses INT DEFAULT 0,
    control_response_rate DECIMAL(5, 2),
    control_avg_response_time INT,
    control_interviews INT DEFAULT 0,
    control_interview_rate DECIMAL(5, 2),
    
    -- Variant group metrics
    variant_submissions INT DEFAULT 0,
    variant_responses INT DEFAULT 0,
    variant_response_rate DECIMAL(5, 2),
    variant_avg_response_time INT,
    variant_interviews INT DEFAULT 0,
    variant_interview_rate DECIMAL(5, 2),
    
    -- Statistical analysis
    response_rate_improvement DECIMAL(5, 2),
    interview_rate_improvement DECIMAL(5, 2),
    p_value DECIMAL(5, 4),
    is_statistically_significant BOOLEAN DEFAULT false,
    minimum_sample_size INT DEFAULT 20,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inconclusive')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Recommendations based on results
    winning_variant TEXT,
    recommendation_text TEXT,
    implementation_confidence DECIMAL(3, 2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_application_submission_metrics_user_id ON application_submission_metrics(user_id);
CREATE INDEX idx_application_submission_metrics_submitted_at ON application_submission_metrics(submitted_at);
CREATE INDEX idx_application_submission_metrics_industry ON application_submission_metrics(industry);
CREATE INDEX idx_timing_recommendations_user_id ON timing_recommendations(user_id);
CREATE INDEX idx_application_timing_schedules_user_id ON application_timing_schedules(user_id);
CREATE INDEX idx_application_timing_schedules_scheduled_time ON application_timing_schedules(scheduled_submit_time);
CREATE INDEX idx_timing_ab_test_results_user_id ON timing_ab_test_results(user_id);
CREATE INDEX idx_industry_timing_patterns_lookup ON industry_timing_patterns(industry, company_size);

-- Add comments to tables
COMMENT ON TABLE industry_timing_patterns IS 'Stores historical data on optimal submission times by industry and company size';
COMMENT ON TABLE application_submission_metrics IS 'Tracks actual application submissions and their outcomes for correlation analysis';
COMMENT ON TABLE timing_recommendations IS 'Stores personalized timing recommendations for users';
COMMENT ON TABLE application_timing_schedules IS 'Manages scheduled application submissions for optimal timing';
COMMENT ON TABLE timing_ab_test_results IS 'Tracks A/B test results to measure impact of submission timing on success rates';
