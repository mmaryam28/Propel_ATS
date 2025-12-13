-- UC-124: Expand test data for all industry/company size combinations
-- This ensures the timing optimizer recommends different times for different combinations

-- Add missing combinations
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
-- Finance combinations
('finance', 'medium', 'Wednesday', 10, '10 AM - 12 PM', 25.5, 36, 110, 28, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[17, 18, 19, 20], ARRAY['End of day low response'], 0.88),
('finance', 'startup', 'Monday', 8, '8-10 AM', 20.1, 42, 85, 17, ARRAY['Saturday', 'Sunday'], ARRAY[19, 20, 21, 22], ARRAY['Founders busy afternoons'], 0.70),

-- Healthcare combinations
('healthcare', 'large', 'Tuesday', 9, '9-11 AM', 22.8, 72, 140, 32, ARRAY['Friday afternoon', 'Saturday', 'Sunday'], ARRAY[16, 17, 18, 19, 20], ARRAY['Clinical teams busy'], 0.85),
('healthcare', 'startup', 'Monday', 9, '9-11 AM', 17.5, 60, 95, 17, ARRAY['Wednesday', 'Friday', 'Sunday'], ARRAY[17, 18, 19], ARRAY['Clinicians busy late'], 0.68),

-- Tech + Small (new size)
('tech', 'small', 'Thursday', 10, '10 AM - 12 PM', 23.4, 54, 130, 31, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[18, 19, 20], ARRAY['End of week low attention'], 0.82),

-- Finance + Small (new size)
('finance', 'small', 'Wednesday', 9, '9-11 AM', 26.7, 30, 115, 31, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[17, 18, 19, 20], ARRAY['Recruitment pauses at week end'], 0.89),

-- Healthcare + Small (new size)
('healthcare', 'small', 'Tuesday', 10, '10 AM - 12 PM', 21.3, 48, 105, 22, ARRAY['Friday', 'Saturday', 'Sunday'], ARRAY[17, 18, 19], ARRAY['Staff meetings afternoon'], 0.76);

-- Verify the new data
SELECT industry, company_size, best_day_of_week, best_hour_range, avg_response_rate 
FROM industry_timing_patterns 
ORDER BY industry, company_size;
