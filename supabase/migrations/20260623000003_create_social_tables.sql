-- Create social events table (friends outings, hotel, experiences)
CREATE TABLE IF NOT EXISTS public.eventos_sociales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'amigos' CHECK (tipo IN ('amigos', 'hotel', 'fiesta', 'experiencia', 'otros')),
  con_quien JSONB DEFAULT '[]',
  descripcion TEXT DEFAULT '',
  gasto DECIMAL(10,2) DEFAULT 0,
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.eventos_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to eventos_sociales" ON public.eventos_sociales FOR ALL USING (true) WITH CHECK (true);

-- Create dates table
CREATE TABLE IF NOT EXISTS public.citas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  persona TEXT NOT NULL,
  lugar TEXT DEFAULT '',
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to citas" ON public.citas FOR ALL USING (true) WITH CHECK (true);

-- Create intimacy tracking table
CREATE TABLE IF NOT EXISTS public.intimidad_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  calidad INTEGER DEFAULT 3 CHECK (calidad >= 1 AND calidad <= 5),
  posiciones JSONB DEFAULT '[]',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.intimidad_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to intimidad_tracking" ON public.intimidad_tracking FOR ALL USING (true) WITH CHECK (true);
