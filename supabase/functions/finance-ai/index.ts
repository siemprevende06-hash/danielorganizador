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

// Modelos gratis conocidos (se prueban primero por velocidad)
const MODELOS_FREE = [
  "qwen/qwen3-32b:free",
  "qwen/qwen3-8b:free",
  "moonshotai/kimi-k2-0905:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

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
    if (!message || typeof message !== "string") return json({ error: "Falta el mensaje" }, 400);

    const catsTxt = categories.length > 0
      ? categories.map((c) => `- ${c.id}: "${c.name}" (${c.type})`).join("\n")
      : "(sin categorías)";
    const walletsTxt = wallets.length > 0
      ? wallets.map((w) => `- ${w.id}: "${w.name}"`).join("\n")
      : "(sin billeteras)";

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
{"completado":true,"transaccion":{"description":"Café","amount":5,"currency":"USD","date":"2026-08-20","walletId":"wallet-efectivo","categoryId":"cat-coffee","type":"expense"}}

B) Faltan datos:
{"completado":false,"pregunta":"¿En qué billetera fue? (Efectivo, Digital 1, Digital 2)","parcial":{"description":"Café","amount":5,"currency":"USD","date":"2026-08-20"}}`;

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
      });

    let res: Response | null = null;

    // 1) Prueba modelos gratis conocidos
    for (const modelo of MODELOS_FREE) {
      try { res = await chat(modelo); } catch { continue; }
      if (res.ok) break;
      if (res.status === 401 || res.status === 403) break;
    }

    // 2) Si ninguno funcionó, descubre los modelos gratis vigentes ahora mismo
    if (!res || !res.ok) {
      try {
        const mr = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
        });
        if (mr.ok) {
          const lista = await mr.json();
          const free: string[] = (lista.data || [])
            .filter((m: any) => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0)
            .map((m: any) => m.id)
            .slice(0, 12);
          for (const modelo of free) {
            try { res = await chat(modelo); } catch { continue; }
            if (res.ok) break;
            if (res.status === 401 || res.status === 403) break;
          }
        }
      } catch { /* sin descubrimiento disponible */ }
    }

    if (!res || !res.ok) {
      if (res) {
        const errText = await res.text();
        let msg = errText;
        try { msg = JSON.parse(errText)?.error?.message || JSON.parse(errText)?.message || errText; } catch { /* texto plano */ }
        return json({ error: msg, status: res.status }, res.status);
      }
      return json({ error: "No se pudo conectar con OpenRouter" }, 502);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "El modelo no devolvió JSON válido" }, 502);

    let parsed: any;
    try { parsed = JSON.parse(match[0]); } catch {
      return json({ error: "El modelo no devolvió JSON válido" }, 502);
    }

    if (parsed.completado && parsed.transaccion) {
      const t = parsed.transaccion;
      return json({
        completado: true,
        transaccion: {
          description: String(t.description || "").trim(),
          amount: Number(t.amount) || 0,
          currency: t.currency === "USD" ? "USD" : "CUP",
          date: typeof t.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : todayStr(),
          walletId: String(t.walletId || ""),
          categoryId: String(t.categoryId || ""),
          type: t.type === "income" ? "income" : "expense",
        },
      });
    }

    return json({
      completado: false,
      pregunta: String(parsed.pregunta || "Faltan datos, cuéntame más."),
      parcial: parsed.parcial || {},
    });
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado" }, 500);
  }
});