-- Drop existing table if it exists
DROP TABLE IF EXISTS insight_summaries CASCADE;

-- Create table
create table insight_summaries (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  content text not null,
  notes text,
  focus_area text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  CONSTRAINT insight_summaries_focus_area_valid CHECK (
    focus_area IN (
      'challenges-barriers',
      'strategies-solutions',
      'outcomes-results',
      'key-stakeholders-roles',
      'best-practices-methodologies',
      'lessons-learned-insights',
      'implementation-tactics',
      'change-readiness',
      'change-sustainability'
    )
  ),
  CONSTRAINT insight_summaries_unique_per_project UNIQUE (project_id, title)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_insight_summaries_project_id ON insight_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_created_at ON insight_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_focus_area ON insight_summaries(focus_area);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_insight_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_insight_summaries_updated_at ON insight_summaries;
CREATE TRIGGER update_insight_summaries_updated_at
  BEFORE UPDATE ON insight_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_insight_summaries_updated_at();

-- Add RLS policies
alter table insight_summaries enable row level security;

create policy "Users can view their own project's summaries"
  on insight_summaries
  for select
  using (
    project_id in (
      select p.id from projects p
      where p.user_id = auth.uid()::text
    )
  );

create policy "Users can insert summaries into their own projects"
  on insight_summaries
  for insert
  with check (
    project_id in (
      select p.id from projects p
      where p.user_id = auth.uid()::text
    )
  );

create policy "Users can update their own project's summaries"
  on insight_summaries
  for update
  using (
    project_id in (
      select p.id from projects p
      where p.user_id = auth.uid()::text
    )
  )
  with check (
    project_id in (
      select p.id from projects p
      where p.user_id = auth.uid()::text
    )
  );

create policy "Users can delete their own project's summaries"
  on insight_summaries
  for delete
  using (
    project_id in (
      select p.id from projects p
      where p.user_id = auth.uid()::text
    )
  );

-- Grant permissions
GRANT ALL ON insight_summaries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight_summaries TO authenticated; 