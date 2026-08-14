-- Fase 1 Gym: sesiones de entrenamiento con duración

-- Sesiones completas de entrenamiento (fecha, inicio, fin, duración)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'gimnasio',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to workout_sessions" ON public.workout_sessions FOR ALL USING (true) WITH CHECK (true);

-- Vincular los logs de ejercicio a su sesión
ALTER TABLE public.exercise_logs ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL;

-- Guardar el peso por serie para calcular el volumen total con precisión
ALTER TABLE public.exercise_logs ADD COLUMN IF NOT EXISTS weights_per_set JSONB DEFAULT '[]'::jsonb;