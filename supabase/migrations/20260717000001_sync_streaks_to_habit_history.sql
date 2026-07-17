
-- ============================================================
-- Sync: mirror system_habit_streaks to habit_history
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_system_streak_to_habit_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.habit_history (habit_id, current_streak, longest_streak, completed_dates)
  VALUES (NEW.habit_id, NEW.current_streak, NEW.longest_streak, '[]'::jsonb)
  ON CONFLICT (habit_id) DO UPDATE
    SET current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(public.habit_history.longest_streak, EXCLUDED.longest_streak);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_system_streak_to_habit_history ON public.system_habit_streaks;
CREATE TRIGGER trg_sync_system_streak_to_habit_history
AFTER INSERT OR UPDATE ON public.system_habit_streaks
FOR EACH ROW EXECUTE FUNCTION public.sync_system_streak_to_habit_history();
