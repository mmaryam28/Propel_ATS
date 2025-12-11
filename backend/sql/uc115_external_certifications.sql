-- UC-115: External Skills Assessment Platform Integration
-- SQL migration for external certifications tables in Supabase

-- Drop existing tables and recreate with correct schema
-- WARNING: This will delete all existing data in these tables!
DROP TABLE IF EXISTS external_certification_courses CASCADE;
DROP TABLE IF EXISTS external_certification_badges CASCADE;
DROP TABLE IF EXISTS external_certifications CASCADE;

-- Main table for external platform certifications
CREATE TABLE external_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Platform information
    platform TEXT NOT NULL CHECK (platform IN ('HackerRank', 'LeetCode', 'Codecademy', 'Other')),
    platform_username TEXT,
    profile_url TEXT NOT NULL,
    
    -- Verification and status
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'manual', 'failed')),
    is_public BOOLEAN DEFAULT true,
    
    -- Scores and rankings (stored as JSON for flexibility)
    scores JSONB DEFAULT '{}',
    ranking_data JSONB DEFAULT '{}',
    
    -- Sync information
    last_synced_at TIMESTAMPTZ,
    last_verification_attempt TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique platform per user
    UNIQUE(user_id, platform)
);

-- Table for individual badges/certificates from external platforms
CREATE TABLE external_certification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_certification_id UUID NOT NULL REFERENCES external_certifications(id) ON DELETE CASCADE,
    
    -- Badge information
    badge_name TEXT NOT NULL,
    badge_id TEXT,
    badge_type TEXT, -- e.g., 'skill', 'achievement', 'completion'
    badge_icon_url TEXT,
    
    -- Badge details
    description TEXT,
    earned_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    skill_level TEXT, -- e.g., 'beginner', 'intermediate', 'advanced', 'expert'
    
    -- Verification
    verification_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for completed courses from external platforms
CREATE TABLE external_certification_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_certification_id UUID NOT NULL REFERENCES external_certifications(id) ON DELETE CASCADE,
    
    -- Course information
    course_name TEXT NOT NULL,
    course_id TEXT,
    course_url TEXT,
    
    -- Course details
    completion_date TIMESTAMPTZ,
    completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    certificate_url TEXT,
    
    -- Course metrics
    duration_hours DECIMAL(10, 2),
    final_score DECIMAL(5, 2),
    skills_learned TEXT[], -- Array of skills
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_external_certifications_user_id ON external_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_external_certifications_platform ON external_certifications(platform);
CREATE INDEX IF NOT EXISTS idx_external_certifications_verification ON external_certifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_external_certification_badges_cert_id ON external_certification_badges(external_certification_id);
CREATE INDEX IF NOT EXISTS idx_external_certification_courses_cert_id ON external_certification_courses(external_certification_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_external_certifications_updated_at ON external_certifications;
CREATE TRIGGER update_external_certifications_updated_at
    BEFORE UPDATE ON external_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_certification_badges_updated_at ON external_certification_badges;
CREATE TRIGGER update_external_certification_badges_updated_at
    BEFORE UPDATE ON external_certification_badges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_certification_courses_updated_at ON external_certification_courses;
CREATE TRIGGER update_external_certification_courses_updated_at
    BEFORE UPDATE ON external_certification_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE external_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_certification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_certification_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own certifications
DROP POLICY IF EXISTS "Users can view own external certifications" ON external_certifications;
CREATE POLICY "Users can view own external certifications"
    ON external_certifications FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own external certifications" ON external_certifications;
CREATE POLICY "Users can insert own external certifications"
    ON external_certifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own external certifications" ON external_certifications;
CREATE POLICY "Users can update own external certifications"
    ON external_certifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own external certifications" ON external_certifications;
CREATE POLICY "Users can delete own external certifications"
    ON external_certifications FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for badges
DROP POLICY IF EXISTS "Users can view badges from their certifications" ON external_certification_badges;
CREATE POLICY "Users can view badges from their certifications"
    ON external_certification_badges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM external_certifications 
            WHERE id = external_certification_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

DROP POLICY IF EXISTS "Users can manage badges from their certifications" ON external_certification_badges;
CREATE POLICY "Users can manage badges from their certifications"
    ON external_certification_badges FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM external_certifications 
            WHERE id = external_certification_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for courses
DROP POLICY IF EXISTS "Users can view courses from their certifications" ON external_certification_courses;
CREATE POLICY "Users can view courses from their certifications"
    ON external_certification_courses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM external_certifications 
            WHERE id = external_certification_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

DROP POLICY IF EXISTS "Users can manage courses from their certifications" ON external_certification_courses;
CREATE POLICY "Users can manage courses from their certifications"
    ON external_certification_courses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM external_certifications 
            WHERE id = external_certification_id 
            AND user_id = auth.uid()
        )
    );

-- Optional: Create a view for easy querying of all certification data
CREATE OR REPLACE VIEW external_certifications_full AS
SELECT 
    ec.id,
    ec.user_id,
    ec.platform,
    ec.platform_username,
    ec.profile_url,
    ec.verification_status,
    ec.is_public,
    ec.scores,
    ec.ranking_data,
    ec.last_synced_at,
    ec.created_at,
    ec.updated_at,
    COUNT(DISTINCT ecb.id) as badge_count,
    COUNT(DISTINCT ecc.id) as course_count,
    json_agg(DISTINCT jsonb_build_object(
        'id', ecb.id,
        'name', ecb.badge_name,
        'type', ecb.badge_type,
        'earned_date', ecb.earned_date,
        'is_verified', ecb.is_verified
    )) FILTER (WHERE ecb.id IS NOT NULL) as badges,
    json_agg(DISTINCT jsonb_build_object(
        'id', ecc.id,
        'name', ecc.course_name,
        'completion_date', ecc.completion_date,
        'completion_percentage', ecc.completion_percentage
    )) FILTER (WHERE ecc.id IS NOT NULL) as courses
FROM external_certifications ec
LEFT JOIN external_certification_badges ecb ON ec.id = ecb.external_certification_id
LEFT JOIN external_certification_courses ecc ON ec.id = ecc.external_certification_id
GROUP BY ec.id;

-- Grant access to the view
GRANT SELECT ON external_certifications_full TO authenticated;

-- Insert some sample data for testing (optional - remove in production)
-- Note: Replace 'your-user-id' with an actual user ID from your users table
/*
INSERT INTO external_certifications (user_id, platform, platform_username, profile_url, verification_status, is_public)
VALUES 
    ('your-user-id', 'HackerRank', 'johndoe', 'https://www.hackerrank.com/johndoe', 'verified', true),
    ('your-user-id', 'LeetCode', 'johndoe', 'https://leetcode.com/johndoe', 'manual', true)
ON CONFLICT (user_id, platform) DO NOTHING;
*/

-- Add comment for documentation
COMMENT ON TABLE external_certifications IS 'Stores links to external certification platforms like HackerRank, LeetCode, and Codecademy';
COMMENT ON TABLE external_certification_badges IS 'Stores individual badges and achievements earned on external platforms';
COMMENT ON TABLE external_certification_courses IS 'Stores completed courses from external certification platforms';
