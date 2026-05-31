
CREATE TABLE public.identity_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  area_id TEXT NOT NULL,
  area_label TEXT NOT NULL,
  point_a TEXT NOT NULL DEFAULT '',
  point_b TEXT NOT NULL DEFAULT '',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(area_id)
);

ALTER TABLE public.identity_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to identity_plan"
ON public.identity_plan FOR ALL
USING (true) WITH CHECK (true);

CREATE TABLE public.challenge_90_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  title TEXT NOT NULL DEFAULT 'Reto de 90 Días',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_90_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to challenge_90_days"
ON public.challenge_90_days FOR ALL
USING (true) WITH CHECK (true);
