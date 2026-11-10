import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const todayStr = () => {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

// Extrae el primer JSON válido de la respuesta del modelo. Tolera texto extra,
// fences de markdown (```json) y varios bloques con llaves. Devuelve null si no
// hay ningún JSON parseable.
function extractJson(text: string): any | null {
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* sigue */ }
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(clean); } catch { /* sigue */ }
  let best: any = null;
  let bestScore = 0;
  let idx = clean.indexOf("{");
  while (idx !== -1) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let i = idx; i < clean.length; i++) {
      const ch = clean[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (inStr) { if (ch === '"') inStr = false; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      const candidate = clean.slice(idx, end + 1);
      try {
        const parsed = JSON.parse(candidate);
        const score = candidate.length + (parsed.completado !== undefined ? 1000 : 0);
        if (!best || score > bestScore) { best = parsed; bestScore = score; }
      } catch { /* bloque inválido, probar el siguiente */ }
    }
    idx = clean.indexOf("{", idx + 1);
  }
  return best;
}

// Modelos gratuitos de reserva. La lista real se descubre en vivo.
const MODELOS_PREFERIDOS = [
  "recursive/flint-v1.0:free",
  "qwen/qwen3-32b:free",
  "moonshotai/kimi-k2-0905:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

let MODELO_ACTIVO: string | null = null;

/** OpenCode Console: proveedor alternativo elegido en Configuración. */
const OPENCODE_BASE = (Deno.env.get("OPENCODE_BASE_URL") || "https://opencode.ai/inference").replace(/\/+$/, "");
const OPENCODE_URL = `${OPENCODE_BASE}/openai/v1/chat/completions`;
const OPENCODE_MODEL = (Deno.env.get("OPENCODE_MODEL") || "deepseek-v4.1-flash-free").trim();

/**
 * OpenRouter restringe algunos gratuitos a "agentic harnesses": desde una Edge
 * Function devuelven 403. Nunca deben entrar en la cadena de modelos.
 */
const MODELOS_RESTRINGIDOS = /thinkingmachines|inkling/i;
/** Modelos que ya fallaron por sí mismos en esta instancia. */
const MODELOS_INVALIDOS = new Set<string>();

const modeloBloqueado = (id: string) =>
  !id || MODELOS_RESTRINGIDOS.test(id) || MODELOS_INVALIDOS.has(id);

const puntuarModelo = (id: string) => {
  let score = 0;
  if (/deepseek/.test(id)) score += 60;
  if (/qwen/.test(id)) score += 50;
  if (/mistral/.test(id)) score += 40;
  if (/llama/.test(id)) score += 35;
  if (/gemini|gemma/.test(id)) score += 30;
  if (/kimi|moonshot/.test(id)) score += 25;
  if (/glm/.test(id)) score += 20;
  if (/flint/.test(id)) score += 90;
  // Modelo gratuito que ha respondido de forma fiable en las pruebas reales.
  if (/xingchen|xing4/.test(id)) score += 100;
  if (/reason|thinking|r1/.test(id)) score -= 40;
  if (/audio|embed|rerank|moderation|safety|image|vision|-vl|vl-/.test(id)) score -= 200;
  const size = Number((id.match(/(\d+(?:\.\d+)?)b(?:-|:|\b)/) || [])[1]);
  if (Number.isFinite(size) && size > 0 && size < 7) score -= 60;
  return score;
};

let catalogoCache: { at: number; modelos: string[] } | null = null;

/** Lee el catálogo y devuelve modelos gratuitos de texto. */
async function descubrirModelos(apiKey: string): Promise<string[]> {
  if (catalogoCache && Date.now() - catalogoCache.at < 10 * 60 * 1000) {
    return catalogoCache.modelos;
  }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return catalogoCache?.modelos || [];
    const data = await res.json();
    const modelos = (Array.isArray(data?.data) ? data.data : [])
      .filter((m: any) => {
        if (!m || typeof m.id !== "string") return false;
        if (modeloBloqueado(m.id)) return false;
        const pricing = m.pricing || {};
        if (Number(pricing.prompt) !== 0 || Number(pricing.completion) !== 0) return false;
        if (Number(pricing.request || 0) !== 0) return false;
        const outputs = m.architecture?.output_modalities;
        if (Array.isArray(outputs) && !outputs.includes("text")) return false;
        return true;
      })
      .map((m: any) => m.id as string)
      .sort((a: string, b: string) => puntuarModelo(b) - puntuarModelo(a))
      .slice(0, 12);
    catalogoCache = { at: Date.now(), modelos };
    return modelos;
  } catch {
    return catalogoCache?.modelos || [];
  }
}

async function candidatosModelo(apiKey: string): Promise<string[]> {
  const descubiertos = await descubrirModelos(apiKey);
  const preferidos = descubiertos.length
    ? MODELOS_PREFERIDOS.filter((id) => descubiertos.includes(id))
    : MODELOS_PREFERIDOS;
  const lista = [
    ...(MODELO_ACTIVO ? [MODELO_ACTIVO] : []),
    ...descubiertos,
    ...preferidos,
    ...MODELOS_PREFERIDOS,
  ];
  return [...new Set(lista)].filter((id) => !modeloBloqueado(id)).slice(0, 12);
}

async function leerErrorOpenRouter(res: Response): Promise<string> {
  const texto = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(texto);
    return String(parsed?.error?.message || parsed?.message || texto || `HTTP ${res.status}`);
  } catch {
    return texto || `HTTP ${res.status}`;
  }
}

const MENSAJE_LIMITE_DIARIO =
  "Se agotó el límite diario de modelos gratuitos de OpenRouter. Se renueva mañana; si necesitas más hoy, añade 10 créditos en OpenRouter para desbloquear 1000 peticiones gratuitas al día.";

const esLimiteDiario = (detalle: string) => /free-models-per-day|per day|daily/i.test(detalle);

interface CategoryInfo { id: string; name: string; type: string }
interface WalletInfo { id: string; name: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) return json({ error: "OPENROUTER_API_KEY no está configurada" }, 500);

    const body = await req.json().catch(() => null);
    const message = body?.message;
    const history: { role: string; content: string }[] = Array.isArray(body?.history) ? body.history : [];
    const wallets: WalletInfo[] = Array.isArray(body?.wallets) ? body.wallets : [];
    const categories: CategoryInfo[] = Array.isArray(body?.categories) ? body.categories : [];
    const proveedor = body?.provider === "deepseek" ? "deepseek" : "openrouter";
    const opencodeKey = Deno.env.get("OPENCODE_API_KEY") || "";
    const usarOpenCode = proveedor === "deepseek" && Boolean(opencodeKey);
    if (!message || typeof message !== "string") return json({ error: "Falta el mensaje" }, 400);

    const catsTxt = categories.length > 0
      ? categories.map((c) => `- ${c.id}: "${c.name}" (${c.type})`).join("\n")
      : "(sin categorías)";
    const walletsTxt = wallets.length > 0
      ? wallets.map((w) => `- ${w.id}: "${w.name}"`).join("\n")
      : "(sin billeteras)";

    // Ejemplos para el prompt con datos reales, para que el modelo no copie ids inventados ni fechas viejas
    const hoy = todayStr();
    const ejemploWalletId = wallets[0]?.id || "wallet-id";
    const ejemploCatExpense = categories.find((c) => c.type === "expense")?.id || "cat-id";

    const systemPrompt = `Eres el asistente financiero de Daniel. Conviertes lo que te dice en una transacción de su app, y si faltan datos se los pides por chat hasta completarla.

CATEGORÍAS DISPONIBLES (usa SIEMPRE estos ids exactos; el "type" de la categoría elegida define income/expense):
${catsTxt}

BILLETERAS DISPONIBLES (usa SIEMPRE estos ids exactos):
${walletsTxt}

HOY es ${todayStr()}.

REGLAS:
1. Extrae del mensaje: descripción breve, monto (número), moneda (solo "USD" o "CUP"), fecha (YYYY-MM-DD, por defecto HOY), billetera (walletId) y la categoría que mejor coincida con el gasto/ingreso (categoryId). Desambigua bien: "café"->cat-coffee, "comida/almuerzo/merienda"->cat-food, "transporte/pasaje/combustible"->cat-transport, salario/freelance/pago recibido->categoría de income.
2. NUNCA inventes: ni montos, ni ids de billetera, ni ids de categoría. Solo usa los listados arriba.
3. Si falta algún dato (billetera, monto, descripción, o es ambiguo), responde el formato B y haz UNA pregunta específica con las opciones disponibles (ej: "¿En qué billetera fue? (Efectivo, Digital 1, Digital 2)").
4. Cuando el usuario responda en el historial, completa la transacción acumulando lo ya dicho.
5. Moneda por defecto: CUP si el usuario no especifica (vive en Cuba), salvo que diga "USD", "dólares", "$" seguido de número grande en otra moneda o el nombre del detalle indique moneda extranjera.
6. El mensaje puede venir de voz; transcribe y normaliza números ("veinte"->20 no aplica: solo viene texto dictado, corrígelo si hace falta).
7. Si el mensaje no es para registrar una transacción o es incomprensible, responde el formato B con una pregunta aclaratoria breve.

RESPONDE ÚNICAMENTE JSON VÁLIDO, sin markdown, sin texto extra. Dos formatos:

A) Transacción completa:
{"completado":true,"transaccion":{"description":"Café","amount":5,"currency":"USD","date":"${hoy}","walletId":"${ejemploWalletId}","categoryId":"${ejemploCatExpense}","type":"expense"}}

B) Faltan datos:
{"completado":false,"pregunta":"¿En qué billetera fue? (Efectivo, Digital 1, Digital 2)","parcial":{"description":"Café","amount":5,"currency":"USD","date":"${hoy}"}}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const chat = (modelo: string) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Segundo Cerebro",
        },
        body: JSON.stringify({ model: modelo, messages, temperature: 0.2 }),
        signal: AbortSignal.timeout(45_000),
      });

    const chatOpenCode = () =>
      fetch(OPENCODE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opencodeKey}`,
          "x-opencode-session": `ses_${crypto.randomUUID()}`,
        },
        body: JSON.stringify({ model: OPENCODE_MODEL, messages, temperature: 0.2 }),
        signal: AbortSignal.timeout(45_000),
      });

    let ultimoEstado = 0;
    let ultimoDetalle = "";
    let parsed: any = null;
    let modeloUsado = "";

    // DeepSeek primero si el usuario lo eligió. Si falla o no devuelve JSON,
    // seguimos con la cadena normal de OpenRouter.
    if (usarOpenCode) {
      try {
        const intento = await chatOpenCode();
        if (intento.ok) {
          const data = await intento.json().catch(() => null);
          const content = data?.choices?.[0]?.message?.content || "";
          const intentoParsed = extractJson(content);
          if (intentoParsed) {
            modeloUsado = OPENCODE_MODEL;
            parsed = intentoParsed;
          } else {
            console.warn(`[finance-ai] opencode/${OPENCODE_MODEL} -> respuesta sin JSON`);
          }
        } else {
          ultimoEstado = intento.status;
          ultimoDetalle = await leerErrorOpenRouter(intento);
          console.warn(
            `[finance-ai] opencode/${OPENCODE_MODEL} -> ${intento.status} ${ultimoDetalle.slice(0, 180)}`,
          );
        }
      } catch (e) {
        console.warn(
          `[finance-ai] opencode/${OPENCODE_MODEL} falló: ${(e as Error).message}`,
        );
      }
    }

    if (!parsed) {
      for (const modelo of await candidatosModelo(OPENROUTER_API_KEY)) {
        let intento: Response;
        try {
          intento = await chat(modelo);
        } catch {
          continue;
        }

        if (intento.ok) {
          const data = await intento.json().catch(() => null);
          const content = data?.choices?.[0]?.message?.content || "";
          const intentoParsed = extractJson(content);
          if (intentoParsed) {
            MODELO_ACTIVO = modelo;
            modeloUsado = modelo;
            parsed = intentoParsed;
            break;
          }
          ultimoEstado = 200;
          ultimoDetalle = `respuesta sin JSON válido: ${String(content).slice(0, 160)}`;
          console.warn(`[finance-ai] ${modelo} -> respuesta sin JSON`);
          // Los modelos pequeños a veces ignoran el formato: probamos otro.
          continue;
        }

        ultimoEstado = intento.status;
        ultimoDetalle = await leerErrorOpenRouter(intento);
        console.warn(`[finance-ai] ${modelo} -> ${intento.status} ${ultimoDetalle.slice(0, 180)}`);

        // Solo una clave inválida corta la cadena. Un 403 de un modelo
        // restringido (p. ej. thinkingmachines/inkling) es del modelo.
        if (intento.status === 401) break;

        if (
          intento.status === 400 ||
          intento.status === 403 ||
          intento.status === 404 ||
          intento.status === 422
        ) {
          MODELOS_INVALIDOS.add(modelo);
          if (MODELO_ACTIVO === modelo) MODELO_ACTIVO = null;
        }

        // 402 = sin crédito y 429 diario = cuenta agotada: insistir no ayuda.
        // Otros 429 pueden ser del proveedor de ese modelo: probamos el siguiente.
        if (intento.status === 402) break;
        if (intento.status === 429 && esLimiteDiario(ultimoDetalle)) break;
      }
    }

    if (!parsed) {
      if (ultimoEstado === 401) {
        return json({ error: "La clave de OpenRouter no es válida o no tiene permisos." }, 500);
      }
      if (ultimoEstado === 429 || ultimoEstado === 402) {
        return json(
          {
            error: esLimiteDiario(ultimoDetalle)
              ? MENSAJE_LIMITE_DIARIO
              : "OpenRouter está limitando las peticiones gratuitas ahora mismo. Espera un minuto y vuelve a intentarlo.",
            detalle: ultimoDetalle.slice(0, 300),
          },
          429,
        );
      }
      // Mejor una pregunta amable que un error: el usuario retoma el chat sin
      // ver un mensaje técnico.
      return json({
        completado: false,
        pregunta:
          "No pude interpretar eso. Dímelo de nuevo con el monto y la billetera, por ejemplo: \"Compré café por 5 USD en Efectivo\".",
        parcial: {},
        modelo: modeloUsado || undefined,
      });
    }

    if (parsed.completado && parsed.transaccion) {
      const t = parsed.transaccion;
      const type = t.type === "income" ? "income" : "expense";

      // NUNCA inventar ids: si el modelo devolvió un id que no existe en las listas,
      // se corrige con una billetera/categoría válidas, que es mejor que registrar nada.
      let walletId = String(t.walletId || "");
      if (!wallets.some((w) => w.id === walletId)) {
        walletId = wallets[0]?.id || "";
      }

      let categoryId = String(t.categoryId || "");
      let resolvedType = type;
      const catMatch = categories.find((c) => c.id === categoryId);
      if (catMatch) {
        resolvedType = catMatch.type === "income" ? "income" : "expense";
      } else {
        const fallbackCat = categories.find((c) =>
          type === "income" ? c.type === "income" : c.type === "expense"
        );
        categoryId = fallbackCat?.id || "";
        if (fallbackCat) resolvedType = fallbackCat.type === "income" ? "income" : "expense";
      }

      return json({
        completado: true,
        transaccion: {
          description: String(t.description || "").trim(),
          amount: Number(t.amount) || 0,
          currency: t.currency === "USD" ? "USD" : "CUP",
          date: typeof t.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : todayStr(),
          walletId,
          categoryId,
          type: resolvedType,
        },
        modelo: modeloUsado || undefined,
      });
    }

    return json({
      completado: false,
      pregunta: String(parsed.pregunta || "Faltan datos, cuéntame más."),
      parcial: parsed.parcial || {},
      modelo: modeloUsado || undefined,
    });
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado" }, 500);
  }
});