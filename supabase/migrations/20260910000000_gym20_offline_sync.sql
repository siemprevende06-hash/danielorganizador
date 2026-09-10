-- Almacenamiento del estado completo de Gym 2.0 como un único documento JSONB
-- por usuario. Permite sincronización bidireccional: guarda localmente mientras
-- estás offline y sube/descarga al reconectar.

CREATE TABLE IF NOT EXISTS public.gym20_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym20_data TO anon, authenticated;
GRANT ALL ON public.gym20_data TO service_role;

ALTER TABLE public.gym20_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on gym20_data" ON public.gym20_data;
CREATE POLICY "Allow all on gym20_data" ON public.gym20_data
  FOR ALL USING (true) WITH CHECK (true);