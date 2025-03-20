-- Drop the table if it exists
DROP TABLE IF EXISTS project_tasks CASCADE;

-- Create the project_tasks table
CREATE TABLE project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  user_id TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_tasks_user_id_not_empty CHECK (user_id <> ''),
  CONSTRAINT project_tasks_status_valid CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON project_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tasks_updated_at();

-- Disable RLS to allow service role access
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can access all project tasks" ON project_tasks;

-- Create policy for service role
CREATE POLICY "Service role can access all project tasks"
  ON project_tasks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS but allow service role to bypass
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON project_tasks TO service_role;

-- Log table creation
DO $$ 
BEGIN 
  RAISE NOTICE 'Project tasks table created successfully with service role access';
END $$; 