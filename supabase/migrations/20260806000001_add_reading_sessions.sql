-- Sesiones de lectura diarias: tiempo y páginas (inicio/fin)
create table if not exists public.reading_sessions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid default auth.uid(),
  session_date date not null default current_date,
  book_id uuid,
  minutes integer not null default 0,
  page_start integer,
  page_end integer,
  pages_read integer generated always as (greatest(0, coalesce(page_end, 0) - coalesce(page_start, 0))) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reading_sessions enable row level security;

create policy "Allow all access to reading_sessions"
  on public.reading_sessions
  for all
  using (true)
  with check (true);

create index if not exists reading_sessions_session_date_idx on public.reading_sessions (user_id, session_date);
create index if not exists reading_sessions_book_id_idx on public.reading_sessions (book_id);
