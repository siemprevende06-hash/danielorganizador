/**
 * Coach GYM — función de Supabase Edge.
 *
 * Recibe el mensaje del usuario y un snapshot REAL de Gym 2.0 construido en el
 * cliente. El modelo puede:
 *   - consultar datos concretos (historial, progresión, biblioteca…), y
 *   - proponer acciones (crear/editar rutinas, plan, pesos, registros…).
 *
 * Las acciones NO se escriben aquí: se devuelven al cliente en `acciones` y la
 * app las aplica sobre su estado local (que luego sincroniza con Supabase).
 * Así el Coach tiene control total sin romper el modo offline ni duplicar la
 * lógica de negocio.
 *
 * Despliegue:
 *   npx supabase functions deploy gym-coach --project-ref fuqmrtenzlslkeqgdjwy
 */

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

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";
/** OpenCode Console: proveedor alternativo elegido en Configuración. */
const OPENCODE_BASE = (Deno.env.get("OPENCODE_BASE_URL") || "https://opencode.ai/inference").replace(/\/+$/, "");
const OPENCODE_URL = `${OPENCODE_BASE}/openai/v1/chat/completions`;
const OPENCODE_MODEL = (Deno.env.get("OPENCODE_MODEL") || "deepseek-v4.1-flash-free").trim();

/** Presupuesto total por petición (el cliente corta a los 100 s). */
const GLOBAL_BUDGET_MS = 94_000;
/** Tiempo máximo por llamada al modelo. */
const ATTEMPT_TIMEOUT_MS = 34_000;
/** Rondas máximas de herramientas por modelo. */
const MAX_TOOL_ROUNDS = 4;
/** Tamaño máximo del estado que se mete en el prompt. */
const MAX_PROMPT_DATA_CHARS = 48_000;

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const norm = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const shiftISO = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

// ---------------------------------------------------------------- snapshot

interface Snapshot {
  fecha_hoy?: string;
  dia_semana?: string;
  hora_local?: string;
  unidad?: string;
  peso_objetivo?: number | null;
  descanso_por_defecto_seg?: number;
  rutinas?: any[];
  semana?: Record<string, string>;
  plan_puntual?: any[];
  peso_corporal?: any[];
  medidas?: any[];
  sesiones?: any[];
  historial?: any[];
  estadisticas?: Record<string, any>;
  catalogo?: Record<string, string[]>;
}

const asSnapshot = (raw: unknown): Snapshot | null => {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Snapshot;
  if (!Array.isArray(s.rutinas) && !Array.isArray(s.historial)) return null;
  return s;
};

const snapshotToday = (s: Snapshot) => s.fecha_hoy || todayISO();

/** Recorta el estado para que quepa cómodo en modelos gratuitos. */
function buildPromptSnapshot(s: Snapshot) {
  const today = snapshotToday(s);
  const plan = (Array.isArray(s.plan_puntual) ? s.plan_puntual : [])
    .filter((p) => p && typeof p.fecha === "string" && p.fecha >= shiftISO(today, -1))
    .slice(0, 10);

  const historial = (Array.isArray(s.historial) ? s.historial : []).slice(0, 8);

  const data: Record<string, unknown> = {
    fecha_hoy: today,
    dia_semana: s.dia_semana || DAY_NAMES[new Date(`${today}T12:00:00Z`).getUTCDay()],
    hora_local: s.hora_local || "",
    unidad: s.unidad || "kg",
    peso_objetivo: s.peso_objetivo ?? null,
    descanso_por_defecto_seg: s.descanso_por_defecto_seg ?? 90,
    rutinas: Array.isArray(s.rutinas) ? s.rutinas : [],
    semana: s.semana || {},
    plan_puntual: plan,
    peso_corporal: (Array.isArray(s.peso_corporal) ? s.peso_corporal : []).slice(-10),
    medidas: (Array.isArray(s.medidas) ? s.medidas : []).slice(-1),
    sesiones: (Array.isArray(s.sesiones) ? s.sesiones : []).slice(-60),
    historial,
    estadisticas: s.estadisticas || {},
    catalogo_grupos: s.catalogo
      ? Object.fromEntries(Object.entries(s.catalogo).map(([grupo, nombres]) => [grupo, nombres.length]))
      : {},
  };

  // Si el estado es enorme, quitamos historial antiguo antes de romper el JSON.
  let text = JSON.stringify(data);
  while (text.length > MAX_PROMPT_DATA_CHARS && (data.historial as any[]).length > 2) {
    (data.historial as any[]).pop();
    text = JSON.stringify(data);
  }
  while (text.length > MAX_PROMPT_DATA_CHARS && (data.sesiones as any[]).length > 10) {
    (data.sesiones as any[]).shift();
    text = JSON.stringify(data);
  }
  return {
    data,
    text,
    today,
    diaSemana: String(data.dia_semana),
    hora: String(data.hora_local || ""),
    unidad: String(data.unidad),
  };
}

// ---------------------------------------------------------------- tools

const str = (description: string, extra: Record<string, unknown> = {}) => ({
  type: "string",
  description,
  ...extra,
});
const num = (description: string) => ({ type: "number", description });
const bool = (description: string) => ({ type: "boolean", description });

const exerciseSpec = {
  type: "object",
  properties: {
    ejercicio: str("Nombre del ejercicio en español (de la biblioteca si existe)."),
    grupo: str("Grupo muscular: pecho, espalda, hombros, brazos, piernas, abdomen, cardio…"),
    equipo: str("Equipo: barra, mancuernas, máquina, cable, peso corporal…"),
    series: num("Número de series."),
    reps: num("Repeticiones objetivo."),
    reps_min: num("Repeticiones mínimas si usa progresión doble."),
    peso: num("Peso objetivo en la unidad del usuario (kg por defecto)."),
    segundos: num("Segundos por serie para isométricos."),
    minutos: num("Minutos para cardio."),
    velocidad: num("Velocidad en km/h para cardio."),
    descanso_seg: num("Descanso entre series en segundos."),
    modo: str("Tipo de ejercicio.", { enum: ["reps", "time", "cardio"] }),
    por_lado: bool("true si las repeticiones son por lado."),
    peso_corporal: bool("true si es un ejercicio con peso corporal."),
    progresion: str("Política de progresión.", {
      enum: ["off", "linear", "greyskull", "double", "time"],
    }),
  },
  required: ["ejercicio"],
  additionalProperties: false,
};

const setSpec = {
  type: "object",
  properties: {
    peso: num("Peso usado en la serie."),
    reps: num("Repeticiones realizadas."),
    segundos: num("Segundos aguantados (isométrico)."),
    minutos: num("Minutos realizados (cardio)."),
    velocidad: num("Velocidad en km/h (cardio)."),
    descanso: num("Descanso después de la serie, en segundos."),
  },
  additionalProperties: false,
};

const workoutExerciseSpec = {
  type: "object",
  properties: {
    ejercicio: str("Nombre del ejercicio."),
    grupo: str("Grupo muscular (opcional)."),
    equipo: str("Equipo (opcional)."),
    series: {
      type: "array",
      description: "Series realizadas, en orden.",
      items: setSpec,
    },
  },
  required: ["ejercicio", "series"],
  additionalProperties: false,
};

const tools = [
  // ------------------------- lectura -------------------------
  {
    type: "function",
    function: {
      name: "leer_historial",
      description:
        "Devuelve sesiones reales del historial. Úsalo para revisar un ejercicio concreto más allá de las últimas sesiones que ya ves en el contexto.",
      parameters: {
        type: "object",
        properties: {
          ejercicio: str("Nombre del ejercicio a filtrar (opcional)."),
          limite: num("Cuántas sesiones devolver (1-15, por defecto 8)."),
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sugerir_entrenamiento",
      description:
        "Calcula el entrenamiento que toca para una fecha: rutina planificada + series, reps, peso sugerido, descanso y última sesión de cada ejercicio. Úsalo para 'prepara mi próximo entrenamiento'.",
      parameters: {
        type: "object",
        properties: {
          fecha: str("hoy, mañana, ayer, un día de la semana o YYYY-MM-DD. Por defecto hoy."),
          rutina: str("Nombre de una rutina concreta (opcional; si no, usa el plan)."),
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_ejercicio",
      description:
        "Busca ejercicios reales de la biblioteca de Gym 2.0 por nombre o grupo muscular. Úsalo antes de inventar el nombre de un ejercicio nuevo.",
      parameters: {
        type: "object",
        properties: {
          consulta: str("Nombre o grupo muscular a buscar (ej. 'press banca', 'espalda', 'curl')."),
          grupo: str("Filtrar por grupo muscular (opcional)."),
        },
        required: ["consulta"],
        additionalProperties: false,
      },
    },
  },

  // ------------------------- acciones -------------------------
  {
    type: "function",
    function: {
      name: "crear_rutina",
      description: "Crea una rutina nueva en Gym 2.0 con sus ejercicios.",
      parameters: {
        type: "object",
        properties: {
          nombre: str("Nombre de la rutina."),
          emoji: str("Emoji de la rutina (opcional)."),
          progresion: str("Progresión por defecto de la rutina.", {
            enum: ["off", "linear", "greyskull", "double", "time"],
          }),
          ejercicios: { type: "array", items: exerciseSpec },
        },
        required: ["nombre", "ejercicios"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "actualizar_rutina",
      description:
        "Edita una rutina existente: renombrar, cambiar progresión, añadir, quitar, ajustar o reemplazar ejercicios.",
      parameters: {
        type: "object",
        properties: {
          rutina: str("Nombre o id de la rutina a editar."),
          nombre: str("Nuevo nombre (opcional)."),
          emoji: str("Nuevo emoji (opcional)."),
          progresion: str("Nueva progresión por defecto.", {
            enum: ["off", "linear", "greyskull", "double", "time"],
          }),
          agregar_ejercicios: { type: "array", items: exerciseSpec },
          quitar_ejercicios: { type: "array", items: str("Nombre del ejercicio a quitar.") },
          ajustar_ejercicios: { type: "array", items: exerciseSpec },
          reemplazar_ejercicios: { type: "array", items: exerciseSpec },
        },
        required: ["rutina"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eliminar_rutina",
      description:
        "Elimina una rutina y la quita del plan. SOLO usa confirmado=true cuando el usuario ya haya confirmado explícitamente que quiere borrarla.",
      parameters: {
        type: "object",
        properties: {
          rutina: str("Nombre o id de la rutina."),
          confirmado: bool("true solo si el usuario confirmó el borrado en este mensaje."),
        },
        required: ["rutina", "confirmado"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "asignar_semana",
      description:
        "Asigna rutinas a los días de la semana (plan semanal). Usa 'descanso' para dejar un día libre.",
      parameters: {
        type: "object",
        properties: {
          dias: {
            type: "object",
            properties: {
              lunes: str("Rutina o 'descanso'."),
              martes: str("Rutina o 'descanso'."),
              miercoles: str("Rutina o 'descanso'."),
              jueves: str("Rutina o 'descanso'."),
              viernes: str("Rutina o 'descanso'."),
              sabado: str("Rutina o 'descanso'."),
              domingo: str("Rutina o 'descanso'."),
            },
          },
        },
        required: ["dias"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "planificar_dia",
      description:
        "Cambia el plan de una fecha concreta (sin tocar el plan semanal). Usa 'descanso' para marcar descanso.",
      parameters: {
        type: "object",
        properties: {
          fecha: str("hoy, mañana, ayer, día de la semana o YYYY-MM-DD."),
          rutina: str("Nombre de la rutina o 'descanso'."),
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_peso",
      description: "Registra el peso corporal de una fecha.",
      parameters: {
        type: "object",
        properties: {
          peso: num("Peso corporal."),
          fecha: str("Fecha (por defecto hoy)."),
        },
        required: ["peso"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_medidas",
      description: "Registra medidas corporales (pecho, cintura, cadera, brazos, muslo).",
      parameters: {
        type: "object",
        properties: {
          medidas: {
            type: "object",
            properties: {
              pecho: num("Pecho."),
              cintura: num("Cintura."),
              cadera: num("Cadera."),
              brazo_izq: num("Brazo izquierdo."),
              brazo_der: num("Brazo derecho."),
              biceps_flex: num("Bíceps flexionado."),
              biceps_relax: num("Bíceps relajado."),
              muslo: num("Muslo."),
            },
          },
          fecha: str("Fecha (por defecto hoy)."),
        },
        required: ["medidas"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "objetivo_peso",
      description: "Fija el peso corporal objetivo.",
      parameters: {
        type: "object",
        properties: { peso: num("Peso objetivo.") },
        required: ["peso"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ajustar_ejercicio",
      description:
        "Ajusta un ejercicio en una rutina o en todas donde aparezca: peso, series, reps, descanso, segundos o progresión.",
      parameters: {
        type: "object",
        properties: {
          ejercicio: str("Nombre del ejercicio."),
          rutina: str("Rutina concreta (opcional; si no, todas donde aparezca)."),
          series: num("Nuevas series."),
          reps: num("Nuevas repeticiones."),
          reps_min: num("Repeticiones mínimas."),
          peso: num("Nuevo peso objetivo."),
          descanso_seg: num("Nuevo descanso entre series."),
          segundos: num("Nuevos segundos para isométricos."),
          progresion: str("Nueva progresión.", {
            enum: ["off", "linear", "greyskull", "double", "time"],
          }),
          por_lado: bool("Repeticiones por lado."),
          peso_corporal: bool("Ejercicio con peso corporal."),
        },
        required: ["ejercicio"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_entrenamiento",
      description:
        "Registra una sesión ya realizada con sus ejercicios y series reales. No lo uses para planificar el futuro. Si el usuario dice «3x10», crea 3 series de 10 reps (no una sola serie).",
      parameters: {
        type: "object",
        properties: {
          fecha: str("Fecha de la sesión (por defecto hoy)."),
          rutina: str("Rutina realizada (opcional)."),
          nombre: str("Nombre de la sesión (opcional)."),
          duracion_min: num("Duración en minutos (opcional)."),
          ejercicios: { type: "array", items: workoutExerciseSpec },
        },
        required: ["ejercicios"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_ejercicio",
      description: "Añade un ejercicio nuevo a la biblioteca personal de Gym 2.0.",
      parameters: {
        type: "object",
        properties: {
          nombre: str("Nombre del ejercicio."),
          grupo: str("Grupo muscular."),
          equipo: str("Equipo."),
          descripcion: str("Descripción o técnica (opcional)."),
        },
        required: ["nombre"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ajustes",
      description: "Cambia ajustes generales de Gym 2.0 (unidad, descanso por defecto, objetivo de peso, sonido).",
      parameters: {
        type: "object",
        properties: {
          unidad: str("Unidad de peso.", { enum: ["kg", "lb"] }),
          descanso_seg: num("Descanso por defecto entre series."),
          objetivo_peso: {
            type: ["number", "null"],
            description: "Peso corporal objetivo (null para borrarlo).",
          },
          sonido: bool("Sonido activado."),
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "abrir_pantalla",
      description: "Abre una pantalla de Gym 2.0 después de responder.",
      parameters: {
        type: "object",
        properties: {
          pantalla: str("Pantalla a abrir.", {
            enum: ["home", "workout", "plan", "library", "stats", "history", "coach"],
          }),
        },
        required: ["pantalla"],
        additionalProperties: false,
      },
    },
  },
];

const ACTION_NAMES = new Set([
  "crear_rutina",
  "actualizar_rutina",
  "eliminar_rutina",
  "asignar_semana",
  "planificar_dia",
  "registrar_peso",
  "registrar_medidas",
  "objetivo_peso",
  "ajustar_ejercicio",
  "registrar_entrenamiento",
  "crear_ejercicio",
  "ajustes",
  "abrir_pantalla",
]);

/**
 * Corrige patrones que los modelos pequeños suelen interpretar mal.
 * «3x10» en un entrenamiento son 3 series de 10, no una sola serie.
 */
function normalizeAction(name: string, action: any, message: string): any {
  if (name !== "registrar_entrenamiento") return action;
  const match = message.match(
    /(\d{1,2})\s*(?:x|×|series?\s*(?:de)?\s*(?:x|×)?)\s*(\d{1,3})/i,
  );
  if (!match) return action;
  const setsCount = Number(match[1]);
  const reps = Number(match[2]);
  if (!Number.isFinite(setsCount) || setsCount < 2 || setsCount > 20) return action;
  if (!Number.isFinite(reps) || reps < 1 || reps > 100) return action;
  const exercises = Array.isArray(action.ejercicios) ? action.ejercicios : [];
  if (exercises.length !== 1) return action;
  const exercise = exercises[0];
  const sets = Array.isArray(exercise?.series) ? exercise.series : [];
  if (sets.length !== 1) return action;
  const base = sets[0] || {};
  exercise.series = Array.from({ length: setsCount }, () => ({
    ...base,
    reps: base.reps ?? reps,
  }));
  return action;
}

/** Valida lo mínimo imprescindible para no aplicar basura. */
function validateAction(name: string, args: Record<string, unknown>): string | null {
  const has = (key: string) => args[key] !== undefined && args[key] !== null && args[key] !== "";
  switch (name) {
    case "crear_rutina": {
      if (!has("nombre")) return "Falta el nombre de la rutina.";
      if (!Array.isArray(args.ejercicios) || args.ejercicios.length === 0)
        return "Una rutina necesita al menos un ejercicio.";
      return null;
    }
    case "actualizar_rutina":
      return has("rutina") ? null : "Falta indicar qué rutina editar.";
    case "eliminar_rutina":
      if (!has("rutina")) return "Falta indicar qué rutina eliminar.";
      if (args.confirmado !== true)
        return "No elimines todavía: primero pide confirmación explícita al usuario. Cuando confirme, vuelve a llamar con confirmado=true.";
      return null;
    case "asignar_semana":
      return args.dias && typeof args.dias === "object" ? null : "Faltan los días de la semana.";
    case "registrar_peso": {
      const peso = Number(args.peso);
      return Number.isFinite(peso) && peso > 0 ? null : "El peso debe ser un número mayor que 0.";
    }
    case "registrar_medidas":
      return args.medidas && typeof args.medidas === "object" ? null : "Faltan las medidas.";
    case "objetivo_peso": {
      const peso = Number(args.peso);
      return Number.isFinite(peso) && peso > 0 ? null : "El objetivo debe ser un número mayor que 0.";
    }
    case "ajustar_ejercicio":
      return has("ejercicio") ? null : "Falta el nombre del ejercicio.";
    case "registrar_entrenamiento":
      if (!Array.isArray(args.ejercicios) || args.ejercicios.length === 0)
        return "Faltan los ejercicios del entrenamiento.";
      if (
        !args.ejercicios.some(
          (e: any) => e && Array.isArray(e.series) && e.series.length > 0,
        )
      )
        return "Cada ejercicio necesita al menos una serie con peso/reps o segundos.";
      return null;
    case "crear_ejercicio":
      return has("nombre") ? null : "Falta el nombre del ejercicio.";
    case "ajustes":
      return ["unidad", "descanso_seg", "objetivo_peso", "sonido"].some(has)
        ? null
        : "No había ningún ajuste válido.";
    case "abrir_pantalla":
      return has("pantalla") ? null : "Falta la pantalla.";
    case "planificar_dia":
      return null;
    default:
      return "Herramienta desconocida.";
  }
}

// ---------------------------------------------------------------- read tools

const findRoutineByName = (s: Snapshot, ref: unknown) => {
  const routines = Array.isArray(s.rutinas) ? s.rutinas : [];
  const q = norm(ref);
  if (!q) return null;
  return (
    routines.find((r) => norm(r?.id) === q) ||
    routines.find((r) => norm(r?.nombre) === q) ||
    routines.find((r) => norm(r?.nombre).includes(q)) ||
    routines.find((r) => q.includes(norm(r?.nombre))) ||
    null
  );
};

function resolveDate(raw: unknown, today: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return today;
  const n = norm(value);
  if (n === "hoy" || n === "today") return today;
  if (n === "manana" || n === "tomorrow") return shiftISO(today, 1);
  if (n === "ayer" || n === "yesterday") return shiftISO(today, -1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const weekday = DAY_NAMES.findIndex((d) => norm(d) === n);
  if (weekday >= 0) {
    const current = new Date(`${today}T12:00:00Z`).getUTCDay();
    return shiftISO(today, (weekday - current + 7) % 7);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return today;
}

function routineForDate(s: Snapshot, iso: string): { routine: any | null; rest: boolean } {
  const plan = (Array.isArray(s.plan_puntual) ? s.plan_puntual : []).find((p) => p?.fecha === iso);
  if (plan) {
    if (norm(plan.rutina) === "descanso" || !plan.rutina) return { routine: null, rest: true };
    return { routine: findRoutineByName(s, plan.rutina), rest: false };
  }
  const day = DAY_NAMES[new Date(`${iso}T12:00:00Z`).getUTCDay()];
  const name = s.semana?.[day];
  if (!name || norm(name) === "descanso") return { routine: null, rest: true };
  return { routine: findRoutineByName(s, name), rest: false };
}

function executeReadTool(
  s: Snapshot,
  name: string,
  args: Record<string, unknown>,
): unknown {
  switch (name) {
    case "leer_historial": {
      const limit = clamp(Math.round(Number(args.limite) || 8), 1, 15);
      const q = norm(args.ejercicio);
      const workouts = (Array.isArray(s.historial) ? s.historial : [])
        .map((w) => {
          const exercises = (Array.isArray(w?.ejercicios) ? w.ejercicios : []).filter(
            (e: any) => !q || norm(e?.ejercicio).includes(q) || q.includes(norm(e?.ejercicio)),
          );
          return { ...w, ejercicios: exercises };
        })
        .filter((w) => (q ? w.ejercicios.length > 0 : true))
        .slice(0, limit);
      if (!workouts.length) {
        return {
          sesiones: [],
          nota: q
            ? `No hay sesiones registradas de «${String(args.ejercicio)}» en el historial reciente.`
            : "No hay sesiones registradas.",
        };
      }
      return { sesiones: workouts };
    }

    case "sugerir_entrenamiento": {
      const today = snapshotToday(s);
      const iso = resolveDate(args.fecha, today);
      let routine = args.rutina ? findRoutineByName(s, args.rutina) : null;
      if (args.rutina && !routine) {
        return {
          error: `No encontré la rutina «${String(args.rutina)}».`,
          rutinas: (s.rutinas || []).map((r: any) => r?.nombre),
        };
      }
      let rest = false;
      if (!routine) {
        const picked = routineForDate(s, iso);
        routine = picked.routine;
        rest = picked.rest;
      }
      if (!routine) {
        return {
          fecha: iso,
          descanso: rest,
          mensaje: rest
            ? "Ese día está marcado como descanso. Puedo cambiarlo si quieres."
            : "No hay rutina planificada para ese día.",
        };
      }
      return {
        fecha: iso,
        rutina: routine.nombre,
        rutina_id: routine.id,
        ejercicios: (Array.isArray(routine.ejercicios) ? routine.ejercicios : []).map((e: any) => ({
          ejercicio: e.ejercicio,
          ejercicio_id: e.ejercicio_id,
          series: e.series,
          reps: e.reps,
          reps_min: e.reps_min ?? null,
          segundos: e.segundos ?? null,
          peso_objetivo: e.peso_objetivo ?? null,
          descanso_seg: e.descanso_seg ?? s.descanso_por_defecto_seg ?? 90,
          modo: e.modo,
          ultima_sesion: e.ultima_sesion ?? null,
          sugerido: e.sugerido ?? null,
        })),
      };
    }

    case "buscar_ejercicio": {
      const catalog = s.catalogo || {};
      const q = norm(args.consulta);
      const groupFilter = norm(args.grupo);
      const tokens = q.split(" ").filter(Boolean);
      const found: { ejercicio: string; grupo: string; score: number }[] = [];
      for (const [grupo, nombres] of Object.entries(catalog)) {
        if (groupFilter && !norm(grupo).includes(groupFilter)) continue;
        for (const nombre of nombres || []) {
          const n = norm(nombre);
          if (!n) continue;
          let score = 0;
          if (n === q) score = 1000;
          else if (n.startsWith(q + " ")) score = 850;
          else if (n.includes(q)) score = 700;
          else if (q && q.includes(n) && n.length >= 4) score = 620;
          else if (tokens.length && tokens.every((t) => n.includes(t))) score = 500;
          if (score > 0) found.push({ ejercicio: nombre, grupo, score });
        }
      }
      found.sort((a, b) => b.score - a.score || a.ejercicio.localeCompare(b.ejercicio, "es"));
      return {
        resultados: found.slice(0, 25).map(({ ejercicio, grupo }) => ({ ejercicio, grupo })),
        nota: found.length
          ? "Usa el nombre exacto de esta lista al crear o ajustar ejercicios."
          : "No encontré coincidencias. Puedes crear el ejercicio con crear_ejercicio.",
      };
    }

    default:
      return { error: "Herramienta de lectura desconocida." };
  }
}

// ---------------------------------------------------------------- OpenRouter

interface ChatMessage {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface ModelReply {
  content: string;
  toolCalls: any[];
}

class ModelHttpError extends Error {
  status: number;
  /** Solo una clave inválida (401) invalida toda la cadena de modelos. */
  fatal: boolean;
  constructor(status: number, message: string, fatal = status === 401) {
    super(message);
    this.status = status;
    this.fatal = fatal;
  }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  timeoutMs: number,
  useTools: boolean,
  toolChoice?: unknown,
  provider: "openrouter" | "opencode" = "openrouter",
): Promise<ModelReply> {
  const opencode = provider === "opencode";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(4_000, timeoutMs));
  try {
    const res = await fetch(opencode ? OPENCODE_URL : OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opencode ? Deno.env.get("OPENCODE_API_KEY") || "" : apiKey}`,
        ...(opencode
          ? { "x-opencode-session": `ses_${crypto.randomUUID()}` }
          : {
              "HTTP-Referer": "https://lovable.dev",
              "X-Title": "Segundo Cerebro - Coach Gym",
            }),
      },
      body: JSON.stringify({
        model: opencode ? OPENCODE_MODEL : model,
        messages,
        ...(useTools ? { tools } : {}),
        ...(useTools && toolChoice ? { tool_choice: toolChoice } : {}),
        temperature: 0.35,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed?.error?.message || parsed?.message || text;
      } catch {
        /* texto plano */
      }
      throw new ModelHttpError(
        res.status,
        `${opencode ? "OpenCode" : "OpenRouter"} ${res.status}: ${String(detail || "sin detalle").slice(0, 400)}`,
        // Un fallo de OpenCode nunca es fatal: siempre debe caer a OpenRouter.
        opencode ? false : undefined,
      );
    }

    const data = await res.json();
    if (data?.error) {
      throw new ModelHttpError(
        Number(data.error?.code) || 502,
        data.error?.message || "El modelo devolvió un error.",
        opencode ? false : undefined,
      );
    }
    const msg = data?.choices?.[0]?.message;
    if (!msg) throw new ModelHttpError(502, "El modelo devolvió una respuesta vacía.");

    return {
      content: typeof msg.content === "string" ? msg.content : "",
      toolCalls: Array.isArray(msg.tool_calls) ? msg.tool_calls : [],
    };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- model discovery

/**
 * OpenRouter restringe algunos modelos gratuitos a "agentic harnesses": desde
 * una Edge Function devuelven 403 con el mensaje "only available on agentic
 * harnesses". Nunca deben entrar en la cadena de modelos.
 */
const MODELOS_RESTRINGIDOS = /thinkingmachines|inkling/i;
/** Modelos que ya fallaron por sí mismos en esta instancia. */
const MODELOS_INVALIDOS = new Set<string>();

const esErrorDeModelo = (detalle: string, status: number) =>
  status === 400 ||
  status === 403 ||
  status === 404 ||
  status === 422 ||
  /agentic harness|only available|deprecated|not a valid model|does not exist|no endpoints? found/i.test(
    detalle,
  );

const modeloBloqueado = (id: string, detalle = "") =>
  !id ||
  MODELOS_RESTRINGIDOS.test(id) ||
  MODELOS_INVALIDOS.has(id) ||
  /agentic harness|only available on/i.test(detalle);

function marcarModeloInvalido(id: string) {
  if (!id) return;
  MODELOS_INVALIDOS.add(id);
  if (lastGoodModel === id) lastGoodModel = null;
}

const MENSAJE_LIMITE_DIARIO =
  "Se agotó el límite diario de modelos gratuitos de OpenRouter. Se renueva mañana; si necesitas más hoy, añade 10 créditos en OpenRouter para desbloquear 1000 peticiones gratuitas al día.";

const esLimiteDiario = (detalle: string) => /free-models-per-day|per day|daily/i.test(detalle);

let modelsCache: { at: number; models: any[] } | null = null;
/** Último modelo que respondió bien en esta instancia (se reinicia en frío). */
let lastGoodModel: string | null = null;

async function discoverModels(apiKey: string): Promise<any[]> {
  if (modelsCache && Date.now() - modelsCache.at < 30 * 60 * 1000) return modelsCache.models;
  try {
    const res = await fetch(MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    modelsCache = { at: Date.now(), models: list };
    return list;
  } catch {
    return [];
  }
}

const STATIC_TOOL_MODELS = [
  "deepseek/deepseek-chat-v3.1:free",
  "qwen/qwen3-235b-a22b:free",
  "qwen/qwen3-32b:free",
  "qwen/qwen3-30b-a3b:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "moonshotai/kimi-k2-0905:free",
  "z-ai/glm-4.5-air:free",
];

const STATIC_TEXT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-8b:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
];

const modelScore = (id: string, contextLength: number) => {
  // Contexto con tope bajo: un modelo desconocido con contexto enorme no debe
  // adelantar a modelos conocidos por llamar bien a herramientas.
  let score = Math.min(contextLength / 4000, 30);
  if (/deepseek/.test(id)) score += 200;
  if (/qwen3|qwen-3/.test(id)) score += 180;
  if (/mistral/.test(id)) score += 120;
  if (/llama/.test(id)) score += 100;
  if (/gemini/.test(id)) score += 90;
  if (/kimi|moonshot/.test(id)) score += 80;
  if (/glm/.test(id)) score += 70;
  // Modelo gratuito que ha respondido de forma fiable en las pruebas reales.
  if (/xingchen|xing4/.test(id)) score += 210;
  if (/reason|thinking|r1/.test(id)) score -= 90;
  if (/audio|embed|rerank|moderation|safety|image|vision/.test(id)) score -= 500;
  const size = Number((id.match(/(\d+(?:\.\d+)?)b(?:\b|-)/) || [])[1]);
  if (Number.isFinite(size) && size > 0 && size < 7) score -= 120;
  return score;
};

function pickModels(all: any[], onlyTools: boolean, active: string | null): string[] {
  const free = all
    .filter((m) => {
      if (!m || typeof m.id !== "string" || !m.id.endsWith(":free")) return false;
      if (modeloBloqueado(m.id)) return false;
      const pricing = m.pricing || {};
      const isFree =
        Number(pricing.prompt) === 0 &&
        Number(pricing.completion) === 0 &&
        Number(pricing.request || 0) === 0;
      if (!isFree) return false;
      if (onlyTools && Array.isArray(m.supported_parameters) && !m.supported_parameters.includes("tools"))
        return false;
      const outputs = m.architecture?.output_modalities;
      if (Array.isArray(outputs) && !outputs.includes("text")) return false;
      return true;
    })
    .map((m) => ({
      id: m.id as string,
      score: modelScore(m.id as string, Number(m.context_length) || 4096),
    }))
    .sort((a, b) => b.score - a.score)
    .map((m) => m.id);

  // Si el catálogo se pudo leer, no gastamos tiempo en modelos estáticos que
  // ya no existen (p. ej. Qwen3 8B, retirado en octubre de 2026).
  const available = new Set(all.map((m) => m?.id).filter(Boolean));
  const preferred = (onlyTools ? STATIC_TOOL_MODELS : STATIC_TEXT_MODELS).filter(
    (id) => !modeloBloqueado(id) && (!all.length || available.has(id)),
  );

  const out: string[] = [];
  if (active && !modeloBloqueado(active)) out.push(active);
  // Los 4 mejores gratuitos descubiertos, luego los estáticos fiables y
  // finalmente el resto de gratuitos.
  for (const id of [...free.slice(0, 4), ...preferred, ...free.slice(4)]) {
    if (!out.includes(id) && !modeloBloqueado(id)) out.push(id);
  }
  return out.slice(0, 8);
}

// ---------------------------------------------------------------- prompt

function buildSystemPrompt(
  s: Snapshot,
  promptData: ReturnType<typeof buildPromptSnapshot>,
  hasSnapshot: boolean,
): string {
  const stats = s.estadisticas || {};
  const planLines = Object.entries(s.semana || {})
    .filter(([, value]) => value)
    .map(([day, value]) => `${day}: ${value}`)
    .join(" · ");

  return `Eres el COACH GYM de Daniel: entrenador personal especializado en fuerza, hipertrofia y progresión con pesas. Hablas SIEMPRE en español, directo, práctico y sin relleno.

ALCANCE ESTRICTO — SOLO GIMNASIO
- Solo respondes sobre entrenamiento con pesas, ejercicios, rutinas, series/reps/pesos, técnica, progresión, descanso, recuperación muscular, peso corporal y medidas.
- Nutrición e hidratación: SOLO como apoyo al entrenamiento (proteína, superávit, comida alrededor del entreno). Sueño: SOLO como recuperación para entrenar.
- Si preguntan algo fuera de eso (finanzas, trabajo, estudios, relaciones, política, noticias, vida personal, productividad, tecnología…), NO des una respuesta sobre el tema: di en UNA sola línea que solo puedes ayudar con gimnasio y devuelve el foco a su próximo entrenamiento.
- No eres un coach de vida: nada de planes de vida, hábitos generales ni consejos financieros.

SEGURIDAD CARDÍACA (dato real del usuario)
- Prolapso de válvula mitral asintomático. FC de reposo ≈120 lpm; no debe acercarse a 148 lpm.
- Básicos de pierna: 3-4 min de descanso. Accesorios: 2 min. Exhala en el esfuerzo, evita series al fallo absoluto.
- Si siente mareo, dolor de pecho o palpitaciones fuertes: parar de inmediato. No lo minimices.

CÓMO ACTUAR
- SÍ puedes modificar Gym 2.0. Cuando el usuario pida un cambio (crear/editar/borrar rutina, plan, pesos, ajustes, registrar peso/medidas/entreno), LLAMA a la herramienta de acción. La app aplica el cambio automáticamente al terminar tu respuesta.
- No digas "no puedo editar" ni pidas al usuario que lo haga a mano.
- Está PROHIBIDO decir "registrado", "creado", "actualizado", "guardado", "hecho" o "listo" si en esta respuesta no llamaste a la herramienta correspondiente. El texto NO cambia nada en la app.
- Si el usuario da los datos para un cambio, no pidas permiso: llama a la herramienta y luego explica el resultado. Solo pide confirmación antes de borrar una rutina.
- Antes de borrar una rutina pide confirmación explícita; solo entonces usa confirmado=true.
- Para pesos y progresión usa SIEMPRE los datos reales: "sugerido", última sesión e historial. Si el JSON ya trae el dato, no llames a herramientas de lectura.
- Si faltan datos, usa leer_historial, sugerir_entrenamiento o buscar_ejercicio. No inventes pesos, récords, sesiones, repeticiones objetivo, días de plan ni ejercicios.
- Para nombres nuevos, usa nombres reales de la biblioteca (buscar_ejercicio). Si no existe, créalo con crear_ejercicio.
- Máximo 1-2 acciones por respuesta, salvo que el usuario pida un plan completo.
- No afirmes que cambiaste algo si no llamaste a la herramienta correspondiente.

CONTEXTO RÁPIDO
- Hoy: ${promptData.today} (${promptData.diaSemana})${promptData.hora ? `, ${promptData.hora}` : ""}. Unidad: ${promptData.unidad}. Objetivo de peso: ${s.peso_objetivo ?? "sin definir"}.
- Plan semanal: ${planLines || "sin plan cargado"}.
- Resumen: ${stats.entrenamientos_totales ?? 0} entrenamientos totales · ${stats.ultimos_7_dias ?? 0} en 7 días · racha ${stats.racha_dias ?? 0} días · cumplimiento 28 días ${stats.cumplimiento_plan_28_dias_pct ?? "—"}%.

${hasSnapshot ? "ESTADO REAL DE GYM 2.0 (JSON)" : "SIN ESTADO DE GYM 2.0"}
${hasSnapshot ? promptData.text : "No recibí el estado del gimnasio. Pide al usuario que recargue la app antes de dar datos concretos y no inventes nada."}

RECORDATORIO FINAL
Responde en markdown conciso (máx ~220 palabras), con el plan concreto (ejercicio, series, reps, peso y descanso cuando aplique) y termina con una pregunta breve o el siguiente paso. Si el usuario pide un cambio, la acción va en la herramienta; el texto es para explicar el resultado.`;
}

// ---------------------------------------------------------------- action handling

function normalizeToolName(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^functions\./, "")
    .replace(/[^a-z0-9_]/g, "");
}

function parseToolArgs(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- intención de acción

/**
 * Detecta pedidos de cambio con suficiente claridad como para forzar la
 * herramienta correcta. Es deliberadamente conservador: si hay duda, devuelve
 * null y el modelo decide con las herramientas normales.
 */
function detectActionIntent(raw: string): string | null {
  const t = norm(raw);
  const has = (re: RegExp) => re.test(t);
  const hasNumber = /\d/.test(t);

  const registerVerb =
    /\b(registra|registrar|guarda|guardar|apunta|apuntar|anota|anotar|marca|marcar|actualiza|actualizar|pon|poner)\b/;
  const editVerb =
    /\b(edita|editar|actualiza|actualizar|anade|anadir|agrega|agregar|quita|quitar|cambia|cambiar|ajusta|ajustar|reemplaza|reemplazar)\b/;

  if (has(/\b(borra|borrar|elimina|eliminar)\b/) && has(/\brutina\b/)) return "eliminar_rutina";

  if (has(/\b(objetivo|meta)\b/) && has(/\b(peso|kg|kilos?)\b/) && hasNumber) return "objetivo_peso";

  const weightPhrase = has(/\b(hoy pese|pese hoy|mi peso (es|de hoy)|peso corporal de hoy)\b/);
  if (
    hasNumber &&
    has(/\b(peso|balanza|bascula|pese)\b/) &&
    !has(/\b(objetivo|meta)\b/) &&
    (has(registerVerb) || weightPhrase)
  ) {
    return "registrar_peso";
  }

  if (
    hasNumber &&
    has(/\b(medidas|cintura|cadera|pantorrilla|cuello)\b/) &&
    has(registerVerb)
  ) {
    return "registrar_medidas";
  }

  const routineDetail = has(/\b(con|que tenga|incluye|incluyendo)\b/) || (raw.match(/,/g) || []).length >= 2;
  if (
    has(/\b(crea|crear|arma|armar|prepara|preparar|disena|disenar|haz|hacer)\b/) &&
    has(/\brutina\b/) &&
    routineDetail
  ) {
    return "crear_rutina";
  }

  if (has(editVerb) && has(/\brutina\b/)) return "actualizar_rutina";

  const exerciseHint =
    /\b(press|banca|inclinado|sentadilla|peso muerto|curl|remo|jalon|dominada|fondo|militar|hip thrust|zancada|extension|flexion|apertura|elevacion|gemelo|plancha|rumano|bulgara|hack|prensa|polea|mancuerna|barra)\b/;
  if (
    has(/\b(sube|subir|baja|bajar|aumenta|aumentar|reduce|reducir|cambia|cambiar|ajusta|ajustar|pon|poner)\b/) &&
    has(/\b(peso|kg|kilos?|reps|repeticiones|series)\b/) &&
    has(exerciseHint) &&
    !has(/\b(peso corporal|mi peso|objetivo|meta)\b/)
  ) {
    return "ajustar_ejercicio";
  }

  if (
    has(/\b(asigna|asignar|organiza|organizar|planifica|planificar)\b/) &&
    has(/\b(semana|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/)
  ) {
    return "asignar_semana";
  }

  if (
    has(/\b(planifica|planificar|cambia|cambiar|pon|poner|marca|marcar)\b/) &&
    has(/\b(hoy|manana|ayer|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/) &&
    has(/\b(entreno|entrenamiento|rutina|descanso)\b/)
  ) {
    return "planificar_dia";
  }

  if (
    (has(/\b(entrenamiento|entrene|sesion|hice)\b/) && has(registerVerb)) ||
    has(/\b(hoy entrene|entrene hoy)\b/)
  ) {
    return "registrar_entrenamiento";
  }

  if (
    has(/\b(crea|crear|anade|anadir|agrega|agregar)\b/) &&
    has(/\bejercicio\b/) &&
    !has(/\brutina\b/)
  ) {
    return "crear_ejercicio";
  }

  if (
    has(/\b(cambia|cambiar|ajusta|ajustar|pon|poner)\b/) &&
    has(/\b(unidad|descanso|sonido)\b/)
  ) {
    return "ajustes";
  }

  if (
    has(/\b(abre|abrir|ve a|ir a|muestra|muestrame|lleva|llevame)\b/) &&
    has(/\b(pantalla|rutina|rutinas|plan|historial|progreso|estadisticas|medidas|ajustes|ejercicios|coach|inicio)\b/)
  ) {
    return "abrir_pantalla";
  }

  return null;
}

/**
 * Red de seguridad determinista: si ningún modelo ejecutó la acción, al menos
 * las órdenes simples (peso, objetivo, abrir pantalla, ajustes) se aplican.
 */
function fallbackActionForIntent(
  raw: string,
  s: Snapshot,
  intent: string | null,
): { action: any; text: string } | null {
  if (!intent) return null;
  const today = snapshotToday(s);
  const unit = s.unidad || "kg";

  const extractWeight = (): number | null => {
    const match =
      raw.match(/(?:peso(?:\s+corporal)?|pese|pesé|balanza|báscula)[^\d]{0,30}(\d{1,3}(?:[.,]\d{1,2})?)/i) ||
      raw.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilos?|libras?|lb)\b/i);
    if (!match) return null;
    let value = Number(match[1].replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 500) return null;
    if (/\b(lb|libras?)\b/i.test(raw) && unit === "kg") {
      value = Math.round(value * 0.45359237 * 10) / 10;
    }
    return Math.round(value * 10) / 10;
  };

  const dateFor = () => {
    if (/\bayer\b/i.test(raw)) return shiftISO(today, -1);
    if (/\b(mañana|manana)\b/i.test(raw)) return shiftISO(today, 1);
    return today;
  };

  if (intent === "registrar_peso") {
    const peso = extractWeight();
    if (peso == null) return null;
    const fecha = dateFor();
    return {
      action: { tipo: "registrar_peso", peso, fecha },
      text: `Peso corporal registrado: ${peso} ${unit} (${fecha}).`,
    };
  }

  if (intent === "objetivo_peso") {
    const peso = extractWeight();
    if (peso == null) return null;
    return {
      action: { tipo: "objetivo_peso", peso },
      text: `Objetivo de peso actualizado: ${peso} ${unit}.`,
    };
  }

  if (intent === "abrir_pantalla") {
    const t = norm(raw);
    const screens: [RegExp, string, string][] = [
      [/\b(rutina|rutinas|plan|semana)\b/, "plan", "Plan"],
      [/\b(entrenar|entreno|workout)\b/, "workout", "Entrenar"],
      [/\b(ejercicio|ejercicios|biblioteca)\b/, "library", "Ejercicios"],
      [/\b(estadistica|estadisticas|progreso)\b/, "stats", "Estadísticas"],
      [/\bhistorial\b/, "history", "Historial"],
      [/\b(inicio|home)\b/, "home", "Inicio"],
      [/\bcoach\b/, "coach", "Coach IA"],
    ];
    const found = screens.find(([re]) => re.test(t));
    if (!found) return null;
    return {
      action: { tipo: "abrir_pantalla", pantalla: found[1] },
      text: `Abriendo ${found[2]}.`,
    };
  }

  if (intent === "ajustes") {
    const action: any = { tipo: "ajustes" };
    const notes: string[] = [];
    if (/\b(libras?|lb)\b/i.test(raw)) {
      action.unidad = "lb";
      notes.push("unidad: lb");
    } else if (/\b(unidad)\b/i.test(norm(raw)) && /\bkg|kilos?\b/i.test(raw)) {
      action.unidad = "kg";
      notes.push("unidad: kg");
    }
    const rest =
      raw.match(/descanso[^\d]{0,20}(\d{1,3})/i) ||
      raw.match(/(\d{1,3})\s*(?:seg|segundos)[^\d]{0,20}descanso/i);
    if (rest) {
      action.descanso_seg = Number(rest[1]);
      notes.push(`descanso: ${rest[1]}s`);
    }
    if (/\bsonido\b/i.test(raw)) {
      const normalized = norm(raw);
      const off = /\b(desactiv|apag|off|no)\b/.test(normalized);
      const on = /\b(activ|encend|on|si)\b/.test(normalized);
      if (on || off) {
        action.sonido = on && !off;
        notes.push(`sonido: ${action.sonido ? "sí" : "no"}`);
      }
    }
    if (!notes.length) return null;
    return { action, text: `Ajustes actualizados — ${notes.join(" · ")}.` };
  }

  return null;
}

// ---------------------------------------------------------------- handler

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const started = Date.now();
  const remaining = () => GLOBAL_BUDGET_MS - (Date.now() - started);

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return json(
        {
          error:
            "El Coach GYM no está configurado: falta OPENROUTER_API_KEY en los secretos de Supabase.",
        },
        500,
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Petición inválida." }, 400);
    const proveedor = body.provider === "deepseek" ? "deepseek" : "openrouter";
    const opencodeKey = Deno.env.get("OPENCODE_API_KEY") || "";
    const usarOpenCode = proveedor === "deepseek" && Boolean(opencodeKey);

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Falta el mensaje." }, 400);
    if (message.length > 4000) return json({ error: "El mensaje es demasiado largo." }, 400);
    let intent = detectActionIntent(message);
    // Borrar es destructivo: no forzamos la herramienta hasta que el usuario
    // confirme. Si solo dice «borra la rutina X», el modelo debe preguntar.
    const deleteConfirmed =
      /\b(confirmo|confirmado|confirma|dale|adelante|borrala|eliminala|hazlo|procede)\b/.test(
        norm(message),
      ) || /\bsí\b/i.test(message);
    if (intent === "eliminar_rutina" && !deleteConfirmed) intent = null;

    const history: ChatMessage[] = (Array.isArray(body.history) ? body.history : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-16)
      .map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, 4000),
      }))
      .filter((m: ChatMessage) => m.content.trim());

    const snapshot = asSnapshot(body.snapshot);
    const hasSnapshot = Boolean(snapshot);
    const safeSnapshot: Snapshot = snapshot || {
      fecha_hoy: todayISO(),
      dia_semana: DAY_NAMES[new Date().getDay()],
      rutinas: [],
      historial: [],
      semana: {},
      catalogo: {},
    };
    const promptData = buildPromptSnapshot(safeSnapshot);
    const systemPrompt = buildSystemPrompt(safeSnapshot, promptData, hasSnapshot);

    const baseMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // ------------------------- modelos -------------------------
    const allModels = await discoverModels(apiKey);
    // `lastGoodModel` puede ser el modelo de OpenCode; no debe reutilizarse
    // como si fuera un id de OpenRouter.
    const activeSeed = lastGoodModel === OPENCODE_MODEL ? null : lastGoodModel;
    let activeModel: string | null = intent ? null : activeSeed;
    let toolModels = pickModels(allModels, true, activeSeed);
    if (!allModels.length || !toolModels.length) toolModels = STATIC_TOOL_MODELS.slice(0, 6);
    // DeepSeek va primero solo si el usuario lo eligió. Si falla, la cadena
    // continúa con los modelos de OpenRouter (fallback automático).
    if (usarOpenCode) {
      toolModels = [OPENCODE_MODEL, ...toolModels.filter((m) => m !== OPENCODE_MODEL)];
    }

    let lastError = "";
    let partialActions: any[] = [];
    const seenActions = new Set<string>();

    const addAction = (action: any): boolean => {
      const key = stableStringify(action);
      if (seenActions.has(key)) return false;
      seenActions.add(key);
      partialActions.push(action);
      return true;
    };

    // Las acciones simples se fuerzan a la herramienta exacta. Las complejas
    // usan tool_choice "required" para que el modelo pueda consultar antes
    // (por ejemplo, buscar_ejercicio) sin inventar nombres.
    const SPECIFIC_TOOL_INTENTS = new Set([
      "registrar_peso",
      "objetivo_peso",
      "registrar_medidas",
      "abrir_pantalla",
      "ajustes",
      "eliminar_rutina",
      "registrar_entrenamiento",
    ]);
    const forcedIntentTool = intent
      ? SPECIFIC_TOOL_INTENTS.has(intent)
        ? intent
        : "__required__"
      : null;

    const runToolLoop = async (
      model: string,
      forcedTool: string | null,
      provider: "openrouter" | "opencode",
    ) => {
      const messages = [...baseMessages];
      const actions: any[] = [];
      let lastContent = "";
      let sawAction = false;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const left = remaining();
        if (left < 6_000) break;
        const toolChoice =
          round === 0 && forcedTool
            ? forcedTool === "__required__"
              ? "required"
              : { type: "function", function: { name: forcedTool } }
            : undefined;
        const timeout = () => Math.min(ATTEMPT_TIMEOUT_MS, Math.max(4_000, remaining() - 3_000));
        let reply: ModelReply;
        try {
          reply = await callOpenRouter(
            apiKey,
            model,
            messages,
            timeout(),
            true,
            toolChoice,
            provider,
          );
        } catch (e) {
          const err = e as ModelHttpError;
          // Algunos modelos gratuitos no aceptan tool_choice forzado: reintenta
          // sin forzarlo en vez de descartar el modelo.
          if (toolChoice && (err.status === 400 || err.status === 422)) {
            reply = await callOpenRouter(apiKey, model, messages, timeout(), true, undefined, provider);
          } else {
            throw e;
          }
        }

        if (reply.content.trim()) lastContent = reply.content.trim();
        if (!reply.toolCalls.length) {
          return { content: lastContent, actions, sawAction };
        }

        messages.push({
          role: "assistant",
          content: reply.content || "",
          tool_calls: reply.toolCalls,
        });

        for (const call of reply.toolCalls) {
          const name = normalizeToolName(call?.function?.name);
          const rawArgs = call?.function?.arguments;
          const args = parseToolArgs(rawArgs);
          let result: unknown;

          if (!args) {
            result = {
              error:
                "No pude leer los argumentos de la herramienta (JSON inválido). Vuelve a llamarla con JSON válido.",
            };
          } else if (ACTION_NAMES.has(name)) {
            const clean = { ...args };
            delete clean.tipo;
            const problem = validateAction(name, clean);
            if (problem) {
              result = { error: problem };
            } else {
              const action = normalizeAction(name, { tipo: name, ...clean }, message);
              const added = addAction(action);
              actions.push(action);
              sawAction = true;
              result = {
                ok: true,
                accion: name,
                nota: added
                  ? "Cambio registrado. La app lo aplicará automáticamente al terminar tu respuesta. No vuelvas a llamar esta misma acción ni intentes verificarla con una lectura: el cambio todavía no aparece en el estado de esta conversación."
                  : "Ese cambio ya estaba registrado; no hace falta repetirlo.",
              };
            }
          } else if (
            name === "leer_historial" ||
            name === "sugerir_entrenamiento" ||
            name === "buscar_ejercicio"
          ) {
            try {
              result = executeReadTool(safeSnapshot, name, args);
            } catch (e) {
              result = { error: (e as Error).message || "No pude leer esos datos." };
            }
          } else {
            result = { error: `Herramienta «${name || "(sin nombre)"}» no disponible.` };
          }

          messages.push({
            role: "tool",
            tool_call_id: call?.id || `call_${round}_${Math.random().toString(36).slice(2, 8)}`,
            content: String(JSON.stringify(result)).slice(0, 14_000),
          });
        }
      }

      return { content: lastContent, actions, sawAction };
    };

    for (const model of toolModels) {
      if (remaining() < 8_000) break;
      const proveedorModelo =
        usarOpenCode && model === OPENCODE_MODEL ? "opencode" : "openrouter";
      try {
        const result = await runToolLoop(model, forcedIntentTool, proveedorModelo);
        activeModel = model;
        if (result.sawAction || result.actions.length) {
          lastGoodModel = model;
          // Hay cambios reales: no probamos otro modelo (evita duplicados).
          return json({
            content: result.content || fallbackActionText(result.actions),
            acciones: mergeActions(partialActions, result.actions),
            modelo: model,
          });
        }
        if (result.content) {
          if (intent) {
            // El usuario pidió un cambio: no aceptamos una respuesta de texto
            // que no ejecutó nada. Probamos otro modelo.
            lastError = "El modelo respondió sin ejecutar la acción solicitada.";
            continue;
          }
          lastGoodModel = model;
          return json({ content: result.content, acciones: [], modelo: model });
        }
        lastError = "El modelo devolvió una respuesta vacía.";
      } catch (e) {
        const err = e as Error & { fatal?: boolean; status?: number };
        lastError = err.message || String(e);
        if (lastGoodModel === model) lastGoodModel = null;
        if (err.fatal) {
          return json({ error: `La clave de OpenRouter no es válida o no tiene permisos. ${lastError}` }, 500);
        }
        // Modelo caído, restringido, retirado o sin soporte de herramientas:
        // lo vetamos y seguimos con el siguiente. Nunca devolvemos su error.
        if (esErrorDeModelo(lastError, Number(err.status) || 0)) marcarModeloInvalido(model);
        // Límite diario de la cuenta: probar más modelos solo añade espera.
        if (err.status === 429 && esLimiteDiario(lastError)) break;
        // 429 / timeout: probamos el siguiente.
      }
    }

    // Si algún modelo alcanzó a proponer acciones pero se quedó sin texto,
    // las devolvemos igualmente: son cambios válidos.
    if (partialActions.length) {
      return json({
        content: fallbackActionText(partialActions),
        acciones: partialActions,
        modelo: activeModel || undefined,
      });
    }

    // ------------------------- fallback sin herramientas -------------------------
    if (remaining() > 18_000) {
      let textModels = pickModels(
        allModels,
        false,
        intent ? null : activeModel === OPENCODE_MODEL ? null : activeModel,
      );
      if (!allModels.length) textModels = STATIC_TEXT_MODELS.filter((id) => !modeloBloqueado(id));
      for (const model of textModels.slice(0, 3)) {
        if (remaining() < 14_000) break;
        try {
          const reply = await callOpenRouter(
            apiKey,
            model,
            [
              { role: "system", content: buildNoToolsPrompt(systemPrompt) },
              ...history,
              { role: "user", content: message },
            ],
            Math.min(30_000, remaining() - 3_000),
            false,
          );
          const parsed = parseJsonReply(reply.content);
          if (parsed) {
            if (intent && !parsed.acciones.length) {
              lastError = "El modelo de texto respondió sin incluir la acción solicitada.";
              continue;
            }
            lastGoodModel = model;
            return json({
              content: parsed.content || "Listo.",
              acciones: parsed.acciones,
              modelo: model,
              modo: "json",
            });
          }
          if (reply.content.trim()) {
            if (intent) {
              lastError = "El modelo de texto respondió sin incluir la acción solicitada.";
              continue;
            }
            lastGoodModel = model;
            return json({ content: reply.content.trim(), acciones: [], modelo: model });
          }
        } catch (e) {
          const err = e as Error & { status?: number };
          lastError = err.message || lastError;
          if (esErrorDeModelo(lastError, Number(err.status) || 0)) marcarModeloInvalido(model);
        }
      }
    }

    // ------------------------- red de seguridad determinista -------------------------
    // Si el usuario pidió un cambio y ningún modelo lo ejecutó, aplicamos las
    // órdenes simples sin depender del modelo. Nunca devolvemos un texto que
    // diga "registrado" si no hay una acción real.
    if (intent) {
      const fallback = fallbackActionForIntent(message, safeSnapshot, intent);
      if (fallback) {
        return json({
          content: fallback.text,
          acciones: [fallback.action],
          modelo: activeModel || undefined,
        });
      }
      return json({
        content:
          "⚠️ No pude aplicar el cambio en la app. Vuelve a pedírmelo con el dato exacto; por ejemplo: «registra mi peso de hoy: 82.5 kg».",
        acciones: [],
        modelo: activeModel || undefined,
      });
    }

    const limiteDiario = esLimiteDiario(lastError);
    return json(
      {
        error: limiteDiario
          ? MENSAJE_LIMITE_DIARIO
          : "Ningún modelo gratuito respondió ahora mismo. Espera un minuto y vuelve a intentarlo. " +
            (lastError ? `Detalle: ${lastError.slice(0, 240)}` : ""),
      },
      429,
    );
  } catch (e) {
    return json({ error: (e as Error).message || "Error inesperado en el Coach GYM." }, 500);
  }
});

// ---------------------------------------------------------------- helpers finales

function mergeActions(a: any[], b: any[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  for (const action of [...a, ...b]) {
    const key = stableStringify(action);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out.slice(0, 16);
}

function fallbackActionText(actions: any[]): string {
  const labels: Record<string, string> = {
    crear_rutina: "crear la rutina",
    actualizar_rutina: "actualizar la rutina",
    eliminar_rutina: "eliminar la rutina",
    asignar_semana: "organizar la semana",
    planificar_dia: "cambiar el plan del día",
    registrar_peso: "registrar el peso",
    registrar_medidas: "registrar las medidas",
    objetivo_peso: "cambiar el objetivo de peso",
    ajustar_ejercicio: "ajustar el ejercicio",
    registrar_entrenamiento: "registrar el entrenamiento",
    crear_ejercicio: "crear el ejercicio",
    ajustes: "cambiar los ajustes",
    abrir_pantalla: "abrir la pantalla",
  };
  const list = actions.map((a) => labels[a.tipo] || a.tipo).join(", ");
  return `Listo: ${list}. La app ya aplicó los cambios; revisa las tarjetas de abajo y dime si quieres ajustar algo.`;
}

function buildNoToolsPrompt(base: string): string {
  return `${base}

MODO SIN HERRAMIENTAS
En esta llamada no tienes herramientas. Si el usuario pide un cambio, devuelve las acciones dentro del JSON.
Responde SOLO con un objeto JSON válido, sin markdown ni texto fuera del JSON:
{"content":"respuesta breve en español para el usuario","acciones":[]}
Cada acción es un objeto con "tipo" y sus campos. Tipos y campos principales:
- crear_rutina: {"tipo":"crear_rutina","nombre":"Push","ejercicios":[{"ejercicio":"Press banca","series":3,"reps":8,"peso":40,"descanso_seg":120}]}
- actualizar_rutina: {"tipo":"actualizar_rutina","rutina":"Push","agregar_ejercicios":[...],"quitar_ejercicios":["..."]}
- asignar_semana: {"tipo":"asignar_semana","dias":{"lunes":"Push","martes":"descanso"}}
- planificar_dia: {"tipo":"planificar_dia","fecha":"2026-01-15","rutina":"Push"}
- ajustar_ejercicio: {"tipo":"ajustar_ejercicio","ejercicio":"Press banca","peso":42.5,"series":4,"reps":8,"descanso_seg":150}
- registrar_peso: {"tipo":"registrar_peso","peso":52.5}
- registrar_medidas: {"tipo":"registrar_medidas","medidas":{"pecho":90,"cintura":72}}
- registrar_entrenamiento: {"tipo":"registrar_entrenamiento","rutina":"Push","ejercicios":[{"ejercicio":"Press banca","series":[{"peso":40,"reps":10},{"peso":40,"reps":9}]}]}
- eliminar_rutina: {"tipo":"eliminar_rutina","rutina":"Push","confirmado":true}
- objetivo_peso: {"tipo":"objetivo_peso","peso":55}
- crear_ejercicio: {"tipo":"crear_ejercicio","nombre":"...","grupo":"pecho"}
- ajustes: {"tipo":"ajustes","unidad":"kg","descanso_seg":120}
- abrir_pantalla: {"tipo":"abrir_pantalla","pantalla":"plan"}
Si no hay cambios, deja "acciones":[] y responde normal en "content".`;
}

function parseJsonReply(raw: string): { content: string; acciones: any[] } | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
  const acciones = Array.isArray(parsed.acciones)
    ? parsed.acciones
        .filter(
          (a: any) =>
            a &&
            typeof a === "object" &&
            typeof a.tipo === "string" &&
            ACTION_NAMES.has(a.tipo),
        )
        .slice(0, 16)
    : [];
  if (!content && !acciones.length) return null;
  return { content, acciones };
}
