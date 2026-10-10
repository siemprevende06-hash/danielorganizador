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

const CUBA_OFFSET_MS = 4 * 60 * 60 * 1000;

const cubaNow = () => new Date(Date.now() - CUBA_OFFSET_MS);

const ymd = (d: Date) => d.toISOString().split("T")[0];

const todayStr = () => ymd(cubaNow());

const daysAgo = (n: number) => ymd(new Date(Date.now() - CUBA_OFFSET_MS - n * 86400000));

const contarDias = (start: string, end: string) =>
  Math.max(1, Math.floor((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1);

const DOW_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Resuelve el rango de fechas (hora de Cuba) para un período pedido por el coach.
function resolverPeriodo(periodo: string, fecha?: string): { start: string; end: string; label: string } {
  const base = fecha ? new Date(`${fecha}T12:00:00Z`) : cubaNow();
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const day = base.getUTCDate();
  let start: Date, end: Date, label: string;
  switch (periodo) {
    case "dia":
      start = new Date(Date.UTC(y, m, day));
      end = new Date(Date.UTC(y, m, day));
      label = `día ${ymd(start)}`;
      break;
    case "semana": {
      const dow = new Date(Date.UTC(y, m, day)).getUTCDay();
      const diffToMon = (dow + 6) % 7;
      start = new Date(Date.UTC(y, m, day - diffToMon));
      end = new Date(Date.UTC(y, m, day - diffToMon + 6));
      label = `semana del ${ymd(start)} al ${ymd(end)}`;
      break;
    }
    case "trimestre": {
      const q = Math.floor(m / 3);
      start = new Date(Date.UTC(y, q * 3, 1));
      end = new Date(Date.UTC(y, q * 3 + 3, 0));
      label = `trimestre ${q + 1} de ${y}`;
      break;
    }
    case "ano":
      start = new Date(Date.UTC(y, 0, 1));
      end = new Date(Date.UTC(y, 11, 31));
      label = `año ${y}`;
      break;
    case "mes":
    default:
      start = new Date(Date.UTC(y, m, 1));
      end = new Date(Date.UTC(y, m + 1, 0));
      label = `mes ${m + 1} de ${y}`;
      break;
  }
  return { start: ymd(start), end: ymd(end), label };
}

// Horas de sueño a partir de "HH:MM" (espejo de src/lib/sleep.ts)
function calcSleepHours(wakeTime: string, sleepTime: string | undefined | null): number {
  if (!wakeTime || !sleepTime) return 0;
  const [wh, wm] = wakeTime.split(":").map(Number);
  const [sh, sm] = sleepTime.split(":").map(Number);
  if ([wh, wm, sh, sm].some((n) => isNaN(n))) return 0;
  const wakeMins = wh * 60 + wm;
  const sleepMins = sh * 60 + sm;
  const diff = sleepMins > wakeMins ? 24 * 60 - sleepMins + wakeMins : wakeMins - sleepMins;
  return Math.round((diff / 60) * 10) / 10;
}

// ---------------- Esfuerzo: definiciones (espejo de EstadisticasEsfuerzo.tsx) ----------------

const SOSTEN_LABELS: Record<string, string> = {
  "pre-entreno": "Pre-entreno", desayuno: "Desayuno", "merienda-1": "Merienda 1",
  almuerzo: "Almuerzo", "merienda-2": "Merienda 2", comida: "Comida",
  "antes-dormir": "Antes de dormir", suplementos: "Suplementos",
  gym: "Gym", "horario-regular": "Horario",
  "skincare-manana": "Skincare AM", "skincare-noche": "Skincare PM", "banarme-vestirme": "Bañarse",
  "rutina-activacion": "Activación", "alistamiento-desayuno": "Alistamiento", "rutina-desactivacion": "Desactivación",
  "no-videojuegos": "No videojuegos", "no-porn": "No porn", "no-fap": "No fap", "redes-sociales": "Redes sociales",
  "habit-sueno": "Hábito sueño", "habit-rutina-activacion": "Hábito activación", "habit-entrenamiento": "Hábito gym",
  "habit-desayuno": "Hábito desayuno", "habit-skincare-am": "Hábito skincare AM", "habit-skincare-pm": "Hábito skincare PM",
  "habit-rutina-desactivacion": "Hábito desactivación", "habit-alimentacion": "Hábito alimentación",
  "habit-finanzas": "Hábito finanzas", "mini-nofap": "Mini no fap", "mini-nosocial": "Mini no social",
};

// Mismo conjunto que usa la página para "Sostén promedio/día" y consistencia.
const SOSTEN_ALL: string[] = [
  "pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir", "suplementos", "gym", "horario-regular",
  "habit-sueno", "habit-rutina-activacion", "habit-entrenamiento", "habit-desayuno", "habit-skincare-am", "habit-skincare-pm",
  "habit-rutina-desactivacion", "habit-alimentacion", "habit-finanzas", "mini-nofap", "mini-nosocial",
  "rutina-activacion", "alistamiento-desayuno", "rutina-desactivacion",
  "no-videojuegos", "no-porn", "no-fap", "redes-sociales",
  "skincare-manana", "skincare-noche", "banarme-vestirme",
];

const MEJORA_HABITS = [
  { id: "lectura", label: "Lectura", target: 20 },
  { id: "musica", label: "Música (piano/guitarra)", target: 30 },
  { id: "ajedrez", label: "Ajedrez", target: 15 },
  { id: "idiomas", label: "Idiomas", target: 30 },
  { id: "game", label: "Game (seducción)", target: 15 },
  { id: "entrenamiento-fisico", label: "Entreno", target: 60 },
];

const ENFOQUE_AREAS = ["universidad", "emprendimiento", "proyectos"];

const toMin = (t: string | null | undefined) => {
  if (!t) return null;
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

function getMejoraMinutes(d: any, id: string): number {
  if (id === "entrenamiento-fisico") return Number(d.workout_duration) || 0;
  const td = d.time_data || {};
  if (id === "idiomas") return (Number(td.italiano) || 0) + (Number(td.ingles) || 0) + (Number(td.idiomas) || 0);
  return Number(td[id]) || 0;
}

// ---------------- Esfuerzo: agregación ----------------

async function buildEsfuerzo(sb: any, start: string, end: string, opts: { detalle?: boolean } = {}) {
  const detalle = opts.detalle !== false;
  const [sysRes, areaRes, taskRes] = await Promise.all([
    sb.from("daily_systems_tracking")
      .select("tracking_date,completions,time_data,count_data,workout_duration,skipped,active_focus_areas,wake_time,sleep_time")
      .gte("tracking_date", start).lte("tracking_date", end).order("tracking_date"),
    sb.from("daily_area_stats")
      .select("area_id,stat_date,time_spent_minutes,time_goal_minutes,completed")
      .gte("stat_date", start).lte("stat_date", end),
    sb.from("tasks")
      .select("id,title,completed,source,due_date,area_id")
      .gte("due_date", `${start}T00:00:00`).lte("due_date", `${end}T23:59:59`),
  ]);

  const days: any[] = sysRes.data || [];
  const stats: any[] = areaRes.data || [];
  const tasks: any[] = taskRes.data || [];

  const diasRegistrados = new Set(days.map((d) => d.tracking_date));
  const nDias = diasRegistrados.size;
  const diasEnPeriodo = contarDias(start, end);

  // Sostén por hábito (hecho / no_hice / sin_registro)
  const sostenDetalle = SOSTEN_ALL.map((id) => {
    let hecho = 0, noHice = 0;
    days.forEach((d) => {
      const c = d.completions || {};
      const s = d.skipped || {};
      if (c[id] === true) hecho++;
      else if (s[id] === true) noHice++;
    });
    return { habito: SOSTEN_LABELS[id] || id, hecho, no_hice: noHice, sin_registro: Math.max(0, nDias - hecho - noHice) };
  });

  const totalSosten = days.reduce((acc, d) => {
    const c = d.completions || {};
    return acc + SOSTEN_ALL.filter((h) => c[h] === true).length;
  }, 0);
  const sostenPosibles = nDias * SOSTEN_ALL.length;
  const sostenPct = sostenPosibles ? Math.round((totalSosten / sostenPosibles) * 100) : 0;

  const diasConsistentes = days.filter((d) => {
    const c = d.completions || {};
    return SOSTEN_ALL.filter((h) => c[h] === true).length / SOSTEN_ALL.length >= 0.8;
  }).length;

  // Mejora por hábito
  const mejora = MEJORA_HABITS.map((h) => {
    let minutos = 0, diasMeta = 0, noHice = 0, diasConActividad = 0;
    days.forEach((d) => {
      const v = getMejoraMinutes(d, h.id);
      minutos += v;
      if (v > 0) diasConActividad++;
      if (v >= h.target) diasMeta++;
      const s = d.skipped || {};
      const skipped = h.id === "entrenamiento-fisico"
        ? s["entrenamiento-fisico"]
        : h.id === "idiomas"
          ? (s.italiano || s.ingles)
          : s[h.id];
      if (skipped && v === 0) noHice++;
    });
    return {
      habito: h.label, minutos, dias_con_actividad: diasConActividad, dias_meta: diasMeta,
      meta_diaria_min: h.target, no_hice: noHice, sin_registro: Math.max(0, nDias - diasConActividad - noHice),
    };
  });

  // Enfoque por área
  const areaAgg: Record<string, { min: number; dias: Set<string> }> = {};
  stats.forEach((s) => {
    if (!ENFOQUE_AREAS.includes(s.area_id)) return;
    if (!areaAgg[s.area_id]) areaAgg[s.area_id] = { min: 0, dias: new Set() };
    areaAgg[s.area_id].min += s.time_spent_minutes || 0;
    if ((s.time_spent_minutes || 0) > 0) areaAgg[s.area_id].dias.add(s.stat_date);
  });
  const enfoque = ENFOQUE_AREAS.map((a) => {
    let noHice = 0, noEnfoque = 0;
    days.forEach((d) => {
      const act = Array.isArray(d.active_focus_areas) ? d.active_focus_areas : ENFOQUE_AREAS;
      const s = d.skipped || {};
      if (!act.includes(a)) { noEnfoque++; return; }
      if (s[a] === true) noHice++;
    });
    const diasActivos = areaAgg[a]?.dias.size || 0;
    return {
      area: a, minutos: areaAgg[a]?.min || 0, dias_activos: diasActivos,
      no_hice: noHice, no_enfoque: noEnfoque, sin_dato: Math.max(0, nDias - diasActivos - noHice - noEnfoque),
    };
  });

  const esGeneral = (t: any) => t.completed !== undefined && (t.source === "general" || (!t.source && !t.area_id));
  const tareasGeneralesCompletadas = tasks.filter((t) => esGeneral(t) && t.completed).length;
  const tareasGeneralesPendientes = tasks.filter((t) => esGeneral(t) && !t.completed).length;

  // Sueño
  let sleepTotal = 0, sleepDays = 0, sleepOk = 0;
  days.forEach((d) => {
    const h = calcSleepHours(d.wake_time || "", d.sleep_time);
    if (h > 0) { sleepTotal += h; sleepDays++; if (h >= 7) sleepOk++; }
  });

  const out: any = {
    periodo: { desde: start, hasta: end },
    dias_en_periodo: diasEnPeriodo,
    dias_con_registro: nDias,
    dias_sin_registro: Math.max(0, diasEnPeriodo - nDias),
    sosten_pct_promedio: sostenPct,
    sosten_completados: totalSosten,
    sosten_posibles: sostenPosibles,
    consistencia_pct: nDias ? Math.round((diasConsistentes / nDias) * 100) : 0,
    dias_consistentes_80: diasConsistentes,
    sueno: {
      promedio_horas: sleepDays ? Math.round((sleepTotal / sleepDays) * 10) / 10 : 0,
      dias_con_dato: sleepDays,
      pct_ok_7h: sleepDays ? Math.round((sleepOk / sleepDays) * 100) : 0,
    },
    mejora,
    enfoque,
    tareas_generales_completadas: tareasGeneralesCompletadas,
    tareas_generales_pendientes: tareasGeneralesPendientes,
    leyenda: "hecho/actividad/completados = sí lo hizo. no_hice = Daniel lo marcó EXPLÍCITAMENTE como no hecho. sin_registro/sin_dato = nadie registró nada (NO significa que no lo hiciera). no_enfoque = ese día el área no estaba activa.",
  };
  if (detalle) out.detalle_sosten = sostenDetalle;
  return out;
}

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
      name: "leer_esfuerzo",
      description: "Lee las estadísticas reales de la página Esfuerzo (Sostén, Mejora, Enfoque, Sueño y consistencia) para un período. Cada dato viene con hecho / no_hice / sin_registro. Úsalo para responder '¿cómo voy?' por día, semana, mes, trimestre o año.",
      parameters: {
        type: "object",
        properties: {
          periodo: { type: "string", enum: ["dia", "semana", "mes", "trimestre", "ano"] },
          fecha: { type: "string", description: "Fecha de referencia YYYY-MM-DD (opcional; por defecto hoy, hora de Cuba)." },
        },
        required: ["periodo"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "leer_diario",
      description: "Lee las entradas del diario de Daniel (journal_entries). Úsalo cuando hable de sus reflexiones, emociones o algo que escribió.",
      parameters: {
        type: "object",
        properties: {
          limite: { type: "number", description: "Cuántas entradas devolver (máx 50, por defecto 10)." },
          desde: { type: "string", description: "Desde YYYY-MM-DD (opcional)." },
          hasta: { type: "string", description: "Hasta YYYY-MM-DD (opcional)." },
          busqueda: { type: "string", description: "Texto a buscar dentro del contenido (opcional)." },
        },
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
            enum: ["mapa_de_vida", "destino", "identidad", "finanzas", "gimnasio", "lectura", "musica", "ajedrez", "idiomas", "revisiones", "diario", "esfuerzo_30_dias", "tareas_pendientes"],
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
  const nowCuba = cubaNow();
  const horaCuba = nowCuba.toISOString().slice(11, 16);
  const nowMin = Number(horaCuba.slice(0, 2)) * 60 + Number(horaCuba.slice(3, 5));
  const diaSemana = DOW_ES[nowCuba.getUTCDay()];
  const semana = resolverPeriodo("semana");
  const mes = resolverPeriodo("mes");

  const [
    tasksToday, blocks, systems, areaStats, reviews, weekly, monthly, twelve, sprints, goals, streaks, memories, pointB, identity,
  ] = await Promise.all([
    sb.from("tasks").select("id,title,completed,priority,area_id,source,routine_block_id,due_date,estimated_minutes").gte("due_date", `${today}T00:00:00`).lte("due_date", `${today}T23:59:59`),
    sb.from("routine_blocks").select("block_id,title,start_time,end_time,block_type,default_focus,current_focus").order("order_index"),
    sb.from("daily_systems_tracking").select("*").eq("tracking_date", today).maybeSingle(),
    sb.from("daily_area_stats").select("area_id,stat_date,time_spent_minutes,completed").gte("stat_date", daysAgo(13)),
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

  const blocksData: any[] = blocks.data || [];
  const blockById = new Map(blocksData.map((b: any) => [b.block_id, b]));
  const estadoBloque = (startTime: string | null, endTime: string | null) => {
    const s = toMin(startTime), e = toMin(endTime);
    if (s === null || e === null) return "desconocido";
    if (nowMin >= e) return "pasado";
    if (nowMin < s) return "futuro";
    return "actual";
  };

  const bloquesRutina = blocksData.map((b: any) => ({
    block_id: b.block_id,
    titulo: b.title,
    horario: `${(b.start_time || "").slice(0, 5)}-${(b.end_time || "").slice(0, 5)}`,
    focus: b.current_focus || b.default_focus || null,
    estado: estadoBloque(b.start_time, b.end_time),
  }));

  const tareasHoy = (tasksToday.data || []).map((t: any) => {
    const b = t.routine_block_id ? blockById.get(t.routine_block_id) : null;
    return {
      ...t,
      bloque: b ? `${b.title} ${(b.start_time || "").slice(0, 5)}-${(b.end_time || "").slice(0, 5)}` : null,
      estado_temporal: b ? estadoBloque(b.start_time, b.end_time) : null,
    };
  });

  const [esfuerzoHoy, esfuerzoSemana, esfuerzoMes, diario] = await Promise.all([
    buildEsfuerzo(sb, today, today, { detalle: false }),
    buildEsfuerzo(sb, semana.start, semana.end, { detalle: false }),
    buildEsfuerzo(sb, mes.start, mes.end, { detalle: false }),
    sb.from("journal_entries").select("entry_date,created_at,content").order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    fecha_hoy: today,
    dia_semana: diaSemana,
    hora_cuba: horaCuba,
    horas_restantes_del_dia: Math.max(0, Math.round(((24 * 60 - nowMin) / 60) * 10) / 10),
    tareas_hoy: tareasHoy,
    bloques_rutina: bloquesRutina,
    sistemas_hoy: systems.data || null,
    esfuerzo: {
      hoy: esfuerzoHoy,
      semana: esfuerzoSemana,
      mes: esfuerzoMes,
    },
    diario_reciente: (diario.data || []).map((e: any) => ({
      fecha: e.entry_date || (e.created_at || "").slice(0, 10),
      contenido: String(e.content || "").slice(0, 600),
    })),
    objetivos_semana: weekly.data || [],
    metas_mes: monthly.data || [],
    metas_trimestre: twelve.data || [],
    objetivos_sprint: sprints.data || [],
    metas: goals.data || [],
    rachas: streaks.data || [],
    memoria_largo_plazo: memories.data || [],
    destino_metricas: pointB.data || [],
    plan_identidad: identity.data || [],
    revisiones_recientes: reviews.data || [],
    esfuerzo_14_dias: areaStats.data || [],
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
    case "diario": return await q("journal_entries", "entry_date,created_at,content", 30);
    case "esfuerzo_30_dias": {
      const { data } = await sb.from("daily_area_stats").select("area_id,stat_date,time_spent_minutes,completed").gte("stat_date", daysAgo(30));
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
    case "leer_esfuerzo": {
      const { start, end, label } = resolverPeriodo(args.periodo || "dia", args.fecha);
      const r = await buildEsfuerzo(sb, start, end, { detalle: true });
      return { periodo_label: label, ...r };
    }
    case "leer_diario": {
      let query = sb.from("journal_entries").select("entry_date,created_at,content").order("created_at", { ascending: false });
      if (args.desde) query = query.gte("entry_date", args.desde);
      if (args.hasta) query = query.lte("entry_date", args.hasta);
      if (args.busqueda) query = query.ilike("content", `%${args.busqueda}%`);
      const limite = Math.min(50, Math.max(1, Math.round(Number(args.limite) || 10)));
      const { data, error } = await query.limit(limite);
      if (error) return { error: error.message };
      return (data || []).map((e: any) => ({
        fecha: e.entry_date || (e.created_at || "").slice(0, 10),
        contenido: String(e.content || "").slice(0, 1500),
      }));
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
4. Usar herramientas cuando aporte: buscar en la web, crear tareas y asignarlas a bloques, guardar memoria de largo plazo, leer su Esfuerzo por período y leer su Diario.
5. SIEMPRE que hables de datos, comparaciones, pasos, plan del día o resultados web, llama a "mostrar_visual" para dibujarlo en el lienzo. Puedes llamarla varias veces.

ESTADÍSTICAS DE ESFUERZO (página Esfuerzo):
- Tienes un resumen siempre disponible de hoy, esta semana y este mes en "esfuerzo".
- Para consultar día, semana, mes, trimestre o año usa la herramienta "leer_esfuerzo".
- El esfuerzo se divide en Sostén (hábitos estructurales), Mejora (lectura, música/piano, ajedrez, idiomas, game, entreno), Enfoque (universidad, emprendimiento, proyectos) y Sueño, más consistencia.

TRES ESTADOS QUE NO DEBES CONFUNDIR (aplica a hábitos, mejora y enfoque):
- ✅ HECHO: está completado (completions=true / hubo minutos / completado).
- ❌ NO HICE: Daniel lo marcó EXPLÍCITAMENTE como no hecho (skipped). Ese SÍ es un fallo suyo.
- — SIN REGISTRO / SIN DATO: nadie anotó nada. NO significa que no lo hiciera: puede que no tocara todavía o que simplemente no lo registrara. NUNCA lo presentES como fracaso.
- (Enfoque) "no_enfoque": ese día el área no estaba activa; tampoco cuenta como fallo.

REGLA TEMPORAL (MUY IMPORTANTE — el error de "no hiciste piano" por la mañana):
- Ahora mismo son las ${ctx.hora_cuba} (hora de Cuba) del ${ctx.fecha_hoy}, ${ctx.dia_semana}. Quedan ~${ctx.horas_restantes_del_dia} h de día.
- Cada bloque de "bloques_rutina" y cada tarea traen su horario y su "estado": "pasado", "actual" o "futuro".
- NUNCA le digas que no hizo una actividad cuyo bloque esté en "futuro" o "actual" y todavía no haya terminado. En su lugar di "aún no toca" o "está programado para las HH:MM".
- Solo considera "no hecho" (1) un hábito marcado con ❌, o (2) una tarea cuyo bloque ya es "pasado". Aun así, matiza.
- Antes de juzgar el día, mira las horas que quedan. Por la mañana NO puedes evaluar el día completo.

DIARIO:
- En "diario_reciente" tienes sus últimas reflexiones. Usa "leer_diario" para leer más o buscar por fecha/tema.

CONTEXTO REAL DE SU VIDA (JSON):
${JSON.stringify(ctx).slice(0, 60000)}

Reglas:
- Nunca inventes datos: si no los tienes, usa leer_esfuerzo/leer_diario/leer_contexto_extra o dilo.
- Áreas válidas para tareas: ${AREAS.join(", ")}.
- Antes de crear tareas elige bloques reales de "bloques_rutina" (usa su block_id).
- Guarda con guardar_memoria lo importante y duradero que descubras de él (no trivialidades).
- Respuestas en markdown, concisas (máx ~250 palabras) y terminando con una pregunta o un siguiente paso.`;

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
