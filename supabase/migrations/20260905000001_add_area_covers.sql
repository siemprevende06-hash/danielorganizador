-- Portadas de áreas y sub-áreas (imágenes subidas desde Áreas de Vida / Mapa de Vida)
create table if not exists public.area_covers (
  id text not null,
  type text not null default 'area' check (type in ('area', 'sub')),
  url text not null,
  updated_at timestamptz not null default now(),
  primary key (id, type)
);

create index if not exists area_covers_type_idx on public.area_covers (type);

alter table public.area_covers enable row level security;

create policy "Allow all access to area_covers"
  on public.area_covers
  for all
  using (true)
  with check (true);