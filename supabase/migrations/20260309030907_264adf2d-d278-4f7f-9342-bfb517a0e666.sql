
-- Periodic reviews table for weekly, monthly, and quarterly self-assessments
CREATE TABLE public.periodic_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('weekly', 'monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Effort objectives (consistency-based)
  effort_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Result objectives (outcome-based)
  result_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Aggregated metrics
  overall_effort_score NUMERIC DEFAULT NULL,
  overall_result_score NUMERIC DEFAULT NULL,
  overall_rating INTEGER DEFAULT NULL CHECK (overall_rating >= 1 AND overall_rating <= 10),
  
  -- Reflections
  wins TEXT DEFAULT NULL,
  struggles TEXT DEFAULT NULL,
  lessons_learned TEXT DEFAULT NULL,
  next_period_focus TEXT DEFAULT NULL,
  
  -- Consistency data snapshot
  consistency_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, review_type, period_start)
);

-- Enable RLS
ALTER TABLE public.periodic_reviews ENABLE ROW LEVEL SECURITY;

-- Allow all access policy
CREATE POLICY "Allow all access to periodic_reviews"
  ON public.periodic_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);
