
CREATE TABLE public.entrepreneurship_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  income_type TEXT NOT NULL DEFAULT 'revenue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.entrepreneurship_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to entrepreneurship_income"
  ON public.entrepreneurship_income
  FOR ALL
  USING (true)
  WITH CHECK (true);
