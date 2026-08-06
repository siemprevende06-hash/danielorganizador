-- Registro de imagenes/fotos/videos subidos por el usuario (para persistencia en BD)
create table if not exists public.uploaded_images (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid default auth.uid(),
  url text not null,
  path text not null,
  folder text not null default 'general',
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.uploaded_images enable row level security;

create policy "Allow all access to uploaded_images"
  on public.uploaded_images
  for all
  using (true)
  with check (true);

create index if not exists uploaded_images_folder_idx on public.uploaded_images (folder);
create index if not exists uploaded_images_url_idx on public.uploaded_images (url);
