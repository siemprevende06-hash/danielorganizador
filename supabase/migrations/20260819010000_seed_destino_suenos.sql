-- Seed: los sueños de Daniel (14/08/2026) como metas del Destino a Llegar,
-- clasificadas por etapa: sosten (hábitos), mejora (acumulativa), enfoque (resultados mínimos)

-- ══════════════ SOSTÉN — rutinas y hábitos ══════════════
WITH g AS (
  INSERT INTO public.goals (title, area_id, stage, daily_system, status, progress_percentage) VALUES
    ('Asistencia al gym Lunes-Miércoles-Viernes en su horario', 'gym', 'sosten', 'L, M, V en el horario fijo', 'active', 0),
    ('Hábito de piano consolidado en su horario con máximos y mínimos', 'piano', 'sosten', 'Día sí / día no, con máximos y mínimos de tiempo', 'active', 0),
    ('Hábito de guitarra consolidado en su horario con máximos y mínimos', 'guitarra', 'sosten', 'Día sí / día no, con máximos y mínimos de tiempo', 'active', 0),
    ('Intercalar piano y guitarra un día sí y un día no', 'piano', 'sosten', 'Alternar instrumentos cada día', 'active', 0),
    ('Hábito de lectura diario consolidado', 'lectura', 'sosten', 'Bloque fijo de lectura diaria', 'active', 0),
    ('Hábito de ajedrez diario consolidado', 'ajedrez', 'sosten', 'Bloque fijo de ajedrez diario', 'active', 0),
    ('Bloque sagrado de 30 minutos para idiomas y respetarlo', 'idiomas', 'sosten', '30 minutos sagrados de idiomas', 'active', 0),
    ('Estar apuntado en la escuela de inglés', 'idiomas', 'sosten', 'Matricular y asistir a la escuela', 'active', 0),
    ('Hábito diario de estudio universitario consolidado', 'universidad', 'sosten', 'Bloque fijo de estudio diario', 'active', 0),
    ('Respetar la planificación y los no negociables del Sostén con buenas estadísticas', 'mental', 'sosten', 'Respetar no negociables salvo fuerza mayor + control de alimentación', 'active', 0)
  RETURNING id
)
INSERT INTO public.goal_tasks (goal_id, title)
SELECT g.id, t.title FROM g CROSS JOIN (VALUES
  ('Definir horario exacto'),
  ('Cumplirlo 7 días seguidos')
) t(title)
WHERE (SELECT count(*) FROM g) > 0;

-- ══════════════ MEJORA ACUMULATIVA — crecer hasta el punto de comodidad ══════════════
WITH g AS (
  INSERT INTO public.goals (title, area_id, stage, daily_system, status, progress_percentage) VALUES
    ('Tocar 10 canciones de piano a la perfección con video', 'piano', 'mejora', 'Práctica día sí / día no hasta masterizar', 'active', 0),
    ('Tocar 10 canciones de guitarra a la perfección con video', 'guitarra', 'mejora', 'Práctica día sí / día no hasta masterizar', 'active', 0),
    ('Leer solo libros en inglés y entenderlos al 95%', 'lectura', 'mejora', 'Lectura diaria en inglés', 'active', 0),
    ('Llegar a 65 libros enfocado en finanzas, psicología y desarrollo personal', 'lectura', 'mejora', 'Lectura semanal constante', 'active', 0),
    ('Tener mis libros organizados con estadísticas en mi biblioteca personal', 'lectura', 'mejora', 'Registrar cada libro en la biblioteca', 'active', 0),
    ('Llegar a 800 de ELO en ajedrez y jugar sólido sin errores graves', 'ajedrez', 'mejora', 'Ajedrez diario con repaso de errores', 'active', 0),
    ('Base de conocimiento de game construida con el hábito diario', 'mental', 'mejora', 'Estudio diario de game', 'active', 0),
    ('Seleccionar consejos de game y aplicarlos de forma masiva', 'mental', 'mejora', 'Aplicar consejos en interacciones reales', 'active', 0),
    ('Tener la valentía de invitar sin esperar nada a cambio, solo para pasarla bien', 'mental', 'mejora', 'Hacer invitaciones sin expectativas', 'active', 0),
    ('Inglés: sentir que aumenté mi vocabulario a B2 y soltarme en escritura y speak', 'idiomas', 'mejora', 'Práctica diaria de inglés escrita y hablada', 'active', 0),
    ('Italiano: frases sencillas y base de 500 palabras de vocabulario', 'idiomas', 'mejora', 'Bloque semanal de italiano', 'active', 0),
    ('Barras: 3 tandas 12, 11, 10', 'gym', 'mejora', 'Progresar tandas en entrenamiento', 'active', 0),
    ('Planchas: 3 tandas 35, 33, 30', 'gym', 'mejora', 'Progresar tandas en entrenamiento', 'active', 0),
    ('Paralelas: 3 tandas 20, 18, 15', 'gym', 'mejora', 'Progresar tandas en entrenamiento', 'active', 0),
    ('Bíceps: 3 tandas 25, 22, 20', 'gym', 'mejora', 'Progresar tandas en entrenamiento', 'active', 0),
    ('Completar 3 series de fuerza sin problemas', 'gym', 'mejora', 'Completar todas las series en cada entreno', 'active', 0),
    ('Organización completa del entrenamiento en la app', 'gym', 'mejora', 'Registrar cada entrenamiento en la app', 'active', 0)
  RETURNING id
)
INSERT INTO public.goal_tasks (goal_id, title)
SELECT g.id, t.title FROM g CROSS JOIN (VALUES
  ('Registrar el punto de partida actual'),
  ('Superar el objetivo en sesión real'),
  ('Grabar video como evidencia')
) t(title)
WHERE (SELECT count(*) FROM g) > 0;

-- ══════════════ ENFOQUE — resultados mínimos tangibles ══════════════
WITH g AS (
  INSERT INTO public.goals (title, area_id, stage, daily_system, status, progress_percentage) VALUES
    ('Pasar a 4to año de universidad sin problemas', 'universidad', 'enfoque', 'Estudio diario + exámenes al día', 'active', 0),
    ('Aprobar F2', 'universidad', 'enfoque', 'Preparación de exámenes', 'active', 0),
    ('Aprobar MP1', 'universidad', 'enfoque', 'Preparación de exámenes', 'active', 0),
    ('Verificar que todo esté correcto en Sigenu (notas)', 'universidad', 'enfoque', 'Revisar Sigenu periódicamente', 'active', 0),
    ('Registrar Autec y empezar mi empresa poco a poco', 'emprendimiento', 'enfoque', 'Avanza 1 paso legal de Autec por semana', 'active', 0),
    ('Realizar el plan para Autec', 'emprendimiento', 'enfoque', 'Documentar y ejecutar el plan', 'active', 0),
    ('Mejorar Siemprevende delegando carga a la IA y llegar a la Play Store', 'emprendimiento', 'enfoque', 'Mejorar la app con IA', 'active', 0),
    ('App de restaurante: conseguir clientes y mejorarla con comida 3D', 'emprendimiento', 'enfoque', 'Conseguir clientes y mejorar con su feedback', 'active', 0),
    ('Proyecto de supervisión de cámaras para empresas industriales y mercados', 'emprendimiento', 'enfoque', 'Desarrollar y probar el prototipo', 'active', 0),
    ('Entrar al mundo offline/hardware y crear equipos para la realidad de Cuba', 'emprendimiento', 'enfoque', 'Investigar y armar el primer equipo', 'active', 0),
    ('Formar y liderar un equipo de trabajadores que hagan crecer Autec', 'emprendimiento', 'enfoque', 'Reclutar y liderar al equipo', 'active', 0),
    ('Buscar el pasaporte', 'proyectos', 'enfoque', 'Gestionar turnos y trámites', 'active', 0),
    ('Terminar la app de organización', 'proyectos', 'enfoque', 'Completar módulos pendientes', 'active', 0),
    ('Sacar la licencia de moto', 'proyectos', 'enfoque', 'Preparación y trámite', 'active', 0),
    ('Montar panel solar y crear sistema de respaldo de energía en la casa', 'proyectos', 'enfoque', 'Instalar y probar el sistema', 'active', 0),
    ('Crear sistema de organización inviolable para que la casa siempre esté ordenada', 'proyectos', 'enfoque', 'Definir y aplicar el sistema', 'active', 0),
    ('Condiciones de agua: tanque, motor (con y sin corriente), cisterna y bidones de reserva', 'proyectos', 'enfoque', 'Completar la infraestructura de agua', 'active', 0),
    ('Terminar el garaje: techo, reborde de tejas, espacios y luces con EcoFlow', 'proyectos', 'enfoque', 'Completar obra del garaje', 'active', 0),
    ('Condiciones mínimas para el carro: virado y capucha', 'proyectos', 'enfoque', 'Arreglar y dejar el carro operativo', 'active', 0),
    ('Tener un ingreso mensual', 'finanzas', 'enfoque', 'Activar una fuente de ingreso estable', 'active', 0),
    ('Tener dinero para salir', 'finanzas', 'enfoque', 'Presupuesto de ocio mensual', 'active', 0),
    ('Tener dinero para invitar', 'finanzas', 'enfoque', 'Presupuesto para invitar', 'active', 0),
    ('Tener mis finanzas organizadas', 'finanzas', 'enfoque', 'Registrar ingresos y gastos en la app', 'active', 0)
  RETURNING id
)
INSERT INTO public.goal_tasks (goal_id, title)
SELECT g.id, t.title FROM g CROSS JOIN (VALUES
  ('Definir el primer paso concreto'),
  ('Ejecutarlo'),
  ('Confirmar el resultado')
) t(title)
WHERE (SELECT count(*) FROM g) > 0;