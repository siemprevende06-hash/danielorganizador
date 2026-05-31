-- Agregar campos para progreso por pilares en daily_reviews
ALTER TABLE daily_reviews
ADD COLUMN IF NOT EXISTS pillar_progress JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS secondary_goals_progress JSONB DEFAULT '[]'::jsonb;

-- Agregar meta de ajedrez a twelve_week_goals si no existe
INSERT INTO twelve_week_goals (title, description, category, quarter, year, status)
SELECT 'Jugar ajedrez diario', 'Jugar al menos 1 partida de ajedrez durante el almuerzo', 'ajedrez', 1, 2026, 'active'
WHERE NOT EXISTS (SELECT 1 FROM twelve_week_goals WHERE category = 'ajedrez');