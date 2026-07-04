
CREATE TABLE public.distribution_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  percentage NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'Target',
  color TEXT DEFAULT 'blue',
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distribution_bags TO anon, authenticated;
GRANT ALL ON public.distribution_bags TO service_role;
ALTER TABLE public.distribution_bags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to distribution_bags" ON public.distribution_bags FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_distribution_bags_updated_at BEFORE UPDATE ON public.distribution_bags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS distributed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS task_ids JSONB;
