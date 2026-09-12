-- Check-in de energía/sueño del día (1 tap) en daily_reviews
ALTER TABLE public.daily_reviews
  ADD COLUMN IF NOT EXISTS energy_rating integer,
  ADD COLUMN IF NOT EXISTS sleep_rating integer,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric;