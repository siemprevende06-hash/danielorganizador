CREATE TABLE IF NOT EXISTS public.entrepreneurship_goals (
  id uuid primary key default gen_random_uuid(),
  entrepreneurship_id uuid not null references public.entrepreneurships(id) on delete cascade,
  user_id uuid,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_goals TO anon, authenticated;
GRANT ALL ON public.entrepreneurship_goals TO service_role;
ALTER TABLE public.entrepreneurship_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all entrepreneurship_goals" ON public.entrepreneurship_goals;
CREATE POLICY "Allow all entrepreneurship_goals" ON public.entrepreneurship_goals FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.university_subjects ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;