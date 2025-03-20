-- Drop existing trigger if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_projects_updated_at'
    AND tgrelid = 'projects'::regclass
  ) THEN
    DROP TRIGGER update_projects_updated_at ON projects;
    RAISE NOTICE 'Dropped existing trigger update_projects_updated_at';
  END IF;
END $$;

-- First check if name column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'name'
  ) THEN
    -- Rename name column to title if it exists
    ALTER TABLE projects RENAME COLUMN name TO title;
    RAISE NOTICE 'Renamed name column to title in projects table';
  ELSE
    RAISE NOTICE 'No name column found in projects table';
  END IF;
END $$;

-- Add title column if neither exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND (column_name = 'name' OR column_name = 'title')
  ) THEN
    ALTER TABLE projects ADD COLUMN title TEXT NOT NULL;
    RAISE NOTICE 'Added title column to projects table';
  ELSE
    RAISE NOTICE 'Title column already exists in projects table';
  END IF;
END $$;

-- Create trigger only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_projects_updated_at'
    AND tgrelid = 'projects'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
    RAISE NOTICE 'Created trigger update_projects_updated_at';
  ELSE
    RAISE NOTICE 'Trigger update_projects_updated_at already exists';
  END IF;
END $$; 