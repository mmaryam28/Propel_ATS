-- QUICK TEST SETUP FOR CONTACT DISCOVERY
-- Copy and paste this into Supabase SQL Editor
-- This will work with your EXISTING contacts

-- ============================================
-- STEP 1: Find your user_id and contact IDs
-- ============================================
-- First, run this to see your info:
SELECT 
  u.id as your_user_id,
  u.email,
  pc.id as contact_id,
  pc.full_name as contact_name
FROM users u
LEFT JOIN professional_contacts pc ON pc.user_id = u.id
WHERE u.email = 'ld403ld@gmail.com'  -- Replace with your actual email
ORDER BY pc.created_at DESC;

-- ============================================
-- STEP 2: EASIEST TEST - Link your contacts to each other
-- ============================================
-- This creates connections between YOUR OWN contacts
-- Replace the IDs below with the contact_ids from Step 1

-- Example: If you have Luis, kdf, and Nikoleta as contacts:
-- Luis knows Nikoleta (creating a path)

-- COPY THE CONTACT IDS FROM STEP 1 OUTPUT AND PASTE THEM HERE:
DO $$
DECLARE
  contact1_id uuid := 'PASTE-LUIS-CONTACT-ID-HERE';  -- Replace with actual ID
  contact2_id uuid := 'PASTE-KDF-CONTACT-ID-HERE';   -- Replace with actual ID
  contact3_id uuid := 'PASTE-NIKOLETA-CONTACT-ID-HERE'; -- Replace with actual ID
BEGIN
  -- Create connections between your contacts
  INSERT INTO contact_connections (contact_id, connected_contact_id, connection_strength)
  VALUES 
    (contact1_id, contact2_id, 4),  -- Luis knows kdf
    (contact2_id, contact3_id, 5),  -- kdf knows Nikoleta
    (contact1_id, contact3_id, 3)   -- Luis knows Nikoleta
  ON CONFLICT (contact_id, connected_contact_id) DO NOTHING;
  
  RAISE NOTICE 'Connections created successfully!';
END $$;

-- ============================================
-- ALTERNATIVE: Use actual IDs from your screenshot
-- ============================================
-- Based on your screenshot, you have contacts: kdf, Luis Duarte, Nikoleta Sino
-- Find their IDs first, then run:

-- Example (replace with real IDs):
INSERT INTO contact_connections (contact_id, connected_contact_id, connection_strength, created_at)
VALUES 
  -- Format: (contact_id, connected_contact_id, strength)
  -- Replace these UUIDs with your actual contact IDs
  ('YOUR-CONTACT-1-ID', 'YOUR-CONTACT-2-ID', 4, NOW()),
  ('YOUR-CONTACT-2-ID', 'YOUR-CONTACT-3-ID', 5, NOW())
ON CONFLICT (contact_id, connected_contact_id) DO NOTHING;

-- ============================================
-- STEP 3: Verify the connections were created
-- ============================================
SELECT 
  c1.full_name as "Contact A",
  c2.full_name as "Knows",
  cc.connection_strength as "Strength"
FROM contact_connections cc
JOIN professional_contacts c1 ON cc.contact_id = c1.id
JOIN professional_contacts c2 ON cc.connected_contact_id = c2.id;

-- ============================================
-- STEP 4: Test if suggestions work
-- ============================================
-- This simulates what the API does
WITH your_contacts AS (
  SELECT id 
  FROM professional_contacts 
  WHERE user_id = (SELECT id FROM users WHERE email = 'ld403ld@gmail.com')
)
SELECT 
  pc.full_name as "Suggested Person",
  pc.company,
  pc.industry,
  COUNT(DISTINCT cc.contact_id) as "Mutual Connections"
FROM contact_connections cc
JOIN professional_contacts pc ON cc.connected_contact_id = pc.id
WHERE cc.contact_id IN (SELECT id FROM your_contacts)
  AND cc.connected_contact_id NOT IN (SELECT id FROM your_contacts)
GROUP BY pc.id, pc.full_name, pc.company, pc.industry;
