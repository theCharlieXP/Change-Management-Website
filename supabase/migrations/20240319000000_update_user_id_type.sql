-- First, drop any existing foreign key constraints that might reference user_id
ALTER TABLE IF EXISTS project_insights DROP CONSTRAINT IF EXISTS project_insights_user_id_fkey;
ALTER TABLE IF EXISTS project_summaries DROP CONSTRAINT IF EXISTS project_summaries_user_id_fkey;
ALTER TABLE IF EXISTS project_tasks DROP CONSTRAINT IF EXISTS project_tasks_user_id_fkey;
ALTER TABLE IF EXISTS project_notes DROP CONSTRAINT IF EXISTS project_notes_user_id_fkey;
ALTER TABLE IF EXISTS projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Update the user_id column type in the projects table
ALTER TABLE projects 
  ALTER COLUMN user_id TYPE text;

-- Update RLS policies to work with the new type
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

CREATE POLICY "Users can only see their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Add an index on user_id to improve query performance
DROP INDEX IF EXISTS idx_projects_user_id;
CREATE INDEX idx_projects_user_id ON projects(user_id); 