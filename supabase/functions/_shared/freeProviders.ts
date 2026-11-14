/**
 * Proveedores gratuitos con API real: Google AI Studio (Gemini), Groq y Mistral.
 *
 * Los tres exponen un endpoint compatible con OpenAI (`/chat/completions`), así
 * que la misma petición que ya usamos para OpenRouter sirve aquí. Se activan
 * solos cuando su secreto existe en Supabase:
 *
 *   GEMINI_API_KEY     -> https://aistudio.google.com/apikey
 *   GROQ_API_KEY       -> https://console.groq.com/keys
 *   MISTRAL_API_KEY    -> https://console.mistral.ai/api-keys
 *
 * Si un secreto falta, ese proveedor simplemente no entra en la cadena: la app
 * sigue funcionando como hasta ahora.
 *
 * Aviso de privacidad: los planes gratuitos pueden usar los prompts para
 * mejorar sus modelos (Gemini free tier y Mistral "Experiment" lo hacen). No
 * configures estas claves si no quieres que datos del diario o de finanzas
 * salgan de tu control.
 */

export type FreeProviderName = "gemini" | "groq" | "mistral";

export type FreeCandidate = {
  nombre: FreeProviderName;
  modelo: string;
  url: string;
  key: string;
};

const ENV: Record<FreeProviderName, string> = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
};

const CHAT_URL: Record<FreeProviderName, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
};

const MODELS_URL: Record<FreeProviderName, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/models",
  groq: "https://api.groq.com/openai/v1/models",
  mistral: "https://api.mistral.ai/v1/models",
};

/** Catálogo de emergencia si el endpoint de modelos no responde. */
const RESPALDO: Record<FreeProviderName, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  groq: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"],
  mistral: ["mistral-small-latest", "open-mistral-nemo", "mistral-large-latest"],
};

/** Nada de embeddings, audio, OCR ni moderación: aquí solo queremos chat. */
const EXCLUIR =
  /embed|moderation|whisper|tts|guard|ocr|vision|image|audio|rerank|aqa|imagen|veo|learnlm|robotics/i;

/** Preferencia por familia de modelo (mayor = mejor para este proyecto). */
const PESO: Record<FreeProviderName, Array<[RegExp, number]>> = {
  gemini: [
    [/gemini-?3(\.\d+)?-flash/i, 120],
    [/flash-lite/i, 80],
    [/flash/i, 100],
    [/gemini/i, 60],
    [/gemma/i, 20],
  ],
  groq: [
    [/llama-3\.3-70b/i, 120],
    [/gpt-oss-120b/i, 110],
    [/qwen3?.{0,4}32b/i, 90],
    [/llama-3\.1-8b/i, 60],
  ],
  mistral: [
    [/small-latest/i, 120],
    [/open-mistral-nemo/i, 90],
    [/large-latest/i, 50],
  ],
};

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<FreeProviderName, { at: number; modelos: string[] }>();

/**
 * Proveedores con clave inválida o sin permisos: se dejan de intentar durante
 * 10 minutos para no sumar latencia en cada petición.
 */
const caidos = new Map<FreeProviderName, number>();

export function marcarProveedorCaido(nombre: FreeProviderName): void {
  caidos.set(nombre, Date.now());
}

function estaCaido(nombre: FreeProviderName): boolean {
  const at = caidos.get(nombre);
  return Boolean(at && Date.now() - at < CACHE_MS);
}

export function claveProveedor(nombre: FreeProviderName): string {
  return (Deno.env.get(ENV[nombre]) ?? "").trim();
}

function puntuar(nombre: FreeProviderName, id: string): number {
  let score = 0;
  for (const [re, valor] of PESO[nombre]) {
    if (re.test(id)) score = Math.max(score, valor);
  }
  return score;
}

async function descubrir(nombre: FreeProviderName, key: string): Promise<string[]> {
  const previo = cache.get(nombre);
  if (previo && Date.now() - previo.at < CACHE_MS) return previo.modelos;

  try {
    const res = await fetch(MODELS_URL[nombre], {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return previo?.modelos ?? RESPALDO[nombre];

    const data = await res.json();
    const ids: string[] = (Array.isArray(data?.data) ? data.data : [])
      .filter((m: any) => m?.capabilities?.completion_chat !== false)
      .map((m: any) => String(m?.id ?? "").replace(/^models\//, ""))
      .filter((id: string) => Boolean(id) && !EXCLUIR.test(id));

    const modelos = [...new Set(ids)].sort((a, b) => puntuar(nombre, b) - puntuar(nombre, a));
    if (modelos.length) cache.set(nombre, { at: Date.now(), modelos });
    return modelos.length ? modelos : RESPALDO[nombre];
  } catch {
    return previo?.modelos ?? RESPALDO[nombre];
  }
}

/**
 * Devuelve los candidatos gratuitos en orden de preferencia.
 * Por defecto un modelo por proveedor para no alargar la cadena.
 */
export async function candidatosGratis(porProveedor = 1): Promise<FreeCandidate[]> {
  const orden: FreeProviderName[] = ["gemini", "groq", "mistral"];

  const resultados = await Promise.all(
    orden.map(async (nombre) => {
      const key = claveProveedor(nombre);
      if (!key || estaCaido(nombre)) return [] as FreeCandidate[];
      const modelos = (await descubrir(nombre, key)).slice(0, Math.max(1, porProveedor));
      return modelos.map((modelo) => ({
        nombre,
        modelo,
        url: CHAT_URL[nombre],
        key,
      }));
    }),
  );

  return resultados.flat();
}

export function cabecerasGratis(c: FreeCandidate): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${c.key}`,
  };
}
