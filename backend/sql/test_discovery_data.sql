-- Test Data for Contact Discovery Feature
-- This script adds sample contact connections to test the discovery feature
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Find your user_id
-- ============================================
-- Replace 'your-email@example.com' with your actual email
-- SELECT id FROM users WHERE email = 'your-email@example.com';

-- ============================================
-- STEP 2: Create some test contacts for another user
-- ============================================
-- First, let's create a test user (or use an existing one)
-- This simulates another person in the system who has contacts

-- Insert a test user (skip if you have other real users)
INSERT INTO users (id, email, password, firstname, lastname, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'testuser1@example.com', 'hashed_password', 'Test', 'User1', NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STEP 3: Add contacts for the test user
-- ============================================
-- These are the test user's 1st-degree contacts
INSERT INTO professional_contacts (id, user_id, full_name, headline, company, role, industry, relationship_type, source, created_at)
VALUES 
  -- Contact A (belongs to test user)
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'Senior Product Manager', 'TechCorp', 'Product Manager', 'Technology', 'colleague', 'manual', NOW()),
  
  -- Contact B (belongs to test user)
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Michael Chen', 'Software Engineering Lead', 'DataCo', 'Engineering Manager', 'Technology', 'mentor', 'manual', NOW()),
  
  -- Contact C (belongs to test user - this one you might know too)
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Emily Rodriguez', 'UX Designer', 'DesignHub', 'Senior Designer', 'Design', 'linkedin_connection', 'linkedin', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 4: Add 2nd-degree connections
-- ============================================
-- These are contacts that the test user's contacts know (2nd-degree)
-- These will show up as suggestions for YOUR user

INSERT INTO professional_contacts (id, user_id, full_name, headline, company, role, industry, relationship_type, source, created_at)
VALUES 
  -- Person D (Sarah's connection - will be suggested to you)
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'David Martinez', 'VP of Engineering', 'TechCorp', 'VP Engineering', 'Technology', 'colleague', 'manual', NOW()),
  
  -- Person E (Michael's connection - will be suggested to you)
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Jennifer Lee', 'Principal Software Engineer', 'Google', 'Engineer', 'Technology', 'friend', 'manual', NOW()),
  
  -- Person F (Emily's connection - will be suggested to you)
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'Robert Taylor', 'Design Director', 'Adobe', 'Director', 'Design', 'mentor', 'manual', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 5: Link YOUR contacts to the test user's contacts
-- ============================================
-- This creates the connection graph
-- IMPORTANT: Replace the contact IDs below with your actual contact IDs
-- You can find them by running: SELECT id, full_name FROM professional_contacts WHERE user_id = 'YOUR_USER_ID';

-- Example: If one of YOUR contacts is Luis Duarte (from your screenshot)
-- Find his ID and create connections:

-- Assuming you have a contact, let's link them to Sarah (who knows David)
-- Replace 'YOUR-CONTACT-ID-HERE' with actual contact IDs from your account

-- Example connections (you need to replace these IDs):
-- INSERT INTO contact_connections (contact_id, connected_contact_id, connection_strength, created_at)
-- VALUES 
--   ('YOUR-LUIS-DUARTE-ID', '11111111-1111-1111-1111-111111111111', 3, NOW()),  -- Your contact knows Sarah
--   ('YOUR-KDF-ID', '22222222-2222-2222-2222-222222222222', 4, NOW()),  -- Your contact knows Michael
--   ('YOUR-NIKOLETA-ID', '33333333-3333-3333-3333-333333333333', 5, NOW());  -- Your contact knows Emily

-- ============================================
-- STEP 6: Link test contacts to 2nd-degree connections
-- ============================================
-- This creates the paths: You -> Your Contact -> Test Contact -> 2nd Degree Person

INSERT INTO contact_connections (contact_id, connected_contact_id, connection_strength, created_at)
VALUES 
  -- Sarah knows David
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 4, NOW()),
  
  -- Michael knows Jennifer
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 5, NOW()),
  
  -- Emily knows Robert
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 4, NOW())
ON CONFLICT (contact_id, connected_contact_id) DO NOTHING;

-- ============================================
-- STEP 7 (OPTIONAL): Add target companies
-- ============================================
-- Add companies you're interested in for better scoring
-- Replace 'YOUR-USER-ID' with your actual user ID

-- INSERT INTO user_target_companies (user_id, company_name, priority, created_at)
-- VALUES 
--   ('YOUR-USER-ID', 'Google', 5, NOW()),
--   ('YOUR-USER-ID', 'Adobe', 4, NOW()),
--   ('YOUR-USER-ID', 'TechCorp', 3, NOW())
-- ON CONFLICT (user_id, company_name) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check your contacts
-- SELECT id, full_name, company FROM professional_contacts WHERE user_id = 'YOUR-USER-ID';

-- Check all contact connections
-- SELECT 
--   c1.full_name as contact_name,
--   c2.full_name as knows_person
-- FROM contact_connections cc
-- JOIN professional_contacts c1 ON cc.contact_id = c1.id
-- JOIN professional_contacts c2 ON cc.connected_contact_id = c2.id;

-- Test the suggestions endpoint (use this in browser console or Postman)
-- GET http://localhost:3000/discovery/suggestions
