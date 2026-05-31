-- Create physical_goals table for transformation targets
CREATE TABLE public.physical_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  start_weight NUMERIC NOT NULL,
  target_weight NUMERIC NOT NULL,
  start_photo_url TEXT,
  target_photo_url TEXT,
  gym_days_target INTEGER DEFAULT 20,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create physical_tracking table for measurements history
CREATE TABLE public.physical_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  weight NUMERIC NOT NULL,
  body_fat_percentage NUMERIC,
  chest_cm NUMERIC,
  waist_cm NUMERIC,
  arm_cm NUMERIC,
  front_photo_url TEXT,
  side_photo_url TEXT,
  notes TEXT,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.physical_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for physical_goals (public access like other tables in project)
CREATE POLICY "Allow all access to physical_goals" ON public.physical_goals FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for physical_tracking
CREATE POLICY "Allow all access to physical_tracking" ON public.physical_tracking FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at on physical_goals
CREATE TRIGGER update_physical_goals_updated_at
BEFORE UPDATE ON public.physical_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();