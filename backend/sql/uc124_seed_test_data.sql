-- UC-124: Sample test data for demo purposes
-- User ID: 0dc7e257-bf18-4646-8cc8-e4552bcabef5

-- Insert sample industry timing patterns
INSERT INTO industry_timing_patterns (
    industry, 
    company_size, 
    best_day_of_week, 
    best_hour_of_day, 
    best_hour_range,
    avg_response_rate, 
    avg_response_time_hours, 
    submission_count, 
    response_count,
    bad_days_of_week,
    bad_hours,
    avoid_reasons,
    confidence_level
) VALUES 
('tech', 'large', 'Tuesday', 9, '9-11 AM', 24.4, 48, 150, 37, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[17, 18, 19, 20, 21], ARRAY['Evening submissions are ignored', 'Weekend submissions low priority'], 0.85),
('tech', 'medium', 'Wednesday', 10, '10 AM - 12 PM', 22.1, 72, 120, 26, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[18, 19, 20], ARRAY['End of day low response'], 0.78),
('tech', 'startup', 'Monday', 8, '8-10 AM', 18.5, 36, 80, 15, ARRAY['Saturday', 'Sunday'], ARRAY[19, 20, 21, 22], ARRAY['Founders busy afternoons'], 0.65),
('finance', 'large', 'Tuesday', 9, '9-11 AM', 28.3, 24, 200, 57, ARRAY['Friday afternoon', 'Saturday', 'Sunday'], ARRAY[16, 17, 18, 19, 20], ARRAY['End of week recruiting slows'], 0.92),
('healthcare', 'medium', 'Monday', 9, '9-11 AM', 19.2, 96, 100, 19, ARRAY['Friday', 'Sunday'], ARRAY[17, 18, 19, 20], ARRAY['Clinical teams busy'], 0.72);

-- Sample timing recommendations (adjust user_id to your actual user)
INSERT INTO timing_recommendations (
    user_id,
    recommended_day_of_week,
    recommended_time_range,
    recommended_hour_start,
    recommended_hour_end,
    based_on_industry,
    based_on_company_size,
    current_recommendation,
    time_until_optimal,
    reasoning,
    warnings,
    confidence_level,
    estimated_response_rate_improvement,
    historical_success_rate
) VALUES
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 'Tuesday', '9-11 AM', 9, 11, 'tech', 'large', 'Wait until Tuesday 9-11 AM', 1380, 'Based on analysis of 150+ submissions to large tech companies, Tuesday 9-11 AM shows 24.4% response rate vs 15% baseline', ARRAY['Weekend submissions are rarely seen by recruiters', 'Submissions after 6 PM are less likely to be noticed'], 0.85, 35, 24.4);

-- Sample scheduled submissions
INSERT INTO application_timing_schedules (
    user_id,
    application_id,
    scheduled_submit_time,
    status,
    send_reminder,
    reminder_minutes_before,
    scheduling_reason
) VALUES
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 1, NOW() + INTERVAL '2 days' + INTERVAL '9 hours', 'scheduled', true, 30, 'Optimal timing: Tech company large size - Tuesday 9 AM window'),
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 2, NOW() + INTERVAL '3 days' + INTERVAL '10 hours', 'scheduled', true, 60, 'Optimal timing: Tech company medium size - Wednesday 10 AM window');

-- Sample submission metrics to show historical data
INSERT INTO application_submission_metrics (
    user_id,
    application_id,
    submitted_at,
    day_of_week,
    hour_of_day,
    user_timezone,
    company_name,
    industry,
    company_size,
    is_remote,
    first_response_at,
    response_time_hours,
    response_type,
    got_interview,
    application_quality_score
) VALUES
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 3, NOW() - INTERVAL '7 days', 'Tuesday', 9, 'America/New_York', 'Google', 'tech', 'large', true, NOW() - INTERVAL '6 days', 18, 'interview', true, 82),
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 4, NOW() - INTERVAL '14 days', 'Friday', 18, 'America/New_York', 'Meta', 'tech', 'large', true, NULL, NULL, 'none', false, 75),
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 5, NOW() - INTERVAL '21 days', 'Wednesday', 10, 'America/New_York', 'Microsoft', 'tech', 'large', true, NOW() - INTERVAL '19 days', 36, 'follow_up', false, 88),
('0dc7e257-bf18-4646-8cc8-e4552bcabef5', 6, NOW() - INTERVAL '28 days', 'Monday', 8, 'America/New_York', 'Stripe', 'tech', 'medium', true, NOW() - INTERVAL '27 days', 24, 'interview', true, 85);

COMMIT;
