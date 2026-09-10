-- Los días de descanso del gym (skipped['entrenamiento-fisico'] = true)
-- NO rompen la racha: se recorren como "puentes" que conectan corridas.

-- Reemplaza recompute_system_habit_streak para que, al calcular la corrida,
-- los días intermedios marcados como descanso (skipped) del hábito no corten
-- la racha: se tratan como huecos rellenables que conectan dos días entrenados.

CREATE OR REPLACE FUNCTION public.recompute_system_habit_streak(_habit_id TEXT, _today_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  prev_date DATE := NULL;
  run INTEGER := 0;
  best INTEGER := 0;
  cur INTEGER := 0;
  today_date DATE := _today_date;
  last_date DATE := NULL;
  key TEXT := 'streak:' || _habit_id;
  d DATE;
  bridge_ok BOOLEAN;
BEGIN
  FOR r IN
    SELECT tracking_date
    FROM public.daily_systems_tracking
    WHERE (completions ? key) AND (completions ->> key) IN ('true','min','max')
    ORDER BY tracking_date ASC
  LOOP
    IF prev_date IS NULL OR r.tracking_date = prev_date + 1 THEN
      run := run + 1;
    ELSIF r.tracking_date = prev_date THEN
      CONTINUE;
    ELSE
      -- Hay un hueco entre prev_date y r.tracking_date. Si TODOS los días del
      -- hueco están marcados como descanso (skipped) del hábito, el descanso
      -- es un puente: la racha continúa sin romperse.
      bridge_ok := TRUE;
      FOR d IN SELECT g::date
               FROM generate_series(prev_date + 1, r.tracking_date - 1, '1 day') AS g
      LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.daily_systems_tracking t
          WHERE t.tracking_date = d AND t.skipped ? _habit_id
        ) THEN
          bridge_ok := FALSE;
          EXIT;
        END IF;
      END LOOP;

      IF bridge_ok THEN
        run := run + 1;
      ELSE
        run := 1;
      END IF;
    END IF;
    IF run > best THEN best := run; END IF;
    prev_date := r.tracking_date;
    last_date := r.tracking_date;
  END LOOP;

  -- Racha actual: se mantiene si el último día completado es hoy/ayer,
  -- o si todo lo que separa el último día de hoy son días de descanso.
  IF last_date IS NULL THEN
    cur := 0;
  ELSIF last_date = today_date OR last_date = today_date - 1 THEN
    cur := run;
  ELSE
    bridge_ok := TRUE;
    FOR d IN SELECT g::date
             FROM generate_series(last_date + 1, today_date, '1 day') AS g
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.daily_systems_tracking t
        WHERE t.tracking_date = d AND t.skipped ? _habit_id
      ) THEN
        bridge_ok := FALSE;
        EXIT;
      END IF;
    END LOOP;
    cur := CASE WHEN bridge_ok THEN run ELSE 0 END;
  END IF;

  INSERT INTO public.system_habit_streaks (habit_id, current_streak, longest_streak, last_completed_date)
  VALUES (_habit_id, cur, best, last_date)
  ON CONFLICT (habit_id) DO UPDATE
    SET current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(public.system_habit_streaks.longest_streak, EXCLUDED.longest_streak),
        last_completed_date = EXCLUDED.last_completed_date,
        updated_at = now();
END;
$$;