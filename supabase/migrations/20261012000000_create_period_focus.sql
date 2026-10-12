-- ─────────────────────────────────────────────────────────────────────────────
-- period_focus — Foco por periodo (día/semana/mes/trimestre/año).
-- Cada periodo tiene 1 foco principal + varios secundarios. Un foco enlaza una
-- entidad existente (tarea/proyecto/meta/asignatura/iniciativa/libro/canción)
-- o es texto libre. El área se deriva de la entidad. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.period_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type  TEXT NOT NULL CHECK (period_type IN ('day','week','month','quarter','year')),
  period_start DATE NOT NULL,
  entity_type  TEXT NOT NULL DEFAULT 'free',  -- task|project|goal|subject|entrepreneurship|book|song|free
  entity_id    TEXT,
  title        TEXT NOT NULL,
  area_id      TEXT,
  note         TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  rank         INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'active',  -- active|done|skipped
  user_id      UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.period_focus TO anon, authenticated;
GRANT ALL ON public.period_focus TO service_role;
ALTER TABLE public.period_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "period_focus_all" ON public.period_focus FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS period_focus_period_idx
  ON public.period_focus (period_type, period_start);

-- Un solo foco principal por periodo.
CREATE UNIQUE INDEX IF NOT EXISTS period_focus_primary_uidx
  ON public.period_focus (period_type, period_start)
  WHERE is_primary;

CREATE TRIGGER update_period_focus_updated_at
  BEFORE UPDATE ON public.period_focus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
