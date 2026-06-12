
-- =============================
-- FASE 3: routine_steps + daily completions (editable Activación/Desactivación/Alistamiento)
-- =============================
CREATE TABLE public.routine_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_type TEXT NOT NULL CHECK (routine_type IN ('activation','deactivation','morning_prep')),
  group_id TEXT,
  group_title TEXT,
  title TEXT NOT NULL,
  duration_min INT,
  sort_order INT NOT NULL DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_steps TO anon, authenticated;
GRANT ALL ON public.routine_steps TO service_role;
ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.routine_steps FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_routine_steps_updated BEFORE UPDATE ON public.routine_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.routine_steps_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.routine_steps(id) ON DELETE CASCADE,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, tracking_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_steps_daily TO anon, authenticated;
GRANT ALL ON public.routine_steps_daily TO service_role;
ALTER TABLE public.routine_steps_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.routine_steps_daily FOR ALL USING (true) WITH CHECK (true);

-- =============================
-- FASE 4: tarjetas portada de Mis Sistemas (Inicio)
-- =============================
CREATE TABLE public.system_card_covers (
  card_id TEXT PRIMARY KEY,
  cover_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_card_covers TO anon, authenticated;
GRANT ALL ON public.system_card_covers TO service_role;
ALTER TABLE public.system_card_covers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.system_card_covers FOR ALL USING (true) WITH CHECK (true);

-- =============================
-- FASE 5: Recetas + plan semanal + ingredientes
-- =============================
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  instructions TEXT,
  servings INT DEFAULT 1,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO anon, authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tg_recipes_updated BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_ingredients TO anon, authenticated;
GRANT ALL ON public.recipe_ingredients TO service_role;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.recipe_ingredients FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date DATE NOT NULL,
  meal_slot TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_date, meal_slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan TO anon, authenticated;
GRANT ALL ON public.meal_plan TO service_role;
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.meal_plan FOR ALL USING (true) WITH CHECK (true);

-- =============================
-- FASE 1: Seed pasos por defecto de Activación (para que página funcione sin estar vacía)
-- =============================
INSERT INTO public.routine_steps (routine_type, group_id, group_title, title, sort_order) VALUES
('activation','inicio','Inicio Energético','Poner audífonos y podcast o música',0),
('activation','inicio','Inicio Energético','Encender Entorno (Luces, TV, laptop, equipo)',1),
('activation','inicio','Inicio Energético','Abrir Notion en tablet y Notion Calendar',2),
('activation','inicio','Inicio Energético','Poner reloj en TV o móvil',3),
('activation','inicio','Inicio Energético','Tender Cama',4),
('activation','inicio','Inicio Energético','Recoger Cuarto y poner ropa de Gym sobre la cama',5),
('activation','salud','Salud y Nutrición','Orinar',6),
('activation','salud','Salud y Nutrición','Llenar pomo de agua y tomar un vaso',7),
('activation','salud','Salud y Nutrición','Tomar vitaminas y cucharada de miel',8),
('activation','salud','Salud y Nutrición','Sacar pozuelos y pomos',9),
('activation','energia','Energizadores','Ejercicio',10),
('activation','energia','Energizadores','Poner a hacer café',11),
('activation','energia','Energizadores','Ducha fría rápida',12),
('activation','plan','Planificación y Foco','Afirmaciones positivas',13),
('activation','plan','Planificación y Foco','Práctica de gratitud y Journaling',14),
('activation','plan','Planificación y Foco','Leer autocrítica del día anterior',15),
('activation','plan','Planificación y Foco','Leer metas y visualización',16),
('activation','plan','Planificación y Foco','Ver mi porqué y mi propósito',17),
('activation','plan','Planificación y Foco','Planificar el día si no está hecho',18),
('deactivation','noche','Cierre del día','Apagar pantallas y luces principales',0),
('deactivation','noche','Cierre del día','Preparar ropa del día siguiente',1),
('deactivation','noche','Cierre del día','Higiene nocturna (cepillado, skincare)',2),
('deactivation','noche','Cierre del día','Lectura ligera 10–15 min',3),
('deactivation','noche','Cierre del día','Journaling de cierre',4),
('deactivation','noche','Cierre del día','Respiración / meditación',5),
('morning_prep','desayuno','Desayuno','Servir agua y café',0),
('morning_prep','desayuno','Desayuno','Preparar avena/huevos',1),
('morning_prep','desayuno','Desayuno','Tomar suplementos',2),
('morning_prep','alistamiento','Alistamiento','Vestirme',3),
('morning_prep','alistamiento','Alistamiento','Revisar agenda del día',4),
('morning_prep','alistamiento','Alistamiento','Llevar mochila / materiales',5);
