import { useState, useEffect, useCallback } from 'react';
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

export const useLanguageLearning = () => {
  const [settings, setSettings] = useState<LanguageSettings | null>(null);
  const [todaySession, setTodaySession] = useState<LanguageSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración de idiomas
  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('language_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          currentLanguage: data.current_language as Language,
          englishLevel: data.english_level || 'intermediate',
          italianLevel: data.italian_level || 'beginner',
          aiConversationEnabled: data.ai_conversation_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  }, []);

  // Cargar sesión del día
  const loadTodaySession = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('language_sessions')
        .select('*')
        .eq('session_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodaySession({
          id: data.id,
          sessionDate: data.session_date,
          language: data.language as Language,
          blockType: data.block_type as BlockType,
          vocabularyCompleted: data.vocabulary_completed ?? false,
          grammarCompleted: data.grammar_completed ?? false,
          speakingCompleted: data.speaking_completed ?? false,
          readingCompleted: data.reading_completed ?? false,
          listeningCompleted: data.listening_completed ?? false,
          totalDuration: data.total_duration ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading today session:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadSettings(), loadTodaySession()]);
      setIsLoading(false);
    };
    init();
  }, [loadSettings, loadTodaySession]);

  // Cambiar idioma actual
  const setLanguage = useCallback(async (language: Language) => {
    try {
      if (settings) {
        await supabase
          .from('language_settings')
          .update({ current_language: language, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        
        setSettings(prev => prev ? { ...prev, currentLanguage: language } : null);
      }
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [settings]);

  // Obtener sub-tareas según duración del bloque
  const getSubTasksForDuration = useCallback((durationMinutes: number): LanguageSubTask[] => {
    const baseSubtasks = durationMinutes >= 60 ? MORNING_SUBTASKS : AFTERNOON_SUBTASKS;
    
    return baseSubtasks.map(task => ({
      ...task,
      completed: todaySession ? 
        (todaySession as any)[`${task.id}Completed`] ?? false : 
        false,
    }));
  }, [todaySession]);

  // Completar una sub-tarea
  const completeSubTask = useCallback(async (taskId: string, blockType: BlockType) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fieldName = `${taskId}_completed`;
      
      if (todaySession) {
        // Actualizar sesión existente
        await supabase
          .from('language_sessions')
          .update({ [fieldName]: true })
          .eq('id', todaySession.id);
        
        setTodaySession(prev => prev ? {
          ...prev,
          [`${taskId}Completed`]: true,
        } as LanguageSession : null);
      } else {
        // Crear nueva sesión
        const { data, error } = await supabase
          .from('language_sessions')
          .insert({
            session_date: today,
            language: settings?.currentLanguage || 'english',
            block_type: blockType,
            [fieldName]: true,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTodaySession({
            id: data.id,
            sessionDate: data.session_date,
            language: data.language as Language,
            blockType: data.block_type as BlockType,
            vocabularyCompleted: data.vocabulary_completed ?? false,
            grammarCompleted: data.grammar_completed ?? false,
            speakingCompleted: data.speaking_completed ?? false,
            readingCompleted: data.reading_completed ?? false,
            listeningCompleted: data.listening_completed ?? false,
            totalDuration: data.total_duration ?? 0,
          });
        }
      }
    } catch (error) {
      console.error('Error completing subtask:', error);
    }
  }, [todaySession, settings]);

  // Toggle sub-tarea (completar/descompletar)
  const toggleSubTask = useCallback(async (taskId: string, blockType: BlockType) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fieldName = `${taskId}_completed`;
      const currentValue = todaySession ? (todaySession as any)[`${taskId}Completed`] ?? false : false;
      
      if (todaySession) {
        await supabase
          .from('language_sessions')
          .update({ [fieldName]: !currentValue })
          .eq('id', todaySession.id);
        
        setTodaySession(prev => prev ? {
          ...prev,
          [`${taskId}Completed`]: !currentValue,
        } as LanguageSession : null);
      } else {
        const { data, error } = await supabase
          .from('language_sessions')
          .insert({
            session_date: today,
            language: settings?.currentLanguage || 'english',
            block_type: blockType,
            [fieldName]: true,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTodaySession({
            id: data.id,
            sessionDate: data.session_date,
            language: data.language as Language,
            blockType: data.block_type as BlockType,
            vocabularyCompleted: data.vocabulary_completed ?? false,
            grammarCompleted: data.grammar_completed ?? false,
            speakingCompleted: data.speaking_completed ?? false,
            readingCompleted: data.reading_completed ?? false,
            listeningCompleted: data.listening_completed ?? false,
            totalDuration: data.total_duration ?? 0,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  }, [todaySession, settings]);

  // Calcular progreso
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
    completeSubTask,
    toggleSubTask,
    getProgress,
    loadTodaySession,
  };
};
