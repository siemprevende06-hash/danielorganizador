import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'english' | 'italian';
export type BlockType = 'morning' | 'afternoon';

export interface LanguageSubTask {
  id: string;
  name: string;
  icon: string;
  durationMinutes: number;
  description: string;
  completed: boolean;
  resource?: string;
}

export interface LanguageSettings {
  id: string;
  currentLanguage: Language;
  englishLevel: string;
  italianLevel: string;
  aiConversationEnabled: boolean;
}

export interface LanguageSession {
  id: string;
  sessionDate: string;
  language: Language;
  blockType: BlockType;
  vocabularyCompleted: boolean;
  grammarCompleted: boolean;
  speakingCompleted: boolean;
  readingCompleted: boolean;
  listeningCompleted: boolean;
  totalDuration: number;
}

// Sub-tareas para bloque de mañana (90 minutos)
const MORNING_SUBTASKS: Omit<LanguageSubTask, 'completed'>[] = [
  { id: 'vocabulary', name: 'Vocabulario', icon: '📚', durationMinutes: 10, description: 'Flashcards y palabras nuevas', resource: 'Anki / Quizlet' },
  { id: 'grammar', name: 'Escritura/Gramática', icon: '✍️', durationMinutes: 20, description: 'Ejercicios de gramática', resource: 'Duolingo' },
  { id: 'speaking', name: 'Habla con IA', icon: '🗣️', durationMinutes: 10, description: 'Conversación práctica con asistente', resource: 'ChatGPT / Claude' },
  { id: 'reading', name: 'Lectura', icon: '📖', durationMinutes: 20, description: 'Texto en el idioma seleccionado', resource: 'Artículos / Libros' },
  { id: 'listening', name: 'Escucha', icon: '🎧', durationMinutes: 30, description: 'Película/Video con subtítulos', resource: 'Netflix / YouTube' },
];

// Sub-tareas para bloque de tarde (30 minutos)
const AFTERNOON_SUBTASKS: Omit<LanguageSubTask, 'completed'>[] = [
  { id: 'vocabulary', name: 'Vocabulario', icon: '📚', durationMinutes: 5, description: 'Repaso rápido de palabras', resource: 'Anki / Quizlet' },
  { id: 'grammar', name: 'Escritura/Gramática', icon: '✍️', durationMinutes: 5, description: 'Ejercicios cortos', resource: 'Duolingo' },
  { id: 'speaking', name: 'Habla con IA', icon: '🗣️', durationMinutes: 5, description: 'Mini conversación práctica', resource: 'ChatGPT / Claude' },
  { id: 'reading', name: 'Lectura', icon: '📖', durationMinutes: 5, description: 'Lectura breve', resource: 'Artículos cortos' },
  { id: 'listening', name: 'Escucha', icon: '🎧', durationMinutes: 10, description: 'Video corto o canción', resource: 'YouTube' },
];

const mapRowToSession = (row: any): LanguageSession => ({
  id: row.id,
  sessionDate: row.session_date,
  language: row.language as Language,
  blockType: row.block_type as BlockType,
  vocabularyCompleted: row.vocabulary_completed ?? false,
  grammarCompleted: row.grammar_completed ?? false,
  speakingCompleted: row.speaking_completed ?? false,
  readingCompleted: row.reading_completed ?? false,
  listeningCompleted: row.listening_completed ?? false,
  totalDuration: row.total_duration ?? 0,
});

export const useLanguageLearning = () => {
  const [settings, setSettings] = useState<LanguageSettings | null>(null);
  const [todaySession, setTodaySession] = useState<LanguageSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async (): Promise<LanguageSettings | null> => {
    const { data, error } = await supabase
      .from('language_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      currentLanguage: data.current_language as Language,
      englishLevel: data.english_level || 'intermediate',
      italianLevel: data.italian_level || 'beginner',
      aiConversationEnabled: data.ai_conversation_enabled ?? true,
    };
  }, []);

  const loadTodaySession = useCallback(async (languageOverride?: Language) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const language = languageOverride ?? settings?.currentLanguage ?? 'english';

      const { data, error } = await supabase
        .from('language_sessions')
        .select('*')
        .eq('session_date', today)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setTodaySession(data ? mapRowToSession(data) : null);
    } catch (error) {
      console.error('Error loading today session:', error);
    }
  }, [settings?.currentLanguage]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const s = await fetchSettings();
        setSettings(s);
        await loadTodaySession(s?.currentLanguage ?? 'english');
      } catch (error) {
        console.error('Error loading language settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [fetchSettings, loadTodaySession]);

  const setLanguage = useCallback(async (language: Language) => {
    try {
      if (!settings) return;

      await supabase
        .from('language_settings')
        .update({ current_language: language, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      setSettings(prev => (prev ? { ...prev, currentLanguage: language } : null));
      await loadTodaySession(language);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [settings, loadTodaySession]);

  const getSubTasksForDuration = useCallback((durationMinutes: number): LanguageSubTask[] => {
    const baseSubtasks = durationMinutes >= 60 ? MORNING_SUBTASKS : AFTERNOON_SUBTASKS;

    return baseSubtasks.map(task => ({
      ...task,
      completed: todaySession ? (todaySession as any)[`${task.id}Completed`] ?? false : false,
    }));
  }, [todaySession]);

  const toggleSubTask = useCallback(async (taskId: string, blockType: BlockType) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const language = settings?.currentLanguage ?? 'english';
      const fieldName = `${taskId}_completed`;

      // Si la sesión cargada no coincide con el idioma actual, la tratamos como inexistente
      const hasCompatibleSession = todaySession && todaySession.language === language;
      const currentValue = hasCompatibleSession ? (todaySession as any)[`${taskId}Completed`] ?? false : false;

      if (hasCompatibleSession) {
        await supabase.from('language_sessions').update({ [fieldName]: !currentValue }).eq('id', todaySession!.id);
        setTodaySession(prev => (prev ? ({ ...prev, [`${taskId}Completed`]: !currentValue } as LanguageSession) : null));
        return;
      }

      const { data, error } = await supabase
        .from('language_sessions')
        .insert({
          session_date: today,
          language,
          block_type: blockType,
          [fieldName]: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setTodaySession(mapRowToSession(data));
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  }, [todaySession, settings?.currentLanguage]);

  const logPracticeMinutes = useCallback(async (taskId: string, minutes: number, blockType: BlockType) => {
    try {
      if (minutes <= 0) return;

      const today = new Date().toISOString().split('T')[0];
      const language = settings?.currentLanguage ?? 'english';

      // 1) Asegurar sesión (para el idioma actual)
      let sessionId: string | null = null;

      if (todaySession && todaySession.language === language) {
        sessionId = todaySession.id;
      } else {
        const { data: existing } = await supabase
          .from('language_sessions')
          .select('*')
          .eq('session_date', today)
          .eq('language', language)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          sessionId = existing.id;
        } else {
          const { data: created, error } = await supabase
            .from('language_sessions')
            .insert({ session_date: today, language, block_type: blockType })
            .select()
            .single();

          if (error) throw error;
          sessionId = created?.id ?? null;
        }
      }

      if (!sessionId) return;

      // 2) Incrementar duraciones
      const durationField = `${taskId}_duration`;
      const completedField = `${taskId}_completed`;

      const { data: currentRow } = await supabase
        .from('language_sessions')
        .select(`${durationField}, total_duration`)
        .eq('id', sessionId)
        .maybeSingle();

      const currentTask = (currentRow as any)?.[durationField] ?? 0;
      const currentTotal = (currentRow as any)?.total_duration ?? 0;

      await supabase
        .from('language_sessions')
        .update({
          [completedField]: true,
          [durationField]: currentTask + minutes,
          total_duration: currentTotal + minutes,
        })
        .eq('id', sessionId);

      await loadTodaySession(language);
    } catch (error) {
      console.error('Error logging practice minutes:', error);
    }
  }, [settings?.currentLanguage, todaySession, loadTodaySession]);

  const getProgress = useCallback(() => {
    if (!todaySession) return { completed: 0, total: 5, percentage: 0 };

    const completed = [
      todaySession.vocabularyCompleted,
      todaySession.grammarCompleted,
      todaySession.speakingCompleted,
      todaySession.readingCompleted,
      todaySession.listeningCompleted,
    ].filter(Boolean).length;

    return {
      completed,
      total: 5,
      percentage: Math.round((completed / 5) * 100),
    };
  }, [todaySession]);

  return {
    settings,
    todaySession,
    isLoading,
    currentLanguage: settings?.currentLanguage || 'english',
    setLanguage,
    getSubTasksForDuration,
    toggleSubTask,
    getProgress,
    loadTodaySession,
    logPracticeMinutes,
  };
};
