CREATE TABLE public.personal_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  area_id text NOT NULL,
  sub_area text,
  cover_image_url text,
  system_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_lists TO anon, authenticated;
GRANT ALL ON public.personal_lists TO service_role;
ALTER TABLE public.personal_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_lists_all" ON public.personal_lists FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.personal_list_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.personal_lists(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.personal_list_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'medium',
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_list_tasks TO anon, authenticated;
GRANT ALL ON public.personal_list_tasks TO service_role;
ALTER TABLE public.personal_list_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_list_tasks_all" ON public.personal_list_tasks FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX personal_list_tasks_list_idx ON public.personal_list_tasks(list_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_personal_lists_updated_at BEFORE UPDATE ON public.personal_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_list_tasks_updated_at BEFORE UPDATE ON public.personal_list_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();