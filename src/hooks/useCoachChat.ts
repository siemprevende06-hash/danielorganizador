import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/env";
import { getAIProvider } from "@/lib/aiProvider";
import type { Json } from "@/integrations/supabase/types";
import type { CoachVisual } from "@/components/coach/VisualCanvas";
import { engineDesdeRespuesta, type AiEngine } from "@/components/ai/AiModelBadge";

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

const FN_URL = edgeFunctionUrl("life-coach");

type StoredCoachRow = {
  id: string;
  role: string;
  content: string | null;
  visual: { visuals?: unknown; acciones?: unknown } | null;
};

export function useCoachChat() {
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [memories, setMemories] = useState<CoachMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Proveedor y modelo reales que respondieron la última vez. */
  const [engine, setEngine] = useState<AiEngine | null>(null);

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
      ((data as unknown as StoredCoachRow[] | null) || []).map((m) => {
        const visual =
          m.visual && typeof m.visual === "object" && !Array.isArray(m.visual) ? m.visual : null;
        return {
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content || "",
          visuals: Array.isArray(visual?.visuals) ? (visual.visuals as CoachVisual[]) : [],
          acciones: Array.isArray(visual?.acciones) ? (visual.acciones as CoachAccion[]) : [],
        };
      }),
    );
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
    setEngine(null);
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
    async (text: string, context?: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      setLoading(true);

      // El contexto (por ejemplo la autocrítica del día) se envía al modelo,
      // pero no se muestra como si el usuario lo hubiera escrito.
      const prompt = context ? `${trimmed}\n\n${context}` : trimmed;
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
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ message: prompt, history, provider: getAIProvider() }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(data?.error || `Error del servidor (${res.status})`);
        }

        setEngine(engineDesdeRespuesta(data));

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
          visual: { visuals: assistant.visuals, acciones: assistant.acciones, fuentes: data.fuentes || [] } as unknown as Json,
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
    engine,
    sendMessage,
    openConversation,
    newConversation,
    deleteMemory,
    reloadMemories: loadMemories,
  };
}
