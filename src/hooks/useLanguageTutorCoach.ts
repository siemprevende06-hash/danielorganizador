import { useCallback, useEffect, useRef, useState } from 'react';
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/env';
import { getAIProvider } from '@/lib/aiProvider';
import { hashTexto } from '@/lib/speakingMetrics';
import type { Language } from './useLanguageLearning';
import type { SpeakingStructure } from '@/components/languages/speakingStructures';

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

export interface StructureReviewStep {
  /** Orden del paso dentro de la estructura (0-based). */
  index?: number;
  label: string;
  ok: boolean;
  note?: string;
}

export interface StructureReview {
  covered: StructureReviewStep[];
  verdict: string;
  missing: string[];
}

/** Mensaje ya guardado, con su corrección y revisión (B8). */
export interface PersistedCoachMessage {
  id: string;
  feedback?: TutorFeedback | null;
  structureReview?: StructureReview | null;
}

export interface EvaluateOptions {
  structure?: SpeakingStructure | null;
  /** Permite al panel guardar el resultado en `ai_messages.visual`. */
  onPersist?: (meta: { feedback?: TutorFeedback; structureReview?: StructureReview }) => void;
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

/** Convierte la estructura local al formato compacto que espera la función. */
function structurePayload(structure: SpeakingStructure, language: Language) {
  return {
    id: structure.id,
    question: structure.question[language],
    steps: structure.steps.map((step, index) => ({
      index,
      label: step.label,
      template: step.template[language],
    })),
  };
}

/** Forma cruda de un paso de revisión tal como lo devuelve el modelo. */
interface RawReviewStep {
  index?: unknown;
  step?: unknown;
  stepIndex?: unknown;
  label?: unknown;
  ok?: unknown;
  note?: unknown;
}

function parseReview(raw: Record<string, unknown>): StructureReview | null {
  const source = (raw.review ?? raw) as Record<string, unknown>;
  const rawSteps = Array.isArray(source?.covered) ? (source.covered as RawReviewStep[]) : [];
  const covered = rawSteps
    .map((c, position) => {
      const index = Number(c?.index ?? c?.step ?? c?.stepIndex);
      return {
        index: Number.isFinite(index) ? index : position,
        label: clean(c?.label, 80),
        ok: c?.ok === true,
        note: clean(c?.note, 240) || undefined,
      };
    })
    .filter(c => c.label)
    .slice(0, 8);
  const verdict = clean(source?.verdict, 500);
  const rawMissing = Array.isArray(source?.missing) ? (source.missing as unknown[]) : [];
  const missing = rawMissing
    .map(m => clean(m, 160))
    .filter(Boolean)
    .slice(0, 6);
  if (!covered.length && !verdict) return null;
  return { covered, verdict, missing };
}

/**
 * Evalúa lo que dice el estudiante y genera respuestas sugeridas.
 * Va separado del chat para que el tutor pueda seguir la conversación sin
 * corregir dentro del hilo: el feedback vive en su propia burbuja.
 *
 * T2: feedback + revisión de estructura se piden en una sola llamada.
 * T6: cada acción deja su latencia en consola para detectar proveedores lentos.
 */
export function useLanguageTutorCoach(language: Language, level: string) {
  const [feedback, setFeedback] = useState<Record<string, TutorFeedback>>({});
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<TutorSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [structureReviews, setStructureReviews] = useState<Record<string, StructureReview>>({});
  const [structureReviewing, setStructureReviewing] = useState<Record<string, boolean>>({});
  const [structureReviewErrors, setStructureReviewErrors] = useState<Record<string, string>>({});
  const tokenRef = useRef(0);
  const explainTokenRef = useRef(0);
  const suggestTokenRef = useRef(0);
  const structureTokenRef = useRef(0);
  const reviewTokenRef = useRef(0);
  /** Cache por hash de texto + estructura: la misma frase no se evalúa dos veces. */
  const cacheRef = useRef<Map<string, { feedback: TutorFeedback; review: StructureReview | null }>>(new Map());

  const reset = useCallback(() => {
    tokenRef.current += 1;
    explainTokenRef.current += 1;
    suggestTokenRef.current += 1;
    structureTokenRef.current += 1;
    reviewTokenRef.current += 1;
    setFeedback({});
    setEvaluating({});
    setExplainingId(null);
    setSuggestion(null);
    setSuggestionLoading(false);
    setSuggestionError(null);
    setStructureLoading(false);
    setStructureError(null);
    setStructureReviews({});
    setStructureReviewing({});
    setStructureReviewErrors({});
  }, []);

  useEffect(() => {
    reset();
  }, [language, reset]);

  /** Rehidrata correcciones guardadas al abrir un hilo (B8). */
  const hydrate = useCallback((items: PersistedCoachMessage[]) => {
    if (!items.length) return;
    setFeedback(prev => {
      const next = { ...prev };
      for (const item of items) {
        if (item.feedback) next[item.id] = item.feedback;
      }
      return next;
    });
    setStructureReviews(prev => {
      const next = { ...prev };
      for (const item of items) {
        if (item.structureReview) next[item.id] = item.structureReview;
      }
      return next;
    });
  }, []);

  const evaluate = useCallback(
    async (
      messageId: string,
      utterance: string,
      history: TutorHistoryEntry[],
      options?: EvaluateOptions
    ) => {
      const token = tokenRef.current;
      const structure = options?.structure ?? null;
      const cacheKey = `${language}|${level}|${hashTexto(utterance)}|${
        structure ? `${structure.id}:${structure.steps.map(step => step.label).join('|')}` : 'sin-estructura'
      }`;

      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setFeedback(prev => ({ ...prev, [messageId]: cached.feedback }));
        if (cached.review) setStructureReviews(prev => ({ ...prev, [messageId]: cached.review as StructureReview }));
        options?.onPersist?.({
          feedback: cached.feedback,
          structureReview: cached.review ?? undefined,
        });
        return;
      }

      setEvaluating(prev => ({ ...prev, [messageId]: true }));

      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const data = await callCoach({
          action: 'feedback',
          language,
          level,
          message: utterance,
          history: normalizeHistory(history),
          ...(structure ? { structure: structurePayload(structure, language) } : {}),
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
        const result: TutorFeedback = { status, corrected, explanation, tip: tip || undefined };
        const review = structure ? parseReview(data) : null;

        setFeedback(prev => ({ ...prev, [messageId]: result }));
        if (review) setStructureReviews(prev => ({ ...prev, [messageId]: review }));

        cacheRef.current.set(cacheKey, { feedback: result, review });
        if (cacheRef.current.size > 120) {
          const first = cacheRef.current.keys().next().value;
          if (first) cacheRef.current.delete(first);
        }
        options?.onPersist?.({ feedback: result, structureReview: review ?? undefined });

        if (typeof console !== 'undefined') {
          const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started);
          console.debug(`[language-tutor] feedback ${ms} ms${structure ? ' + estructura' : ''}`);
        }
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

  /** Genera una estructura personalizada para una pregunta concreta. */
  const generateStructure = useCallback(
    async (question: string): Promise<SpeakingStructure | null> => {
      const limpio = question.trim();
      if (!limpio) return null;
      const token = ++structureTokenRef.current;
      setStructureLoading(true);
      setStructureError(null);
      try {
        const data = await callCoach({
          action: 'structure',
          language,
          level,
          message: limpio,
        });
        if (token !== structureTokenRef.current) return null;

        const raw = (data.structure ?? {}) as Record<string, unknown>;
        const rawSteps = (Array.isArray(raw.steps) ? raw.steps : [])
          .map((s: any) => ({
            label: clean(s?.label, 80),
            template: clean(s?.template, 300),
            tip: clean(s?.tip, 240),
          }))
          .filter((s: any) => s.label && s.template)
          .slice(0, 5);
        if (rawSteps.length < 2) throw new Error('La estructura no llegó completa');

        const steps = rawSteps.map(step => ({
          label: step.label,
          template:
            language === 'italian'
              ? { english: '', italian: step.template }
              : { english: step.template, italian: '' },
          tip: step.tip,
        }));

        const targetQuestion = clean(raw.question, 300) || limpio;
        const questionEs = clean(raw.questionEs, 300) || limpio;
        const phrases = (Array.isArray(raw.phrases) ? raw.phrases : [])
          .map((p: any) => clean(p, 160))
          .filter(Boolean)
          .slice(0, 6);
        const example = clean(raw.example, 1200);
        const exampleEs = clean(raw.exampleEs, 1200);

        return {
          id: `custom-${Date.now()}`,
          category: 'personalizada',
          level: undefined,
          question: { english: targetQuestion, italian: targetQuestion },
          questionEs,
          goal: clean(raw.goal, 400) || 'Responde con una idea clara, una razón y un ejemplo.',
          steps,
          phrases:
            language === 'italian'
              ? { english: [], italian: phrases }
              : { english: phrases, italian: [] },
          example:
            language === 'italian'
              ? { english: '', italian: example }
              : { english: example, italian: '' },
          exampleEs,
          custom: true,
        };
      } catch (e) {
        if (token !== structureTokenRef.current) return null;
        setStructureError((e as Error).message || 'No pude crear la estructura');
        return null;
      } finally {
        if (token === structureTokenRef.current) setStructureLoading(false);
      }
    },
    [language, level]
  );

  /**
   * Revisión aislada de estructura. El flujo normal la pide junto al feedback
   * (T2); se conserva para reintentos puntuales sin reevaluar la gramática.
   */
  const reviewStructure = useCallback(
    async (
      messageId: string,
      utterance: string,
      structure: SpeakingStructure,
      history: TutorHistoryEntry[]
    ): Promise<StructureReview | null> => {
      const token = ++reviewTokenRef.current;
      setStructureReviewing(prev => ({ ...prev, [messageId]: true }));
      setStructureReviewErrors(prev => {
        if (!prev[messageId]) return prev;
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      try {
        const data = await callCoach({
          action: 'structureReview',
          language,
          level,
          message: utterance,
          history: normalizeHistory(history),
          structure: structurePayload(structure, language),
        });
        if (token !== reviewTokenRef.current) return null;

        const review = parseReview(data);
        if (!review) throw new Error('La revisión no llegó completa');
        setStructureReviews(prev => ({ ...prev, [messageId]: review }));
        return review;
      } catch (e) {
        if (token !== reviewTokenRef.current) return null;
        setStructureReviewErrors(prev => ({
          ...prev,
          [messageId]: (e as Error).message || 'No pude revisar la estructura',
        }));
        return null;
      } finally {
        if (token === reviewTokenRef.current) {
          setStructureReviewing(prev => {
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

  const clearStructureReviews = useCallback(() => {
    reviewTokenRef.current += 1;
    setStructureReviews({});
    setStructureReviewing({});
    setStructureReviewErrors({});
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
    structureLoading,
    structureError,
    generateStructure,
    structureReviews,
    structureReviewing,
    structureReviewErrors,
    reviewStructure,
    clearStructureReviews,
    hydrate,
    reset,
  };
}
