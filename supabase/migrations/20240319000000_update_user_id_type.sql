-- First, drop all dependent tables and their policies
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_insights CASCADE;
DROP TABLE IF EXISTS project_summaries CASCADE;
DROP TABLE IF EXISTS project_notes CASCADE;

-- Drop the projects table and recreate it with the correct type
DROP TABLE IF EXISTS projects CASCADE;

-- Recreate the projects table with text user_id
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status project_status_enum NOT NULL DEFAULT 'planning',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
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

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();