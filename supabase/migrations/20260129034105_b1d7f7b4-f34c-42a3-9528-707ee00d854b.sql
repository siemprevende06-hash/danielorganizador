-- 1. Detalles de comidas para tracking de nutrición
CREATE TABLE public.meal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_tracking_id UUID REFERENCES public.meal_tracking(id) ON DELETE CASCADE,
  user_id UUID,
  description TEXT NOT NULL,
  estimated_calories INTEGER DEFAULT 0,
  protein_grams NUMERIC DEFAULT 0,
  carbs_grams NUMERIC DEFAULT 0,
  fat_grams NUMERIC DEFAULT 0,
  ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meal_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to meal_details" ON public.meal_details FOR ALL USING (true) WITH CHECK (true);

-- 2. Sesiones de focus para estadísticas
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  task_id UUID,
  task_title TEXT NOT NULL,
  task_area TEXT,
  block_id TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to focus_sessions" ON public.focus_sessions FOR ALL USING (true) WITH CHECK (true);

-- 3. Escalones de confianza
CREATE TABLE public.confidence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  target_level INTEGER DEFAULT 2,
  parent_id UUID REFERENCES public.confidence_steps(id) ON DELETE CASCADE,
  view_type TEXT DEFAULT 'weekly',
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.confidence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to confidence_steps" ON public.confidence_steps FOR ALL USING (true) WITH CHECK (true);

-- 4. Objetivos semanales
CREATE TABLE public.weekly_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  week_start_date DATE NOT NULL,
  area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.weekly_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to weekly_objectives" ON public.weekly_objectives FOR ALL USING (true) WITH CHECK (true);

-- 5. Biblioteca de lectura
CREATE TABLE public.reading_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  author TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'to_read',
  start_date DATE,
  finish_date DATE,
  rating INTEGER,
  notes TEXT,
  pages_total INTEGER,
  pages_read INTEGER DEFAULT 0,
  genre TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reading_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reading_library" ON public.reading_library FOR ALL USING (true) WITH CHECK (true);

-- 6. Canciones de piano/guitarra
CREATE TABLE public.music_repertoire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  instrument TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  difficulty TEXT DEFAULT 'beginner',
  status TEXT DEFAULT 'learning',
  youtube_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.music_repertoire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to music_repertoire" ON public.music_repertoire FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_confidence_steps_updated_at BEFORE UPDATE ON public.confidence_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_objectives_updated_at BEFORE UPDATE ON public.weekly_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reading_library_updated_at BEFORE UPDATE ON public.reading_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_music_repertoire_updated_at BEFORE UPDATE ON public.music_repertoire FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();