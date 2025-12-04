-- Add resume_added and cover_letter_added to team_activity activity_type check constraint

-- Drop the existing check constraint
ALTER TABLE team_activity DROP CONSTRAINT IF EXISTS team_activity_activity_type_check;

-- Add the updated check constraint with new activity types
ALTER TABLE team_activity ADD CONSTRAINT team_activity_activity_type_check 
CHECK (activity_type IN (
    'member_added', 'member_removed', 'role_changed', 
    'team_created', 'team_updated', 'invitation_sent',
    'candidate_added', 'report_generated',
    'job_posting_added', 'resume_added', 'cover_letter_added'
));
