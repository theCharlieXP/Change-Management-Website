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
  position INTEGER NOT NULL DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_project_tasks_position ON project_tasks(project_id, position);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON project_tasks(created_at DESC);

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

-- Create position trigger
CREATE OR REPLACE FUNCTION set_task_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position) + 1, 0)
    INTO NEW.position
    FROM project_tasks
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_task_position_trigger ON project_tasks;
CREATE TRIGGER set_task_position_trigger
  BEFORE INSERT ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_position();

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can access all project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can view tasks from their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON project_tasks;

-- Create policy for service role
CREATE POLICY "Service role can access all project tasks"
  ON project_tasks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for users
CREATE POLICY "Users can view tasks from their projects"
  ON project_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can create tasks in their projects"
  ON project_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can update tasks in their projects"
  ON project_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete tasks from their projects"
  ON project_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Re-enable RLS but allow service role to bypass
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON project_tasks TO service_role;

-- Log table update
DO $$ 
BEGIN 
  RAISE NOTICE 'Project tasks table updated successfully with service role access';
END $$; 