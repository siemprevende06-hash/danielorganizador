-- Fase 2 Gym: detección de récords personales (PR)
ALTER TABLE public.exercise_logs ADD COLUMN IF NOT EXISTS is_pr BOOLEAN NOT NULL DEFAULT false;