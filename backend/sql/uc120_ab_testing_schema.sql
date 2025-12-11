-- UC-120: A/B Testing (Material Comparison) Schema
-- Add missing columns to ab_test_results table

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add total_responses column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'total_responses'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN total_responses INTEGER DEFAULT 0;
    END IF;

    -- Add response_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'response_rate'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN response_rate DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add avg_time_to_response_hours column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'avg_time_to_response_hours'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN avg_time_to_response_hours DECIMAL(10,2);
    END IF;

    -- Add total_interviews column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'total_interviews'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN total_interviews INTEGER DEFAULT 0;
    END IF;

    -- Add interview_conversion_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'interview_conversion_rate'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN interview_conversion_rate DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add total_offers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'total_offers'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN total_offers INTEGER DEFAULT 0;
    END IF;

    -- Add offer_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ab_test_results' AND column_name = 'offer_rate'
    ) THEN
        ALTER TABLE ab_test_results ADD COLUMN offer_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ab_test_results' 
ORDER BY ordinal_position;
