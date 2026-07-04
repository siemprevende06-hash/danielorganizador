
CREATE TABLE public.system_overall_streaks (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT system_overall_streaks_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_overall_streaks TO anon, authenticated;
GRANT ALL ON public.system_overall_streaks TO service_role;

ALTER TABLE public.system_overall_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to system_overall_streaks"
  ON public.system_overall_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_system_overall_streaks_updated_at
  BEFORE UPDATE ON public.system_overall_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_overall_streaks (id, current_streak, longest_streak)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;
