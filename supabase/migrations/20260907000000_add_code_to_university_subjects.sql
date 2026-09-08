ALTER TABLE public.university_subjects ADD COLUMN IF NOT EXISTS code TEXT;

-- Backfill: el código se guardaba erróneamente en la columna color
UPDATE public.university_subjects SET code = color WHERE code IS NULL AND color IS NOT NULL;