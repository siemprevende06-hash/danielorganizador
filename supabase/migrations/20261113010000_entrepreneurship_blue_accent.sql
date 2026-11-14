-- Alinea el acento por defecto de emprendimientos con la paleta azul.
ALTER TABLE public.entrepreneurships
  ALTER COLUMN accent_color SET DEFAULT '#3b82f6';

UPDATE public.entrepreneurships
SET accent_color = '#3b82f6'
WHERE accent_color IS NULL
   OR lower(accent_color) IN ('#8b5cf6', '#7c3aed', '#6d28d9', '#a855f7');