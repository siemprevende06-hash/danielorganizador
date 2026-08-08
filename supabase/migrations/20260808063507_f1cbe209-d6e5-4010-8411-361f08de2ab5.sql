CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_date date not null default current_date,
  book_id uuid,
  minutes integer not null default 0,
  page_start integer,
  page_end integer,
  pages_read integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_sessions TO anon, authenticated;
GRANT ALL ON public.reading_sessions TO service_role;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reading_sessions_all" ON public.reading_sessions;
CREATE POLICY "reading_sessions_all" ON public.reading_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  url text not null,
  path text not null,
  folder text,
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uploaded_images TO anon, authenticated;
GRANT ALL ON public.uploaded_images TO service_role;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uploaded_images_all" ON public.uploaded_images;
CREATE POLICY "uploaded_images_all" ON public.uploaded_images FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.sync_state (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_state TO anon, authenticated;
GRANT ALL ON public.sync_state TO service_role;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_state_all" ON public.sync_state;
CREATE POLICY "sync_state_all" ON public.sync_state FOR ALL USING (true) WITH CHECK (true);