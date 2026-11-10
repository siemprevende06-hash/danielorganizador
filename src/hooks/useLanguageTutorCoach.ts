import { useCallback, useEffect, useRef, useState } from 'react';
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/env';
import { getAIProvider } from '@/lib/aiProvider';
import type { Language } from './useLanguageLearning';

const FN_URL = edgeFunctionUrl('language-tutor');
const REQUEST_TIMEOUT_MS = 45000;

export interface TutorHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export type TutorFeedbackStatus = 'correcto' | 'incorrecto' | 'error';

export interface TutorFeedback {
  status: TutorFeedbackStatus;
  corrected: string;
  explanation: string;
  tip?: string;
  /** Explicación ampliada que llega al pulsar "Explicar más". */
  longExplanation?: string;
}

export interface TutorSuggestion {
  text: string;
  translation?: string;
  hint?: string;
  forAssistantId: string;
}

function clean(value: unknown, max = 1200): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function normalizeHistory(history: TutorHistoryEntry[]): TutorHistoryEntry[] {
  return history
    .filter(entry => (entry.role === 'user' || entry.role === 'assistant') && entry.content.trim())
    .slice(-8)
    .map(entry => ({ role: entry.role, content: entry.content.slice(0, 1000) }));
}

async function callCoach(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ ...payload, provider: getAIProvider() }),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        data && typeof data.error === 'string' && data.error
          ? data.error
          : `Error del tutor (${res.status})`;
      throw new Error(message);
    }
    if (!data || typeof data !== 'object') throw new Error('Respuesta vacía del tutor');
    return data as Record<string, unknown>;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error('El tutor tardó demasiado en responder');
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Evalúa lo que dice el estudiante y genera respuestas sugeridas.
 * Va separado del chat para que el tutor pueda seguir la conversación sin
 * corregir dentro del hilo: el feedback vive en su propia burbuja.
 */
export function useLanguageTutorCoach(language: Language, level: string) {
  const [feedback, setFeedback] = useState<Record<string, TutorFeedback>>({});
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<TutorSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const tokenRef = useRef(0);
  const explainTokenRef = useRef(0);
  const suggestTokenRef = useRef(0);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    explainTokenRef.current += 1;
    suggestTokenRef.current += 1;
    setFeedback({});
    setEvaluating({});
    setExplainingId(null);
    setSuggestion(null);
    setSuggestionLoading(false);
    setSuggestionError(null);
  }, []);

  useEffect(() => {
    reset();
  }, [language, reset]);

  const evaluate = useCallback(
    async (messageId: string, utterance: string, history: TutorHistoryEntry[]) => {
      const token = tokenRef.current;
      setEvaluating(prev => ({ ...prev, [messageId]: true }));

      try {
        const data = await callCoach({
          action: 'feedback',
          language,
          level,
          message: utterance,
          history: normalizeHistory(history),
        });
        if (token !== tokenRef.current) return;

        const rawStatus = clean(data.status, 30).toLowerCase();
        if (rawStatus.includes('no_aplica') || rawStatus.includes('no aplica')) {
          setFeedback(prev => {
            if (!prev[messageId]) return prev;
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
          return;
        }

        const status: TutorFeedbackStatus = rawStatus.includes('incorrect')
          ? 'incorrecto'
          : rawStatus.includes('correct')
            ? 'correcto'
            : 'error';

        if (status === 'error') {
          setFeedback(prev => ({
            ...prev,
            [messageId]: {
              status: 'error',
              corrected: '',
              explanation: 'No pude interpretar la evaluación. Inténtalo otra vez.',
            },
          }));
          return;
        }

        const corrected = clean(data.corrected, 500) || utterance;
        const explanation = clean(data.explanation, 900);
        const tip = clean(data.tip, 400);

        setFeedback(prev => ({
          ...prev,
          [messageId]: { status, corrected, explanation, tip: tip || undefined },
        }));
      } catch (e) {
        if (token !== tokenRef.current) return;
        setFeedback(prev => ({
          ...prev,
          [messageId]: {
            status: 'error',
            corrected: '',
            explanation: (e as Error).message || 'No pude revisar tu frase',
          },
        }));
      } finally {
        if (token === tokenRef.current) {
          setEvaluating(prev => {
            if (!prev[messageId]) return prev;
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
        }
      }
    },
    [language, level]
  );

  const explain = useCallback(
    async (messageId: string, utterance: string, current: TutorFeedback): Promise<string | null> => {
      const token = ++explainTokenRef.current;
      setExplainingId(messageId);
      try {
        const data = await callCoach({
          action: 'explain',
          language,
          level,
          message: utterance,
          corrected: current.corrected,
          explanation: current.longExplanation || current.explanation,
        });
        if (token !== explainTokenRef.current) return null;
        const text = clean(data.explanation, 1800);
        if (!text) throw new Error('El tutor no devolvió una explicación');
        setFeedback(prev =>
          prev[messageId]
            ? { ...prev, [messageId]: { ...prev[messageId], longExplanation: text } }
            : prev
        );
        return text;
      } catch {
        return null;
      } finally {
        if (token === explainTokenRef.current) setExplainingId(null);
      }
    },
    [language, level]
  );

  const suggest = useCallback(
    async (assistantId: string, assistantText: string, history: TutorHistoryEntry[]) => {
      const token = ++suggestTokenRef.current;
      setSuggestionLoading(true);
      setSuggestionError(null);
      try {
        const data = await callCoach({
          action: 'suggest',
          language,
          level,
          message: assistantText,
          history: normalizeHistory(history),
        });
        if (token !== suggestTokenRef.current) return;
        const text = clean(data.suggestion, 400);
        if (!text) throw new Error('El tutor no devolvió una sugerencia');
        setSuggestion({
          text,
          translation: clean(data.translation, 400) || undefined,
          hint: clean(data.hint, 300) || undefined,
          forAssistantId: assistantId,
        });
      } catch (e) {
        if (token !== suggestTokenRef.current) return;
        setSuggestionError((e as Error).message || 'No pude generar una sugerencia');
      } finally {
        if (token === suggestTokenRef.current) setSuggestionLoading(false);
      }
    },
    [language, level]
  );

  const clearSuggestion = useCallback(() => {
    suggestTokenRef.current += 1;
    setSuggestion(null);
    setSuggestionError(null);
    setSuggestionLoading(false);
  }, []);

  return {
    feedback,
    evaluating,
    explainingId,
    evaluate,
    explain,
    suggestion,
    suggestionLoading,
    suggestionError,
    suggest,
    clearSuggestion,
    reset,
  };
}
