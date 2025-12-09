-- Add contribution statistics to github_repositories table
-- This stores aggregated contribution data for each repository

-- Add new columns to github_repositories for contribution stats
ALTER TABLE github_repositories 
ADD COLUMN IF NOT EXISTS total_commits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS commit_frequency JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_commit_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contributions_synced_at TIMESTAMPTZ;

-- Create index for faster queries on contribution data
CREATE INDEX IF NOT EXISTS idx_github_repos_last_commit ON github_repositories(last_commit_date DESC);
CREATE INDEX IF NOT EXISTS idx_github_repos_contributions_synced ON github_repositories(contributions_synced_at);

-- Add comment to explain the JSONB structure for commit_frequency
COMMENT ON COLUMN github_repositories.commit_frequency IS 
'Array of weekly commit counts for the past year. Format: [{"week": "2024-01-01", "commits": 5}, ...]';
