-- Create table for monthly area goals
CREATE TABLE IF NOT EXISTS public.monthly_area_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL NOT NULL DEFAULT 0,
  current_value DECIMAL NOT NULL DEFAULT 0,
  unit TEXT, -- e.g., 'horas', 'páginas', 'ejercicios', etc.
  month_start DATE NOT NULL,
  month_end DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_monthly_area_goals_user_area ON public.monthly_area_goals(user_id, area_id);
CREATE INDEX idx_monthly_area_goals_month ON public.monthly_area_goals(month_start, month_end);

-- Enable Row Level Security
ALTER TABLE public.monthly_area_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own monthly area goals"
  ON public.monthly_area_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly area goals"
  ON public.monthly_area_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly area goals"
  ON public.monthly_area_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly area goals"
  ON public.monthly_area_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_area_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_monthly_area_goals_updated_at
  BEFORE UPDATE ON public.monthly_area_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_area_goals_updated_at();

-- Function to auto-mark as completed when target is reached
CREATE OR REPLACE FUNCTION check_monthly_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_value >= NEW.target_value AND NEW.completed = FALSE THEN
    NEW.completed = TRUE;
    NEW.completed_at = now();
  ELSIF NEW.current_value < NEW.target_value AND NEW.completed = TRUE THEN
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check completion
CREATE TRIGGER check_monthly_goal_completion_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_area_goals
  FOR EACH ROW
  EXECUTE FUNCTION check_monthly_goal_completion();
