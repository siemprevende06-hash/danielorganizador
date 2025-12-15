-- Drop the restrictive RLS policies on daily_plans
DROP POLICY IF EXISTS "Users can view their own daily plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can create their own daily plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can update their own daily plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can delete their own daily plans" ON public.daily_plans;

-- Drop the restrictive RLS policies on daily_plan_tasks
DROP POLICY IF EXISTS "Users can view their own daily plan tasks" ON public.daily_plan_tasks;
DROP POLICY IF EXISTS "Users can create their own daily plan tasks" ON public.daily_plan_tasks;
DROP POLICY IF EXISTS "Users can update their own daily plan tasks" ON public.daily_plan_tasks;
DROP POLICY IF EXISTS "Users can delete their own daily plan tasks" ON public.daily_plan_tasks;

-- Make user_id nullable for daily_plans since there's no authentication
ALTER TABLE public.daily_plans ALTER COLUMN user_id DROP NOT NULL;

-- Set default value for user_id to allow null inserts
ALTER TABLE public.daily_plans ALTER COLUMN user_id SET DEFAULT NULL;