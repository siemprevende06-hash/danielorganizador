ALTER TABLE public.grocery_products
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_basic BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.meal_tracking
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS weights_per_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_pr BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  routine_id UUID,
  tipo TEXT NOT NULL DEFAULT 'gimnasio',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO anon, authenticated;
GRANT ALL ON public.workout_sessions TO service_role;

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on workout_sessions" ON public.workout_sessions;
CREATE POLICY "Allow all on workout_sessions" ON public.workout_sessions
  FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();