-- Drop the table if it exists
DROP TABLE IF EXISTS project_notes CASCADE;

-- Create the project_notes table
CREATE TABLE project_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_notes_user_id_not_empty CHECK (user_id <> '')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_user_id ON project_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_created_at ON project_notes(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_project_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_notes_updated_at ON project_notes;
CREATE TRIGGER update_project_notes_updated_at
  BEFORE UPDATE ON project_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_notes_updated_at();

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can access all project notes" ON project_notes;
DROP POLICY IF EXISTS "Users can view notes from their projects" ON project_notes;
DROP POLICY IF EXISTS "Users can create notes in their projects" ON project_notes;
DROP POLICY IF EXISTS "Users can update notes in their projects" ON project_notes;
DROP POLICY IF EXISTS "Users can delete notes from their projects" ON project_notes;

-- Create policy for service role
CREATE POLICY "Service role can access all project notes"
  ON project_notes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for users
CREATE POLICY "Users can view notes from their projects"
  ON project_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can create notes in their projects"
  ON project_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can update notes in their projects"
  ON project_notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete notes from their projects"
  ON project_notes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Re-enable RLS but allow service role to bypass
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON project_notes TO service_role;

-- Log table update
DO $$ 
BEGIN 
  RAISE NOTICE 'Project notes table updated successfully with service role access';
END $$; 