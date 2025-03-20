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
  END IF;
END $$;

-- Log the change
DO $$ 
BEGIN 
  RAISE NOTICE 'Successfully ensured projects table has title column';
END $$; 