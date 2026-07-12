CREATE TABLE public.trimestral_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, quarter, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trimestral_plans TO anon, authenticated;
GRANT ALL ON public.trimestral_plans TO service_role;

ALTER TABLE public.trimestral_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to trimestral_plans" ON public.trimestral_plans FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_trimestral_plans_updated_at BEFORE UPDATE ON public.trimestral_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
