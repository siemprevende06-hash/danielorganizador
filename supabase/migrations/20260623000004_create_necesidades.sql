-- Create necesidades table (the 7 core needs)
CREATE TABLE IF NOT EXISTS public.necesidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  necesidad_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  icono TEXT DEFAULT '🔥',
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  area_referencia TEXT DEFAULT '',
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, necesidad_id)
);

ALTER TABLE public.necesidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to necesidades" ON public.necesidades FOR ALL USING (true) WITH CHECK (true);

-- Insert the 7 default needs
INSERT INTO public.necesidades (necesidad_id, titulo, descripcion, icono, progreso, area_referencia, orden) VALUES
  ('moto', 'Moto de Combustión', 'Libertad de movimiento con mi propia moto', '🏍️', 10, 'goals', 1),
  ('dinero', 'Dinero para Salir', 'Tener presupuesto para invitar y disfrutar', '💰', 5, 'finance', 2),
  ('novia', 'Novia que me guste', 'Relación de pareja con conexión genuina', '❤️', 0, 'vida-social', 3),
  ('amigos', 'Amigos y Experiencias', 'Salidas, hoteles y momentos inolvidables', '🎉', 5, 'vida-social', 4),
  ('intimidad', 'Sexo en todas las posiciones', 'Vida íntima plena y variada con mi pareja', '🔞', 0, 'vida-social', 5),
  ('boxeo', 'Fuerza y Boxeo', 'Estar fuerte, seguro y con skills de boxeo', '🥊', 15, 'gym', 6),
  ('exito', 'Éxito y Alineación', 'Sentirme realizado y alineado con mi propósito', '🧭', 25, 'vision', 7);
