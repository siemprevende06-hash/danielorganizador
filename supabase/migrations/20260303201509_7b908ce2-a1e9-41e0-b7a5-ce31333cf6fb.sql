
-- Create monthly_area_goals table
CREATE TABLE IF NOT EXISTS public.monthly_area_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  area_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NULL,
  month_start DATE NOT NULL,
  month_end DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_area_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to monthly_area_goals" ON public.monthly_area_goals FOR ALL USING (true) WITH CHECK (true);

-- Create app_settings table for global config
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
