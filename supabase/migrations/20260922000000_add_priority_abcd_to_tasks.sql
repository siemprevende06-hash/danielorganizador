alter table public.tasks add column if not exists priority_abcd text
  default null check (priority_abcd is null or priority_abcd in ('a', 'b', 'c', 'd'));

create index if not exists tasks_priority_abcd_idx on public.tasks (priority_abcd);