-- Permite registrar práctica de música con segundos (menos de 1 minuto).
-- Las columnas de minutos pasan a numeric para admitir fracciones (p. ej. 0.5 = 30 s).
-- Idempotente / seguro de re-ejecutar.

ALTER TABLE public.music_practice_sessions
  ALTER COLUMN duration_minutes TYPE numeric(10,2) USING duration_minutes::numeric,
  ALTER COLUMN left_hand_minutes TYPE numeric(10,2) USING left_hand_minutes::numeric,
  ALTER COLUMN right_hand_minutes TYPE numeric(10,2) USING right_hand_minutes::numeric,
  ALTER COLUMN both_hands_minutes TYPE numeric(10,2) USING both_hands_minutes::numeric;

ALTER TABLE public.music_repertoire
  ALTER COLUMN practice_minutes TYPE numeric(10,2) USING practice_minutes::numeric;
