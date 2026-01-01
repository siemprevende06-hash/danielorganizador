-- Create workout_routines table for weekly workout schedules
CREATE TABLE public.workout_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  workout_days JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_routines
CREATE POLICY "Allow all access to workout_routines" ON public.workout_routines FOR ALL USING (true) WITH CHECK (true);

-- Create workout_exercises table for exercises in each routine
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  target_sets INTEGER DEFAULT 3,
  target_reps TEXT DEFAULT '8-12',
  muscle_group TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_exercises
CREATE POLICY "Allow all access to workout_exercises" ON public.workout_exercises FOR ALL USING (true) WITH CHECK (true);

-- Create exercise_logs table for tracking strength progress
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  user_id UUID,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sets_completed INTEGER,
  reps_per_set JSONB DEFAULT '[]',
  weight_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_logs
CREATE POLICY "Allow all access to exercise_logs" ON public.exercise_logs FOR ALL USING (true) WITH CHECK (true);