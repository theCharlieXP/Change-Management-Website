-- Drop existing type if it exists
drop type if exists project_status_enum cascade;

-- Create enum for project status
create type project_status_enum as enum (
  'planning',
  'inprogress',
  'onhold',
  'completed',
  'cancelled'
);

-- Create projects table
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status project_status_enum not null default 'planning',
  user_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index on user_id for faster queries
create index if not exists projects_user_id_idx on projects(user_id);

-- Set up row level security
alter table projects enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own projects" on projects;
drop policy if exists "Users can insert their own projects" on projects;
drop policy if exists "Users can update their own projects" on projects;
drop policy if exists "Users can delete their own projects" on projects;

-- Create policy to allow users to see only their own projects
create policy "Users can view their own projects"
  on projects for select
  using (auth.jwt()->>'sub' = user_id);

-- Create policy to allow users to insert their own projects
create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.jwt()->>'sub' = user_id);

-- Create policy to allow users to update their own projects
create policy "Users can update their own projects"
  on projects for update
  using (auth.jwt()->>'sub' = user_id);

-- Create policy to allow users to delete their own projects
create policy "Users can delete their own projects"
  on projects for delete
  using (auth.jwt()->>'sub' = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists update_projects_updated_at on projects;

-- Create trigger to automatically update updated_at timestamp
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column(); 