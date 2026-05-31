
CREATE TABLE public.daily_systems_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  completions jsonb DEFAULT '{}'::jsonb,
  time_data jsonb DEFAULT '{}'::jsonb,
  count_data jsonb DEFAULT '{}'::jsonb,
  water_data jsonb DEFAULT '{}'::jsonb,
  work_assignments jsonb DEFAULT '{}'::jsonb,
  block_completions jsonb DEFAULT '{}'::jsonb,
  wake_time time without time zone,
  sleep_time time without time zone,
  workout_duration integer DEFAULT 0,
  workout_intensity text DEFAULT 'moderate',
  meal_photos jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tracking_date)
);

ALTER TABLE public.daily_systems_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to daily_systems_tracking"
ON public.daily_systems_tracking
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_daily_systems_tracking_updated_at
BEFORE UPDATE ON public.daily_systems_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
