-- Enable RLS on all new tables
ALTER TABLE public.entrepreneurships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entrepreneurships (public read, no auth required)
CREATE POLICY "Anyone can view entrepreneurships"
  ON public.entrepreneurships
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create entrepreneurships"
  ON public.entrepreneurships
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update entrepreneurships"
  ON public.entrepreneurships
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete entrepreneurships"
  ON public.entrepreneurships
  FOR DELETE
  USING (true);

-- RLS Policies for entrepreneurship_tasks (public access)
CREATE POLICY "Anyone can view entrepreneurship tasks"
  ON public.entrepreneurship_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create entrepreneurship tasks"
  ON public.entrepreneurship_tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update entrepreneurship tasks"
  ON public.entrepreneurship_tasks
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete entrepreneurship tasks"
  ON public.entrepreneurship_tasks
  FOR DELETE
  USING (true);

-- RLS Policies for subtasks (public access)
CREATE POLICY "Anyone can view subtasks"
  ON public.subtasks
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create subtasks"
  ON public.subtasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update subtasks"
  ON public.subtasks
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete subtasks"
  ON public.subtasks
  FOR DELETE
  USING (true);

-- Fix the search_path on the update function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;