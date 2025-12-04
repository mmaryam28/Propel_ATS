-- UC-108: Team Account Management
-- Create tables for team accounts with role-based access control

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
    max_members INTEGER DEFAULT 5,
    billing_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if auth.users exists (comment out if not using Supabase Auth)
-- ALTER TABLE teams ADD CONSTRAINT teams_owner_id_fkey 
--   FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Team members table with role management
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'mentor', 'candidate')),
    permissions JSONB DEFAULT '{
        "view_all_candidates": false,
        "edit_candidates": false,
        "view_analytics": false,
        "manage_team": false,
        "invite_members": false
    }'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_id UUID,
    role TEXT NOT NULL CHECK (role IN ('admin', 'mentor', 'candidate')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team activity log
CREATE TABLE IF NOT EXISTS team_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'member_added', 'member_removed', 'role_changed', 
        'team_created', 'team_updated', 'invitation_sent',
        'candidate_added', 'report_generated'
    )),
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_activity_team ON team_activity(team_id);

-- Row Level Security Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they are members of"
    ON teams FOR SELECT
    USING (
        id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
        OR owner_id = auth.uid()
    );

CREATE POLICY "Team owners can update their teams"
    ON teams FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams"
    ON teams FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
    ON teams FOR DELETE
    USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Team members can view other members in their teams"
    ON team_members FOR SELECT
    USING (
        team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Team admins can insert members"
    ON team_members FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Team admins can update members"
    ON team_members FOR UPDATE
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Team admins can delete members"
    ON team_members FOR DELETE
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Team invitations policies
CREATE POLICY "Team members can view invitations"
    ON team_invitations FOR SELECT
    USING (
        team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
        OR invitee_id = auth.uid()
        OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Team admins can create invitations"
    ON team_invitations FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR permissions->>'invite_members' = 'true')
        )
    );

CREATE POLICY "Team admins can update invitations"
    ON team_invitations FOR UPDATE
    USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        OR invitee_id = auth.uid()
    );

-- Team activity policies
CREATE POLICY "Team members can view team activity"
    ON team_activity FOR SELECT
    USING (
        team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Team members can insert activity"
    ON team_activity FOR INSERT
    WITH CHECK (
        team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add team owner as admin member
CREATE OR REPLACE FUNCTION add_team_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO team_members (team_id, user_id, role, permissions)
    VALUES (
        NEW.id,
        NEW.owner_id,
        'admin',
        '{
            "view_all_candidates": true,
            "edit_candidates": true,
            "view_analytics": true,
            "manage_team": true,
            "invite_members": true
        }'::jsonb
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER add_owner_as_admin AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION add_team_owner_as_admin();
