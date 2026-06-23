-- Create distribution_bags table
CREATE TABLE IF NOT EXISTS public.distribution_bags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  percentage DECIMAL(5,2) NOT NULL DEFAULT 10,
  icon TEXT DEFAULT 'Target',
  color TEXT DEFAULT 'blue',
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.distribution_bags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to distribution_bags" ON public.distribution_bags FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_distribution_bags_updated_at BEFORE UPDATE ON public.distribution_bags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
