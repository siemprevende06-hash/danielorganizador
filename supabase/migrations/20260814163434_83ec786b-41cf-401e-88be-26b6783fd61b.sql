ALTER TABLE public.exercise_logs
  DROP CONSTRAINT IF EXISTS exercise_logs_session_id_fkey;

ALTER TABLE public.exercise_logs
  ADD CONSTRAINT exercise_logs_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id) ON DELETE SET NULL;