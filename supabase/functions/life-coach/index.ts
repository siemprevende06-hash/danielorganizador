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

const AREAS = [
  "universidad", "emprendimiento", "proyectos", "gym", "idiomas", "ajedrez",
  "lectura", "musica", "piano", "guitarra", "apariencia", "finanzas", "mental", "social", "gaming",
];

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

// ---------------- Tools ----------------

const tools = [
  {
    type: "function",
    function: {
      name: "buscar_web",
      description: "Busca información actual en internet. Usa esto cuando necesites datos externos (técnicas, precios, noticias, referencias).",
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
      description: "Muestra un apoyo visual en el lienzo junto al chat para explicar mejor tu respuesta. Úsalo siempre que muestres datos, comparaciones, pasos o resultados de la web.",
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
      name: "crear_tarea",
      description: "Crea una tarea real en la app para la fecha indicada y opcionalmente la asigna a un bloque de la rutina.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          area_id: { type: "string", description: `Una de: ${AREAS.join(", ")}` },
          prioridad: { type: "string", enum: ["high", "medium", "low"] },
          fecha: { type: "string", description: "YYYY-MM-DD. Por defecto hoy." },
          bloque_id: { type: "string", description: "block_id de un bloque de la rutina (opcional)" },
          minutos: { type: "number" },
        },
        required: ["titulo"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_plan_dia",
      description: "Crea varias tareas de golpe (plan del día), cada una con su bloque y área.",
      parameters: {
        type: "object",
        properties: {
          tareas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                area_id: { type: "string" },
                prioridad: { type: "string", enum: ["high", "medium", "low"] },
                bloque_id: { type: "string" },
                fecha: { type: "string" },
                minutos: { type: "number" },
              },
              required: ["titulo"],
              additionalProperties: false,
            },
          },
        },
        required: ["tareas"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "asignar_tarea_a_bloque",
      description: "Asigna una tarea existente a un bloque de la rutina.",
      parameters: {
        type: "object",
        properties: {
          tarea_id: { type: "string" },
          bloque_id: { type: "string" },
        },
        required: ["tarea_id", "bloque_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "completar_tarea",
      description: "Marca una tarea como completada o pendiente.",
      parameters: {
        type: "object",
        properties: {
          tarea_id: { type: "string" },
          completada: { type: "boolean" },
        },
        required: ["tarea_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_memoria",
      description: "Guarda un hecho, preferencia o conclusión importante sobre Daniel para recordarlo en futuras conversaciones.",
      parameters: {
        type: "object",
        properties: {
          contenido: { type: "string" },
          tipo: { type: "string", enum: ["hecho", "preferencia", "objetivo", "emocional", "conclusion"] },
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
      name: "leer_contexto_extra",
      description: "Lee más datos de la app cuando los necesites.",
      parameters: {
        type: "object",
        properties: {
          seccion: {
            type: "string",
            enum: ["mapa_de_vida", "destino", "identidad", "finanzas", "gimnasio", "lectura", "musica", "ajedrez", "idiomas", "revisiones", "esfuerzo_30_dias", "tareas_pendientes"],
          },
        },
        required: ["seccion"],
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
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LifeCoachBot/1.0)" },
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

async function buildContext(sb: any) {
  const today = todayStr();
  const [
    tasksToday, blocks, systems, areaStats, reviews, weekly, monthly, twelve, sprints, goals, streaks, memories, pointB, identity,
  ] = await Promise.all([
    sb.from("tasks").select("id,title,completed,priority,area_id,source,routine_block_id,due_date,estimated_minutes").gte("due_date", `${today}T00:00:00`).lte("due_date", `${today}T23:59:59`),
    sb.from("routine_blocks").select("block_id,title,start_time,end_time,block_type,default_focus,current_focus").order("order_index"),
    sb.from("daily_systems_tracking").select("*").eq("tracking_date", today).maybeSingle(),
    sb.from("daily_area_stats").select("area_id,stat_date,minutes_spent,completed").gte("stat_date", daysAgo(13)),
    sb.from("daily_reviews").select("*").order("review_date", { ascending: false }).limit(5),
    sb.from("weekly_objectives").select("*").order("created_at", { ascending: false }).limit(15),
    sb.from("monthly_area_goals").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("twelve_week_goals").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("sprint_objectives").select("*").order("created_at", { ascending: false }).limit(15),
    sb.from("goals").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("area_streaks").select("*"),
    sb.from("ai_memories").select("kind,content,importance").order("importance", { ascending: false }).limit(60),
    sb.from("point_b_metrics").select("*").limit(30),
    sb.from("identity_plan").select("*").limit(20),
  ]);

  return {
    hoy: today,
    hora_cuba: new Date(Date.now() - 4 * 3600000).toISOString().slice(11, 16),
    tareas_hoy: tasksToday.data || [],
    bloques_rutina: blocks.data || [],
    sistemas_hoy: systems.data || null,
    esfuerzo_14_dias: areaStats.data || [],
    revisiones_recientes: reviews.data || [],
    objetivos_semana: weekly.data || [],
    metas_mes: monthly.data || [],
    metas_trimestre: twelve.data || [],
    objetivos_sprint: sprints.data || [],
    metas: goals.data || [],
    rachas: streaks.data || [],
    memoria_largo_plazo: memories.data || [],
    destino_metricas: pointB.data || [],
    plan_identidad: identity.data || [],
  };
}

async function readExtra(sb: any, seccion: string) {
  const q = async (table: string, select = "*", limit = 40) => {
    const { data, error } = await sb.from(table).select(select).limit(limit);
    return error ? { error: error.message } : data;
  };
  switch (seccion) {
    case "mapa_de_vida": return await q("vision_board_cells");
    case "destino": return { metricas: await q("point_b_metrics"), texto: await q("text_sections") };
    case "identidad": return { plan: await q("identity_plan"), sistemas: await q("identity_systems") };
    case "finanzas": return { carteras: await q("wallets"), movimientos: await q("transactions", "*", 60) };
    case "gimnasio": return { sesiones: await q("workout_sessions", "*", 30), fisico: await q("physical_tracking", "*", 30) };
    case "lectura": return { biblioteca: await q("reading_library"), sesiones: await q("reading_sessions", "*", 30) };
    case "musica": return { repertorio: await q("music_repertoire"), practicas: await q("music_practice_sessions", "*", 30) };
    case "ajedrez": return { metas: await q("chess_goals"), sesiones: await q("chess_sessions", "*", 30) };
    case "idiomas": return { config: await q("language_settings"), sesiones: await q("language_sessions", "*", 30) };
    case "revisiones": return await q("daily_reviews", "*", 20);
    case "esfuerzo_30_dias": {
      const { data } = await sb.from("daily_area_stats").select("area_id,stat_date,minutes_spent,completed").gte("stat_date", daysAgo(30));
      return data || [];
    }
    case "tareas_pendientes": {
      const { data } = await sb.from("tasks").select("id,title,priority,area_id,source,due_date,routine_block_id").eq("completed", false).limit(80);
      return data || [];
    }
    default: return { error: "Sección desconocida" };
  }
}

// ---------------- Tool execution ----------------

async function execTool(sb: any, name: string, args: any, out: { visuals: any[]; acciones: any[]; fuentes: any[] }) {
  switch (name) {
    case "buscar_web": {
      const r = await webSearch(String(args.query || ""));
      if (r.resultados?.length) out.fuentes.push(...r.resultados);
      return r;
    }
    case "mostrar_visual": {
      const visual = {
        tipo: args.tipo,
        titulo: args.titulo,
        descripcion: args.descripcion || null,
        datos: Array.isArray(args.datos) ? args.datos : [],
      };
      out.visuals.push(visual);
      return { ok: true };
    }
    case "crear_tarea": {
      const fecha = args.fecha || todayStr();
      const { data, error } = await sb.from("tasks").insert({
        title: args.titulo,
        area_id: args.area_id || null,
        priority: args.prioridad || "medium",
        due_date: `${fecha}T12:00:00Z`,
        routine_block_id: args.bloque_id || null,
        estimated_minutes: args.minutos || null,
        status: "pending",
        source: "general",
        completed: false,
      }).select("id,title").single();
      if (error) return { error: error.message };
      out.acciones.push({ tipo: "tarea_creada", titulo: data.title, id: data.id, bloque: args.bloque_id || null });
      return { ok: true, id: data.id };
    }
    case "crear_plan_dia": {
      const rows = (args.tareas || []).map((t: any) => ({
        title: t.titulo,
        area_id: t.area_id || null,
        priority: t.prioridad || "medium",
        due_date: `${t.fecha || todayStr()}T12:00:00Z`,
        routine_block_id: t.bloque_id || null,
        estimated_minutes: t.minutos || null,
        status: "pending",
        source: "general",
        completed: false,
      }));
      if (rows.length === 0) return { error: "Sin tareas" };
      const { data, error } = await sb.from("tasks").insert(rows).select("id,title,routine_block_id");
      if (error) return { error: error.message };
      (data || []).forEach((d: any) =>
        out.acciones.push({ tipo: "tarea_creada", titulo: d.title, id: d.id, bloque: d.routine_block_id }));
      return { ok: true, creadas: data?.length || 0 };
    }
    case "asignar_tarea_a_bloque": {
      const { error } = await sb.from("tasks").update({ routine_block_id: args.bloque_id }).eq("id", args.tarea_id);
      if (error) return { error: error.message };
      out.acciones.push({ tipo: "tarea_asignada", id: args.tarea_id, bloque: args.bloque_id });
      return { ok: true };
    }
    case "completar_tarea": {
      const completed = args.completada !== false;
      const { error } = await sb.from("tasks").update({ completed, status: completed ? "completed" : "pending" }).eq("id", args.tarea_id);
      if (error) return { error: error.message };
      out.acciones.push({ tipo: completed ? "tarea_completada" : "tarea_reabierta", id: args.tarea_id });
      return { ok: true };
    }
    case "guardar_memoria": {
      const { error } = await sb.from("ai_memories").insert({
        content: args.contenido,
        kind: args.tipo || "hecho",
        importance: Math.min(5, Math.max(1, Math.round(args.importancia || 3))),
        source: "coach",
      });
      if (error) return { error: error.message };
      out.acciones.push({ tipo: "memoria_guardada", titulo: args.contenido });
      return { ok: true };
    }
    case "leer_contexto_extra":
      return await readExtra(sb, args.seccion);
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

    const ctx = await buildContext(sb);

    const systemPrompt = `Eres el Coach de Vida IA de Daniel: mitad estratega de productividad, mitad terapeuta cercano. Hablas SIEMPRE en español, directo, cálido y honesto. No adulas: si algo va mal, se lo dices con respeto y le das el siguiente paso concreto.

Tu trabajo:
1. Ayudarle a planificar (hoy, semana, mes, trimestre) usando sus bloques de rutina reales.
2. Evaluar su vida por áreas con los datos reales que tienes abajo, decirle si va en la dirección correcta hacia su Destino y su Plan Identidad.
3. Acompañarlo emocionalmente: escucha, valida, y luego reencuadra hacia la acción mínima posible.
4. Usar herramientas cuando aporte: buscar en la web, crear tareas y asignarlas a bloques, guardar memoria de largo plazo.
5. SIEMPRE que hables de datos, comparaciones, pasos, plan del día o resultados web, llama a "mostrar_visual" para dibujarlo en el lienzo. Puedes llamarla varias veces.

Reglas:
- Nunca inventes datos: si no los tienes, usa leer_contexto_extra o dilo.
- Áreas válidas para tareas: ${AREAS.join(", ")}.
- Antes de crear tareas elige bloques reales de "bloques_rutina" (usa su block_id).
- Guarda con guardar_memoria lo importante y duradero que descubras de él (no trivialidades).
- Respuestas en markdown, concisas (máx ~250 palabras) y terminando con una pregunta o un siguiente paso.

CONTEXTO REAL DE SU VIDA (JSON):
${JSON.stringify(ctx).slice(0, 60000)}`;

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
        const result = await execTool(sb, call.function?.name, args, out);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 12000),
        });
      }
      if (msg.content) finalText = msg.content;
    }

    if (!finalText && out.visuals.length === 0) {
      finalText = "No pude generar una respuesta esta vez. ¿Puedes reformular tu pregunta?";
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
