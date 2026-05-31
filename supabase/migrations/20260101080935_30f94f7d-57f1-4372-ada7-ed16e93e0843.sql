-- Create twelve_week_goals table
CREATE TABLE public.twelve_week_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  year INTEGER NOT NULL DEFAULT 2026,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_value TEXT,
  current_value TEXT,
  progress_percentage INTEGER DEFAULT 0,
  weekly_actions JSONB DEFAULT '[]'::jsonb,
  connected_blocks TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_plans table
CREATE TABLE public.weekly_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  year INTEGER NOT NULL DEFAULT 2026,
  goal_id UUID REFERENCES public.twelve_week_goals(id) ON DELETE CASCADE,
  daily_tasks JSONB DEFAULT '{}'::jsonb,
  completion_status JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.twelve_week_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for twelve_week_goals (allow all for now since no auth)
CREATE POLICY "Allow all access to twelve_week_goals" ON public.twelve_week_goals FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for weekly_plans
CREATE POLICY "Allow all access to weekly_plans" ON public.weekly_plans FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_twelve_week_goals_updated_at
  BEFORE UPDATE ON public.twelve_week_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_plans_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();