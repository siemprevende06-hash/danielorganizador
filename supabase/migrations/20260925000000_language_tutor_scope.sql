-- Tutor IA de idiomas: separa sus conversaciones de las del Coach IA
-- Valores de scope: 'coach' (Life Coach), 'tutor-english', 'tutor-italian'

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'coach';

CREATE INDEX IF NOT EXISTS idx_ai_conversations_scope
  ON public.ai_conversations (scope, updated_at DESC);
