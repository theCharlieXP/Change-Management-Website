-- First, let's check if the projects table exists and has the correct structure
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status project_status_enum NOT NULL DEFAULT 'planning',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Ensure RLS is enabled on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create project_tasks table with proper relationship
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT fk_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);

-- Ensure RLS is enabled on project_tasks
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Recreate policies for projects
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

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

-- Recreate policies for project_tasks
DROP POLICY IF EXISTS "Users can view tasks from their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON project_tasks;

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