-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tasks from their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON project_tasks;

-- Recreate policies with correct auth check
CREATE POLICY "Users can view tasks from their projects"
    ON project_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can create tasks in their projects"
    ON project_tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can update tasks in their projects"
    ON project_tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.jwt()->>'sub'
    ));

CREATE POLICY "Users can delete tasks from their projects"
    ON project_tasks FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_tasks.project_id
        AND projects.user_id = auth.jwt()->>'sub'
    )); 