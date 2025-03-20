-- Add deleted_at column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS policies to exclude deleted items by default
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
CREATE POLICY "Users can only see their own projects"
  ON projects FOR SELECT
  USING (
    auth.uid()::text = user_id 
    AND deleted_at IS NULL
  );

-- Create function to soft delete projects
CREATE OR REPLACE FUNCTION soft_delete_project(project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NOW()
  WHERE id = project_id
  AND auth.uid()::text = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore soft-deleted projects
CREATE OR REPLACE FUNCTION restore_project(project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NULL
  WHERE id = project_id
  AND auth.uid()::text = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at); 