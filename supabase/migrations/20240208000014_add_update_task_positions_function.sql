create or replace function update_task_positions(task_updates jsonb[])
returns void
language plpgsql
security definer
as $$
begin
  -- Update all task positions in a single transaction
  for i in 0..array_length(task_updates, 1)-1 loop
    update project_tasks
    set 
      position = (task_updates[i]->>'position')::int,
      updated_at = now()
    where id = (task_updates[i]->>'id')::uuid;
  end loop;
end;
$$; 