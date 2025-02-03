-- Create custom types
CREATE TYPE project_status AS ENUM (
  'planning',
  'in-progress',
  'on-hold',
  'completed',
  'cancelled'
);

CREATE TYPE task_status AS ENUM (
  'todo',
  'in-progress',
  'completed',
  'blocked'
);

CREATE TYPE insight_focus_area AS ENUM (
  'challenges-barriers',
  'strategies-solutions',
  'outcomes-results',
  'stakeholders-roles',
  'best-practices',
  'lessons-learned',
  'implementation-tactics',
  'communication-engagement',
  'metrics-performance',
  'risk-management',
  'technology-tools',
  'cultural-transformation',
  'change-leadership',
  'employee-training',
  'change-sustainability'
);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Create project_insights table
CREATE TABLE project_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  notes TEXT,
  source TEXT,
  focus_area insight_focus_area NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_insights_project_id ON project_insights(project_id);

-- Create project_summaries table
CREATE TABLE project_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  focus_area insight_focus_area NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_summaries_project_id ON project_summaries(project_id);

-- Create project_tasks table
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);

-- Create project_notes table
CREATE TABLE project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_notes_project_id ON project_notes(project_id);

-- Create updated_at triggers
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_notes_updated_at
    BEFORE UPDATE ON project_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Policies for project_insights
CREATE POLICY "Users can only see insights from their projects"
  ON project_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_insights.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only insert insights to their projects"
  ON project_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_insights.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only delete insights from their projects"
  ON project_insights FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_insights.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Policies for project_summaries
CREATE POLICY "Users can only see summaries from their projects"
  ON project_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_summaries.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only insert summaries to their projects"
  ON project_summaries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_summaries.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only delete summaries from their projects"
  ON project_summaries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_summaries.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Policies for project_tasks
CREATE POLICY "Users can only see tasks from their projects"
  ON project_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only insert tasks to their projects"
  ON project_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only update tasks from their projects"
  ON project_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only delete tasks from their projects"
  ON project_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Policies for project_notes
CREATE POLICY "Users can only see notes from their projects"
  ON project_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only insert notes to their projects"
  ON project_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only update notes from their projects"
  ON project_notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  ));

CREATE POLICY "Users can only delete notes from their projects"
  ON project_notes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.uid()::text
  )); 