-- Create entrepreneurship_goals table
CREATE TABLE IF NOT EXISTS public.entrepreneurship_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.entrepreneurship_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entrepreneurship_goals (public access, matching other tables)
CREATE POLICY "Anyone can view entrepreneurship_goals"
  ON public.entrepreneurship_goals
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create entrepreneurship_goals"
  ON public.entrepreneurship_goals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update entrepreneurship_goals"
  ON public.entrepreneurship_goals
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete entrepreneurship_goals"
  ON public.entrepreneurship_goals
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_entrepreneurship_goals_entrepreneurship_id ON public.entrepreneurship_goals(entrepreneurship_id);

CREATE TRIGGER update_entrepreneurship_goals_updated_at
  BEFORE UPDATE ON public.entrepreneurship_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();