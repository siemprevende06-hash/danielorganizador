-- ═══════════════════════════════════════════════════════════════════════════
-- Progreso de canciones: duración + 3 puntos de control por canción.
-- Aprendida (learned_at) · Dominada (mastered_at) · Videograbada (recorded_at).
-- Una canción con los 3 checks está completamente lista.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.music_repertoire
  add column if not exists duration_seconds integer,
  add column if not exists learned_at timestamptz,
  add column if not exists mastered_at timestamptz,
  add column if not exists recorded_at timestamptz;

-- Conservar canciones ya marcadas como dominadas (status='mastered').
update public.music_repertoire
  set mastered_at = coalesce(mastered_at, updated_at, now())
  where status = 'mastered' and mastered_at is null;