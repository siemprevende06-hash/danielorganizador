-- ============================================================
-- Business Command Center: modelo de datos del emprendimiento
-- ============================================================

-- 1. Ficha ampliada del negocio ---------------------------------
ALTER TABLE public.entrepreneurships
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'idea'
    CHECK (stage IN ('idea','validation','mvp','traction','revenue','scale','paused')),
  ADD COLUMN IF NOT EXISTS business_model TEXT,
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD','CUP')),
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS north_star_key TEXT,
  ADD COLUMN IF NOT EXISTS north_star_target NUMERIC,
  ADD COLUMN IF NOT EXISTS started_at DATE,
  ADD COLUMN IF NOT EXISTS stage_entered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_entrepreneurships_stage
  ON public.entrepreneurships(stage) WHERE archived = false;

-- 2. Ingresos: moneda, tasa histórica y cliente -----------------
ALTER TABLE public.entrepreneurship_income
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD','CUP')),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS customer_id UUID;

-- 3. Gastos ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  exchange_rate NUMERIC(12,2) NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'operating',
  expense_kind TEXT NOT NULL DEFAULT 'opex' CHECK (expense_kind IN ('cogs','opex')),
  vendor TEXT,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Clientes y embudo ------------------------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  segment TEXT,
  status TEXT NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead','contacted','demo','trial','paying','churned')),
  plan TEXT,
  mrr NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  source TEXT,
  started_at DATE,
  churned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Snapshots de métricas --------------------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','derived','import')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, metric_key, period_date)
);

-- 6. Experimentos -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','running','done','discarded')),
  start_date DATE,
  end_date DATE,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  result TEXT,
  learning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Hitos y criterios de salida de etapa ------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  template_key TEXT,
  title TEXT NOT NULL,
  stage TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'exit' CHECK (kind IN ('exit','milestone','product')),
  target_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, template_key)
);

-- 8. Revisión semanal -------------------------------------------
CREATE TABLE IF NOT EXISTS public.entrepreneurship_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  wins TEXT,
  blockers TEXT,
  next_focus TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
  mrr_snapshot NUMERIC(14,2),
  users_snapshot INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, week_start)
);

-- 9. Índices -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ent_expenses_ent_date
  ON public.entrepreneurship_expenses(entrepreneurship_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_ent_customers_ent_status
  ON public.entrepreneurship_customers(entrepreneurship_id, status);
CREATE INDEX IF NOT EXISTS idx_ent_metrics_ent_key_date
  ON public.entrepreneurship_metrics(entrepreneurship_id, metric_key, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_ent_experiments_ent_status
  ON public.entrepreneurship_experiments(entrepreneurship_id, status);
CREATE INDEX IF NOT EXISTS idx_ent_milestones_ent_stage
  ON public.entrepreneurship_milestones(entrepreneurship_id, stage);
CREATE INDEX IF NOT EXISTS idx_ent_reviews_ent_week
  ON public.entrepreneurship_reviews(entrepreneurship_id, week_start DESC);

-- 10. RLS y permisos --------------------------------------------
ALTER TABLE public.entrepreneurship_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all entrepreneurship_expenses" ON public.entrepreneurship_expenses;
CREATE POLICY "Allow all entrepreneurship_expenses" ON public.entrepreneurship_expenses
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all entrepreneurship_customers" ON public.entrepreneurship_customers;
CREATE POLICY "Allow all entrepreneurship_customers" ON public.entrepreneurship_customers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all entrepreneurship_metrics" ON public.entrepreneurship_metrics;
CREATE POLICY "Allow all entrepreneurship_metrics" ON public.entrepreneurship_metrics
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all entrepreneurship_experiments" ON public.entrepreneurship_experiments;
CREATE POLICY "Allow all entrepreneurship_experiments" ON public.entrepreneurship_experiments
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all entrepreneurship_milestones" ON public.entrepreneurship_milestones;
CREATE POLICY "Allow all entrepreneurship_milestones" ON public.entrepreneurship_milestones
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all entrepreneurship_reviews" ON public.entrepreneurship_reviews;
CREATE POLICY "Allow all entrepreneurship_reviews" ON public.entrepreneurship_reviews
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_expenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_metrics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_experiments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_milestones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entrepreneurship_reviews TO anon, authenticated;
GRANT ALL ON public.entrepreneurship_expenses TO service_role;
GRANT ALL ON public.entrepreneurship_customers TO service_role;
GRANT ALL ON public.entrepreneurship_metrics TO service_role;
GRANT ALL ON public.entrepreneurship_experiments TO service_role;
GRANT ALL ON public.entrepreneurship_milestones TO service_role;
GRANT ALL ON public.entrepreneurship_reviews TO service_role;

-- 11. Triggers updated_at ---------------------------------------
DROP TRIGGER IF EXISTS update_entrepreneurship_customers_updated_at ON public.entrepreneurship_customers;
CREATE TRIGGER update_entrepreneurship_customers_updated_at
  BEFORE UPDATE ON public.entrepreneurship_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Limpieza de tareas generales al borrar un emprendimiento ---
CREATE OR REPLACE FUNCTION public.cleanup_entrepreneurship_tasks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.tasks
  WHERE source = 'entrepreneurship'
    AND source_id IN (
      SELECT id FROM public.entrepreneurship_tasks WHERE entrepreneurship_id = OLD.id
    );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_entrepreneurship_tasks ON public.entrepreneurships;
CREATE TRIGGER trg_cleanup_entrepreneurship_tasks
  BEFORE DELETE ON public.entrepreneurships
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_entrepreneurship_tasks();