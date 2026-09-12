-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIONES PENDIENTES — danielorganizador (Supabase)
-- Generado el 2026-09-11. Pegar TODO en Supabase Dashboard > SQL Editor > Run.
-- Orden cronológico. Cada bloque es idempotente / seguro de re-ejecutar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- [1/6] 20260809_dedupe_app_settings.sql
-- Deduplica app_settings y previene duplicados futuros (user_id NULL).
-- ─────────────────────────────────────────────────────────────────────────────
delete from public.app_settings a
using public.app_settings b
where a.setting_key = b.setting_key
  and a.user_id is not distinct from b.user_id
  and (a.updated_at < b.updated_at or (a.updated_at = b.updated_at and a.id < b.id));

create unique index if not exists app_settings_setting_key_uidx
  on public.app_settings (setting_key)
  where user_id is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- [2/6] 20260826063520_4ac3c308-1b12-4808-96a0-3012083a3a71.sql
-- Tablas personal_lists y personal_list_tasks.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.personal_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  area_id text NOT NULL,
  sub_area text,
  cover_image_url text,
  system_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_lists TO anon, authenticated;
GRANT ALL ON public.personal_lists TO service_role;
ALTER TABLE public.personal_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_lists_all" ON public.personal_lists FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.personal_list_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.personal_lists(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.personal_list_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_list_tasks TO anon, authenticated;
GRANT ALL ON public.personal_list_tasks TO service_role;
ALTER TABLE public.personal_list_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_list_tasks_all" ON public.personal_list_tasks FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX personal_list_tasks_list_idx ON public.personal_list_tasks(list_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_personal_lists_updated_at BEFORE UPDATE ON public.personal_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_list_tasks_updated_at BEFORE UPDATE ON public.personal_list_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- [3/6] 20260905000000_add_currency_to_wallets_and_transactions.sql
-- *** CRÍTICA: sin esto las finanzas no sincronizan a la nube. ***
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS currency TEXT;

UPDATE public.wallets SET currency = 'USD' WHERE currency IS NULL AND name ILIKE '%usd%';
UPDATE public.wallets SET currency = 'CUP' WHERE currency IS NULL;

ALTER TABLE public.wallets ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.wallets ALTER COLUMN currency SET DEFAULT 'CUP';

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT;

UPDATE public.transactions SET currency = 'USD' WHERE currency IS NULL;

ALTER TABLE public.transactions ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN currency SET DEFAULT 'USD';

-- ─────────────────────────────────────────────────────────────────────────────
-- [4/6] 20260907000000_add_code_to_university_subjects.sql
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.university_subjects ADD COLUMN IF NOT EXISTS code TEXT;

UPDATE public.university_subjects SET code = color WHERE code IS NULL AND color IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- [5/6] 20260908000000_add_cover_to_music_repertoire.sql
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.music_repertoire add column if not exists cover_image_url text;

-- ─────────────────────────────────────────────────────────────────────────────
-- [7/7] 20260910000001_rest_days_keep_gym_streak.sql
-- Los días de descanso del gym no rompen la racha (CREATE OR REPLACE, seguro).
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- [7/7] 20260912000000_dedupe_wallets.sql
-- Billeteras duplicadas: la siembra automática creó un "Efectivo CUP" extra
-- (saldo 0) junto al real. Consolidar por (nombre, moneda) la de mayor saldo,
-- reapuntar transacciones/préstamos y bloquear duplicados futuros.
-- ─────────────────────────────────────────────────────────────────────────────
BEGIN;

CREATE TEMP TABLE keep_wallet AS
SELECT DISTINCT ON (lower(btrim(name)), currency)
  id,
  lower(btrim(name)) AS nombre,
  currency
FROM public.wallets
ORDER BY lower(btrim(name)), currency, balance DESC NULLS LAST, updated_at DESC;

UPDATE public.transactions t
SET wallet_id = k.id
FROM public.wallets w
JOIN keep_wallet k ON lower(btrim(w.name)) = k.nombre AND w.currency = k.currency
WHERE t.wallet_id = w.id AND w.id <> k.id;

UPDATE public.loans l
SET wallet_id = k.id
FROM public.wallets w
JOIN keep_wallet k ON lower(btrim(w.name)) = k.nombre AND w.currency = k.currency
WHERE l.wallet_id = w.id AND w.id <> k.id;

DELETE FROM public.wallets w
USING keep_wallet k
WHERE lower(btrim(w.name)) = k.nombre AND w.currency = k.currency AND w.id <> k.id;

DROP TABLE keep_wallet;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_name_currency_uidx
  ON public.wallets (lower(btrim(name)), currency);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- [7/7] 20260912000002_energy_sleep_checkin.sql
-- Check-in de energía/sueño del día (1 tap) en daily_reviews.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.daily_reviews
  ADD COLUMN IF NOT EXISTS energy_rating integer,
  ADD COLUMN IF NOT EXISTS sleep_rating integer,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric;