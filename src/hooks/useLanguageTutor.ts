import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/env';
import { getAIProvider } from '@/lib/aiProvider';
import type { CoachVisual } from '@/components/coach/VisualCanvas';
import { engineDesdeRespuesta, type AiEngine } from '@/components/ai/AiModelBadge';
import type { Language } from './useLanguageLearning';
import type { TutorSkill } from '@/components/languages/tutorModes';
import type { StructureReview, TutorFeedback } from './useLanguageTutorCoach';

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
  /** Mensaje interno (arranque de escenario/estructura): no se pinta. */
  hidden?: boolean;
  /** Corrección y revisión de estructura persistidas en `ai_messages.visual`. */
  meta?: TutorMessageMeta;
  /** id real en `ai_messages` (los ids temporales cambian en cada envío). */
  dbId?: string;
}

export interface TutorMessageMeta {
  feedback?: TutorFeedback;
  structureReview?: StructureReview;
}

export interface TutorConversationSnapshot {
  conversation: {
    id: string;
    title: string | null;
    scope: string;
    created_at?: string;
    updated_at?: string;
  };
  messages: Array<{
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    visual: Record<string, unknown> | null;
    created_at?: string;
  }>;
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
  /** Conversación larga: respuestas más ricas y más historial. */
  longTalk?: boolean;
  /** Pide el resumen final de la sesión en español. */
  sessionEnd?: boolean;
  /** Pregunta concreta cuya estructura está practicando. */
  structureQuestion?: string;
}

const scopeFor = (language: Language) => `tutor-${language}`;

/** Recorta el historial: prompts más cortos = primera palabra mucho antes. */
const buildHistory = (messages: TutorMessage[], limit = 12) =>
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
  /** Proveedor y modelo reales que respondieron la última vez. */
  const [engine, setEngine] = useState<AiEngine | null>(null);

  const scope = scopeFor(language);
  const skillRef = useRef<TutorSkill | null>(skill);
  skillRef.current = skill;

  const messagesRef = useRef<TutorMessage[]>([]);
  messagesRef.current = messages;
  const convRef = useRef<string | null>(null);
  /** Cambia al abrir/crear/borrar un hilo: invalida resoluciones tardías (B9). */
  const epochRef = useRef(0);
  /** id temporal del mensaje → promesa con el id real en `ai_messages`. */
  const userRowRef = useRef<Map<string, Promise<string | null>>>(new Map());
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

  const openConversation = useCallback(async (id: string): Promise<TutorMessage[]> => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    canceladoRef.current = true;
    epochRef.current += 1;
    userRowRef.current.clear();
    setConversationId(id);
    convRef.current = id;
    const { data } = await db
      .from('ai_messages')
      .select('id,role,content,visual')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    const rows = (data as unknown as
      | Array<{ id: string; role: string; content: string | null; visual: unknown }>
      | null) ?? [];
    const loaded: TutorMessage[] = rows.map(m => {
      const visual = (m.visual && typeof m.visual === 'object' ? m.visual : {}) as Record<string, unknown>;
      const feedback =
        visual.feedback && typeof visual.feedback === 'object' ? (visual.feedback as TutorFeedback) : undefined;
      const structureReview =
        visual.structureReview && typeof visual.structureReview === 'object'
          ? (visual.structureReview as StructureReview)
          : undefined;
      return {
        id: m.id,
        dbId: m.id,
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content || '',
        visuals: Array.isArray(visual.visuals) ? (visual.visuals as CoachVisual[]) : [],
        acciones: Array.isArray(visual.acciones) ? (visual.acciones as TutorAccion[]) : [],
        hidden: visual.hidden === true,
        meta: feedback || structureReview ? { feedback, structureReview } : undefined,
      };
    });
    setMessages(loaded);
    return loaded;
  }, []);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    canceladoRef.current = true;
    epochRef.current += 1;
    userRowRef.current.clear();
    convRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError(null);
    setEngine(null);
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
    epochRef.current += 1;
    userRowRef.current.clear();
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

  /** Borra un hilo completo y devuelve lo necesario para deshacerlo (B18/U8). */
  const deleteConversation = useCallback(
    async (id: string): Promise<TutorConversationSnapshot | null> => {
      const { data: conv } = await db
        .from('ai_conversations')
        .select('id,title,scope,created_at,updated_at')
        .eq('id', id)
        .maybeSingle();
      const { data: rows } = await db
        .from('ai_messages')
        .select('id,conversation_id,role,content,visual,created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      const snapshot: TutorConversationSnapshot | null = conv
        ? {
            conversation: conv as TutorConversationSnapshot['conversation'],
            messages: ((rows as TutorConversationSnapshot['messages'] | null) ?? []).map(row => ({
              ...row,
              visual: row.visual ?? null,
            })),
          }
        : null;

      await db.from('ai_messages').delete().eq('conversation_id', id);
      await db.from('ai_conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (convRef.current === id) newConversation();
      return snapshot;
    },
    [newConversation]
  );

  /** Reinserta un hilo borrado con sus mensajes (acción "Deshacer"). */
  const restoreConversation = useCallback(
    async (snapshot: TutorConversationSnapshot) => {
      await db.from('ai_conversations').insert(snapshot.conversation);
      if (snapshot.messages.length) {
        await db.from('ai_messages').insert(snapshot.messages);
      }
      await loadConversations();
    },
    [loadConversations]
  );

  const renameConversation = useCallback(async (id: string, title: string) => {
    const limpio = title.trim().slice(0, 80);
    if (!limpio) return;
    setConversations(prev => prev.map(item => (item.id === id ? { ...item, title: limpio } : item)));
    await db.from('ai_conversations').update({ title: limpio }).eq('id', id);
  }, []);

  /**
   * Guarda la corrección y la revisión de estructura dentro del mensaje del
   * estudiante, para que sigan ahí al recargar o abrir el hilo de ayer (B8).
   */
  const persistUserMeta = useCallback(async (tempId: string, meta: TutorMessageMeta) => {
    const pending = userRowRef.current.get(tempId);
    // Los mensajes cargados de un hilo ya traen su id real en `ai_messages`.
    const rowId = pending ? await pending : tempId.startsWith('tmp-') ? null : tempId;
    if (!rowId) return;
    const { data } = await db.from('ai_messages').select('visual').eq('id', rowId).maybeSingle();
    const previous = (data?.visual ?? {}) as Record<string, unknown>;
    const visual = { ...previous, ...meta };
    await db.from('ai_messages').update({ visual }).eq('id', rowId);
    setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, meta } : m)));
  }, []);

  /** Edita la transcripción de un turno (U6) y deja el feedback listo para rehacer. */
  const editUserMessage = useCallback(async (tempId: string, content: string) => {
    const limpio = content.trim();
    if (!limpio) return;
    setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, content: limpio } : m)));
    const pending = userRowRef.current.get(tempId);
    const rowId = pending ? await pending : tempId.startsWith('tmp-') ? null : tempId;
    if (!rowId) return;
    await db.from('ai_messages').update({ content: limpio }).eq('id', rowId);
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
      const historyLimit = options?.sessionEnd
        ? 24
        : skillRef.current === 'speaking'
          ? options?.longTalk
            ? 20
            : 12
          : 16;
      const history = buildHistory(messagesRef.current, historyLimit);
      const convEpoch = epochRef.current;

      setMessages(prev => [
        ...prev,
        ...(hidden
          ? []
          : [{ id: userId, role: 'user' as const, content: trimmed, visuals: [], acciones: [] }]),
        { id: assistantId, role: 'assistant' as const, content: '', visuals: [], acciones: [], streaming: true },
      ]);

      /** Inserta la fila del estudiante y devuelve su id real (para B8/U6). */
      const insertUserRow = async (conversationId: string): Promise<string | null> => {
        const { data } = await db
          .from('ai_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: trimmed,
            visual: hidden ? { hidden: true } : null,
          })
          .select('id')
          .single();
        return data?.id ?? null;
      };

      // La conversación se crea en paralelo: no bloquea la llamada al modelo.
      const convId = convRef.current;
      const convPromise: Promise<string | null> = (async () => {
        try {
          if (convId) return convId;
          const { data, error: convErr } = await db
            .from('ai_conversations')
            .insert({ title: options?.title || trimmed.slice(0, 60), scope })
            .select('id')
            .single();
          if (convErr || !data) return null;
          // B9: si mientras tanto se abrió/creó otro hilo, no secuestres el panel.
          if (epochRef.current === convEpoch) {
            convRef.current = data.id;
            setConversationId(data.id);
          }
          return data.id;
        } catch {
          return null;
        }
      })();

      // La fila del estudiante se inserta en cuanto existe el hilo. La promesa
      // queda disponible antes de que llegue el feedback (B8).
      const userRowPromise = convPromise.then(id => (id ? insertUserRow(id) : null));
      if (!hidden) userRowRef.current.set(userId, userRowPromise);

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
      let meta: {
        visuals?: any[];
        acciones?: any[];
        fuentes?: any[];
        provider?: string;
        model?: string;
        modelo?: string;
      } = {};

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
            longTalk: options?.longTalk === true,
            sessionEnd: options?.sessionEnd === true,
            structureQuestion: options?.structureQuestion || undefined,
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

        setEngine(engineDesdeRespuesta(meta));

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
    engine,
    sendMessage,
    stop,
    openConversation,
    newConversation,
    deleteConversation,
    restoreConversation,
    renameConversation,
    persistUserMeta,
    editUserMessage,
    deleteMemory,
  };
}
