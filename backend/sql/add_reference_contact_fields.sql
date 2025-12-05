-- Add email and phone fields to professional_references table
-- These fields allow storing contact info directly on references
-- for cases where references aren't in the contacts list

ALTER TABLE professional_references
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment
COMMENT ON COLUMN professional_references.email IS 'Direct email contact for this reference';
COMMENT ON COLUMN professional_references.phone IS 'Direct phone contact for this reference';
