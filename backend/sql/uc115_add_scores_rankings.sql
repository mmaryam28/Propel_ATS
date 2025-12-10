-- UC-115: Add scores and rankings fields to external_certifications
-- This adds specific fields for common score/ranking metrics

-- Add new columns for scores and rankings
ALTER TABLE external_certifications
ADD COLUMN IF NOT EXISTS overall_score INTEGER,
ADD COLUMN IF NOT EXISTS overall_ranking INTEGER,
ADD COLUMN IF NOT EXISTS percentile DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_problems_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS easy_problems_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medium_problems_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hard_problems_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_badges INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_courses_completed INTEGER DEFAULT 0;

-- Update the external_certifications_full view to include new fields
DROP VIEW IF EXISTS external_certifications_full;

CREATE VIEW external_certifications_full AS
SELECT 
    ec.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', ecb.id,
                'badge_name', ecb.badge_name,
                'badge_id', ecb.badge_id,
                'badge_type', ecb.badge_type,
                'description', ecb.description,
                'earned_date', ecb.earned_date,
                'badge_icon_url', ecb.badge_icon_url,
                'verification_url', ecb.verification_url,
                'is_verified', ecb.is_verified,
                'skill_level', ecb.skill_level
            ) ORDER BY ecb.earned_date DESC
        ) FILTER (WHERE ecb.id IS NOT NULL),
        '[]'::json
    ) as badges,
    COALESCE(
        json_agg(
            json_build_object(
                'id', ecc.id,
                'course_name', ecc.course_name,
                'course_id', ecc.course_id,
                'completion_date', ecc.completion_date,
                'completion_percentage', ecc.completion_percentage,
                'course_url', ecc.course_url,
                'certificate_url', ecc.certificate_url,
                'skills_learned', ecc.skills_learned,
                'duration_hours', ecc.duration_hours,
                'final_score', ecc.final_score
            ) ORDER BY ecc.completion_date DESC
        ) FILTER (WHERE ecc.id IS NOT NULL),
        '[]'::json
    ) as courses
FROM external_certifications ec
LEFT JOIN external_certification_badges ecb ON ec.id = ecb.external_certification_id
LEFT JOIN external_certification_courses ecc ON ec.id = ecc.external_certification_id
GROUP BY ec.id;

-- Add comment explaining the new fields
COMMENT ON COLUMN external_certifications.overall_score IS 'Overall score/rating on the platform';
COMMENT ON COLUMN external_certifications.overall_ranking IS 'Global or platform ranking';
COMMENT ON COLUMN external_certifications.percentile IS 'Percentile ranking (0-100)';
COMMENT ON COLUMN external_certifications.total_problems_solved IS 'Total number of problems solved';
COMMENT ON COLUMN external_certifications.easy_problems_solved IS 'Number of easy problems solved';
COMMENT ON COLUMN external_certifications.medium_problems_solved IS 'Number of medium problems solved';
COMMENT ON COLUMN external_certifications.hard_problems_solved IS 'Number of hard problems solved';
COMMENT ON COLUMN external_certifications.total_submissions IS 'Total number of submissions made';
COMMENT ON COLUMN external_certifications.acceptance_rate IS 'Percentage of accepted submissions';
COMMENT ON COLUMN external_certifications.streak_days IS 'Current streak in days';
COMMENT ON COLUMN external_certifications.max_streak IS 'Maximum streak achieved in days';
COMMENT ON COLUMN external_certifications.total_badges IS 'Total number of badges earned';
COMMENT ON COLUMN external_certifications.total_courses_completed IS 'Total number of courses completed';
