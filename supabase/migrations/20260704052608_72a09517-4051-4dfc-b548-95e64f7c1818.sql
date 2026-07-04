
CREATE TABLE public.necesidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  necesidad_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  progreso INTEGER NOT NULL DEFAULT 0,
  area_referencia TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.necesidades TO anon, authenticated;
GRANT ALL ON public.necesidades TO service_role;
ALTER TABLE public.necesidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to necesidades" ON public.necesidades FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_necesidades_updated_at BEFORE UPDATE ON public.necesidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS cover_image TEXT;
