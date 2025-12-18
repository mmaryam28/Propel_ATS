-- Test script for duplicate detection
-- Run this in Supabase SQL Editor AFTER executing create_platform_tracking_tables.sql
-- This script automatically uses the first user in your auth.users table

DO $$
DECLARE
  v_user_id uuid;
  v_job1_id uuid;
  v_job2_id uuid;
  v_job3_id uuid;
BEGIN
  -- Automatically get the first user from auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users table. Please create a user account first.';
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- Create test jobs with similar details to trigger duplicate detection
  -- Job 1: LinkedIn application
  INSERT INTO jobs (
    "userId",
    title,
    company,
    location,
    status
  ) VALUES (
    v_user_id,
    'Senior Software Engineer',
    'Microsoft Corporation',
    'Seattle, WA',
    'Applied'
  ) RETURNING id INTO v_job1_id;
  
  RAISE NOTICE 'Created Job 1 with ID: %', v_job1_id;

  -- Add platform for Job 1
  INSERT INTO application_platforms (
    "jobId",
    platform,
    "applicationUrl",
    notes
  ) VALUES (
    v_job1_id,
    'linkedin',
    'https://linkedin.com/jobs/view/123',
    'Applied through quick apply'
  );

  -- Job 2: Indeed application (similar but different platform)
  INSERT INTO jobs (
    "userId",
    title,
    company,
    location,
    status
  ) VALUES (
    v_user_id,
    'Senior Software Developer', -- Slightly different title
    'Microsoft', -- Slightly different company name
    'Seattle, Washington',
    'Applied'
  ) RETURNING id INTO v_job2_id;
  
  RAISE NOTICE 'Created Job 2 with ID: %', v_job2_id;

  -- Add platform for Job 2
  INSERT INTO application_platforms (
    "jobId",
    platform,
    "applicationUrl",
    notes
  ) VALUES (
    v_job2_id,
    'indeed',
    'https://indeed.com/job/456',
    'Applied with tailored resume'
  );

  -- Job 3: Glassdoor application (very similar to Job 1)
  INSERT INTO jobs (
    "userId",
    title,
    company,
    location,
    status
  ) VALUES (
    v_user_id,
    'Sr. Software Engineer', -- Similar title
    'Microsoft Corp', -- Similar company
    'Seattle, WA',
    'Applied'
  ) RETURNING id INTO v_job3_id;
  
  RAISE NOTICE 'Created Job 3 with ID: %', v_job3_id;

  -- Add platform for Job 3
  INSERT INTO application_platforms (
    "jobId",
    platform,
    "applicationUrl"
  ) VALUES (
    v_job3_id,
    'glassdoor',
    'https://glassdoor.com/job/789'
  );

  RAISE NOTICE '✅ Successfully created 3 test jobs with platforms!';
  RAISE NOTICE 'Job IDs: %, %, %', v_job1_id, v_job2_id, v_job3_id;
END $$;

-- Verify jobs were created (shows most recent jobs for the user)
SELECT 
  j.id,
  j.title,
  j.company,
  j.location,
  j."platformCount",
  j.status,
  j."createdAt",
  j."userId"
FROM jobs j
ORDER BY j."createdAt" DESC
LIMIT 5;

-- Check platforms for the most recent jobs
SELECT 
  ap.id,
  ap."jobId",
  ap.platform,
  ap."applicationUrl",
  ap.notes,
  j.title,
  j.company,
  j."userId"
FROM application_platforms ap
JOIN jobs j ON j.id = ap."jobId"
ORDER BY ap."createdAt" DESC
LIMIT 10;

-- After duplicate detection runs (via API), check detected duplicates
SELECT 
  jd.id,
  jd."similarityScore",
  jd."companyMatch",
  jd."titleMatch",
  jd."locationMatch",
  jd.status,
  j1.title as job1_title,
  j1.company as job1_company,
  j1."userId" as user_id,
  j2.title as job2_title,
  j2.company as job2_company
FROM job_duplicates jd
JOIN jobs j1 ON j1.id = jd."jobId1"
JOIN jobs j2 ON j2.id = jd."jobId2"
ORDER BY jd."createdAt" DESC;

-- Clean up test data (uncomment and run when done testing)
-- CAUTION: This will delete the 3 most recent jobs!
/*
DELETE FROM jobs 
WHERE id IN (
  SELECT id FROM jobs 
  ORDER BY "createdAt" DESC 
  LIMIT 3
);
*/
