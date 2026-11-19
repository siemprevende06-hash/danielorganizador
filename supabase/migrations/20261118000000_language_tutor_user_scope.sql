-- T1/T4 · Aísla el historial del Tutor IA por usuario.
--
-- Contexto: `ai_conversations`, `ai_messages` y `ai_memories` nacieron con
-- `GRANT` a `anon` y RLS `USING (true)`. Con la anon key (que viaja en el
-- bundle) cualquiera podía leer el historial completo. Esta migración añade
-- `user_id` con `DEFAULT auth.uid()` para que las filas nuevas queden selladas
-- sin tocar el código del cliente.
--
-- Importante: la app funciona también sin sesión de Supabase (modo preview).
-- En ese caso `auth.uid()` es NULL y las filas siguen visibles para no romper
-- el historial existente. Las filas nuevas de un usuario autenticado sí quedan
-- aisladas. Cuando se confirme que la app siempre corre con sesión, se puede
-- endurecer quitando las ramas `IS NULL` de las políticas.

-- 1. Columnas ---------------------------------------------------------------

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

ALTER TABLE public.ai_messages
  ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

ALTER TABLE public.ai_memories
  ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- 2. Backfill del propietario único ----------------------------------------
-- Solo actúa cuando el proyecto tiene exactamente un usuario: así el historial
-- anterior queda asignado sin riesgo de atribuirlo a la persona equivocada.
DO $$
DECLARE
  v_user UUID;
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM auth.users;
  IF v_count <> 1 THEN
    RETURN;
  END IF;

  SELECT id INTO v_user FROM auth.users LIMIT 1;

  UPDATE public.ai_conversations SET user_id = v_user WHERE user_id IS NULL;
  UPDATE public.ai_messages SET user_id = v_user WHERE user_id IS NULL;
  UPDATE public.ai_memories SET user_id = v_user WHERE user_id IS NULL;
END $$;

-- 3. Índices ---------------------------------------------------------------
-- `(scope, updated_at DESC)` ya existe. Estos cubren el filtro por dueño y
-- las consultas por rol dentro de una conversación.

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON public.ai_conversations (user_id, scope, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user
  ON public.ai_messages (user_id, conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_role
  ON public.ai_messages (conversation_id, role);

CREATE INDEX IF NOT EXISTS idx_ai_memories_user
  ON public.ai_memories (user_id, created_at DESC);

-- 4. RLS por usuario -------------------------------------------------------
-- Se sustituye el "Allow all" por una política que deja pasar lo del dueño y,
-- por compatibilidad, lo que no tiene dueño (historial previo / modo preview).

DROP POLICY IF EXISTS "Allow all on ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Allow all on ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Allow all on ai_memories" ON public.ai_memories;

-- Idempotente: si la migración se reaplica (o se aplicó a mano), no falla.
DROP POLICY IF EXISTS "Owner or legacy on ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Owner or legacy on ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Owner or legacy on ai_memories" ON public.ai_memories;

CREATE POLICY "Owner or legacy on ai_conversations"
  ON public.ai_conversations
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Owner or legacy on ai_messages"
  ON public.ai_messages
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Owner or legacy on ai_memories"
  ON public.ai_memories
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5. Comentarios -----------------------------------------------------------
-- Las métricas de Speaking (turnos, ppm, % correctas) siguen en el dispositivo
-- (`languages-speaking-sessions-v1`): son datos derivados y no merecen una
-- tabla ni una migración de datos. Los minutos canónicos ya viven en
-- `daily_systems_tracking`.

COMMENT ON COLUMN public.ai_conversations.user_id IS
  'Dueño del hilo. DEFAULT auth.uid(); NULL en filas heredadas o modo sin sesión.';
COMMENT ON COLUMN public.ai_messages.user_id IS
  'Dueño del mensaje. DEFAULT auth.uid(); NULL en filas heredadas o modo sin sesión.';
COMMENT ON COLUMN public.ai_memories.user_id IS
  'Dueño del recuerdo. DEFAULT auth.uid(); NULL en filas heredadas o modo sin sesión.';
