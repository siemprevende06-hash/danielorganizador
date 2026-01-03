-- Add new columns to routine_blocks for the new routine structure
ALTER TABLE routine_blocks 
ADD COLUMN IF NOT EXISTS block_type TEXT DEFAULT 'fijo',
ADD COLUMN IF NOT EXISTS default_focus TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS current_focus TEXT,
ADD COLUMN IF NOT EXISTS can_subdivide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sub_blocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Delete existing blocks to replace with new structure
DELETE FROM routine_blocks;

-- Insert the 18 new routine blocks
INSERT INTO routine_blocks (block_id, title, start_time, end_time, tasks, order_index, block_type, default_focus, can_subdivide, emergency_only, notes) VALUES
('1', 'Rutina Activación', '05:00', '05:30', '["Despertar consciente", "Hidratación", "Estiramientos", "Afirmaciones", "Visualización"]'::jsonb, 1, 'fijo', 'none', false, false, NULL),
('2', 'Idiomas + Lectura', '05:30', '07:00', '["Duolingo 25 min", "Práctica vocabulario 25 min", "Lectura diaria 20 min", "Repaso frases 20 min"]'::jsonb, 2, 'dinamico', 'none', true, false, 'Puede moverse a 19:00-19:30 si se necesita tiempo de estudio'),
('3', 'Gym', '07:00', '08:00', '["Calentamiento 10 min", "Entrenamiento principal 40 min", "Estiramientos 10 min"]'::jsonb, 3, 'fijo', 'none', false, false, NULL),
('4', 'Alistamiento + Desayuno', '08:00', '08:30', '["Ducha", "Vestirse", "Desayuno nutritivo"]'::jsonb, 4, 'fijo', 'none', false, false, NULL),
('5', 'Viaje CUJAE + Podcast', '08:30', '09:00', '["Podcast educativo/motivacional"]'::jsonb, 5, 'fijo', 'none', false, false, NULL),
('6', '1er Deep Work', '09:00', '10:30', '["Tarea más importante del día"]'::jsonb, 6, 'configurable', 'universidad', true, false, NULL),
('7', '2do Deep Work', '10:30', '12:00', '["Segunda prioridad"]'::jsonb, 7, 'configurable', 'universidad', true, false, NULL),
('8', '3er Deep Work', '12:00', '13:30', '["Trabajo concentrado"]'::jsonb, 8, 'configurable', 'universidad', true, false, NULL),
('9', 'Almuerzo + Ajedrez', '13:30', '14:00', '["Almuerzo nutritivo", "Partida de ajedrez", "Descanso mental"]'::jsonb, 9, 'fijo', 'none', false, false, NULL),
('10', '4to Deep Work', '14:00', '15:30', '["Continuación de trabajo"]'::jsonb, 10, 'configurable', 'universidad', true, false, NULL),
('11', '5to Deep Work', '15:30', '16:50', '["Finalizar tareas del día"]'::jsonb, 11, 'configurable', 'universidad', true, false, NULL),
('12', 'Viaje Casa + Podcast', '16:50', '17:10', '["Podcast/Audiobook"]'::jsonb, 12, 'fijo', 'none', false, false, NULL),
('13', 'Rutina Llegada + Descanso', '17:10', '17:30', '["Refrescarse", "Cambio de ropa", "Hidratación", "Breve descanso"]'::jsonb, 13, 'fijo', 'none', false, false, NULL),
('14', 'Focus', '17:30', '19:00', '["Emprendimiento o Proyectos personales"]'::jsonb, 14, 'dinamico', 'emprendimiento', true, false, 'Usar para emergencia universitaria si es necesario'),
('15', 'Ocio', '19:00', '20:00', '["Entretenimiento", "Comida (19:30-20:00)", "O Idiomas (19:00-19:30) si se movió de la mañana"]'::jsonb, 15, 'fijo', 'none', true, false, '30 min pueden ser Idiomas si se necesitó el bloque matutino'),
('16', 'Piano o Guitarra', '20:00', '20:30', '["Práctica de instrumento musical"]'::jsonb, 16, 'fijo', 'none', false, false, NULL),
('17', 'Rutina Desactivación', '20:30', '21:00', '["Skincare", "Preparar mañana", "Reflexión del día", "Lectura ligera"]'::jsonb, 17, 'fijo', 'none', false, false, NULL),
('18', 'Bloque Extra', '21:00', '23:00', '["SOLO SI ES ESTRICTAMENTE NECESARIO"]'::jsonb, 18, 'evitar', 'universidad', true, true, 'EVITAR - Reduce sueño de 8h a 6h. Solo para emergencias universitarias.');