
-- performance_modes
CREATE TABLE public.performance_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  mode_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  active_routine JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_modes TO anon, authenticated;
GRANT ALL ON public.performance_modes TO service_role;
ALTER TABLE public.performance_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to performance_modes" ON public.performance_modes FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_performance_modes_updated_at BEFORE UPDATE ON public.performance_modes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- rewards_redemptions
CREATE TABLE public.rewards_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  recompensa_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  icono TEXT,
  costo INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards_redemptions TO anon, authenticated;
GRANT ALL ON public.rewards_redemptions TO service_role;
ALTER TABLE public.rewards_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to rewards_redemptions" ON public.rewards_redemptions FOR ALL USING (true) WITH CHECK (true);

-- mini_habits
CREATE TABLE public.mini_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  habit_key TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⚡',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mini_habits TO anon, authenticated;
GRANT ALL ON public.mini_habits TO service_role;
ALTER TABLE public.mini_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to mini_habits" ON public.mini_habits FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_mini_habits_updated_at BEFORE UPDATE ON public.mini_habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- valuable_skills
CREATE TABLE public.valuable_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.valuable_skills TO anon, authenticated;
GRANT ALL ON public.valuable_skills TO service_role;
ALTER TABLE public.valuable_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to valuable_skills" ON public.valuable_skills FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_valuable_skills_updated_at BEFORE UPDATE ON public.valuable_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- text_sections (contenido de secciones libres tipo Motivos, Realidad, Vision Cards, etc.)
CREATE TABLE public.text_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.text_sections TO anon, authenticated;
GRANT ALL ON public.text_sections TO service_role;
ALTER TABLE public.text_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to text_sections" ON public.text_sections FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_text_sections_updated_at BEFORE UPDATE ON public.text_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
