-- Trigger for system habit streaks
DROP TRIGGER IF EXISTS trg_refresh_system_streaks ON public.daily_systems_tracking;
CREATE TRIGGER trg_refresh_system_streaks
AFTER INSERT OR UPDATE OR DELETE ON public.daily_systems_tracking
FOR EACH ROW EXECUTE FUNCTION public.refresh_system_habit_streaks_for_row();

-- Pillar covers
CREATE TABLE IF NOT EXISTS public.pillar_covers (
  pillar_id TEXT PRIMARY KEY,
  cover_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pillar_covers TO anon, authenticated;
GRANT ALL ON public.pillar_covers TO service_role;
ALTER TABLE public.pillar_covers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all pillar_covers" ON public.pillar_covers;
CREATE POLICY "Allow all pillar_covers" ON public.pillar_covers FOR ALL USING (true) WITH CHECK (true);