
DROP TRIGGER IF EXISTS trg_refresh_system_habit_streaks ON public.daily_systems_tracking;
CREATE TRIGGER trg_refresh_system_habit_streaks
AFTER INSERT OR UPDATE OR DELETE ON public.daily_systems_tracking
FOR EACH ROW EXECUTE FUNCTION public.refresh_system_habit_streaks_for_row();
