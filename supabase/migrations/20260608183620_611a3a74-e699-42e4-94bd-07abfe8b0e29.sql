
CREATE TABLE public.identity_plan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identity_plan_id UUID NOT NULL REFERENCES public.identity_plan(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.identity_plan_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_plan_tasks TO authenticated, anon;
GRANT ALL ON public.identity_plan_tasks TO service_role;
ALTER TABLE public.identity_plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all identity_plan_tasks" ON public.identity_plan_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_identity_plan_tasks_plan ON public.identity_plan_tasks(identity_plan_id);
CREATE INDEX idx_identity_plan_tasks_parent ON public.identity_plan_tasks(parent_task_id);
CREATE TRIGGER trg_identity_plan_tasks_updated BEFORE UPDATE ON public.identity_plan_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vision_board_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_type TEXT NOT NULL CHECK (board_type IN ('porque','recompensas')),
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 8),
  image_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_type, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_board_cells TO authenticated, anon;
GRANT ALL ON public.vision_board_cells TO service_role;
ALTER TABLE public.vision_board_cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all vision_board_cells" ON public.vision_board_cells FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_vision_board_cells_updated BEFORE UPDATE ON public.vision_board_cells FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
