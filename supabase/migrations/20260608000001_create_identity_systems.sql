CREATE TABLE public.identity_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  tasks jsonb DEFAULT '[]'::jsonb,
  linked_system_hint text DEFAULT '',
  is_active boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.identity_systems_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid NOT NULL REFERENCES public.identity_systems(id) ON DELETE CASCADE,
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  task_states jsonb DEFAULT '{}'::jsonb,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(system_id, tracking_date)
);

ALTER TABLE public.identity_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_systems_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to identity_systems"
ON public.identity_systems
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to identity_systems_daily"
ON public.identity_systems_daily
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_identity_systems_updated_at
BEFORE UPDATE ON public.identity_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_systems_daily_updated_at
BEFORE UPDATE ON public.identity_systems_daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
