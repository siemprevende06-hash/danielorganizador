import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Idioma = "english" | "italian";

const MODELOS_FREE = [
  "qwen/qwen3-32b:free",
  "qwen/qwen3-8b:free",
  "moonshotai/kimi-k2-0905:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

let MODELO_ACTIVO: string | null = null;

const todayStr = () => {
  // Hora de Cuba (UTC-4)
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

const daysAgo = (n: number) => {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000 - n * 86400000);
  return d.toISOString().split("T")[0];
};

const IDIOMA_INFO: Record<Idioma, { nombre: string; bandera: string; nota: string }> = {
  english: {
    nombre: "inglés",
    bandera: "🇺🇸",
    nota: "Revisa sobre todo los tiempos verbales, los artículos y el orden de la oración; en speaking, no traduzcas al español.",
  },
  italian: {
    nombre: "italiano",
    bandera: "🇮🇹",
    nota: "Revisa sobre todo las vocales, los diacríticos (à è é ì ò ù) y la concordancia de género y número; en speaking, no traduzcas al español.",
  },
};

const MODOS: Record<string, string> = {
  grammar: "GRAMÁTICA: explica la regla de forma sencilla, da 3-5 ejemplos del idioma objetivo y luego 4-5 ejercicios para que él los intente.",
  vocabulary: "VOCABULARIO: trabaja con palabras útiles del tema que pida, da definición, ejemplo y una frase con contexto. Repite palabras que ya Haya guardado con guardar_palabra.",
  reading: "LECTURA: dale un texto corto del nivel correcto, luego pregúntale preguntas de comprensión y al final explica las palabras difíciles.",
  listening: "ESCUCHA: tu respuesta se va a LEER EN VOZ ALTA por el navegador de Daniel, así que el material debe ir en el TEXTO de tu respuesta, nunca dentro de mostrar_visual. Escribe entre 6 y 10 líneas de diálogo con etiquetas (Ana:, Marco:), frases cortas y naturalidad de una conversación real. NO uses tablas, NO uses markdown, NO uses listas con guiones, NO pongas emojis ni símbolos, y NO traduzcas entre paréntesis lo que se dice en el idioma objetivo, porque el altavoz lo leería tal cual. Separa el material hablado del resto con una línea con tres guiones, y pon las notas y aclaraciones en español DESPUÉS de esa línea. Al final pregúntale en español qué entendió para comprobar su comprensión. Si quieres mostrar vocabulario, usa mostrar_visual SOLO para ese resumen posterior, nunca para el diálogo.",
  speaking: "SPEAKING:Conversación oral. Haz SIEMPRE UNA SOLA pregunta o enunciado por turno y espera su respuesta. Cuando responda, corrige sus errores uno por uno (error → versión corregida → explicación en español) y sigue con la siguiente pregunta. Al final pide un resumen oral de 4 frases.",
  writing: "ESCRITURA: pídele un texto (redacción, correo, descripción) del nivel correcto. Cuando lo escriba, devuelve la versión corregida y una tabla con cada error, cómo corregirlo y por qué.",
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

// ---------------- Tools ----------------

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_web",
      description: "Busca información actual en internet. Úsalo para textos, materiales de escucha, referencias gramaticales o temas actuales.",
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
      description: "Muestra un apoyo visual en el lienzo junto al chat. Úsalo SIEMPRE para tablas de conjugación, comparaciones de errores, listas de vocabulario, resumen de reglas o progreso.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["bar", "line", "pasos", "tabla", "timeline", "fuentes", "comparacion"] },
          titulo: { type: "string" },
          descripcion: { type: "string" },
          datos: {
            type: "array",
            description: "Para bar/line: [{label, value}]. Para pasos: [{label, value}] (value = detalle). Para tabla/comparacion: [{label, value, extra}]. Para timeline: [{label, value}] (value = hora). Para fuentes: [{label, value, extra}] (value=resumen, extra=url).",
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
      description: "Guarda una palabra o expresión en su vocabulario del idioma para que pueda verla en la pestaña Vocabulario y repasarla luego.",
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
      description: "Registra minutos de práctica del usuario para que sus estadísticas de idiomas sumen. Úsalo cuando termine un ejercicio o una sesión de trabajo con él.",
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
      description: "Guarda un error recurrente, una preferencia de aprendizaje o un objetivo del usuario para no repetirlos y recordarlos en el futuro.",
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
      description: "Lee el progreso real del usuario en ese idioma: últimas sesiones, minutos por habilidad, racha y todas sus palabras guardadas.",
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

// ---------------- Web search (DuckDuckGo HTML) ----------------

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, "")).trim();

async function webSearch(query: string) {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LanguageTutorBot/1.0)" },
    });
    if (!res.ok) return { resultados: [], error: `Búsqueda no disponible (${res.status})` };
    const html = await res.text();
    const results: { titulo: string; resumen: string; url: string }[] = [];
    const blockRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="result__a"|$)/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(html)) && results.length < 6) {
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

// ---------------- Context ----------------

const HABILIDADES = ["vocabulary", "grammar", "speaking", "reading", "listening"] as const;

function resumirHabilidades(sesiones: any[]) {
  const totales: Record<string, number> = {};
  for (const h of HABILIDADES) {
    totales[h] = sesiones.reduce((acc, s) => acc + (Number(s[`${h}_duration`]) || 0), 0);
  }
  const completadas: Record<string, number> = {};
  for (const h of HABILIDADES) {
    completadas[h] = sesiones.filter((s) => s[`${h}_completed`]).length;
  }
  return { minutos_por_habilidad: totales, dias_por_habilidad: completadas };
}

function racha(sesiones: any[]) {
  const fechas = new Set(sesiones.map((s) => s.session_date));
  let n = 0;
  for (let i = 0; i < 60; i++) {
    if (fechas.has(daysAgo(i))) n++;
    else if (i > 0) break;
  }
  return n;
}

async function buildContext(sb: any, idioma: Idioma) {
  const hoy = todayStr();
  const [settings, sesiones, palabras, memorias] = await Promise.all([
    sb.from("language_settings").select("current_language,english_level,italian_level,ai_conversation_enabled").limit(1).maybeSingle(),
    sb.from("language_sessions").select("*").eq("language", idioma).gte("session_date", daysAgo(30)).order("session_date", { ascending: false }),
    sb.from("user_vocabulary").select("word,translation,status,review_count").eq("language", idioma).order("updated_at", { ascending: false }).limit(80),
    sb.from("ai_memories").select("kind,content,importance").eq("source", "language-tutor").order("importance", { ascending: false }).limit(40),
  ]);

  const s = Array.isArray(sesiones.data) ? sesiones.data : [];
  const nivelBruto =
    (idioma === "english" ? settings.data?.english_level : settings.data?.italian_level) || "beginner";

  return {
    hoy,
    idioma,
    nivel: nivelBruto,
    nivel_explicado: NIVELES[nivelBruto] || nivelBruto,
    racha_dias: racha(s),
    minutos_totales_30_dias: s.reduce((acc, x) => acc + (Number(x.total_duration) || 0), 0),
    ...resumirHabilidades(s),
    ultimas_sesiones: s.slice(0, 10),
    palabras_guardadas: palabras.data || [],
    memoria: memorias.data || [],
  };
}

async function leerProgreso(sb: any, idioma: Idioma, detalle: string) {
  if (detalle === "sesiones") {
    const { data } = await sb
      .from("language_sessions")
      .select("session_date,block_type,total_duration,vocabulary_duration,grammar_duration,speaking_duration,reading_duration,listening_duration")
      .eq("language", idioma)
      .order("session_date", { ascending: false })
      .limit(30);
    return data || [];
  }
  if (detalle === "vocabulario") {
    const { data } = await sb
      .from("user_vocabulary")
      .select("word,translation,context_en,context_es,status,review_count,created_at")
      .eq("language", idioma)
      .order("created_at", { ascending: false })
      .limit(120);
    return data || [];
  }
  const { data } = await sb
    .from("user_vocabulary")
    .select("word,translation,status")
    .eq("language", idioma)
    .order("created_at", { ascending: false })
    .limit(200);
  const conteo: Record<string, number> = {};
  for (const w of data || []) {
    const k = w.status || "new";
    conteo[k] = (conteo[k] || 0) + 1;
  }
  return { total_palabras: (data || []).length, por_estado: conteo, palabras: data || [] };
}

// ---------------- Tool execution ----------------

async function registrarPractica(sb: any, idioma: Idioma, args: any, out: { acciones: any[] }) {
  const hoy = todayStr();
  const habilidad = HABILIDADES.includes(args.habilidad) ? args.habilidad : "grammar";
  const minutos = Math.min(45, Math.max(5, Math.round(Number(args.minutos) || 10)));

  const { data: actual } = await sb
    .from("language_sessions")
    .select("id,total_duration,block_type")
    .eq("session_date", hoy)
    .eq("language", idioma)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (actual) {
    const { error } = await sb
      .from("language_sessions")
      .update({
        [`${habilidad}_completed`]: true,
        [`${habilidad}_duration`]: minutos,
        total_duration: (Number(actual.total_duration) || 0) + minutos,
      })
      .eq("id", actual.id);
    if (error) return { error: error.message };
    out.acciones.push({ tipo: "practica_registrada", titulo: habilidad, minutos });
    return { ok: true, minutos };
  }

  const { error } = await sb.from("language_sessions").insert({
    session_date: hoy,
    language: idioma,
    block_type: "morning",
    [`${habilidad}_completed`]: true,
    [`${habilidad}_duration`]: minutos,
    total_duration: minutos,
  });
  if (error) return { error: error.message };
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
        word: String(args.palabra).trim(),
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
        importance: Math.min(5, Math.max(1, Math.round(args.importencia || 3))),
        source: "language-tutor",
      });
      if (error) return { error: error.message };
      out.acciones.push({ tipo: "memoria_guardada", titulo: args.contenido });
      return { ok: true };
    }
    case "leer_progreso":
      return await leerProgreso(sb, idioma, String(args.detalle || "todo"));
    default:
      return { error: "Herramienta desconocida" };
  }
}

// ---------------- Handler ----------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) return json({ error: "OPENROUTER_API_KEY no está configurada" }, 500);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => null);
    const message = body?.message;
    const history: { role: string; content: string }[] = Array.isArray(body?.history) ? body.history : [];
    if (!message || typeof message !== "string") return json({ error: "Falta el mensaje" }, 400);

    const idioma: Idioma = body?.language === "italian" ? "italian" : "english";
    const info = IDIOMA_INFO[idioma];
    const modo = MODOS[String(body?.skill || "")] ? String(body.skill) : "libre";
    const ctx = await buildContext(sb, idioma);

    const modoTexto = modo === "libre"
      ? `MODO: conversación libre. Estás en la pestaña "Tutor IA" de su página de Idiomas con el ${info.nombre} seleccionado y no hay habilidad fija activa. Si su petición es claramente de una habilidad concreta, aplícale esas directrices. Si no, ofrécele una práctica corta de las 6 habilidades y pregúntale cuál quiere empezar.`
      : `MODO ACTIVO: ${modo.toUpperCase()}\n${MODOS[modo]}`;

    const systemPrompt = `Eres el Tutor IA de idiomas de Daniel. Estás en la sección "Tutor IA" de su página de Idiomas y le enseñas ${info.nombre} (${info.bandera}).

REGLAS DE ORO:
1. SIEMPRE explicas en ESPAÑOL, pero SIEMPRE enseñas, escribes los ejercicios, los ejemplos y las correcciones en ${info.nombre}. Nunca le pongas textos en inglés si estás enseñando italiano, ni al revés.
2. Adapta TODO a su nivel actual: ${String(ctx.nivel_explicado)}. Si el nivel es bajo, frases cortas y vocabulario básico. Si es alto, exígete con matiz, registro y tiempos verbales avanzados.
3. No lo elogias vacío: si algo está mal, se lo dices con respeto y le das la versión corregida.
4. Nunca inventes datos sobre su progreso: usa leer_progreso si lo necesitas.
5. ${info.nota}

${modoTexto}

HERRAMIENTAS:
- mostrar_visual: OBLIGATORIA en cuanto muestres una tabla de conjugación, una comparación de errores, una lista de vocabulario, una regla explicada paso a paso o su progreso. Puedes llamarla varias veces.
- guardar_palabra: úsala para guardar en su vocabulario las palabras nuevas o útiles que aparezcan (máx 2-3 por mensaje).
- registrar_practica: úsala SOLO cuando termine un ejercicio o una sesión, no antes.
- guardar_memoria: guarda con esto sus errores recurrentes ("siempre confunde el passé composé"), sus preferencias ("prefiere ejemplos de viajes") y sus objetivos ("quiere examinarse el A2 en marzo"). No guardes trivialidades.
- buscar_web: para textos, artículos, temas actuales o referencias de gramática reales.

FORMATO:
- Respuestas en markdown, concisas (máx ~220 palabras por turno).
- Termina siempre con un ejercicio o pregunta concreta para que practique ahora.
- En correcciones usa el formato: ✗ lo que escribió → ✓ lo correcto → por qué (en español).
- IMPORTANTE: cada respuesta tuya tiene un botón de altavoz y puede leerse en voz alta. Cuando el material esté pensado para escuchar (diálogos, frases para repetir, pronunciación), escríbelo como texto hablado limpio, sin tablas ni markdown ni emojis, porque el altavoz lo leerá tal cual.

CONTEXTO REAL DE SU ${info.nombre.toUpperCase()} (JSON):
${JSON.stringify(ctx).slice(0, 40000)}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const out = { visuals: [] as any[], acciones: [] as any[], fuentes: [] as any[] };
    let finalText = "";

    const chat = (modelo: string) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Segundo Cerebro",
        },
        body: JSON.stringify({ model: modelo, messages, tools }),
      });

    for (let round = 0; round < 6; round++) {
      let res: Response | null = null;
      if (MODELO_ACTIVO) {
        try { res = await chat(MODELO_ACTIVO); } catch { res = null; }
      }
      if (!res || !res.ok) {
        for (const m of MODELOS_FREE) {
          try { res = await chat(m); } catch { continue; }
          if (res.ok) { MODELO_ACTIVO = m; break; }
          if (res.status === 401 || res.status === 403) break;
        }
        if (!res || !res.ok) {
          try {
            const mr = await fetch("https://openrouter.ai/api/v1/models", {
              headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
            });
            if (mr.ok) {
              const lista = await mr.json();
              const free: string[] = (lista.data || [])
                .filter((x: any) => x.pricing && Number(x.pricing.prompt) === 0 && Number(x.pricing.completion) === 0)
                .map((x: any) => x.id)
                .slice(0, 12);
              for (const m of free) {
                try { res = await chat(m); } catch { continue; }
                if (res.ok) { MODELO_ACTIVO = m; break; }
                if (res.status === 401 || res.status === 403) break;
              }
            }
          } catch { /* sin descubrimiento */ }
        }
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
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) return json({ error: "Respuesta vacía del modelo" }, 502);

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        finalText = msg.content || "";
        break;
      }

      messages.push({ role: "assistant", content: msg.content || "", tool_calls: toolCalls });
      for (const call of toolCalls) {
        let args: any = {};
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch { args = {}; }
        const result = await execTool(sb, idioma, call.function?.name, args, out);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 12000),
        });
      }
      if (msg.content) finalText = msg.content;
    }

    if (!finalText && out.visuals.length === 0) {
      finalText = `No pude generar una respuesta esta vez. ¿Puedes reformular tu pregunta sobre ${info.nombre}?`;
    }

    return json({
      content: finalText,
      visuals: out.visuals,
      acciones: out.acciones,
      fuentes: out.fuentes,
    });
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado" }, 500);
  }
});
