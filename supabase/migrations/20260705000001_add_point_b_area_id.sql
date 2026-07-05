-- Add point_b_area_id column to point_b_metrics for mapping to POINT_B_AREAS
ALTER TABLE public.point_b_metrics ADD COLUMN IF NOT EXISTS point_b_area_id TEXT;

-- Backfill existing data based on area mapping
UPDATE public.point_b_metrics
SET point_b_area_id = CASE area
    WHEN 'universidad' THEN 'profesional'
    WHEN 'emprendimiento' THEN 'profesional'
    WHEN 'proyectos' THEN 'profesional'
    WHEN 'gym' THEN 'salud'
    WHEN 'idiomas' THEN 'desarrollo'
    WHEN 'musica' THEN 'desarrollo'
    WHEN 'lectura' THEN 'desarrollo'
    WHEN 'finanzas' THEN 'finanzas'
    WHEN 'apariencia' THEN 'apariencia'
    WHEN 'piano' THEN 'desarrollo'
    WHEN 'guitarra' THEN 'desarrollo'
    WHEN 'ajedrez' THEN 'ocio'
    ELSE area
END
WHERE point_b_area_id IS NULL;
