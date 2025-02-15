-- Create task_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'todo',
        'in-progress',
        'completed',
        'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'todo',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);

-- Enable Row Level Security
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for project_tasks
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

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 