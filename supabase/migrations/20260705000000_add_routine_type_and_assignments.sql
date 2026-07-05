-- Add routine_type and block_assignments to daily_plans for planificador
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS routine_type TEXT,
ADD COLUMN IF NOT EXISTS block_assignments JSONB DEFAULT '{}'::jsonb;
