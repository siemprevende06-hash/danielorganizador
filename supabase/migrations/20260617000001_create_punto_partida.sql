CREATE TABLE IF NOT EXISTS public.punto_partida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL,
  area_type TEXT NOT NULL CHECK (area_type IN ('wheel', 'hombre')),
  nota NUMERIC NOT NULL DEFAULT 0,
  sub_scores JSONB DEFAULT '{}',
  respuestas JSONB DEFAULT '{}',
  hechos JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);

ALTER TABLE public.punto_partida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own punto_partida"
  ON public.punto_partida FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own punto_partida"
  ON public.punto_partida FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own punto_partida"
  ON public.punto_partida FOR UPDATE
  USING (auth.uid() = user_id);
