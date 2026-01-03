-- Crear tabla de presets de rutina
CREATE TABLE public.routine_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  wake_time TIME NOT NULL,
  sleep_time TIME NOT NULL,
  sleep_hours NUMERIC,
  excluded_block_ids TEXT[] DEFAULT '{}',
  modified_blocks JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routine_presets ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for now, since app doesn't have auth)
CREATE POLICY "Allow all access to routine_presets" ON public.routine_presets FOR ALL USING (true) WITH CHECK (true);

-- Agregar campos a daily_plans para guardar preset usado
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS preset_id UUID REFERENCES public.routine_presets(id),
ADD COLUMN IF NOT EXISTS wake_time TIME,
ADD COLUMN IF NOT EXISTS sleep_time TIME,
ADD COLUMN IF NOT EXISTS excluded_blocks TEXT[] DEFAULT '{}';

-- Insertar presets predeterminados
INSERT INTO public.routine_presets (name, description, wake_time, sleep_time, sleep_hours, excluded_block_ids, icon, color, is_default)
VALUES 
  ('Rutina Completa', 'Día completo con idiomas matutinos y máxima productividad', '05:00', '21:00', 8, '{}', 'sun', 'blue', true),
  ('Sueño Extendido', 'Para días de mucho cansancio. Elimina idiomas de la mañana y bloque extra nocturno para maximizar sueño', '06:30', '21:00', 9.5, ARRAY['2', '18'], 'moon', 'purple', false),
  ('Emergencia Universitaria', 'Máximo tiempo de estudio. Activa bloque extra nocturno y convierte bloques dinámicos a universidad', '05:00', '23:00', 6, '{}', 'alert-triangle', 'red', false);