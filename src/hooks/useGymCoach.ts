import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/env";
import { getAIProvider } from "@/lib/aiProvider";
import { getGym } from "@/gym2/store";
import { buildGymSnapshot } from "@/gym2/lib/coachContext";
import { applyCoachActions, type CoachActionResult } from "@/gym2/lib/coachActions";
import { engineDesdeModelo, type AiEngine } from "@/components/ai/AiModelBadge";

export interface GymCoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: CoachActionResult[];
}

export interface GymCoachMeta {
  id: string;
  title: string | null;
  updated_at: string;
}

interface GymCoachOptions {
  /** Permite que una acción del Coach cambie de pantalla (Plan, Stats…). */
  onNavigate?: (tab: string) => void;
}

const FN_URL = edgeFunctionUrl("gym-coach");
const SCOPE = "gym";
const REQUEST_TIMEOUT_MS = 100_000;

const asActions = (value: unknown): CoachActionResult[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as CoachActionResult[];
  if (typeof value === "object") {
    const nested = (value as { actions?: unknown }).actions;
    if (Array.isArray(nested)) return nested as CoachActionResult[];
  }
  return [];
};

interface StoredMessage {
  id: string;
  role: string | null;
  content: string | null;
  tool_calls: unknown;
}

const friendlyError = (status: number, data: unknown): string => {
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const rawError = body?.error;
  const rawMessage = body?.message;
  const detail = typeof rawError === "string" ? rawError : rawMessage;
  if (status === 404) {
    return "El Coach GYM todavía no está disponible: falta desplegar la función `gym-coach` en Supabase. Si eres el dueño del proyecto, publícala y recarga la app.";
  }
  if (status === 401 || status === 403) {
    return "El servicio rechazó la petición (clave o permisos). Revisa la configuración de Supabase.";
  }
  if (status === 429) {
    return typeof rawError === "string"
      ? rawError
      : "El modelo está saturado ahora mismo. Espera unos segundos y reinténtalo.";
  }
  return typeof detail === "string"
    ? `No pude responder: ${detail}`
    : `No pude responder (${status}). Inténtalo otra vez.`;
};

export function useGymCoach(options: GymCoachOptions = {}) {
  const [meta, setMeta] = useState<GymCoachMeta[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GymCoachMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Proveedor y modelo reales que respondieron la última vez. */
  const [engine, setEngine] = useState<AiEngine | null>(null);

  const messagesRef = useRef<GymCoachMessage[]>([]);
  const convRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const navigateRef = useRef(options.onNavigate);
  navigateRef.current = options.onNavigate;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    convRef.current = convId;
  }, [convId]);

  const listConversations = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from("ai_conversations")
        .select("id,title,updated_at")
        .eq("scope", SCOPE)
        .order("updated_at", { ascending: false })
        .limit(30);
      setMeta((data as GymCoachMeta[] | null) || []);
    } catch {
      /* el historial no debe romper el chat */
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    setError(null);
    setConvId(id);
    convRef.current = id;
    setMessages([]);
    try {
      const { data } = await supabase
        .from("ai_messages")
        .select("id,role,content,tool_calls")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages(
        ((data as StoredMessage[] | null) || []).map((m) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content || "",
          actions: asActions(m.tool_calls),
        })),
      );
    } catch (e) {
      setError(`No pude cargar la conversación: ${(e as Error).message}`);
    }
  }, []);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    setConvId(null);
    convRef.current = null;
    setMessages([]);
    setError(null);
    setEngine(null);
  }, []);

  useEffect(() => {
    listConversations();
  }, [listConversations]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;

      const gym = getGym();
      if (!gym) {
        setError("Gym 2.0 no está inicializado. Recarga la página.");
        return;
      }

      busyRef.current = true;
      setError(null);
      setLoading(true);

      const userMessage: GymCoachMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const history = messagesRef.current
        .filter((m) => m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [...prev, userMessage]);
      messagesRef.current = [...messagesRef.current, userMessage];

      // La conversación se guarda en paralelo: si la base falla, el Coach
      // igual debe responder. Antes un error de guardado dejaba el chat mudo.
      let conversationId = convRef.current;
      const conversationPromise: Promise<string | null> = (async () => {
        try {
          if (conversationId) {
            await supabase.from("ai_messages").insert({
              conversation_id: conversationId,
              role: "user",
              content: trimmed,
            });
            return conversationId;
          }
          const { data, error: convErr } = await supabase
            .from("ai_conversations")
            .insert({ title: trimmed.slice(0, 60), scope: SCOPE })
            .select("id")
            .single();
          if (convErr || !data) return null;
          conversationId = data.id;
          setConvId(data.id);
          convRef.current = data.id;
          await supabase.from("ai_messages").insert({
            conversation_id: data.id,
            role: "user",
            content: trimmed,
          });
          return data.id;
        } catch {
          return null;
        }
      })();

      const controller = new AbortController();
      abortRef.current = controller;
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const snapshot = buildGymSnapshot(gym.S);
        const res = await fetch(FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            message: trimmed,
            history: history.slice(-16),
            snapshot,
            provider: getAIProvider(),
          }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(friendlyError(res.status, data));
        }

        setEngine(engineDesdeModelo(data.modelo));

        const actions = Array.isArray(data.acciones) ? data.acciones : [];
        let results: CoachActionResult[] = [];
        if (actions.length) {
          try {
            results = applyCoachActions(actions, (tab) => navigateRef.current?.(tab));
          } catch (e) {
            results = [
              {
                tipo: "sistema",
                ok: false,
                mensaje: `El Coach propuso cambios, pero no pude aplicarlos: ${(e as Error).message}`,
              },
            ];
          }
        }

        let content = String(data.content || "").trim();
        if (!content) {
          content = results.length
            ? results
                .map((r) => `${r.ok ? "✅" : "⚠️"} ${r.mensaje}`)
                .join("\n")
            : "No pude generar una respuesta esta vez. ¿Puedes reformular tu pregunta?";
        }

        const assistant: GymCoachMessage = {
          id: `local-a-${Date.now()}`,
          role: "assistant",
          content,
          actions: results,
        };
        setMessages((prev) => [...prev, assistant]);
        messagesRef.current = [...messagesRef.current, assistant];

        // Guardar la respuesta no debe bloquear el chat: si Supabase tarda o
        // falla, el usuario ya tiene su respuesta y puede seguir escribiendo.
        void (async () => {
          try {
            const savedConv = await conversationPromise;
            if (!savedConv) return;
            await supabase.from("ai_messages").insert({
              conversation_id: savedConv,
              role: "assistant",
              content,
              tool_calls: { actions: results } as never,
            });
            await supabase
              .from("ai_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", savedConv);
            await listConversations();
          } catch {
            /* el historial no debe romper el chat */
          }
        })();
      } catch (e) {
        const err = e as Error;
        if (err.name === "AbortError") {
          setError(
            "El Coach tardó demasiado en responder (más de 100 s). Revisa tu conexión y vuelve a intentarlo.",
          );
        } else if (!navigator.onLine) {
          setError("Estás sin conexión. El Coach necesita internet para pensar, aunque tus datos siguen guardados en el dispositivo.");
        } else if (err.name === "TypeError" || /failed to fetch|networkerror|load failed/i.test(err.message)) {
          setError(
            "No pude conectar con el servicio del Coach. Revisa tu conexión y vuelve a intentarlo; tus datos siguen guardados.",
          );
        } else {
          setError(err.message || "No pude conectar con el Coach.");
        }
      } finally {
        window.clearTimeout(timer);
        abortRef.current = null;
        busyRef.current = false;
        setLoading(false);
      }
    },
    [listConversations]
  );

  return {
    meta,
    convId,
    messages,
    loading,
    error,
    engine,
    sendMessage,
    openConversation,
    newConversation,
    listConversations,
    clearError: () => setError(null),
  };
}
