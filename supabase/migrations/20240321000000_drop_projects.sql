-- Drop all project-related tables
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_insights CASCADE;
DROP TABLE IF EXISTS project_summaries CASCADE;
DROP TABLE IF EXISTS project_notes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop all project-related types
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS project_status_enum CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS insight_focus_area CASCADE; 