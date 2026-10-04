import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/env';
import type { CoachVisual } from '@/components/coach/VisualCanvas';
import type { Language } from './useLanguageLearning';
import type { TutorSkill } from '@/components/languages/tutorModes';

const FN_URL = edgeFunctionUrl('language-tutor');

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

const scopeFor = (language: Language) => `tutor-${language}`;

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

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('ai_conversations')
      .select('id,title,updated_at')
      .eq('scope', scope)
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations((data as TutorConversation[] | null) || []);
  }, [scope]);

  const loadMemories = useCallback(async () => {
    const { data } = await supabase
      .from('ai_memories')
      .select('id,kind,content,importance')
      .eq('source', 'language-tutor')
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    setMemories((data as TutorMemory[] | null) || []);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setConversationId(id);
    const { data } = await supabase
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
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Al cambiar de idioma, el historial y los mensajes son otros
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from('ai_memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      setLoading(true);

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      setMessages(prev => [...prev, { id: `local-${Date.now()}`, role: 'user', content: trimmed, visuals: [], acciones: [] }]);

      let convId = conversationId;
      try {
        if (!convId) {
          const { data, error: convErr } = await supabase
            .from('ai_conversations')
            .insert({ title: trimmed.slice(0, 60), scope })
            .select('id')
            .single();
          if (convErr) throw new Error(convErr.message);
          convId = data.id;
          setConversationId(convId);
        }

        await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'user', content: trimmed });

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
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(data?.error || `Error del servidor (${res.status})`);
        }

        const assistant: TutorMessage = {
          id: `local-a-${Date.now()}`,
          role: 'assistant',
          content: data.content || '',
          visuals: Array.isArray(data.visuals) ? data.visuals : [],
          acciones: Array.isArray(data.acciones) ? data.acciones : [],
        };
        setMessages(prev => [...prev, assistant]);

        await supabase.from('ai_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistant.content,
          visual: { visuals: assistant.visuals, acciones: assistant.acciones, fuentes: data.fuentes || [] } as any,
        });
        await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);

        loadConversations();
        loadMemories();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, level, language, loading, messages, loadConversations, loadMemories, scope]
  );

  return {
    conversations,
    conversationId,
    messages,
    memories,
    loading,
    error,
    sendMessage,
    openConversation,
    newConversation,
    deleteMemory,
  };
}
