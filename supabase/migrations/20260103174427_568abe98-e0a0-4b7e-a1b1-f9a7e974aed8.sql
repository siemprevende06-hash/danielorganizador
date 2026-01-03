-- Tabla de configuración de idiomas del usuario
CREATE TABLE language_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  current_language TEXT NOT NULL DEFAULT 'english',
  english_level TEXT DEFAULT 'intermediate',
  italian_level TEXT DEFAULT 'beginner',
  preferred_resources JSONB DEFAULT '{}',
  ai_conversation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de sesiones de idiomas para tracking
CREATE TABLE language_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  language TEXT NOT NULL,
  block_type TEXT NOT NULL,
  vocabulary_completed BOOLEAN DEFAULT false,
  vocabulary_duration INTEGER DEFAULT 0,
  grammar_completed BOOLEAN DEFAULT false,
  grammar_duration INTEGER DEFAULT 0,
  speaking_completed BOOLEAN DEFAULT false,
  speaking_duration INTEGER DEFAULT 0,
  reading_completed BOOLEAN DEFAULT false,
  reading_duration INTEGER DEFAULT 0,
  listening_completed BOOLEAN DEFAULT false,
  listening_duration INTEGER DEFAULT 0,
  notes TEXT,
  total_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE language_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (sin auth por ahora)
CREATE POLICY "Allow all access to language_settings" ON language_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to language_sessions" ON language_sessions FOR ALL USING (true) WITH CHECK (true);

-- Índices para consultas eficientes
CREATE INDEX idx_language_sessions_date ON language_sessions(session_date);
CREATE INDEX idx_language_sessions_language ON language_sessions(language);

-- Insertar configuración por defecto
INSERT INTO language_settings (current_language, english_level, italian_level)
VALUES ('english', 'intermediate', 'beginner');