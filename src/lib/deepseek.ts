import { edgeFunctionUrl, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/env";

/**
 * Página independiente "DeepSeek V4.1 Flash Free".
 *
 * El modelo se sirve desde OpenCode Console. La API key NUNCA se guarda en el
 * navegador: en desarrollo la inyecta el proxy de Vite y en producción la
 * Edge Function `deepseek-chat` (secreto OPENCODE_API_KEY).
 */

export const DEEPSEEK_MODEL = "deepseek-v4.1-flash-free";
export const DEEPSEEK_MODEL_LABEL = "DeepSeek V4.1 Flash Free";
export const DEEPSEEK_CONTEXT_TOKENS = 200_000;
export const DEEPSEEK_MAX_OUTPUT_TOKENS = 32_000;

const DEV_ENDPOINT = "/api/deepseek/chat/completions";
const DEV_HEALTH_ENDPOINT = "/api/deepseek/health";
const EDGE_ENDPOINT = edgeFunctionUrl("deepseek-chat");

export type DeepSeekRole = "user" | "assistant";
export type ReasoningEffort = "low" | "high" | "max";

export interface DeepSeekUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface DeepSeekStats {
  latencyMs?: number;
  usage?: DeepSeekUsage;
  aborted?: boolean;
}

export interface DeepSeekMessage {
  id: string;
  role: DeepSeekRole;
  content: string;
  reasoning?: string;
  createdAt: number;
  error?: string;
  stats?: DeepSeekStats;
}

export interface DeepSeekConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DeepSeekMessage[];
}

export interface DeepSeekSettings {
  systemPrompt: string;
  temperature: number;
  reasoningEffort: ReasoningEffort;
  historyLimit: number;
}

export interface DeepSeekHealth {
  ok: boolean;
  configured: boolean;
  valid?: boolean | null;
  mode: "dev" | "edge";
  model: string;
  detail?: string;
  status?: number;
}

export const DEFAULT_SYSTEM_PROMPT =
  "Eres DeepSeek V4.1 Flash, un asistente útil, directo y preciso. Responde en el idioma en que te hable el usuario. Usa Markdown cuando ayude a leer mejor: listas, tablas, negritas y bloques de código. Si algo no lo sabes o no puedes verificarlo, dilo con claridad. No inventes datos.";

export const DEFAULT_SETTINGS: DeepSeekSettings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.7,
  reasoningEffort: "high",
  historyLimit: 20,
};

export const REASONING_LABELS: Record<ReasoningEffort, string> = {
  low: "Rápido",
  high: "Equilibrado",
  max: "Máximo",
};

export const uid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  apikey: SUPABASE_PUBLISHABLE_KEY,
});

const endpoint = (): string => (import.meta.env.DEV ? DEV_ENDPOINT : EDGE_ENDPOINT);

const headers = (): Record<string, string> =>
  import.meta.env.DEV
    ? { "Content-Type": "application/json", Accept: "text/event-stream, application/json" }
    : {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
        ...authHeaders(),
      };

export async function checkDeepSeekHealth(probe = false): Promise<DeepSeekHealth> {
  const base = import.meta.env.DEV ? DEV_HEALTH_ENDPOINT : EDGE_ENDPOINT;
  const url = probe ? `${base}${base.includes("?") ? "&" : "?"}probe=1` : base;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: import.meta.env.DEV
        ? { Accept: "application/json" }
        : { Accept: "application/json", ...authHeaders() },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        configured: Boolean(data?.configured),
        valid: data?.valid ?? null,
        mode: import.meta.env.DEV ? "dev" : "edge",
        model: DEEPSEEK_MODEL,
        status: res.status,
        detail:
          data?.error ||
          data?.detail ||
          (res.status === 404
            ? "La función deepseek-chat no está desplegada en Supabase."
            : `El servidor respondió ${res.status}.`),
      };
    }
    return {
      ok: true,
      configured: Boolean(data?.configured),
      valid: data?.valid ?? null,
      mode: import.meta.env.DEV ? "dev" : "edge",
      model: data?.model || DEEPSEEK_MODEL,
      status: res.status,
      detail: data?.detail,
    };
  } catch (error) {
    return {
      ok: false,
      configured: false,
      valid: null,
      mode: import.meta.env.DEV ? "dev" : "edge",
      model: DEEPSEEK_MODEL,
      detail:
        (error as Error)?.message ||
        "No se pudo contactar con el servidor de DeepSeek.",
    };
  }
}

interface StreamOptions {
  messages: Pick<DeepSeekMessage, "role" | "content">[];
  settings: DeepSeekSettings;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
  onReasoning?: (chunk: string) => void;
  onUsage?: (usage: DeepSeekUsage) => void;
}

export interface StreamResult {
  content: string;
  reasoning: string;
  usage?: DeepSeekUsage;
  latencyMs: number;
}

async function readError(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  let message = raw;
  try {
    const parsed = JSON.parse(raw);
    message =
      parsed?.error?.message ||
      parsed?.error ||
      parsed?.message ||
      parsed?.detail ||
      raw;
  } catch {
    // El cuerpo no era JSON: se usa el texto tal cual.
  }
  if (res.status === 401 || res.status === 403) {
    return (
      message ||
      "La API key de OpenCode Console no es válida o no tiene acceso a este modelo."
    );
  }
  if (res.status === 402) {
    return "La cuenta de OpenCode Console no tiene saldo o el modelo gratuito no está disponible.";
  }
  if (res.status === 429) {
    return "Demasiadas peticiones seguidas. Espera unos segundos y vuelve a intentarlo.";
  }
  if (res.status === 404) {
    return "No se encontró el endpoint del modelo. Revisa que la función deepseek-chat esté desplegada.";
  }
  return message || `El servidor respondió ${res.status}.`;
}

/**
 * Envía los mensajes al modelo y va entregando el texto conforme llega.
 * Acepta respuestas SSE (streaming) y JSON normal como respaldo.
 */
export async function streamDeepSeek({
  messages,
  settings,
  signal,
  onDelta,
  onReasoning,
  onUsage,
}: StreamOptions): Promise<StreamResult> {
  const startedAt = performance.now();
  const cleanHistory = messages
    .filter((m) => m.content.trim())
    .slice(-Math.max(2, settings.historyLimit))
    .map((m) => ({ role: m.role, content: m.content }));

  const system = settings.systemPrompt.trim();
  const payload: Record<string, unknown> = {
    messages: system
      ? [{ role: "system", content: system }, ...cleanHistory]
      : cleanHistory,
    temperature: settings.temperature,
    reasoning_effort: settings.reasoningEffort,
    stream: true,
  };

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const contentType = res.headers.get("content-type") || "";
  const isStream = contentType.includes("text/event-stream") && res.body;

  let content = "";
  let reasoning = "";
  let usage: DeepSeekUsage | undefined;

  if (!isStream) {
    const data = await res.json().catch(() => null);
    const choice = data?.choices?.[0];
    content = choice?.message?.content || "";
    reasoning = choice?.message?.reasoning_content || choice?.message?.reasoning || "";
    usage = data?.usage;
    if (content) onDelta(content);
    if (reasoning) onReasoning?.(reasoning);
    if (usage) onUsage?.(usage);
    return {
      content,
      reasoning,
      usage,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const json = JSON.parse(data);
      const delta = json?.choices?.[0]?.delta;
      const reasoningChunk =
        delta?.reasoning_content || delta?.reasoning || json?.choices?.[0]?.message?.reasoning_content;
      const textChunk = delta?.content || json?.choices?.[0]?.message?.content;
      if (reasoningChunk) {
        reasoning += reasoningChunk;
        onReasoning?.(reasoningChunk);
      }
      if (textChunk) {
        content += textChunk;
        onDelta(textChunk);
      }
      if (json?.usage) {
        usage = json.usage;
        onUsage?.(json.usage);
      }
    } catch {
      // Fragmento incompleto o comentario SSE: se ignora.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) processLine(line);
  }
  if (buffer) processLine(buffer);

  return {
    content,
    reasoning,
    usage,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(timestamp).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
  });
};
