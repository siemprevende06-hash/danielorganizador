
-- boxeo_tecnicas
CREATE TABLE public.boxeo_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL DEFAULT 'basico',
  nivel_requerido INTEGER NOT NULL DEFAULT 1,
  nivel_dominio INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boxeo_tecnicas TO anon, authenticated;
GRANT ALL ON public.boxeo_tecnicas TO service_role;
ALTER TABLE public.boxeo_tecnicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to boxeo_tecnicas" ON public.boxeo_tecnicas FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_boxeo_tecnicas_updated_at BEFORE UPDATE ON public.boxeo_tecnicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- boxeo_sesiones
CREATE TABLE public.boxeo_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'entrenamiento',
  duracion_minutos INTEGER NOT NULL DEFAULT 0,
  rounds INTEGER NOT NULL DEFAULT 0,
  tecnicas_practicadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  intensidad TEXT NOT NULL DEFAULT 'moderate',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boxeo_sesiones TO anon, authenticated;
GRANT ALL ON public.boxeo_sesiones TO service_role;
ALTER TABLE public.boxeo_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to boxeo_sesiones" ON public.boxeo_sesiones FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_boxeo_sesiones_updated_at BEFORE UPDATE ON public.boxeo_sesiones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- calendar_events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO anon, authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to calendar_events" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
