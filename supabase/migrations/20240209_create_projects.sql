-- Drop existing type if it exists
drop type if exists project_status_enum cascade;

-- Create enum for project status
create type project_status_enum as enum (
  'planning',
  'inprogress',
  'onhold',
  'completed',
  'cancelled'
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies that work with Clerk authentication
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = current_user);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = current_user);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = current_user);

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 