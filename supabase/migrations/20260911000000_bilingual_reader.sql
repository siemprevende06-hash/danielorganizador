-- Lector bilingüe: texto EN/ES interlinear para cada libro
ALTER TABLE public.reading_library
  ADD COLUMN IF NOT EXISTS bilingual_txt TEXT;

-- Posición de lectura (índice de par EN/ES) para reanudar en cualquier dispositivo
ALTER TABLE public.reading_library
  ADD COLUMN IF NOT EXISTS reading_pair_index INTEGER;

-- Vocabulario capturado desde la lectura
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  language TEXT NOT NULL DEFAULT 'english',
  word TEXT NOT NULL,
  translation TEXT,
  context_en TEXT,
  context_es TEXT,
  book_id UUID REFERENCES public.reading_library(id) ON DELETE SET NULL,
  book_title TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  review_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to user_vocabulary" ON public.user_vocabulary FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_user_vocabulary_updated_at BEFORE UPDATE ON public.user_vocabulary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_vocabulary_language ON public.user_vocabulary(language, status);