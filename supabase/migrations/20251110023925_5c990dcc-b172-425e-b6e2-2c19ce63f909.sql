-- Make user_id nullable in all tables since we removed authentication
ALTER TABLE public.tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.university_subjects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.daily_plans ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint on daily_plans since user_id is no longer required
ALTER TABLE public.daily_plans DROP CONSTRAINT IF EXISTS daily_plans_user_id_plan_date_key;

-- Add new unique constraint only on plan_date
ALTER TABLE public.daily_plans ADD CONSTRAINT daily_plans_plan_date_key UNIQUE (plan_date);