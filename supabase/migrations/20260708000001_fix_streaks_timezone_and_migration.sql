
-- ============================================================
-- Fix: streaks timezone + consolidate streak tables/functions
-- ============================================================

-- 1) Set DB timezone to Cuba/Havana so CURRENT_DATE matches frontend
ALTER DATABASE postgres SET timezone TO 'America/Havana';
ALTER ROLE anon SET timezone TO 'America/Havana';
ALTER ROLE authenticated SET timezone TO 'America/Havana';
ALTER ROLE service_role SET timezone TO 'America/Havana';

-- 2) system_habit_streaks table (idempotent)
CREATE TABLE IF NOT EXISTS public.system_habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_habit_streaks TO anon, authenticated;
GRANT ALL ON public.system_habit_streaks TO service_role;

ALTER TABLE public.system_habit_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on system_habit_streaks" ON public.system_habit_streaks;
CREATE POLICY "Allow all on system_habit_streaks"
  ON public.system_habit_streaks FOR ALL
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_system_habit_streaks_updated_at ON public.system_habit_streaks;
CREATE TRIGGER update_system_habit_streaks_updated_at
  BEFORE UPDATE ON public.system_habit_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) system_overall_streaks table (idempotent)
CREATE TABLE IF NOT EXISTS public.system_overall_streaks (
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
DROP POLICY IF EXISTS "Allow all access to system_overall_streaks" ON public.system_overall_streaks;
CREATE POLICY "Allow all access to system_overall_streaks"
  ON public.system_overall_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_system_overall_streaks_updated_at ON public.system_overall_streaks;
CREATE TRIGGER update_system_overall_streaks_updated_at
  BEFORE UPDATE ON public.system_overall_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_overall_streaks (id, current_streak, longest_streak)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 4) Recompute function (FIXED: uses COALESCE(NEW.tracking_date, OLD.tracking_date, CURRENT_DATE)
--    so it works correctly even if DB timezone differs from Cuba)
CREATE OR REPLACE FUNCTION public.recompute_system_habit_streak(_habit_id TEXT, _today_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  prev_date DATE := NULL;
  run INTEGER := 0;
  best INTEGER := 0;
  cur INTEGER := 0;
  today_date DATE := _today_date;
  last_date DATE := NULL;
  key TEXT := 'streak:' || _habit_id;
BEGIN
  FOR r IN
    SELECT tracking_date
    FROM public.daily_systems_tracking
    WHERE (completions ? key) AND (completions ->> key) IN ('true','min','max')
    ORDER BY tracking_date ASC
  LOOP
    IF prev_date IS NULL OR r.tracking_date = prev_date + 1 THEN
      run := run + 1;
    ELSIF r.tracking_date = prev_date THEN
      CONTINUE;
    ELSE
      run := 1;
    END IF;
    IF run > best THEN best := run; END IF;
    prev_date := r.tracking_date;
    last_date := r.tracking_date;
  END LOOP;

  IF last_date IS NULL THEN
    cur := 0;
  ELSIF last_date = today_date OR last_date = today_date - 1 THEN
    cur := run;
  ELSE
    cur := 0;
  END IF;

  INSERT INTO public.system_habit_streaks (habit_id, current_streak, longest_streak, last_completed_date)
  VALUES (_habit_id, cur, best, last_date)
  ON CONFLICT (habit_id) DO UPDATE
    SET current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(public.system_habit_streaks.longest_streak, EXCLUDED.longest_streak),
        last_completed_date = EXCLUDED.last_completed_date,
        updated_at = now();
END;
$$;

-- 5) Trigger function (FIXED: passes tracking_date from the row to recompute)
CREATE OR REPLACE FUNCTION public.refresh_system_habit_streaks_for_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k TEXT;
  habit TEXT;
  keys TEXT[] := '{}';
  ref_date DATE;
BEGIN
  IF NEW IS NOT NULL AND NEW.completions IS NOT NULL THEN
    FOR k IN SELECT jsonb_object_keys(NEW.completions) LOOP
      IF k LIKE 'streak:%' THEN
        keys := array_append(keys, substring(k from 8));
      END IF;
    END LOOP;
  END IF;
  IF OLD IS NOT NULL AND OLD.completions IS NOT NULL THEN
    FOR k IN SELECT jsonb_object_keys(OLD.completions) LOOP
      IF k LIKE 'streak:%' THEN
        habit := substring(k from 8);
        IF NOT (habit = ANY(keys)) THEN
          keys := array_append(keys, habit);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Use the row's tracking_date as reference (Cuba date), fallback to CURRENT_DATE
  ref_date := COALESCE(NEW.tracking_date, OLD.tracking_date, CURRENT_DATE);

  FOREACH habit IN ARRAY keys LOOP
    PERFORM public.recompute_system_habit_streak(habit, ref_date);
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6) Trigger on daily_systems_tracking (idempotent)
DROP TRIGGER IF EXISTS trg_refresh_system_habit_streaks ON public.daily_systems_tracking;
DROP TRIGGER IF EXISTS trg_refresh_system_streaks ON public.daily_systems_tracking;
CREATE TRIGGER trg_refresh_system_habit_streaks
AFTER INSERT OR UPDATE OR DELETE ON public.daily_systems_tracking
FOR EACH ROW EXECUTE FUNCTION public.refresh_system_habit_streaks_for_row();

-- 7) Enable Realtime for system_habit_streaks
-- (through the Supabase publication for Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_habit_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_overall_streaks;

-- 8) Ensure the anon role has the right grants to read streaks
GRANT SELECT ON public.system_habit_streaks TO anon, authenticated;
GRANT SELECT ON public.system_overall_streaks TO anon, authenticated;
