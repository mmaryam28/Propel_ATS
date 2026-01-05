-- Quick check: See your current skills
-- Run this first to see what data you have
SELECT id, "userId", name, category, proficiency, "order"
FROM public.skills
WHERE "userId" IS NOT NULL
LIMIT 20;

-- If you see your skills above, run this to migrate them:
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from localStorage

-- Get your user ID first:
SELECT id, email FROM public.users LIMIT 5;

-- Then insert your skills (replace the user_id value with YOUR actual UUID):
INSERT INTO public.user_profile_skills (user_id, skill_name, category, proficiency, display_order)
SELECT 
  'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ REPLACE THIS WITH YOUR ACTUAL USER ID
  name,
  category,
  proficiency,
  "order"
FROM public.skills
WHERE "userId" = 'YOUR_USER_ID_HERE'  -- ⚠️ REPLACE THIS TOO
ON CONFLICT (user_id, skill_name) DO UPDATE
SET 
  category = EXCLUDED.category,
  proficiency = EXCLUDED.proficiency,
  display_order = EXCLUDED.display_order;

-- Verify the migration worked:
SELECT user_id, skill_name, category, proficiency 
FROM public.user_profile_skills 
ORDER BY display_order;
