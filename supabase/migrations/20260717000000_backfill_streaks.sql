
-- ============================================================
-- RPC: backfill_system_streaks — recomputa TODAS las rachas
-- ============================================================

CREATE OR REPLACE FUNCTION public.backfill_system_streaks()
RETURNS TABLE(habit_id TEXT, current_streak INT, longest_streak INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  habit_ids TEXT[];
  h TEXT;
BEGIN
  -- Collect all distinct habit IDs from streak keys
  SELECT ARRAY_AGG(DISTINCT substring(k from 8))
  INTO habit_ids
  FROM public.daily_systems_tracking,
  LATERAL jsonb_object_keys(completions) AS k
  WHERE k LIKE 'streak:%';

  FOREACH h IN ARRAY habit_ids
  LOOP
    PERFORM public.recompute_system_habit_streak(h);
  END LOOP;

  RETURN QUERY
  SELECT s.habit_id, s.current_streak, s.longest_streak
  FROM public.system_habit_streaks s
  ORDER BY s.habit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_system_streaks() TO anon, authenticated, service_role;
