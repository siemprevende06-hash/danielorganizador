-- Add stage column to goals table to classify goals into the destination journey:
-- 'sosten'   -> routines/habits, consistency until lifestyle
-- 'mejora'   -> cumulative improvement until comfort point
-- 'enfoque'  -> minimum tangible results
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS stage TEXT;

-- Backfill stage based on the life area
UPDATE public.goals
SET stage = CASE
  WHEN area_id IN ('mental','rutina-activacion','rutina-desactivacion','no-fap','ducha-fria','planificacion','apariencia') THEN 'sosten'
  WHEN area_id IN ('gym','idiomas','ajedrez','lectura','piano','guitarra') THEN 'mejora'
  ELSE 'enfoque'
END
WHERE stage IS NULL;

ALTER TABLE public.goals ALTER COLUMN stage SET DEFAULT 'enfoque';