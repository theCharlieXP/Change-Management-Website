-- Drop existing tables first (in correct order to handle dependencies)
DROP TABLE IF EXISTS project_notes CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_summaries CASCADE;
DROP TABLE IF EXISTS project_insights CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS insight_focus_area CASCADE;

-- Create enum types for status fields
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

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create project_insights table
CREATE TABLE project_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(project_id, insight_id)
);

-- Create project_summaries table
CREATE TABLE project_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  focus_area insight_focus_area NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create project_tasks table
CREATE TABLE project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create project_notes table
CREATE TABLE project_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Drop existing function and triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
DROP TRIGGER IF EXISTS update_project_notes_updated_at ON project_notes;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
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

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view project insights" ON project_insights;
DROP POLICY IF EXISTS "Users can insert project insights" ON project_insights;

DROP POLICY IF EXISTS "Users can view project summaries" ON project_summaries;
DROP POLICY IF EXISTS "Users can insert project summaries" ON project_summaries;

DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can manage project tasks" ON project_tasks;

DROP POLICY IF EXISTS "Users can view project notes" ON project_notes;
DROP POLICY IF EXISTS "Users can manage project notes" ON project_notes;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.jwt()->>'sub' = user_id);

-- Create RLS policies for project_insights
CREATE POLICY "Users can view project insights"
  ON project_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_insights.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can insert project insights"
  ON project_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_insights.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

-- Create RLS policies for project_summaries
CREATE POLICY "Users can view project summaries"
  ON project_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_summaries.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can insert project summaries"
  ON project_summaries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_summaries.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

-- Create RLS policies for project_tasks
CREATE POLICY "Users can view project tasks"
  ON project_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can manage project tasks"
  ON project_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

-- Create RLS policies for project_notes
CREATE POLICY "Users can view project notes"
  ON project_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

CREATE POLICY "Users can manage project notes"
  ON project_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_notes.project_id
    AND projects.user_id = auth.jwt()->>'sub'
  ));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_project_id ON project_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_project_summaries_project_id ON project_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id); 