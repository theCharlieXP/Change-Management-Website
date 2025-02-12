-- First disable RLS to allow service role access
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies that work with service role key
CREATE POLICY "Service role can access all projects"
  ON projects
  USING (true);

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow the service role to bypass RLS
ALTER TABLE projects FORCE ROW LEVEL SECURITY; 