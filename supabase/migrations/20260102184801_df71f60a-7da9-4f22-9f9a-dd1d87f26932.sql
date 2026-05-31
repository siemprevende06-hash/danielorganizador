-- Create daily_reviews table for self-criticism/review
CREATE TABLE public.daily_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Objective metrics
  blocks_completed INTEGER DEFAULT 0,
  blocks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  habits_total INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  
  -- Block ratings (JSONB array)
  block_ratings JSONB DEFAULT '[]'::jsonb,
  
  -- Reflection
  what_went_well TEXT,
  what_could_be_better TEXT,
  tomorrow_plan TEXT,
  
  -- Overall rating 1-10
  overall_rating INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, review_date)
);

-- Enable RLS
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow all access to daily_reviews" 
ON public.daily_reviews 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_daily_reviews_updated_at
BEFORE UPDATE ON public.daily_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();