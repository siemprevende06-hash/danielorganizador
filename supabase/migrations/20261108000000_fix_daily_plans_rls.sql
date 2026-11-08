-- Fix "Guardar Plan" (Planificación Mañana).
--
-- La base tenía RLS activo en daily_plans pero sin una política que permitiera
-- INSERT, así que PostgREST rechazaba los planes nuevos con 42501
-- ("new row violates row-level security policy").
--
-- Esta migración restaura el acceso para la app single-user sin autenticación
-- (igual que el resto de tablas) y amplía el CHECK histórico de `mode` para
-- aceptar los tipos de rutina actuales. Es idempotente.

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to daily_plans" ON public.daily_plans;
CREATE POLICY "Allow all access to daily_plans"
  ON public.daily_plans
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_plans TO anon, authenticated;

ALTER TABLE public.daily_plan_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to daily_plan_tasks" ON public.daily_plan_tasks;
CREATE POLICY "Allow all access to daily_plan_tasks"
  ON public.daily_plan_tasks
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_plan_tasks TO anon, authenticated;

-- Las metas diarias se guardan junto con el plan; evita otro posible 42501.
ALTER TABLE public.daily_area_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to daily_area_stats" ON public.daily_area_stats;
CREATE POLICY "Allow all access to daily_area_stats"
  ON public.daily_area_stats
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_area_stats TO anon, authenticated;

-- `routine_type` guarda 'disciplina' | 'normal' | 'descanso'; `mode` conserva
-- el CHECK original. Se aceptan ambos vocabularios para que el INSERT no falle.
ALTER TABLE public.daily_plans DROP CONSTRAINT IF EXISTS daily_plans_mode_check;
ALTER TABLE public.daily_plans
  ADD CONSTRAINT daily_plans_mode_check
  CHECK (
    mode IN (
      'alto-rendimiento',
      'normal',
      'minimo-energia',
      'minimo-emergencia',
      'disciplina',
      'descanso'
    )
  );
