import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type DeepSeekConversation,
  type DeepSeekMessage,
  type DeepSeekSettings,
  type ReasoningEffort,
  estimateTokens,
  streamDeepSeek,
  uid,
} from "@/lib/deepseek";

const CONVERSATIONS_KEY = "deepseek-v4.1-flash-free:conversations:v1";
const SETTINGS_KEY = "deepseek-v4.1-flash-free:settings:v1";
const MAX_CONVERSATIONS = 40;
const MAX_MESSAGES = 120;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function sanitizeMessage(raw: unknown): DeepSeekMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string" || (item.role !== "user" && item.role !== "assistant")) {
    return null;
  }
  if (typeof item.content !== "string") return null;
  return {
    id: item.id,
    role: item.role,
    content: item.content,
    reasoning: typeof item.reasoning === "string" ? item.reasoning : undefined,
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    error: typeof item.error === "string" ? item.error : undefined,
    stats:
      item.stats && typeof item.stats === "object"
        ? (item.stats as DeepSeekMessage["stats"])
        : undefined,
  };
}

function loadConversations(): DeepSeekConversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).id === "string",
      )
      .map((item) => {
        const messages = Array.isArray(item.messages)
          ? item.messages
              .map(sanitizeMessage)
              .filter((m): m is DeepSeekMessage => Boolean(m))
              .slice(-MAX_MESSAGES)
          : [];
        return {
          id: item.id as string,
          title:
            typeof item.title === "string" && item.title.trim()
              ? item.title
              : "Conversación",
          createdAt:
            typeof item.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt:
            typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
          messages,
        };
      })
      .filter((conversation) => conversation.messages.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

function loadSettings(): DeepSeekSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DeepSeekSettings>;
    const effort: ReasoningEffort =
      parsed.reasoningEffort === "low" ||
      parsed.reasoningEffort === "high" ||
      parsed.reasoningEffort === "max"
        ? parsed.reasoningEffort
        : DEFAULT_SETTINGS.reasoningEffort;
    return {
      systemPrompt:
        typeof parsed.systemPrompt === "string"
          ? parsed.systemPrompt
          : DEFAULT_SETTINGS.systemPrompt,
      temperature: Number.isFinite(parsed.temperature)
        ? clamp(Number(parsed.temperature), 0, 2)
        : DEFAULT_SETTINGS.temperature,
      reasoningEffort: effort,
      historyLimit: Number.isFinite(parsed.historyLimit)
        ? clamp(Number(parsed.historyLimit), 2, 60)
        : DEFAULT_SETTINGS.historyLimit,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useDeepSeekChat() {
  const [conversations, setConversations] = useState<DeepSeekConversation[]>(
    loadConversations,
  );
  const [activeId, setActiveId] = useState<string | null>(() => {
    const initial = loadConversations();
    return initial[0]?.id ?? null;
  });
  const [settings, setSettings] = useState<DeepSeekSettings>(loadSettings);
  const [loading, setLoading] = useState(false);
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const settingsRef = useRef(settings);
  const conversationsRef = useRef(conversations);
  const persistTimer = useRef<number | null>(null);

  settingsRef.current = settings;
  conversationsRef.current = conversations;

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [activeId, conversations],
  );

  const messages = activeConversation?.messages ?? [];

  const contextTokens = useMemo(
    () =>
      messages.reduce(
        (total, message) =>
          total +
          estimateTokens(message.content) +
          estimateTokens(message.reasoning || ""),
        estimateTokens(settings.systemPrompt),
      ),
    [messages, settings.systemPrompt],
  );

  // Persistencia con debounce para no escribir en cada token del streaming.
  useEffect(() => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      } catch {
        // localStorage lleno o no disponible: la app sigue funcionando en memoria.
      }
    }, 300);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Sin persistencia de ajustes si el navegador lo bloquea.
    }
  }, [settings]);

  // Guarda el último estado al cerrar o desmontar la página.
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(
          CONVERSATIONS_KEY,
          JSON.stringify(conversationsRef.current),
        );
      } catch {
        // Ignorar.
      }
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  const patchMessage = useCallback(
    (
      conversationId: string,
      messageId: string,
      updater: (message: DeepSeekMessage) => DeepSeekMessage,
    ) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: Date.now(),
                messages: conversation.messages.map((message) =>
                  message.id === messageId ? updater(message) : message,
                ),
              }
            : conversation,
        ),
      );
    },
    [],
  );

  const runCompletion = useCallback(
    async (
      conversationId: string,
      assistantId: string,
      history: DeepSeekMessage[],
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      loadingRef.current = true;
      setLoading(true);
      setStreamingConversationId(conversationId);
      setError(null);

      try {
        const result = await streamDeepSeek({
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          settings: settingsRef.current,
          signal: controller.signal,
          onDelta: (chunk) => {
            patchMessage(conversationId, assistantId, (message) => ({
              ...message,
              content: message.content + chunk,
            }));
          },
          onReasoning: (chunk) => {
            patchMessage(conversationId, assistantId, (message) => ({
              ...message,
              reasoning: (message.reasoning || "") + chunk,
            }));
          },
          onUsage: (usage) => {
            patchMessage(conversationId, assistantId, (message) => ({
              ...message,
              stats: { ...message.stats, usage },
            }));
          },
        });

        patchMessage(conversationId, assistantId, (message) => ({
          ...message,
          stats: {
            ...message.stats,
            latencyMs: result.latencyMs,
            usage: result.usage,
          },
        }));
      } catch (caught) {
        const err = caught as Error;
        if (err?.name === "AbortError") {
          patchMessage(conversationId, assistantId, (message) => ({
            ...message,
            stats: { ...message.stats, aborted: true },
          }));
        } else {
          const detail =
            err?.message || "No se pudo completar la respuesta del modelo.";
          setError(detail);
          patchMessage(conversationId, assistantId, (message) => ({
            ...message,
            error: detail,
          }));
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setStreamingConversationId(null);
        abortRef.current = null;
      }
    },
    [patchMessage],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loadingRef.current) return;

      const userMessage: DeepSeekMessage = {
        id: uid(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantMessage: DeepSeekMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      const current = activeId
        ? conversationsRef.current.find((c) => c.id === activeId) ?? null
        : null;
      const history = [
        ...(current?.messages ?? []).filter((m) => m.content.trim()),
        userMessage,
      ];

      let conversationId = activeId;
      if (!conversationId) {
        conversationId = uid();
        const conversation: DeepSeekConversation = {
          id: conversationId,
          title: text.slice(0, 70),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMessage, assistantMessage],
        };
        setConversations((prev) =>
          [conversation, ...prev].slice(0, MAX_CONVERSATIONS),
        );
        setActiveId(conversationId);
      } else {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title:
                    conversation.messages.length === 0
                      ? text.slice(0, 70)
                      : conversation.title,
                  updatedAt: Date.now(),
                  messages: [
                    ...conversation.messages,
                    userMessage,
                    assistantMessage,
                  ].slice(-MAX_MESSAGES),
                }
              : conversation,
          ),
        );
      }

      await runCompletion(conversationId, assistantMessage.id, history);
    },
    [activeId, runCompletion],
  );

  const retryLast = useCallback(async () => {
    if (!activeId || loadingRef.current) return;
    const conversation = conversationsRef.current.find(
      (c) => c.id === activeId,
    );
    if (!conversation) return;

    let lastUserIndex = -1;
    for (let i = conversation.messages.length - 1; i >= 0; i -= 1) {
      if (conversation.messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex < 0) return;

    const history = conversation.messages
      .slice(0, lastUserIndex + 1)
      .filter((message) => message.content.trim());
    const assistant: DeepSeekMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((item) =>
        item.id === activeId
          ? {
              ...item,
              updatedAt: Date.now(),
              messages: [...item.messages.slice(0, lastUserIndex + 1), assistant],
            }
          : item,
      ),
    );

    await runCompletion(activeId, assistant.id, history);
  }, [activeId, runCompletion]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setError(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setError(null);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      if (streamingConversationId === id) abortRef.current?.abort();
      const remaining = conversationsRef.current.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeId === id) {
        setActiveId(remaining[0]?.id ?? null);
        setError(null);
      }
    },
    [activeId, streamingConversationId],
  );

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    setConversations([]);
    setActiveId(null);
    setError(null);
    try {
      localStorage.removeItem(CONVERSATIONS_KEY);
    } catch {
      // Ignorar.
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<DeepSeekSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    messages,
    settings,
    loading,
    streamingConversationId,
    error,
    contextTokens,
    sendMessage,
    retryLast,
    stop,
    newChat,
    selectConversation,
    deleteConversation,
    clearAll,
    updateSettings,
    resetSettings,
    clearError: () => setError(null),
  };
}
