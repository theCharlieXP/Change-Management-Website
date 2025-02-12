-- Drop the table if it exists
DROP TABLE IF EXISTS projects CASCADE;

-- Create the projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT projects_user_id_not_empty CHECK (user_id <> ''),
  CONSTRAINT projects_status_valid CHECK (status IN ('planning', 'inprogress', 'onhold', 'completed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS to allow service role access
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can access all projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create policy for service role
CREATE POLICY "Service role can access all projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS but allow service role to bypass
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON projects TO service_role;

-- Log table creation
DO $$ 
BEGIN 
  RAISE NOTICE 'Projects table created successfully with service role access';
END $$; 