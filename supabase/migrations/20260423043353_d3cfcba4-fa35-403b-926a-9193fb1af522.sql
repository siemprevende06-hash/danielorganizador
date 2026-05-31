-- Strength goals for main lifts
CREATE TABLE IF NOT EXISTS public.strength_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  exercise_key TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  current_weight_kg NUMERIC DEFAULT 0,
  current_reps INTEGER DEFAULT 0,
  target_weight_kg NUMERIC DEFAULT 0,
  target_reps INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strength_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to strength_goals" ON public.strength_goals FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_strength_goals_updated_at
  BEFORE UPDATE ON public.strength_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chess sessions
CREATE TABLE IF NOT EXISTS public.chess_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_elo INTEGER,
  platform TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chess_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to chess_sessions" ON public.chess_sessions FOR ALL USING (true) WITH CHECK (true);

-- Chess goals
CREATE TABLE IF NOT EXISTS public.chess_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_elo INTEGER DEFAULT 1500,
  target_games_per_month INTEGER DEFAULT 30,
  target_minutes_per_day INTEGER DEFAULT 30,
  starting_elo INTEGER DEFAULT 1000,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chess_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to chess_goals" ON public.chess_goals FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_chess_goals_updated_at
  BEFORE UPDATE ON public.chess_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Weekly gym routine: assigns muscle groups + exercises per day of week
CREATE TABLE IF NOT EXISTS public.weekly_gym_routine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_label TEXT NOT NULL,
  muscle_groups TEXT[] DEFAULT '{}',
  exercises JSONB DEFAULT '[]'::jsonb,
  is_rest_day BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

ALTER TABLE public.weekly_gym_routine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to weekly_gym_routine" ON public.weekly_gym_routine FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_weekly_gym_routine_updated_at
  BEFORE UPDATE ON public.weekly_gym_routine
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();