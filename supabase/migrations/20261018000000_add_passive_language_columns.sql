-- Idioma pasivo (solo inglés): marcar por día si se avanzó en lectura/podcast,
-- televisión o videojuegos. Se guarda en language_sessions (language='english').
-- Idempotente.
ALTER TABLE public.language_sessions
  ADD COLUMN IF NOT EXISTS passive_reading_podcast_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS passive_tv_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS passive_videogames_completed BOOLEAN DEFAULT false;
