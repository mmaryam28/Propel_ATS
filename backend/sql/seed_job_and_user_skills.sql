-- Seed Skills and Job Skills Data
-- This script populates skills for user 32f37232-13c0-4837-8ec9-51f993fe9aa3 and adds skills to existing jobs

-- ============================================
-- 1. CREATE SAMPLE SKILLS IN SKILLS TABLE
-- ============================================

-- Insert common technical skills
INSERT INTO public.skills (id, name, category, proficiency, "userId", "order") VALUES
  (gen_random_uuid(), 'JavaScript', 'Technical', 'Advanced', NULL, 1),
  (gen_random_uuid(), 'TypeScript', 'Technical', 'Advanced', NULL, 2),
  (gen_random_uuid(), 'React', 'Technical', 'Advanced', NULL, 3),
  (gen_random_uuid(), 'Node.js', 'Technical', 'Intermediate', NULL, 4),
  (gen_random_uuid(), 'Python', 'Technical', 'Intermediate', NULL, 5),
  (gen_random_uuid(), 'Java', 'Technical', 'Intermediate', NULL, 6),
  (gen_random_uuid(), 'SQL', 'Technical', 'Advanced', NULL, 7),
  (gen_random_uuid(), 'PostgreSQL', 'Technical', 'Intermediate', NULL, 8),
  (gen_random_uuid(), 'MongoDB', 'Technical', 'Intermediate', NULL, 9),
  (gen_random_uuid(), 'Git', 'Technical', 'Advanced', NULL, 10),
  (gen_random_uuid(), 'Docker', 'Technical', 'Beginner', NULL, 11),
  (gen_random_uuid(), 'AWS', 'Technical', 'Beginner', NULL, 12),
  (gen_random_uuid(), 'REST API', 'Technical', 'Advanced', NULL, 13),
  (gen_random_uuid(), 'GraphQL', 'Technical', 'Intermediate', NULL, 14),
  (gen_random_uuid(), 'HTML/CSS', 'Technical', 'Expert', NULL, 15),
  (gen_random_uuid(), 'Tailwind CSS', 'Technical', 'Advanced', NULL, 16)
ON CONFLICT (id) DO NOTHING;

-- Insert soft skills
INSERT INTO public.skills (id, name, category, proficiency, "userId", "order") VALUES
  (gen_random_uuid(), 'Communication', 'Soft Skills', 'Advanced', NULL, 1),
  (gen_random_uuid(), 'Problem Solving', 'Soft Skills', 'Advanced', NULL, 2),
  (gen_random_uuid(), 'Team Collaboration', 'Soft Skills', 'Advanced', NULL, 3),
  (gen_random_uuid(), 'Leadership', 'Soft Skills', 'Intermediate', NULL, 4),
  (gen_random_uuid(), 'Time Management', 'Soft Skills', 'Advanced', NULL, 5),
  (gen_random_uuid(), 'Critical Thinking', 'Soft Skills', 'Advanced', NULL, 6),
  (gen_random_uuid(), 'Adaptability', 'Soft Skills', 'Advanced', NULL, 7),
  (gen_random_uuid(), 'Project Management', 'Soft Skills', 'Intermediate', NULL, 8)
ON CONFLICT (id) DO NOTHING;

-- Insert languages
INSERT INTO public.skills (id, name, category, proficiency, "userId", "order") VALUES
  (gen_random_uuid(), 'English', 'Languages', 'Expert', NULL, 1),
  (gen_random_uuid(), 'Spanish', 'Languages', 'Intermediate', NULL, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ADD SKILLS TO USER (user_skills table)
-- ============================================

-- Link skills to user 32f37232-13c0-4837-8ec9-51f993fe9aa3
-- Level scale: 0=None, 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert

INSERT INTO public.user_skills (user_id, skill_id, level)
SELECT 
  '32f37232-13c0-4837-8ec9-51f993fe9aa3'::uuid,
  id,
  CASE 
    WHEN proficiency = 'Expert' THEN 5
    WHEN proficiency = 'Advanced' THEN 4
    WHEN proficiency = 'Intermediate' THEN 3
    WHEN proficiency = 'Beginner' THEN 2
    ELSE 2
  END
FROM public.skills
WHERE "userId" IS NULL 
  AND name IN (
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 
    'SQL', 'Git', 'REST API', 'HTML/CSS', 'Tailwind CSS',
    'Communication', 'Problem Solving', 'Team Collaboration', 
    'Time Management', 'Critical Thinking',
    'English'
  )
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- ============================================
-- 3. ADD SKILLS TO JOBS (job_skills table)
-- ============================================

-- Get all jobs for this user and add relevant skills to each
-- This uses the denormalized job_skills structure

-- For Software Engineer / Full-Stack Developer jobs
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('JavaScript', 'Technical', 4, 2.0),
    ('TypeScript', 'Technical', 4, 1.5),
    ('React', 'Technical', 4, 2.0),
    ('Node.js', 'Technical', 3, 1.5),
    ('SQL', 'Technical', 3, 1.0),
    ('REST API', 'Technical', 4, 1.5),
    ('Git', 'Technical', 3, 1.0),
    ('HTML/CSS', 'Technical', 4, 1.0),
    ('Problem Solving', 'Soft Skills', 4, 1.5),
    ('Communication', 'Soft Skills', 3, 1.0),
    ('Team Collaboration', 'Soft Skills', 3, 1.0)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND (
    LOWER(j.title) LIKE '%software%' 
    OR LOWER(j.title) LIKE '%developer%' 
    OR LOWER(j.title) LIKE '%engineer%'
    OR LOWER(j.title) LIKE '%full%stack%'
    OR LOWER(j.title) LIKE '%frontend%'
    OR LOWER(j.title) LIKE '%backend%'
  )
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;

-- For Backend-specific jobs
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('Node.js', 'Technical', 4, 2.0),
    ('Python', 'Technical', 4, 2.0),
    ('SQL', 'Technical', 4, 2.0),
    ('PostgreSQL', 'Technical', 3, 1.5),
    ('REST API', 'Technical', 4, 1.5),
    ('Git', 'Technical', 3, 1.0),
    ('Problem Solving', 'Soft Skills', 4, 1.5),
    ('Communication', 'Soft Skills', 3, 1.0)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND LOWER(j.title) LIKE '%backend%'
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;

-- For Frontend-specific jobs
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('JavaScript', 'Technical', 5, 2.0),
    ('TypeScript', 'Technical', 4, 2.0),
    ('React', 'Technical', 5, 2.5),
    ('HTML/CSS', 'Technical', 5, 1.5),
    ('Tailwind CSS', 'Technical', 3, 1.0),
    ('Git', 'Technical', 3, 1.0),
    ('REST API', 'Technical', 3, 1.0),
    ('Problem Solving', 'Soft Skills', 4, 1.5),
    ('Communication', 'Soft Skills', 3, 1.0),
    ('Team Collaboration', 'Soft Skills', 4, 1.0)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND LOWER(j.title) LIKE '%frontend%'
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;

-- For Data/Analytics jobs
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('Python', 'Technical', 5, 2.5),
    ('SQL', 'Technical', 5, 2.5),
    ('PostgreSQL', 'Technical', 4, 2.0),
    ('MongoDB', 'Technical', 3, 1.0),
    ('Critical Thinking', 'Soft Skills', 5, 2.0),
    ('Problem Solving', 'Soft Skills', 5, 2.0),
    ('Communication', 'Soft Skills', 4, 1.5)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND (
    LOWER(j.title) LIKE '%data%' 
    OR LOWER(j.title) LIKE '%analyst%'
    OR LOWER(j.title) LIKE '%analytics%'
  )
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;

-- For DevOps/Cloud jobs
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('Docker', 'Technical', 4, 2.0),
    ('AWS', 'Technical', 4, 2.5),
    ('Git', 'Technical', 4, 1.5),
    ('Node.js', 'Technical', 3, 1.0),
    ('Python', 'Technical', 3, 1.0),
    ('Problem Solving', 'Soft Skills', 4, 1.5),
    ('Communication', 'Soft Skills', 3, 1.0)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND (
    LOWER(j.title) LIKE '%devops%' 
    OR LOWER(j.title) LIKE '%cloud%'
    OR LOWER(j.title) LIKE '%infrastructure%'
  )
ON CONFLICT (job_id, skill_name) DO UPDATE
SET 
  skill_category = EXCLUDED.skill_category,
  req_level = EXCLUDED.req_level,
  weight = EXCLUDED.weight;

-- Generic skills for any remaining jobs (fallback)
INSERT INTO public.job_skills (job_id, skill_name, skill_category, req_level, weight)
SELECT 
  j.id,
  s.skill_name,
  s.skill_category,
  s.req_level,
  s.weight
FROM public.jobs j
CROSS JOIN (
  VALUES 
    ('Communication', 'Soft Skills', 3, 1.0),
    ('Problem Solving', 'Soft Skills', 4, 1.5),
    ('Team Collaboration', 'Soft Skills', 3, 1.0),
    ('Time Management', 'Soft Skills', 3, 1.0),
    ('Adaptability', 'Soft Skills', 3, 1.0)
) AS s(skill_name, skill_category, req_level, weight)
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js WHERE js.job_id = j.id
  )
ON CONFLICT (job_id, skill_name) DO NOTHING;

-- ============================================
-- 4. VERIFY THE DATA
-- ============================================

-- Check user skills count
SELECT 
  'User Skills Count' AS info,
  COUNT(*) AS count
FROM public.user_skills
WHERE user_id = '32f37232-13c0-4837-8ec9-51f993fe9aa3';

-- Check job skills count by job
SELECT 
  'Job Skills Summary' AS info,
  j.title AS job_title,
  COUNT(js.skill_name) AS skills_count
FROM public.jobs j
LEFT JOIN public.job_skills js ON j.id = js.job_id
WHERE j."userId" = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
GROUP BY j.id, j.title
ORDER BY j.title;

-- Display user's skills with names
SELECT 
  'User Skills Detail' AS info,
  s.name AS skill_name,
  s.category,
  us.level
FROM public.user_skills us
JOIN public.skills s ON us.skill_id = s.id
WHERE us.user_id = '32f37232-13c0-4837-8ec9-51f993fe9aa3'
ORDER BY s.category, s.name;
