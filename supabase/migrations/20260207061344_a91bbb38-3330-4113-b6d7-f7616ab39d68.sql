-- Table for daily area goals, completion status, and streaks
CREATE TABLE public.daily_area_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  area_id TEXT NOT NULL,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Time tracking
  time_goal_minutes INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  -- Completion status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  -- For reading - pages
  pages_goal INTEGER DEFAULT 0,
  pages_done INTEGER DEFAULT 0,
  -- For exercises count
  exercises_goal INTEGER DEFAULT 0,
  exercises_done INTEGER DEFAULT 0,
  -- Notes/details
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint per area per day
  CONSTRAINT unique_daily_area UNIQUE (area_id, stat_date)
);

-- Enable RLS
ALTER TABLE public.daily_area_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own daily area stats"
ON public.daily_area_stats
FOR SELECT
USING (true);

CREATE POLICY "Users can create daily area stats"
ON public.daily_area_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update daily area stats"
ON public.daily_area_stats
FOR UPDATE
USING (true);

-- Table for area goals configuration (persistent settings)
CREATE TABLE public.area_goals_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  area_id TEXT NOT NULL UNIQUE,
  -- Default daily goals
  default_time_goal_minutes INTEGER DEFAULT 30,
  default_pages_goal INTEGER DEFAULT 0,
  default_exercises_goal INTEGER DEFAULT 0,
  -- Display preferences
  show_time_tracking BOOLEAN DEFAULT TRUE,
  show_pages_tracking BOOLEAN DEFAULT FALSE,
  show_exercises_tracking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.area_goals_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for config
CREATE POLICY "Users can view area goals config"
ON public.area_goals_config
FOR SELECT
USING (true);

CREATE POLICY "Users can create area goals config"
ON public.area_goals_config
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update area goals config"
ON public.area_goals_config
FOR UPDATE
USING (true);

-- Table for area streaks
CREATE TABLE public.area_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  area_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.area_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for streaks
CREATE POLICY "Users can view area streaks"
ON public.area_streaks
FOR SELECT
USING (true);

CREATE POLICY "Users can create area streaks"
ON public.area_streaks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update area streaks"
ON public.area_streaks
FOR UPDATE
USING (true);

-- Function to update streak when completing an area
CREATE OR REPLACE FUNCTION public.update_area_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  yesterday DATE;
BEGIN
  -- Only process if marking as completed
  IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
    yesterday := NEW.stat_date - INTERVAL '1 day';
    
    -- Get or create streak record
    SELECT * INTO streak_record 
    FROM public.area_streaks 
    WHERE area_id = NEW.area_id;
    
    IF NOT FOUND THEN
      -- Create new streak record
      INSERT INTO public.area_streaks (area_id, current_streak, longest_streak, last_completed_date)
      VALUES (NEW.area_id, 1, 1, NEW.stat_date);
    ELSE
      -- Update existing streak
      IF streak_record.last_completed_date = yesterday THEN
        -- Consecutive day - increment streak
        UPDATE public.area_streaks 
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_completed_date = NEW.stat_date,
            updated_at = now()
        WHERE area_id = NEW.area_id;
      ELSIF streak_record.last_completed_date < yesterday THEN
        -- Streak broken - reset to 1
        UPDATE public.area_streaks 
        SET current_streak = 1,
            last_completed_date = NEW.stat_date,
            updated_at = now()
        WHERE area_id = NEW.area_id;
      END IF;
      -- If same date, don't update streak
    END IF;
  -- Handle uncompleting
  ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    -- Check if this was the last completed date
    SELECT * INTO streak_record 
    FROM public.area_streaks 
    WHERE area_id = NEW.area_id;
    
    IF FOUND AND streak_record.last_completed_date = NEW.stat_date THEN
      UPDATE public.area_streaks 
      SET current_streak = GREATEST(0, current_streak - 1),
          updated_at = now()
      WHERE area_id = NEW.area_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for streak updates
CREATE TRIGGER update_streak_on_completion
AFTER INSERT OR UPDATE ON public.daily_area_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_area_streak();

-- Timestamp update trigger
CREATE TRIGGER update_daily_area_stats_updated_at
BEFORE UPDATE ON public.daily_area_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_area_goals_config_updated_at
BEFORE UPDATE ON public.area_goals_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_area_streaks_updated_at
BEFORE UPDATE ON public.area_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();