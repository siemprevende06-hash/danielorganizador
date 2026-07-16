ALTER TABLE public.routine_steps DROP CONSTRAINT IF EXISTS routine_steps_routine_type_check;
ALTER TABLE public.routine_steps ADD CONSTRAINT routine_steps_routine_type_check
  CHECK (routine_type IN ('activation','deactivation','morning_prep','weekend'));
