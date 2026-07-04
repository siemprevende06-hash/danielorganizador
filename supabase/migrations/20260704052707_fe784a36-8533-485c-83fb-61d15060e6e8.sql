
CREATE TABLE public.punto_partida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id TEXT NOT NULL UNIQUE,
  area_type TEXT NOT NULL DEFAULT 'wheel',
  nota INTEGER NOT NULL DEFAULT 5,
  sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  hechos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.punto_partida TO anon, authenticated;
GRANT ALL ON public.punto_partida TO service_role;
ALTER TABLE public.punto_partida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to punto_partida" ON public.punto_partida FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_punto_partida_updated_at BEFORE UPDATE ON public.punto_partida FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.eventos_sociales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'otros',
  con_quien JSONB NOT NULL DEFAULT '[]'::jsonb,
  descripcion TEXT,
  gasto NUMERIC NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos_sociales TO anon, authenticated;
GRANT ALL ON public.eventos_sociales TO service_role;
ALTER TABLE public.eventos_sociales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to eventos_sociales" ON public.eventos_sociales FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_eventos_sociales_updated_at BEFORE UPDATE ON public.eventos_sociales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  persona TEXT NOT NULL,
  lugar TEXT,
  rating INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citas TO anon, authenticated;
GRANT ALL ON public.citas TO service_role;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to citas" ON public.citas FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.intimidad_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  calidad INTEGER NOT NULL DEFAULT 0,
  posiciones JSONB NOT NULL DEFAULT '[]'::jsonb,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intimidad_tracking TO anon, authenticated;
GRANT ALL ON public.intimidad_tracking TO service_role;
ALTER TABLE public.intimidad_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to intimidad_tracking" ON public.intimidad_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_intimidad_tracking_updated_at BEFORE UPDATE ON public.intimidad_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
