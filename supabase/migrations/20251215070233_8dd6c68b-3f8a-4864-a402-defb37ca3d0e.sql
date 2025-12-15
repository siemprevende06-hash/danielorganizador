-- Relax RLS for daily planning tables so plans can be saved without authentication

-- Ensure RLS is enabled (required for policies to take effect)
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations on daily_plans for the current anonymous setup
CREATE POLICY "Allow all access to daily_plans"
ON public.daily_plans
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow all operations on daily_plan_tasks for the current anonymous setup
CREATE POLICY "Allow all access to daily_plan_tasks"
ON public.daily_plan_tasks
FOR ALL
USING (true)
WITH CHECK (true);