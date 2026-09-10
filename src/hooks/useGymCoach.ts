import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GymState } from "@/gym2/lib/types";

export interface GymCoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface GymCoachMeta {
  id: string;
  title: string | null;
  updated_at: string;
}

const PROD_SUPABASE_URL = "https://fuqmrtenzlslkeqgdjwy.supabase.co";
const PROD_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cW1ydGVuemxzbGtlcWdkand5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTgxMzksImV4cCI6MjEwMDk5NDEzOX0.3Xxk0AiGLuCjnSJvm0sK9C1cIbpeWgkuhrFc3QnnuVc";
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL}/functions/v1/gym-coach`;

export function useGymCoach() {
  const [meta, setMeta] = useState<GymCoachMeta[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GymCoachMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listConversations = useCallback(async () => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    setMeta((data as GymCoachMeta[] | null) || []);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setConvId(id);
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(
      ((data as any[]) || []).map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content || "",
      })),
    );
  }, []);

  const newConversation = useCallback(() => {
    setConvId(null);
    setMessages([]);
    setError(null);
  }, []);

  useEffect(() => {
    listConversations();
  }, [listConversations]);

  const sendMessage = useCallback(
    async (text: string, gymState?: GymState) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      setLoading(true);
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: "user", content: trimmed },
      ]);

      let id = convId;
      try {
        if (!id) {
          const { data, error: convErr } = await supabase
            .from("ai_conversations")
            .insert({ title: trimmed.slice(0, 60) })
            .select("id")
            .single();
          if (convErr) throw new Error(convErr.message);
          id = data.id;
          setConvId(id);
        }

        await supabase.from("ai_messages").insert({
          conversation_id: id,
          role: "user",
          content: trimmed,
        });

        const res = await fetch(FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || PROD_SUPABASE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || PROD_SUPABASE_KEY,
          },
          body: JSON.stringify({ message: trimmed, history, gymState }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(data?.error || `Error del servidor (${res.status})`);
        }

        const assistant: GymCoachMessage = {
          id: `local-a-${Date.now()}`,
          role: "assistant",
          content: data.content || "",
        };
        setMessages((prev) => [...prev, assistant]);

        await supabase.from("ai_messages").insert({
          conversation_id: id,
          role: "assistant",
          content: assistant.content,
        });
        await supabase
          .from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", id);

        listConversations();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [convId, loading, messages, listConversations]
  );

  return {
    meta,
    convId,
    messages,
    loading,
    error,
    sendMessage,
    openConversation,
    newConversation,
    listConversations,
  };
}