-- Deduplica sesiones de lectura duplicadas (p. ej. por pulsar "Guardar" varias
-- veces seguidas sin cambiar "Terminé en" en la zona de sesión de lectura del
-- Daily). Al ser pages_read una columna generada, cada fila duplicada inflaba el
-- total diario (pico de 43 páginas el 09/09/2026) y el progreso del libro.
-- Se conserva la sesión más antigua de cada grupo idéntico.
-- Idempotente: si no hay duplicados no cambia nada.

BEGIN;

-- 1) Sesiones a conservar: una por grupo (fecha, libro, minutos, inicio, fin, notas)
CREATE TEMP TABLE keep_reading_session AS
SELECT DISTINCT ON (
  session_date,
  coalesce(book_id::text, ''),
  minutes,
  coalesce(page_start, -1),
  coalesce(page_end, -1),
  coalesce(notes, '')
)
  id,
  created_at
FROM public.reading_sessions
ORDER BY
  session_date,
  coalesce(book_id::text, ''),
  minutes,
  coalesce(page_start, -1),
  coalesce(page_end, -1),
  coalesce(notes, ''),
  created_at ASC;

-- 2) Eliminar duplicados (todo lo que no esté en keep_reading_session)
DELETE FROM public.reading_sessions r
WHERE NOT EXISTS (
  SELECT 1 FROM keep_reading_session k WHERE k.id = r.id
);

DROP TABLE keep_reading_session;

-- 3) Reconstruir los totales diarios de "lectura" a partir de las sesiones limpias
UPDATE public.daily_area_stats d
SET time_spent_minutes = COALESCE(sub.minutes, NULL),
    pages_done = COALESCE(sub.pages, NULL)
FROM (
  SELECT session_date,
         SUM(minutes)::int AS minutes,
         SUM(pages_read)::int AS pages
  FROM public.reading_sessions
  GROUP BY session_date
) sub
WHERE d.area_id = 'lectura'
  AND d.stat_date = sub.session_date
  AND (
    d.time_spent_minutes IS DISTINCT FROM COALESCE(sub.minutes, NULL)
    OR d.pages_done IS DISTINCT FROM COALESCE(sub.pages, NULL)
  );

COMMIT;