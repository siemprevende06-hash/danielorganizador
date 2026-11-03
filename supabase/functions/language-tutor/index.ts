import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const encoder = new TextEncoder();
const sse = (obj: unknown) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

type Idioma = "english" | "italian";

// ---------------------------------------------------------------------------
// Modelos
// ---------------------------------------------------------------------------

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Modelos rápidos y buenos (segundos, no minutos) para la pasarela de Lovable.
 * Si la pasarela no está disponible se cae a los modelos gratuitos de OpenRouter.
 */
const MODELOS_RAPIDOS = ["google/gemini-2.5-flash", "google/gemini-2.0-flash-001", "openai/gpt-4o-mini"];

const MODELOS_FREE = [
  "qwen/qwen3-32b:free",
  "moonshotai/kimi-k2-0905:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-8b:free",
];

type Proveedor = {
  nombre: "gateway" | "openrouter";
  modelo: string;
  url: string;
  key: string;
};

/** Último proveedor que funcionó: se prueba primero para no perder tiempo. */
let PROVEEDOR_OK: Proveedor | null = null;

function candidatos(): Proveedor[] {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const orKey = Deno.env.get("OPENROUTER_API_KEY");
  const override = (Deno.env.get("LANGUAGE_TUTOR_MODEL") || "").trim();

  const lista: Proveedor[] = [];

  if (lovableKey) {
    if (override) {
      lista.push({ nombre: "gateway", modelo: override, url: GATEWAY_URL, key: lovableKey });
    }
    for (const m of MODELOS_RAPIDOS) {
      if (m !== override) lista.push({ nombre: "gateway", modelo: m, url: GATEWAY_URL, key: lovableKey });
    }
  }

  if (orKey) {
    if (override && !lovableKey) {
      lista.push({ nombre: "openrouter", modelo: override, url: OPENROUTER_URL, key: orKey });
    }
    for (const m of MODELOS_FREE) {
      if (m !== override) lista.push({ nombre: "openrouter", modelo: m, url: OPENROUTER_URL, key: orKey });
    }
  }

  if (PROVEEDOR_OK) {
    const primero = lista.findIndex(
      (p) => p.nombre === PROVEEDOR_OK!.nombre && p.modelo === PROVEEDOR_OK!.modelo,
    );
    if (primero > 0) {
      const [ok] = lista.splice(primero, 1);
      lista.unshift(ok);
    }
  }

  return lista;
}

// ---------------------------------------------------------------------------
// Utilidades de fecha
// ---------------------------------------------------------------------------

const todayStr = () => {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000); // hora de Cuba (UTC-4)
  return d.toISOString().split("T")[0];
};

const daysAgo = (n: number) => {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000 - n * 86400000);
  return d.toISOString().split("T")[0];
};

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const IDIOMA_INFO: Record<Idioma, { nombre: string; bandera: string; nota: string }> = {
  english: {
    nombre: "inglés",
    bandera: "🇺🇸",
    nota: "Vigila los tiempos verbales, los artículos y el orden de la oración; en speaking no traduzcas al español.",
  },
  italian: {
    nombre: "italiano",
    bandera: "🇮🇹",
    nota: "Vigila las vocales, los diacríticos (à è é ì ò ù) y la concordancia de género y número; en speaking no traduzcas al español.",
  },
};

const NIVELES: Record<string, string> = {
  beginner: "principiante (A1-A2)",
  elementary: "elemental (A2)",
  "lower-intermediate": "intermedio bajo (B1)",
  intermediate: "intermedio (B1-B2)",
  "upper-intermediate": "intermedio alto (B2)",
  advanced: "avanzado (C1)",
  "upper-advanced": "muy avanzado (C1-C2)",
  proficient: "competente (C2)",
  native: "nativo (C2+)",
};

const MODOS: Record<string, string> = {
  grammar:
    "GRAMÁTICA: explica la regla de forma sencilla, da 3-5 ejemplos en el idioma objetivo y luego 4-5 ejercicios cortos para que los intente.",
  vocabulary:
    "VOCABULARIO: trabaja palabras útiles del tema que pida con definición, ejemplo y una frase de contexto. Máximo 12 palabras por turno. Reutiliza las que ya guardó con guardar_palabra.",
  reading:
    "LECTURA: dale un texto corto del nivel correcto, luego preguntas de comprensión y al final las palabras difíciles.",
  listening:
    "ESCUCHA: el material se LEE EN VOZ ALTA en el navegador, así que el diálogo debe ir en el TEXTO de la respuesta, nunca dentro de mostrar_visual. Entre 6 y 10 líneas de diálogo con etiquetas (Ana:, Marco:), frases cortas y naturales. Sin tablas, sin markdown, sin listas, sin emojis y sin traducciones entre paréntesis dentro del diálogo (el altavoz las leería). Separa el material hablado de las notas con una línea de tres guiones y pon las notas en español DESPUÉS. Termina preguntando en español qué entendió.",
  speaking:
    "SPEAKING: conversación oral en tiempo real. Una sola pregunta corta por turno y espera su respuesta.",
  writing:
    "ESCRITURA: pídele un texto (redacción, correo, descripción) del nivel correcto. Cuando lo escriba, devuelve la versión corregida y una tabla con cada error, cómo corregirlo y por qué.",
};

const SCENARIOS: Record<string, string> = {
  cafe: "CAFÉ O RESTAURANTE: tú eres el camarero/camarera. Él es el cliente que entra, se sienta y pide. Salúdale, ofrécele la carta, responde dudas sobre platos y alergias, toma el pedido, trae lo pedido y al final la cuenta. Incluye un imprevisto (plato no disponible) para que improvise.",
  travel: "AEROPUERTO U HOTEL: tú eres el personal de recepción o de mostrador. Él llega con una reserva, equipaje perdido o buscando indicaciones. Pídele el pasaporte o el número de reserva, explica horarios y servicios y ayúdale a resolver un problema.",
  interview: "ENTREVISTA DE TRABAJO: tú eres el entrevistador. Preséntate y presenta el puesto, haz preguntas típicas (experiencia, fortalezas, debilidades, por qué quiere el puesto) y reacciona a cada respuesta con una pregunta de seguimiento.",
  doctor: "CONSULTA MÉDICA: tú eres el médico. Pregúntale síntomas, desde cuándo, intensidad y antecedentes; después explica el diagnóstico provisional, el tratamiento y las señales de alarma.",
  shopping: "TIENDA DE ROPA: tú eres el dependiente. Pregúntale qué busca, ofrece tallas, colores, materiales y precios, sugiere alternativas y gestiona una devolución.",
  smalltalk: "CONOCER A ALGUIEN: tú eres una persona nueva en una fiesta. Preséntate, haz preguntas cotidianas (trabajo, planes, aficiones, viajes) y comparte algo tuyo para que él también pregunte.",
};

/**
 * Prompt de speaking: corto, hablado y sin clase magistral.
 * Es la diferencia entre "contesta mal" y una conversación real.
 */
function promptSpeaking(info: (typeof IDIOMA_INFO)[Idioma], nivel: string, escenarioId: string) {
  const escenario = SCENARIOS[escenarioId];
  return `MODO SPEAKING — CONVERSACIÓN ORAL EN TIEMPO REAL
Tu respuesta se escucha por voz y Daniel te contesta hablando. Todo debe sonar a charla, nunca a clase.

REGLAS DURAS (tienen prioridad sobre cualquier otra instrucción):
1. Escribe SOLO en ${info.nombre}. El español se usa únicamente en la línea de corrección final.
2. Máximo 2 frases y 30 palabras en total. UNA sola pregunta por turno.
3. PROHIBIDO: markdown, listas, tablas, títulos, negritas, emojis, paréntesis con traducción, despedidas, "ejercicio", "lección", "repitamos", resúmenes y explicaciones de gramática.
4. Si hay un error, añade como MUCHO una línea al final, en español, con el formato exacto: ✗ lo que dijo → ✓ lo correcto. Sin explicación. Si no hay errores, no comentes nada.
5. Nunca repitas ni traduzcas lo que él acaba de decir. Nunca digas que eres una IA.
6. Si no entiendes, pide que repita con una pregunta corta en ${info.nombre}.
7. Nivel de Daniel: ${nivel}. Adapta el vocabulario, sin simplificar de más.
8. El historial puede traer respuestas antiguas con explicaciones en español: ignóralas y sigue estas reglas.
${escenario ? `\nESCENARIO ACTIVO: ${escenario}\nMantente en el rol en todo momento. Si es el primer mensaje, abre tú la conversación con una frase dentro del rol, sin explicaciones previas.` : ""}`;
}

function promptGeneral(
  info: (typeof IDIOMA_INFO)[Idioma],
  nivel: string,
  modoTexto: string,
  escenarioId: string,
) {
  const escenario =
    escenarioId && SCENARIOS[escenarioId]
      ? `

ESCENARIO DE SIMULACIÓN ACTIVO (${escenarioId}). Tiene prioridad sobre el modo:
${SCENARIOS[escenarioId]}
- Mantente en el rol y habla en ${info.nombre}; usa el español solo para corregir y para el resumen final.
- Un solo turno por mensaje.
- Al pedir terminar, sal del rol y cierra en español con: qué hizo bien, errores clave y 3 frases nuevas del escenario.`
      : "";

  return `Eres el Tutor IA de idiomas de Daniel. Estás en la sección "Tutor IA" de su página de Idiomas y le enseñas ${info.nombre} (${info.bandera}).

REGLAS:
1. Explica en ESPAÑOL, pero los ejercicios, ejemplos y correcciones siempre en ${info.nombre}. No mezcles idiomas dentro de una misma frase.
2. Adapta todo a su nivel: ${nivel}.
3. Nada de elogios vacíos: si algo está mal, dilo con respeto y da la versión correcta.
4. Nunca inventes datos de su progreso; usa leer_progreso si lo necesitas.
5. ${info.nota}

${modoTexto}${escenario}

HERRAMIENTAS:
- mostrar_visual: úsala cuando muestres una tabla de conjugación, una comparación de errores, una lista de vocabulario o su progreso.
- guardar_palabra: máximo 2-3 palabras nuevas por mensaje.
- registrar_practica: solo cuando termine un ejercicio o una sesión.
- guardar_memoria: errores recurrentes, preferencias y objetivos. Nada trivial.
- buscar_web: textos, temas actuales o dudas reales.

FORMATO:
- Markdown conciso (máx ~220 palabras por turno).
- Termina con un ejercicio o pregunta concreta.
- Correcciones con el formato: ✗ lo que escribió → ✓ lo correcto → por qué (en español).
- Si el material es para escuchar, escríbelo como texto limpio, sin tablas ni emojis.`;
}

// ---------------------------------------------------------------------------
// Herramientas
// ---------------------------------------------------------------------------

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_web",
      description:
        "Busca información actual en internet. Úsalo para textos, materiales de escucha, referencias gramaticales o temas actuales.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Consulta de búsqueda" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mostrar_visual",
      description:
        "Muestra un apoyo visual en el lienzo junto al chat. Úsalo para tablas de conjugación, comparaciones de errores, listas de vocabulario, resumen de reglas o progreso.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["bar", "line", "pasos", "tabla", "timeline", "fuentes", "comparacion"] },
          titulo: { type: "string" },
          descripcion: { type: "string" },
          datos: {
            type: "array",
            description:
              "Para bar/line: [{label, value}]. Para pasos: [{label, value}] (value = detalle). Para tabla/comparacion: [{label, value, extra}]. Para timeline: [{label, value}] (value = hora). Para fuentes: [{label, value, extra}] (value=resumen, extra=url).",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                extra: { type: "string" },
              },
              required: ["label", "value"],
              additionalProperties: false,
            },
          },
        },
        required: ["tipo", "titulo", "datos"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_palabra",
      description:
        "Guarda una palabra o expresión en su vocabulario del idioma para que pueda verla en la pestaña Vocabulario y repasarla luego.",
      parameters: {
        type: "object",
        properties: {
          palabra: { type: "string", description: "La palabra en el idioma objetivo" },
          traduccion: { type: "string", description: "Traducción al español" },
          ejemplo: { type: "string", description: "Frase de ejemplo en el idioma objetivo" },
          ejemplo_es: { type: "string", description: "Traducción de la frase de ejemplo al español" },
        },
        required: ["palabra", "traduccion"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_practica",
      description:
        "Registra minutos de práctica del usuario para que sus estadísticas de idiomas sumen. Úsalo cuando termine un ejercicio o una sesión de trabajo con él.",
      parameters: {
        type: "object",
        properties: {
          habilidad: {
            type: "string",
            enum: ["vocabulary", "grammar", "speaking", "reading", "listening"],
            description: "Habilidad trabajada. La escritura se registra como 'grammar'.",
          },
          minutos: { type: "number", description: "Minutos practicados (estimación razonable, 5 a 45)" },
        },
        required: ["habilidad", "minutos"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_memoria",
      description:
        "Guarda un error recurrente, una preferencia de aprendizaje o un objetivo del usuario para recordarlo en el futuro.",
      parameters: {
        type: "object",
        properties: {
          contenido: { type: "string" },
          tipo: { type: "string", enum: ["error_recurrente", "preferencia", "objetivo", "logro"] },
          importancia: { type: "number", description: "1 a 5" },
        },
        required: ["contenido"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "leer_progreso",
      description:
        "Lee el progreso real del usuario en ese idioma: últimas sesiones, minutos por habilidad, racha y todas sus palabras guardadas.",
      parameters: {
        type: "object",
        properties: {
          detalle: { type: "string", enum: ["sesiones", "vocabulario", "todo"] },
        },
        required: ["detalle"],
        additionalProperties: false,
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Búsqueda web (DuckDuckGo HTML)
// ---------------------------------------------------------------------------

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, "")).trim();

async function webSearch(query: string) {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LanguageTutorBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { resultados: [], error: `Búsqueda no disponible (${res.status})` };
    const html = await res.text();
    const results: { titulo: string; resumen: string; url: string }[] = [];
    const blockRe =
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="result__a"|$)/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(html)) && results.length < 5) {
      let url = decodeEntities(m[1]);
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg) url = decodeURIComponent(uddg[1]);
      const snippetMatch = m[3].match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      results.push({
        titulo: stripTags(m[2]).slice(0, 160),
        resumen: snippetMatch ? stripTags(snippetMatch[1]).slice(0, 400) : "",
        url,
      });
    }
    if (results.length === 0) return { resultados: [], error: "No se encontraron resultados." };
    return { resultados: results };
  } catch (e) {
    return { resultados: [], error: `Error de búsqueda: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Contexto (compacto y cacheado)
// ---------------------------------------------------------------------------

const HABILIDADES = ["vocabulary", "grammar", "speaking", "reading", "listening"] as const;

const ctxCache = new Map<string, { at: number; data: any }>();
const CTX_TTL_MS = 2 * 60 * 1000;

function racha(sesiones: any[]) {
  const fechas = new Set(sesiones.map((s) => s.session_date));
  let n = 0;
  for (let i = 0; i < 60; i++) {
    if (fechas.has(daysAgo(i))) n++;
    else if (i > 0) break;
  }
  return n;
}

/**
 * Contexto mínimo: solo lo que el modelo usa de verdad.
 * Antes se enviaban hasta 40.000 caracteres de JSON en cada turno, lo que
 * disparaba la latencia y confundía al modelo.
 */
async function buildContext(sb: any, idioma: Idioma, ligero: boolean) {
  const clave = `${idioma}:${ligero ? "ligero" : "full"}`;
  const cacheado = ctxCache.get(clave);
  if (cacheado && Date.now() - cacheado.at < CTX_TTL_MS) return cacheado.data;

  const [settings, sesiones, memorias, palabras] = await Promise.all([
    sb
      .from("language_settings")
      .select("english_level,italian_level")
      .limit(1)
      .maybeSingle(),
    ligero
      ? Promise.resolve({ data: [] })
      : sb
          .from("language_sessions")
          .select(
            "session_date,block_type,total_duration,vocabulary_duration,grammar_duration,speaking_duration,reading_duration,listening_duration,vocabulary_completed,grammar_completed,speaking_completed,reading_completed,listening_completed",
          )
          .eq("language", idioma)
          .gte("session_date", daysAgo(30))
          .order("session_date", { ascending: false }),
    sb
      .from("ai_memories")
      .select("kind,content")
      .eq("source", "language-tutor")
      .order("importance", { ascending: false })
      .limit(ligero ? 6 : 12),
    ligero
      ? Promise.resolve({ data: [] })
      : sb
          .from("user_vocabulary")
          .select("word,translation,status")
          .eq("language", idioma)
          .order("updated_at", { ascending: false })
          .limit(40),
  ]);

  const s: any[] = Array.isArray(sesiones.data) ? sesiones.data : [];
  const nivelBruto = String(
    (idioma === "english" ? settings.data?.english_level : settings.data?.italian_level) || "beginner",
  );

  const minutos: Record<string, number> = {};
  for (const h of HABILIDADES) {
    minutos[h] = Math.round(s.reduce((acc, x) => acc + (Number(x[`${h}_duration`]) || 0), 0));
  }

  const vocab: any[] = Array.isArray(palabras.data) ? palabras.data : [];
  const porEstado: Record<string, number> = {};
  for (const w of vocab) {
    const k = w.status || "new";
    porEstado[k] = (porEstado[k] || 0) + 1;
  }

  const data = {
    nivel: NIVELES[nivelBruto] || nivelBruto,
    racha_dias: racha(s),
    minutos_30d: minutos,
    dias_practicados_30d: Object.fromEntries(
      HABILIDADES.map((h) => [h, s.filter((x) => x[`${h}_completed`]).length]),
    ),
    memoria: (memorias.data || []).map((m: any) => m.content).filter(Boolean),
    vocabulario: ligero
      ? undefined
      : {
          total: vocab.length,
          por_estado: porEstado,
          recientes: vocab.slice(0, 20).map((w) => w.word).filter(Boolean),
        },
  };

  ctxCache.set(clave, { at: Date.now(), data });
  return data;
}

async function leerProgreso(sb: any, idioma: Idioma, detalle: string) {
  if (detalle === "sesiones") {
    const { data } = await sb
      .from("language_sessions")
      .select(
        "session_date,block_type,total_duration,vocabulary_duration,grammar_duration,speaking_duration,reading_duration,listening_duration",
      )
      .eq("language", idioma)
      .order("session_date", { ascending: false })
      .limit(20);
    return data || [];
  }
  if (detalle === "vocabulario") {
    const { data } = await sb
      .from("user_vocabulary")
      .select("word,translation,status,review_count")
      .eq("language", idioma)
      .order("created_at", { ascending: false })
      .limit(80);
    return data || [];
  }
  const { data } = await sb
    .from("user_vocabulary")
    .select("word,status")
    .eq("language", idioma)
    .order("created_at", { ascending: false })
    .limit(200);
  const conteo: Record<string, number> = {};
  for (const w of data || []) {
    const k = w.status || "new";
    conteo[k] = (conteo[k] || 0) + 1;
  }
  return { total_palabras: (data || []).length, por_estado: conteo };
}

// ---------------------------------------------------------------------------
// Ejecución de herramientas
// ---------------------------------------------------------------------------

async function registrarPractica(sb: any, idioma: Idioma, args: any, out: { acciones: any[] }) {
  const hoy = todayStr();
  const habilidad = (HABILIDADES as readonly string[]).includes(args.habilidad) ? args.habilidad : "grammar";
  const minutos = Math.min(45, Math.max(5, Math.round(Number(args.minutos) || 10)));

  const { data: actual } = await sb
    .from("language_sessions")
    .select("*")
    .eq("session_date", hoy)
    .eq("language", idioma)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (actual) {
    // No se suma dos veces el mismo bloque: se guarda el máximo del día.
    const previo = Number(actual[`${habilidad}_duration`]) || 0;
    const delta = Math.max(0, minutos - previo);
    const { error } = await sb
      .from("language_sessions")
      .update({
        [`${habilidad}_completed`]: true,
        [`${habilidad}_duration`]: Math.max(previo, minutos),
        total_duration: (Number(actual.total_duration) || 0) + delta,
      })
      .eq("id", actual.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await sb.from("language_sessions").insert({
      session_date: hoy,
      language: idioma,
      block_type: "morning",
      [`${habilidad}_completed`]: true,
      [`${habilidad}_duration`]: minutos,
      total_duration: minutos,
    });
    if (error) return { error: error.message };
  }

  ctxCache.clear();
  out.acciones.push({ tipo: "practica_registrada", titulo: habilidad, minutos });
  return { ok: true, minutos };
}

async function execTool(
  sb: any,
  idioma: Idioma,
  name: string,
  args: any,
  out: { visuals: any[]; acciones: any[]; fuentes: any[] },
) {
  switch (name) {
    case "buscar_web": {
      const r = await webSearch(String(args.query || ""));
      if (r.resultados?.length) out.fuentes.push(...r.resultados);
      return r;
    }
    case "mostrar_visual": {
      out.visuals.push({
        tipo: args.tipo,
        titulo: args.titulo,
        descripcion: args.descripcion || null,
        datos: Array.isArray(args.datos) ? args.datos : [],
      });
      return { ok: true };
    }
    case "guardar_palabra": {
      const { error } = await sb.from("user_vocabulary").insert({
        language: idioma,
        word: String(args.palabra || "").trim(),
        translation: args.traduccion || null,
        context_en: args.ejemplo || null,
        context_es: args.ejemplo_es || null,
        status: "new",
        review_count: 1,
      });
      if (error) return { error: error.message };
      out.acciones.push({ tipo: "palabra_guardada", titulo: args.palabra });
      return { ok: true };
    }
    case "registrar_practica":
      return await registrarPractica(sb, idioma, args, out);
    case "guardar_memoria": {
      const { error } = await sb.from("ai_memories").insert({
        content: args.contenido,
        kind: args.tipo || "error_recurrente",
        importance: Math.min(5, Math.max(1, Math.round(Number(args.importancia) || 3))),
        source: "language-tutor",
      });
      if (error) return { error: error.message };
      ctxCache.clear();
      out.acciones.push({ tipo: "memoria_guardada", titulo: args.contenido });
      return { ok: true };
    }
    case "leer_progreso":
      return await leerProgreso(sb, idioma, String(args.detalle || "todo"));
    default:
      return { error: "Herramienta desconocida" };
  }
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

type ToolAcc = { id: string; name: string; args: string };

function acumularToolCalls(map: Map<number, ToolAcc>, deltas: any[]) {
  for (const d of deltas) {
    const idx = typeof d?.index === "number" ? d.index : 0;
    const cur = map.get(idx) || { id: "", name: "", args: "" };
    if (d?.id) cur.id = d.id;
    if (d?.function?.name) cur.name += d.function.name;
    if (d?.function?.arguments) cur.args += d.function.arguments;
    map.set(idx, cur);
  }
}

async function* sseDelProveedor(res: Response): AsyncGenerator<any> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, "");
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        if (payload === "[DONE]") return;
        try {
          yield JSON.parse(payload);
        } catch {
          /* fragmento incompleto */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}

interface StreamOpts {
  tools: any[];
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

/**
 * Intenta cada proveedor hasta encontrar uno que responda y emita texto.
 * Devuelve la respuesta HTTP abierta para leerla en streaming.
 */
async function abrirStream(messages: any[], opts: StreamOpts): Promise<Response | null> {
  for (const p of candidatos()) {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 45000);
    const onAbort = () => ctrl.abort();
    opts.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const body: Record<string, unknown> = {
        model: p.modelo,
        messages,
        stream: true,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
      };
      if (opts.tools.length) body.tools = opts.tools;

      const res = await fetch(p.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.key}`,
          ...(p.nombre === "openrouter"
            ? { "HTTP-Referer": "https://lovable.dev", "X-Title": "Segundo Cerebro" }
            : {}),
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (res.ok && res.body) {
        PROVEEDOR_OK = p;
        return res;
      }

      const errText = await res.text().catch(() => "");
      console.warn(`[language-tutor] ${p.nombre}/${p.modelo} -> ${res.status} ${errText.slice(0, 180)}`);
    } catch (e) {
      console.warn(`[language-tutor] ${p.nombre}/${p.modelo} falló: ${(e as Error).message}`);
    } finally {
      clearTimeout(timeout);
      opts.signal?.removeEventListener("abort", onAbort);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const message = body?.message;
    if (!message || typeof message !== "string") return json({ error: "Falta el mensaje" }, 400);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const idioma: Idioma = body?.language === "italian" ? "italian" : "english";
    const info = IDIOMA_INFO[idioma];
    const skill = String(body?.skill || "");
    const modo = MODOS[skill] ? skill : "libre";
    const escenarioId = modo === "speaking" && typeof body?.scenario === "string" ? body.scenario : "";
    const esSpeaking = modo === "speaking";

    // El historial se recorta: menos tokens = respuesta más rápida.
    const history = (Array.isArray(body?.history) ? body.history : [])
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1200) }));

    const ctx = await buildContext(sb, idioma, esSpeaking);
    const nivel = String(ctx.nivel);

    const systemPrompt = esSpeaking
      ? promptSpeaking(info, nivel, escenarioId)
      : promptGeneral(
          info,
          nivel,
          modo === "libre"
            ? `MODO: conversación libre. No hay habilidad fija activa. Si su petición es de una habilidad concreta, aplícale esas directrices; si no, ofrécele una práctica corta y pregúntale cuál quiere.`
            : `MODO ACTIVO: ${modo.toUpperCase()}\n${MODOS[modo]}`,
          escenarioId,
        );

    const messages: any[] = [
      {
        role: "system",
        content: `${systemPrompt}\n\nCONTEXTO (JSON):\n${JSON.stringify(ctx).slice(0, 6000)}`,
      },
      ...history,
      { role: "user", content: message },
    ];

    const out = { visuals: [] as any[], acciones: [] as any[], fuentes: [] as any[] };

    // En speaking NO se usan herramientas: cada ronda de tool-calling es otra
    // llamada completa al modelo y multiplicaba la espera. El panel ya permite
    // registrar los minutos con un botón.
    const herramientas = esSpeaking ? [] : tools;
    const maxRondas = esSpeaking ? 1 : 3;
    const maxTokens = esSpeaking ? 400 : modo === "listening" ? 800 : 1200;
    const temperature = esSpeaking ? 0.7 : 0.5;

    const upstream = new AbortController();
    req.signal.addEventListener("abort", () => upstream.abort(), { once: true });

    const stream = new ReadableStream({
      async start(controller) {
        let cerrado = false;
        const ping = setInterval(() => {
          if (cerrado) return;
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            /* conexión cerrada */
          }
        }, 15000);

        const enviar = (obj: unknown) => {
          if (cerrado) return;
          try {
            controller.enqueue(sse(obj));
          } catch {
            cerrado = true;
          }
        };

        try {
          let textoTotal = "";
          let modeloUsado = "";

          for (let ronda = 0; ronda < maxRondas; ronda++) {
            const res = await abrirStream(messages, {
              tools: herramientas,
              maxTokens,
              temperature,
              signal: upstream.signal,
            });

            if (!res) {
              enviar({
                t: "e",
                v: "No pude conectar con el modelo del tutor. Revisa tu conexión e inténtalo otra vez.",
              });
              return;
            }

            modeloUsado = PROVEEDOR_OK?.modelo || "";
            const toolCalls = new Map<number, ToolAcc>();
            let textoRonda = "";

            for await (const ev of sseDelProveedor(res)) {
              const delta = ev?.choices?.[0]?.delta;
              if (!delta) continue;
              if (typeof delta.content === "string" && delta.content) {
                textoRonda += delta.content;
                textoTotal += delta.content;
                enviar({ t: "d", v: delta.content });
              }
              if (Array.isArray(delta.tool_calls) && delta.tool_calls.length) {
                acumularToolCalls(toolCalls, delta.tool_calls);
              }
            }

            if (toolCalls.size && herramientas.length && !textoRonda) {
              const calls = [...toolCalls.values()].filter((c) => c.name);
              if (!calls.length) break;

              messages.push({
                role: "assistant",
                content: "",
                tool_calls: calls.map((c, i) => ({
                  id: c.id || `call_${ronda}_${i}`,
                  type: "function",
                  function: { name: c.name, arguments: c.args || "{}" },
                })),
              });

              for (let i = 0; i < calls.length; i++) {
                const c = calls[i];
                const callId = c.id || `call_${ronda}_${i}`;
                let args: any = {};
                try {
                  args = JSON.parse(c.args || "{}");
                } catch {
                  args = {};
                }
                const result = await execTool(sb, idioma, c.name, args, out);
                messages.push({
                  role: "tool",
                  tool_call_id: callId,
                  content: JSON.stringify(result).slice(0, 8000),
                });
              }
              continue;
            }

            break;
          }

          if (!textoTotal.trim() && out.visuals.length === 0) {
            enviar({
              t: "e",
              v: `No pude generar una respuesta esta vez. ¿Puedes reformular tu pregunta sobre ${info.nombre}?`,
            });
            return;
          }

          enviar({
            t: "m",
            modelo: modeloUsado,
            visuals: out.visuals,
            acciones: out.acciones,
            fuentes: out.fuentes,
          });
        } catch (e) {
          enviar({ t: "e", v: (e as Error).message || "Error inesperado" });
        } finally {
          cerrado = true;
          clearInterval(ping);
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            /* noop */
          }
          try {
            controller.close();
          } catch {
            /* noop */
          }
        }
      },
      cancel() {
        upstream.abort();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado" }, 500);
  }
});
