alter table public.tasks add column if not exists recurrence text default 'none';
alter table public.tasks add column if not exists tags text[] default '{}';
alter table public.tasks add column if not exists parent_id uuid references public.tasks(id) on delete cascade;

create index if not exists tasks_parent_id_idx on public.tasks (parent_id);
create index if not exists tasks_recurrence_idx on public.tasks (recurrence);