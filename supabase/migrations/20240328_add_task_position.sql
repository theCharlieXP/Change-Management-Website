-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_tasks' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create index for position
CREATE INDEX IF NOT EXISTS idx_project_tasks_position ON project_tasks(project_id, position);

-- Create or replace function to set initial position for new tasks
CREATE OR REPLACE FUNCTION set_task_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position) + 1, 0)
    INTO NEW.position
    FROM project_tasks
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new task position
DROP TRIGGER IF EXISTS set_task_position_trigger ON project_tasks;
CREATE TRIGGER set_task_position_trigger
  BEFORE INSERT ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_position();

-- Update existing tasks to have sequential positions
WITH ranked_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1 as new_position
  FROM project_tasks
)
UPDATE project_tasks
SET position = ranked_tasks.new_position
FROM ranked_tasks
WHERE project_tasks.id = ranked_tasks.id; 