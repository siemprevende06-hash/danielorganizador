ALTER TABLE public.daily_systems_tracking
ADD COLUMN IF NOT EXISTS skipped jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS active_focus_areas jsonb DEFAULT '["universidad", "emprendimiento", "proyectos"]';
