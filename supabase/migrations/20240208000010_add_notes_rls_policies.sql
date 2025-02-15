-- Enable RLS on project_notes table
alter table project_notes enable row level security;

-- Create policy to allow users to select their own notes through project ownership
create policy "Users can view notes of their projects" on project_notes
  for select using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert notes into their projects
create policy "Users can create notes in their projects" on project_notes
  for insert with check (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their project notes
create policy "Users can update notes in their projects" on project_notes
  for update using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their project notes
create policy "Users can delete notes in their projects" on project_notes
  for delete using (
    project_id in (
      select id from projects
      where user_id = auth.uid()
    )
  ); 