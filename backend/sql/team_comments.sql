-- Create team_comments table for commenting on team resources
CREATE TABLE IF NOT EXISTS public.team_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_comments_pkey PRIMARY KEY (id),
  CONSTRAINT team_comments_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT team_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT team_comments_resource_type_check CHECK (resource_type IN ('job', 'resume', 'cover_letter'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_comments_team_id ON public.team_comments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_comments_resource ON public.team_comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_team_comments_user_id ON public.team_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_comments_created_at ON public.team_comments(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_team_comments_timestamp 
BEFORE UPDATE ON team_comments 
FOR EACH ROW 
EXECUTE FUNCTION set_updated_at();
