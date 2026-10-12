-- Descanso vs Saltar (gym):
--   * Descanso: día válido (verde). Se guarda en `rest['gym']` y NO rompe la racha.
--   * Saltar:   día rojo (no fui al gym). Se guarda en `skipped['gym']` y SÍ rompe la racha.
--
-- Antes ambos se guardaban en `skipped['gym']` (todo descanso). Migramos esos
-- registros históricos a `rest` para no convertirlos en "saltados".

ALTER TABLE public.daily_systems_tracking
  ADD COLUMN IF NOT EXISTS rest jsonb DEFAULT '{}';

UPDATE public.daily_systems_tracking
SET rest = jsonb_set(COALESCE(rest, '{}'::jsonb), '{gym}', 'true'::jsonb, true),
    skipped = COALESCE(skipped, '{}'::jsonb) - 'gym'
WHERE skipped ? 'gym';

-- Racha del gym: sólo los días de `rest` conectan la racha; los `skipped`
-- (saltar/no ir) la rompen. Para el resto de hábitos se conserva el
-- comportamiento previo (un día `skipped` actúa como puente).
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
      bridge_ok := TRUE;
      FOR d IN SELECT g::date
               FROM generate_series(prev_date + 1, r.tracking_date - 1, '1 day') AS g
      LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.daily_systems_tracking t
          WHERE t.tracking_date = d
            AND CASE WHEN _habit_id = 'gym'
                     THEN t.rest ? _habit_id
                     ELSE t.skipped ? _habit_id
                END
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
        WHERE t.tracking_date = d
          AND CASE WHEN _habit_id = 'gym'
                   THEN t.rest ? _habit_id
                   ELSE t.skipped ? _habit_id
              END
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
