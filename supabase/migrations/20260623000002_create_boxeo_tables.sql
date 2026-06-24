-- Create boxing techniques table
CREATE TABLE IF NOT EXISTS public.boxeo_tecnicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'basico' CHECK (categoria IN ('basico', 'intermedio', 'avanzado')),
  nivel_requerido INTEGER DEFAULT 1,
  nivel_dominio INTEGER DEFAULT 0 CHECK (nivel_dominio >= 0 AND nivel_dominio <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.boxeo_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to boxeo_tecnicas" ON public.boxeo_tecnicas FOR ALL USING (true) WITH CHECK (true);

-- Create boxing sessions table
CREATE TABLE IF NOT EXISTS public.boxeo_sesiones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'saco' CHECK (tipo IN ('saco', 'sombra', 'sparring', 'bolsa', 'otros')),
  duracion_minutos INTEGER NOT NULL DEFAULT 30,
  rounds INTEGER DEFAULT 0,
  intensidad TEXT DEFAULT 'media' CHECK (intensidad IN ('baja', 'media', 'alta')),
  tecnicas_practicadas JSONB DEFAULT '[]',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.boxeo_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to boxeo_sesiones" ON public.boxeo_sesiones FOR ALL USING (true) WITH CHECK (true);
