-- First drop all dependent policies from project_tasks
DROP POLICY IF EXISTS "Users can view tasks from their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON project_tasks;

-- Drop existing project policies (using the correct policy names)
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

-- Now we can safely alter the column type
ALTER TABLE projects ALTER COLUMN user_id TYPE text;

-- Recreate project policies with updated auth check
CREATE POLICY "Users can only see their own projects"
  ON projects FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can only insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can only update their own projects"
  ON projects FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can only delete their own projects"
  ON projects FOR DELETE
  USING (auth.jwt()->>'sub' = user_id);

-- Recreate project_tasks policies with the updated user_id reference
CREATE POLICY "Users can view tasks from their projects"
  ON project_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can create tasks in their projects"
  ON project_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can update tasks in their projects"
  ON project_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can delete tasks from their projects"
  ON project_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

-- Update project_tasks table foreign key
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_project_id_fkey;
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE; 