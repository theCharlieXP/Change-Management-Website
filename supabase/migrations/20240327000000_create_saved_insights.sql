-- Create saved_insights table
create table if not exists saved_insights (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  url text,
  summary text not null,
  additional_notes text,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index on project_id for better query performance
create index if not exists saved_insights_project_id_idx on saved_insights(project_id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at timestamp
create trigger update_saved_insights_updated_at
  before update on saved_insights
  for each row
  execute function update_updated_at_column();

-- Add RLS policies
alter table saved_insights enable row level security;

create policy "Users can view their own saved insights"
  on saved_insights for select
  using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

create policy "Users can insert their own saved insights"
  on saved_insights for insert
  with check (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

create policy "Users can update their own saved insights"
  on saved_insights for update
  using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their own saved insights"
  on saved_insights for delete
  using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  ); 