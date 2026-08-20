-- Seed parte 2: metas faltantes del detalle de sueños de Daniel (14/08/2026)
-- Sostén: plan de idiomas semanal, bloques focus de idiomas, precondición del gym
-- Mejora: practicar música sin aprender, ajedrez sólido, ir al García Moré

WITH g AS (
  INSERT INTO public.goals (title, area_id, stage, daily_system, status, progress_percentage) VALUES
    ('Plan de idiomas: intercalar idiomas semanalmente', 'idiomas', 'sosten', 'Intercalar inglés/italiano por semana', 'active', 0),
    ('Crear espacios de idiomas en bloques focus planificados para avanzar más rápido', 'idiomas', 'sosten', 'Bloques focus dedicados a idiomas', 'active', 0),
    ('Empezar el gym solo después de organizar comidas, sueño y suplementación', 'gym', 'sosten', 'Precondición: comida y sueño organizados', 'active', 0),
    ('Practicar en el bloque de música sin aprender hasta dominar las 10 canciones (piano + guitarra)', 'piano', 'mejora', 'Día sí / día no entre piano y guitarra', 'active', 0),
    ('Jugar ajedrez de manera sólida sin cometer errores graves', 'ajedrez', 'mejora', 'Repasar cada partida y sus errores', 'active', 0),
    ('Empezar a ir al García Moré por el sol y salir de casa (tras completar las fuerzas)', 'gym', 'mejora', 'Tras lograr barras/planchas/paralelas/bíceps', 'active', 0)
  RETURNING id
)
INSERT INTO public.goal_tasks (goal_id, title)
SELECT g.id, t.title FROM g CROSS JOIN (VALUES
  ('Registrar el punto de partida actual'),
  ('Superar el objetivo en sesión real'),
  ('Confirmar el resultado')
) t(title)
WHERE (SELECT count(*) FROM g) > 0;