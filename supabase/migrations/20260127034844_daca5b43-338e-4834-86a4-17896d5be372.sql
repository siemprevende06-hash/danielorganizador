-- Create activity_tracking table for secondary activities
CREATE TABLE activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  bonus_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(activity_date, activity_type)
);

ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to activity_tracking" 
  ON activity_tracking FOR ALL 
  USING (true) WITH CHECK (true);

-- Create block_completions table for tracking block completion status
CREATE TABLE block_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  block_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(completion_date, block_id)
);