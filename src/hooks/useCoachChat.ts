import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CoachVisual } from "@/components/coach/VisualCanvas";

export interface CoachAccion {
  tipo: string;
  titulo?: string;
  id?: string;
  bloque?: string | null;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  visuals: CoachVisual[];
  acciones: CoachAccion[];
}

export interface CoachConversation {
  id: string;
  title: string | null;
  updated_at: string;
}

export interface CoachMemory {
  id: string;
  kind: string | null;
  content: string;
  importance: number | null;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/life-coach`;

export function useCoachChat() {
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [memories, setMemories] = useState<CoachMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations((data as CoachConversation[] | null) || []);
  }, []);

  const loadMemories = useCallback(async () => {
    const { data } = await supabase
      .from("ai_memories")
      .select("id,kind,content,importance")
      .order("importance", { ascending: false })
      .limit(100);
    setMemories((data as CoachMemory[] | null) || []);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setConversationId(id);
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content,visual")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(
      ((data as any[]) || []).map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content || "",
        visuals: Array.isArray(m.visual?.visuals) ? m.visual.visuals : [],
        acciones: Array.isArray(m.visual?.acciones) ? m.visual.acciones : [],
      })),
    );
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  useEffect(() => {
    loadConversations();
    loadMemories();
  }, [loadConversations, loadMemories]);

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from("ai_memories").delete().eq("id", id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      setLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: "user", content: trimmed, visuals: [], acciones: [] },
      ]);

      let convId = conversationId;
      try {
        if (!convId) {
          const { data, error: convErr } = await supabase
            .from("ai_conversations")
            .insert({ title: trimmed.slice(0, 60) })
            .select("id")
            .single();
          if (convErr) throw new Error(convErr.message);
          convId = data.id;
          setConversationId(convId);
        }

        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          role: "user",
          content: trimmed,
        });

        const res = await fetch(FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ message: trimmed, history }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(data?.error || `Error del servidor (${res.status})`);
        }

        const assistant: CoachMessage = {
          id: `local-a-${Date.now()}`,
          role: "assistant",
          content: data.content || "",
          visuals: Array.isArray(data.visuals) ? data.visuals : [],
          acciones: Array.isArray(data.acciones) ? data.acciones : [],
        };
        setMessages((prev) => [...prev, assistant]);

        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistant.content,
          visual: { visuals: assistant.visuals, acciones: assistant.acciones, fuentes: data.fuentes || [] } as any,
        });
        await supabase
          .from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);

        loadConversations();
        loadMemories();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, loading, messages, loadConversations, loadMemories],
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
    reloadMemories: loadMemories,
  };
}
