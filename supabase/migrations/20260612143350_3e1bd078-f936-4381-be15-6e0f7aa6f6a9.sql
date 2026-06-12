
-- sprint_objectives: code expects area, type, min_daily, max_daily
ALTER TABLE public.sprint_objectives ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.sprint_objectives ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.sprint_objectives ADD COLUMN IF NOT EXISTS min_daily NUMERIC;
ALTER TABLE public.sprint_objectives ADD COLUMN IF NOT EXISTS max_daily NUMERIC;
-- keep objective_type in sync (legacy)
UPDATE public.sprint_objectives SET type = objective_type WHERE type IS NULL;

-- point_b_metrics: code expects area + icon, numeric values
ALTER TABLE public.point_b_metrics ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.point_b_metrics ADD COLUMN IF NOT EXISTS icon TEXT;
UPDATE public.point_b_metrics SET area = area_id WHERE area IS NULL;

-- identity_systems: code expects description
ALTER TABLE public.identity_systems ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
