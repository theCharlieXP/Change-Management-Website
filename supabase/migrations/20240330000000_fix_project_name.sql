-- Rename name column to title in projects table
ALTER TABLE projects 
RENAME COLUMN name TO title;

-- Update RLS policies to use title instead of name
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
CREATE POLICY "Users can only see their own projects"
  ON projects FOR SELECT
  USING (
    auth.uid()::text = user_id 
    AND deleted_at IS NULL
  );

-- Log the change
DO $$ 
BEGIN 
  RAISE NOTICE 'Successfully renamed name column to title in projects table';
END $$; 