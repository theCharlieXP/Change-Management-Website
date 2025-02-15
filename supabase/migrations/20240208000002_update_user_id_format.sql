-- First drop all policies that might reference the user_id column
DO $$ 
BEGIN
  -- Drop project_tasks policies if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_tasks') THEN
    DROP POLICY IF EXISTS "Users can view tasks from their projects" ON project_tasks;
    DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
    DROP POLICY IF EXISTS "Users can update tasks in their projects" ON project_tasks;
    DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON project_tasks;
  END IF;

  -- Drop all project policies
  DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
END $$;

-- Now we can safely alter the column type
ALTER TABLE projects ALTER COLUMN user_id TYPE text;

-- Recreate project policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Recreate project_tasks policies if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_tasks') THEN
    -- First, remove any tasks that reference non-existent projects
    DELETE FROM project_tasks pt
    WHERE NOT EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pt.project_id
    );

    -- Drop the existing foreign key if it exists
    ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_project_id_fkey;
    
    -- Add the new foreign key constraint
    ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

    -- Now create the policies
    CREATE POLICY "Users can view tasks from their projects"
      ON project_tasks FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.uid()::text
      ));

    CREATE POLICY "Users can create tasks in their projects"
      ON project_tasks FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.uid()::text
      ));

    CREATE POLICY "Users can update tasks in their projects"
      ON project_tasks FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.uid()::text
      ));

    CREATE POLICY "Users can delete tasks from their projects"
      ON project_tasks FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.uid()::text
      ));
  END IF;
END $$; 