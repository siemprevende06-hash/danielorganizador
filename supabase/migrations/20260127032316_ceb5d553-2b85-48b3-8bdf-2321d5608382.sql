-- 1. Tabla de seguimiento de alimentación
CREATE TABLE public.meal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RLS permisiva para meal_tracking
ALTER TABLE public.meal_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to meal_tracking" ON public.meal_tracking FOR ALL USING (true) WITH CHECK (true);

-- 3. Agregar routine_block_id a entrepreneurship_tasks
ALTER TABLE public.entrepreneurship_tasks ADD COLUMN IF NOT EXISTS routine_block_id TEXT;

-- 4. Agregar campos de gamificación a user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS rewards_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS punishments_balance INTEGER DEFAULT 0;