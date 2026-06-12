
CREATE TABLE public.identity_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_system_hint TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_systems TO anon, authenticated;
GRANT ALL ON public.identity_systems TO service_role;
ALTER TABLE public.identity_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.identity_systems FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_identity_systems_updated BEFORE UPDATE ON public.identity_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.identity_systems_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES public.identity_systems(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_states JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(system_id, tracking_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_systems_daily TO anon, authenticated;
GRANT ALL ON public.identity_systems_daily TO service_role;
ALTER TABLE public.identity_systems_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.identity_systems_daily FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.point_b_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value TEXT,
  target_value TEXT,
  unit TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_b_metrics TO anon, authenticated;
GRANT ALL ON public.point_b_metrics TO service_role;
ALTER TABLE public.point_b_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.point_b_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_point_b_metrics_updated BEFORE UPDATE ON public.point_b_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO anon, authenticated;
GRANT ALL ON public.sprints TO service_role;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.sprints FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_sprints_updated BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sprint_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  objective_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprint_objectives TO anon, authenticated;
GRANT ALL ON public.sprint_objectives TO service_role;
ALTER TABLE public.sprint_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.sprint_objectives FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_sprint_objectives_updated BEFORE UPDATE ON public.sprint_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
