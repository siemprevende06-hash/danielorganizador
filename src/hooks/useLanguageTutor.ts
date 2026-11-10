import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/env';
import { getAIProvider } from '@/lib/aiProvider';
import type { CoachVisual } from '@/components/coach/VisualCanvas';
import type { Language } from './useLanguageLearning';
import type { TutorSkill } from '@/components/languages/tutorModes';

// El cliente tipado de Supabase dispara TS2589 (instantiation too deep) en estas cadenas.
const db = supabase as any;

/** Escritura de fondo: nunca debe romper la conversación ni lanzar rechazos sueltos. */
const fire = (query: any) => {
  try {
    query?.then?.(
      () => undefined,
      () => undefined
    );
  } catch {
    /* noop */
  }
};

const FN_URL = edgeFunctionUrl('language-tutor');
const REQUEST_TIMEOUT_MS = 60000;

export type TutorAccion = {
  tipo: string;
  titulo?: string;
  minutos?: number;
};

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visuals: CoachVisual[];
  acciones: TutorAccion[];
  /** true mientras llega el texto en streaming */
  streaming?: boolean;
}

export interface TutorConversation {
  id: string;
  title: string | null;
  updated_at: string;
}

export interface TutorMemory {
  id: string;
  kind: string | null;
  content: string;
  importance: number | null;
}

export interface SendMessageOptions {
  /** No muestra ni guarda el mensaje del usuario (arranque interno de una simulación). */
  hidden?: boolean;
  /** Marca el primer turno para que el tutor abra él la conversación. */
  start?: boolean;
  /** Título para la conversación nueva. */
  title?: string;
}

const scopeFor = (language: Language) => `tutor-${language}`;

/** Recorta el historial: prompts más cortos = primera palabra mucho antes. */
const buildHistory = (messages: TutorMessage[], limit = 10) =>
  messages
    .filter(m => m.content.trim())
    .slice(-limit)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));

async function* leerEventos(res: Response): AsyncGenerator<any> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        if (payload === '[DONE]') return;
        try {
          yield JSON.parse(payload);
        } catch {
          /* fragmento incompleto */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}

export function useLanguageTutor(language: Language, level: string, skill: TutorSkill | null) {
  const [conversations, setConversations] = useState<TutorConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [memories, setMemories] = useState<TutorMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = scopeFor(language);
  const skillRef = useRef<TutorSkill | null>(skill);
  skillRef.current = skill;

  const messagesRef = useRef<TutorMessage[]>([]);
  messagesRef.current = messages;
  const convRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const canceladoRef = useRef(false);
  const flushRef = useRef<number | null>(null);
  const pendienteRef = useRef<{ id: string; content: string } | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await db
      .from('ai_conversations')
      .select('id,title,updated_at')
      .eq('scope', scope)
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations((data as TutorConversation[] | null) || []);
  }, [scope]);

  const loadMemories = useCallback(async () => {
    const { data } = await db
      .from('ai_memories')
      .select('id,kind,content,importance')
      .eq('source', 'language-tutor')
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    setMemories((data as TutorMemory[] | null) || []);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    canceladoRef.current = true;
    setConversationId(id);
    convRef.current = id;
    const { data } = await db
      .from('ai_messages')
      .select('id,role,content,visual')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    setMessages(
      ((data as any[]) || []).map(m => ({
        id: m.id,
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content || '',
        visuals: Array.isArray(m.visual?.visuals) ? m.visual.visuals : [],
        acciones: Array.isArray(m.visual?.acciones) ? m.visual.acciones : [],
      }))
    );
  }, []);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    canceladoRef.current = true;
    convRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  const applyPatch = useCallback((id: string, patch: Partial<TutorMessage>) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  /** Pinta los deltas como máximo cada 60 ms para no re-renderizar por token. */
  const pushDelta = useCallback(
    (id: string, content: string) => {
      pendienteRef.current = { id, content };
      if (flushRef.current !== null) return;
      flushRef.current = window.setTimeout(() => {
        flushRef.current = null;
        const p = pendienteRef.current;
        if (!p) return;
        pendienteRef.current = null;
        applyPatch(p.id, { content: p.content });
      }, 60);
    },
    [applyPatch]
  );

  const flushDelta = useCallback(
    (id: string, content: string) => {
      if (flushRef.current !== null) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      pendienteRef.current = null;
      applyPatch(id, { content });
    },
    [applyPatch]
  );

  // Al cambiar de idioma, el historial y los mensajes son otros
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    canceladoRef.current = true;
    convRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError(null);
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (flushRef.current !== null) clearTimeout(flushRef.current);
    },
    []
  );

  const deleteMemory = useCallback(async (id: string) => {
    await db.from('ai_memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  /** Corta la respuesta en curso conservando lo ya escrito. */
  const stop = useCallback(() => {
    canceladoRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    busyRef.current = false;
    setMessages(prev => prev.map(m => (m.streaming ? { ...m, streaming: false } : m)));
  }, []);

  const sendMessage = useCallback(
    async (text: string, scenario?: string, options?: SendMessageOptions) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;

      const hidden = options?.hidden === true;
      busyRef.current = true;
      canceladoRef.current = false;
      setLoading(true);
      setError(null);

      const stamp = Date.now();
      const userId = `tmp-u-${stamp}`;
      const assistantId = `tmp-a-${stamp}`;
      const history = buildHistory(messagesRef.current, skillRef.current === 'speaking' ? 6 : 10);

      setMessages(prev => [
        ...prev,
        ...(hidden
          ? []
          : [{ id: userId, role: 'user' as const, content: trimmed, visuals: [], acciones: [] }]),
        { id: assistantId, role: 'assistant' as const, content: '', visuals: [], acciones: [], streaming: true },
      ]);

      // La conversación se crea en paralelo: no bloquea la llamada al modelo.
      const convId = convRef.current;
      const convPromise: Promise<string | null> = (async () => {
        try {
          if (convId) {
            if (!hidden) {
              fire(db.from('ai_messages').insert({ conversation_id: convId, role: 'user', content: trimmed }));
            }
            return convId;
          }
          const { data, error: convErr } = await db
            .from('ai_conversations')
            .insert({ title: options?.title || trimmed.slice(0, 60), scope })
            .select('id')
            .single();
          if (convErr || !data) return null;
          convRef.current = data.id;
          setConversationId(data.id);
          if (!hidden) {
            fire(db.from('ai_messages').insert({ conversation_id: data.id, role: 'user', content: trimmed }));
          }
          return data.id;
        } catch {
          return null;
        }
      })();

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      // Es un tiempo máximo SIN recibir nada: mientras el stream avanza no se corta.
      let timedOut = false;
      let timeout = window.setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, REQUEST_TIMEOUT_MS);
      const reiniciarTimeout = () => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          timedOut = true;
          ctrl.abort();
        }, REQUEST_TIMEOUT_MS);
      };

      let content = '';
      let meta: { visuals?: any[]; acciones?: any[]; fuentes?: any[] } = {};

      try {
        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            message: trimmed,
            history,
            language,
            level,
            skill: skillRef.current,
            scenario: scenario || undefined,
            start: options?.start === true,
            stream: true,
            provider: getAIProvider(),
          }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Error del servidor (${res.status})`);
        }

        const tipo = res.headers.get('content-type') || '';
        if (tipo.includes('text/event-stream') && res.body) {
          for await (const ev of leerEventos(res)) {
            reiniciarTimeout();
            if (ev?.t === 'd' && typeof ev.v === 'string') {
              content += ev.v;
              pushDelta(assistantId, content);
            } else if (ev?.t === 'm') {
              meta = ev;
            } else if (ev?.t === 'e') {
              throw new Error(String(ev.v || 'Error del tutor'));
            }
          }
        } else {
          // Compatibilidad con respuestas JSON antiguas
          const data = await res.json().catch(() => null);
          if (!data) throw new Error('Respuesta vacía del tutor');
          if (data.error) throw new Error(String(data.error));
          content = data.content || '';
          meta = data;
        }

        flushDelta(assistantId, content);
        applyPatch(assistantId, {
          content,
          visuals: Array.isArray(meta.visuals) ? meta.visuals : [],
          acciones: Array.isArray(meta.acciones) ? meta.acciones : [],
          streaming: false,
        });

        const id = await convPromise;
        if (id && content.trim()) {
          fire(
            db.from('ai_messages').insert({
              conversation_id: id,
              role: 'assistant',
              content,
              visual: {
                visuals: meta.visuals || [],
                acciones: meta.acciones || [],
                fuentes: meta.fuentes || [],
              },
            })
          );
          fire(db.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', id));
          fire(loadConversations());
        }
        if (meta.acciones?.some((a: any) => a.tipo === 'memoria_guardada')) void loadMemories();
      } catch (e) {
        // Solo es cancelación si la pidió el usuario; un AbortError sin cancelar es timeout.
        const cancelado = canceladoRef.current;
        if (cancelado) {
          flushDelta(assistantId, content);
          applyPatch(assistantId, { content, streaming: false });
          if (!content.trim()) {
            setMessages(prev => prev.filter(m => m.id !== assistantId));
          }
        } else {
          setError(
            timedOut
              ? 'El tutor ha tardado demasiado en responder. Prueba otra vez.'
              : (e as Error).message || 'No se pudo hablar con el tutor'
          );
          if (content.trim()) {
            // Si el corte llega a mitad de respuesta, no se tira lo ya escrito.
            applyPatch(assistantId, {
              content,
              visuals: Array.isArray(meta.visuals) ? meta.visuals : [],
              acciones: Array.isArray(meta.acciones) ? meta.acciones : [],
              streaming: false,
            });
          } else {
            setMessages(prev => prev.filter(m => m.id !== assistantId));
          }
        }
      } finally {
        clearTimeout(timeout);
        if (abortRef.current === ctrl) {
          abortRef.current = null;
          busyRef.current = false;
          setLoading(false);
        }
      }
    },
    [applyPatch, flushDelta, language, level, loadConversations, loadMemories, pushDelta, scope]
  );

  return {
    conversations,
    conversationId,
    messages,
    memories,
    loading,
    error,
    sendMessage,
    stop,
    openConversation,
    newConversation,
    deleteMemory,
  };
}
