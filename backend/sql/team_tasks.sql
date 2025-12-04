-- Create team_tasks table
CREATE TABLE IF NOT EXISTS public.team_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  created_by uuid NOT NULL,
  due_date timestamp with time zone,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT team_tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT team_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT team_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT team_tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT team_tasks_status_check CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_tasks_team_id ON public.team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_assigned_to ON public.team_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON public.team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_due_date ON public.team_tasks(due_date);

-- Create trigger for updated_at
CREATE TRIGGER update_team_tasks_timestamp 
BEFORE UPDATE ON team_tasks 
FOR EACH ROW 
EXECUTE FUNCTION set_updated_at();
