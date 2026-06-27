ALTER TABLE public.twelve_week_goals
  ADD COLUMN month INTEGER CHECK (month >= 1 AND month <= 3);
