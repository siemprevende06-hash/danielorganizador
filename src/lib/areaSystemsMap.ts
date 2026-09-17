import {
  SOSTEN_AREAS,
  DAY_SYSTEMS,
  type DaySystem,
} from "@/lib/daySystems";

// ---------------------------------------------------------------------------
// Mapa único: Área de vida ↔ Sistema diario ↔ Resultado (Punto B).
// Cada hábito trackeable pertenece a UNA sola área principal; los sistemas del
// día (DAY_SYSTEMS) se fusionan con los hábitos de Sostén para no perder
// ningún control de tracking en el rediseño de la vista "Sistemas".
// ---------------------------------------------------------------------------

export interface AreaSystemConfig {
  /** Hábitos/sistemas asignados al área (ids de daily_systems_tracking / DAY_SYSTEMS). */
  habits: string[];
  /** Áreas de la jerarquía (useDailyPlanData / hierarchy) para metas de minutos. */
  hierarchyAreas: string[];
  /** La visión definitiva del área. */
  vision: string;
  /** "La garantía" del sistema: qué resultado produce si se cumple. */
  promise?: string;
  /** Nota para áreas sin sistema diario propio. */
  systemNote?: string;
}

export const AREA_SYSTEMS: Record<string, AreaSystemConfig> = {
  salud: {
    habits: [
      "gym",
      "pre-entreno",
      "alistamiento-desayuno",
      "desayuno",
      "merienda-1",
      "almuerzo",
      "merienda-2",
      "comida",
      "antes-dormir",
      "suplementos",
    ],
    hierarchyAreas: ["gym"],
    vision: "Físicamente fuerte: 70kg+, gym 5d/sem y presencia imponente",
    promise:
      "Alimentación completa + agua + gym 30–60' todos los días ⇒ subes de peso, duermes mejor y rindes más.",
  },
  "fuerza-mental": {
    habits: [
      "rutina-activacion",
      "horario-regular",
      "rutina-desactivacion",
      "habit-sueno",
      "habit-rutina-activacion",
      "habit-entrenamiento",
      "habit-desayuno",
      "habit-skincare-am",
      "habit-skincare-pm",
      "habit-rutina-desactivacion",
      "habit-alimentacion",
      "habit-finanzas",
      "mini-nofap",
      "mini-nosocial",
      "no-videojuegos",
      "no-porn",
      "no-fap",
      "redes-sociales",
    ],
    hierarchyAreas: [],
    vision: "Rutinas y disciplina automáticas que sostienen todo lo demás",
    promise:
      "Cumplir activación, desactivación y horario regular ⇒ el resto de los sistemas se ejecuta solo.",
  },
  proposito: {
    habits: ["journaling", "vision", "valores", "revisiones"],
    hierarchyAreas: [],
    vision: "Saber quién soy, hacia dónde voy y por qué",
    promise:
      "Journaling y revisiones periódicas = dirección clara. Sin propósito, los demás sistemas no saben a dónde van.",
    systemNote:
      "Tu sistema de propósito (journaling y revisiones) aún no se registra a diario. Es la base que ordena todas las demás áreas.",
  },
  apariencia: {
    habits: ["skincare-manana", "skincare-noche", "banarme-vestirse"],
    hierarchyAreas: [],
    vision: "Presencia impecable en cada detalle del día",
    promise: "Skin care AM/PM + higiene diaria ⇒ presencia y confianza que abren puertas.",
  },
  desarrollo: {
    habits: ["musica", "idiomas", "game", "ajedrez", "lectura"],
    hierarchyAreas: ["musica", "lectura", "ajedrez", "ingles", "italiano", "game"],
    vision: "Tocar música de forma avanzada, +24 libros/año y dominio de inglés e italiano",
    promise:
      "30 min de música (mín 15) ⇒ aprendes canciones. 15 min de lectura/ajedrez/idiomas ⇒ dominio acumulativo.",
  },
  profesional: {
    habits: ["universidad", "emprendimiento", "proyectos"],
    hierarchyAreas: ["universidad", "proyectos", "emprendimiento"],
    vision: "Graduado en Ingeniería Automática y AUTEC estable generando ingresos",
    promise:
      "Bloques de 80–240 min en universidad y emprendimiento ⇒ semestre al día y AUTEC con ingresos recurrentes.",
  },
  finanzas: {
    habits: ["finanzas"],
    hierarchyAreas: [],
    vision: "Libertad económica: ahorro, inversión e ingresos múltiples",
    promise: "15 min diarios de control financiero ⇒ gastos bajo control, ahorro e inversión.",
  },
  familia: {
    habits: ["familia"],
    hierarchyAreas: [],
    vision: "Amistades profundas y una red social sólida",
    promise:
      "Tiempo intencional con los tuyos cada semana ⇒ relaciones profundas que sostienen todo lo demás.",
    systemNote:
      "Aún no hay sistema diario de Familia. Un sistema mínimo: escribir o llamar a alguien y planear algo cada semana.",
  },
  amor: {
    habits: ["game", "seduccion", "conexion", "intimidad_tracking", "habilidades-sociales"],
    hierarchyAreas: [],
    vision: "Hombre seguro con experiencia real en relaciones",
    promise:
      "Practicar Game 15–30' diarios + acciones reales ⇒ citas, conexión y experiencia romántica.",
    systemNote:
      "Tu sistema de amor se conecta al de Game (Desarrollo): práctica diaria + salir en citas y registrar experiencias.",
  },
  ocio: {
    habits: ["game"],
    hierarchyAreas: [],
    vision: "Vida equilibrada, experiencias nuevas y viajes",
    promise:
      "Control del gaming + experiencias nuevas ⇒ recreación sin culpa y vida más rica.",
    systemNote:
      "Tu sistema de ocio se conecta al de Game (Desarrollo): gaming controlado y planear experiencias/viajes.",
  },
};

// ---------------------------------------------------------------------------
// Grupos del Punto B
// ---------------------------------------------------------------------------

export type PointBGroup = "cimientos" | "construccion" | "recompensas";

export const GROUP_CONFIG: Record<
  PointBGroup,
  {
    label: string;
    note: string;
    chip: string;
    bar: string;
    dot: string;
    ring: string;
    headerBg: string;
  }
> = {
  cimientos: {
    label: "Cimientos · Estructura",
    note: "La base sobre la que construyes todo",
    chip: "bg-blue-500/10 text-blue-600 border-blue-500/25",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    ring: "text-blue-500",
    headerBg: "from-blue-500/20 via-blue-500/5",
  },
  construccion: {
    label: "Construcción · Esfuerzo",
    note: "Donde pones tu energía para crecer",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    ring: "text-amber-500",
    headerBg: "from-amber-500/20 via-amber-500/5",
  },
  recompensas: {
    label: "Recompensas · Vida",
    note: "El resultado de tu esfuerzo",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    ring: "text-emerald-500",
    headerBg: "from-emerald-500/20 via-emerald-500/5",
  },
};

/** Compat: label corto por grupo (usado por SistemasSection de Objetivo). */
export const GROUP_LABELS: Record<string, string> = {
  cimientos: "Cimientos · Estructura",
  construccion: "Construcción · Esfuerzo",
  recompensas: "Recompensas · Vida",
};

// ---------------------------------------------------------------------------
// Diagnóstico por área: "si no hay resultados es porque el sistema está roto
// o no lo estás cumpliendo".
// ---------------------------------------------------------------------------

export type DiagnosisKey = "funcionando" | "roto" | "abandonado" | "heredado" | "sin-datos";
export type DiagnosisTone = "green" | "amber" | "red" | "blue" | "grey";

export interface AreaDiagnosis {
  key: DiagnosisKey;
  label: string;
  short: string;
  message: string;
  tone: DiagnosisTone;
  icon: string;
}

export const DIAGNOSIS_TONE: Record<DiagnosisTone, { text: string; bg: string; border: string }> = {
  green: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  red: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  blue: { text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  grey: { text: "text-muted-foreground", bg: "bg-muted/40", border: "border-border/50" },
};

/** Umbral para considerar un área "en marcha" (esfuerzo) o "avanzada" (resultados). */
export const DIAGNOSIS_THRESHOLD = 50;

export function diagnoseArea(esfuerzo: number, resultados: number): AreaDiagnosis {
  const hasData = esfuerzo > 0 || resultados > 0;
  if (!hasData) {
    return {
      key: "sin-datos",
      label: "Sin datos todavía",
      short: "Sin diagnóstico",
      message:
        "Aún no hay esfuerzo ni resultados registrados para esta área. Cumple el sistema y revisa el Punto B para diagnosticar.",
      tone: "grey",
      icon: "❔",
    };
  }
  if (esfuerzo >= DIAGNOSIS_THRESHOLD && resultados >= DIAGNOSIS_THRESHOLD) {
    return {
      key: "funcionando",
      label: "Sistema funcionando",
      short: "Dando resultados",
      message: "Estás cumpliendo el sistema y el área está avanzando. Sigue ejecutándolo.",
      tone: "green",
      icon: "✅",
    };
  }
  if (esfuerzo >= DIAGNOSIS_THRESHOLD) {
    return {
      key: "roto",
      label: "Sistema roto",
      short: "Esfuerzo sin resultados",
      message:
        "Estás haciendo la tarea pero el resultado no avanza. El sistema está roto: ajústalo, no trabajes más duro.",
      tone: "amber",
      icon: "⚙️",
    };
  }
  if (resultados >= DIAGNOSIS_THRESHOLD) {
    return {
      key: "heredado",
      label: "Resultado heredado",
      short: "Esfuerzo pasado",
      message:
        "El área conserva resultados de esfuerzo anterior, pero hoy no alimentas el sistema. Sosténlo o se estancará.",
      tone: "blue",
      icon: "🎓",
    };
  }
  return {
    key: "abandonado",
    label: "Sistema abandonado",
    short: "Área en caos",
    message:
      "No estás cumpliendo el sistema y por eso el área no da resultados. Vuelve a ejecutarlo hoy.",
    tone: "red",
    icon: "🧨",
  };
}

// ---------------------------------------------------------------------------
// Metadatos de hábitos (fusión Sostén + Sistemas del día)
// ---------------------------------------------------------------------------

export interface HabitMeta {
  id: string;
  name: string;
  emoji?: string;
  cover?: { type: "area" | "sub"; id: string };
  hasTime: boolean;
  hasWater: boolean;
  hasMealPhoto: boolean;
  isWorkout: boolean;
  isSleepSchedule: boolean;
  linkTo?: string;
  /** Presente cuando el hábito es además un "sistema del día" (velocidad/racha/contador). */
  system?: DaySystem;
}

const EXTRA_HABITS: Record<string, { name: string; emoji?: string }> = {
  proyectos: { name: "Proyectos" },
};

function buildHabitMeta(): Record<string, HabitMeta> {
  const map: Record<string, HabitMeta> = {};

  for (const area of SOSTEN_AREAS) {
    for (const sub of area.subareas) {
      for (const h of sub.habits) {
        map[h.id] = {
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          cover: h.cover ?? { type: "sub", id: sub.id },
          hasTime: !!h.hasTime,
          hasWater: !!h.hasWater,
          hasMealPhoto: !!h.hasMealPhoto,
          isWorkout: !!h.isWorkout,
          isSleepSchedule: !!h.isSleepSchedule,
          linkTo: h.linkTo,
        };
      }
    }
  }

  for (const area of DAY_SYSTEMS) {
    for (const sys of area.systems) {
      const prev = map[sys.id];
      map[sys.id] = {
        id: sys.id,
        name: sys.name,
        emoji: prev?.emoji,
        cover: sys.cover,
        hasTime: true,
        hasWater: prev?.hasWater ?? false,
        hasMealPhoto: prev?.hasMealPhoto ?? false,
        isWorkout: prev?.isWorkout ?? false,
        isSleepSchedule: prev?.isSleepSchedule ?? false,
        linkTo: prev?.linkTo,
        system: sys,
      };
    }
  }

  for (const [id, extra] of Object.entries(EXTRA_HABITS)) {
    if (!map[id]) {
      map[id] = {
        id,
        name: extra.name,
        emoji: extra.emoji,
        cover: { type: "area", id },
        hasTime: true,
        hasWater: false,
        hasMealPhoto: false,
        isWorkout: false,
        isSleepSchedule: false,
      };
    }
  }

  return map;
}

export const HABIT_META: Record<string, HabitMeta> = buildHabitMeta();

// ---------------------------------------------------------------------------
// Conjunto de hábitos trackeables hoy (para no perder ningún control)
// ---------------------------------------------------------------------------

export const ALL_TRACKABLE_IDS: string[] = (() => {
  const set = new Set<string>();
  for (const a of SOSTEN_AREAS) for (const s of a.subareas) for (const h of s.habits) set.add(h.id);
  for (const a of DAY_SYSTEMS) for (const s of a.systems) set.add(s.id);
  for (const ex of Object.keys(EXTRA_HABITS)) set.add(ex);
  return [...set];
})();

/** Asigna cada hábito a UNA sola área principal (la primera que lo declara). */
export const PRIMARY_HABIT_AREA: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [areaId, cfg] of Object.entries(AREA_SYSTEMS)) {
    for (const h of cfg.habits) {
      if (!m[h]) m[h] = areaId;
    }
  }
  return m;
})();

export function getHabitArea(id: string): string | undefined {
  return PRIMARY_HABIT_AREA[id];
}

/** Hábitos interactivos que pertenecen de forma activa a un área. */
export function getAreaTrackableHabits(areaId: string): HabitMeta[] {
  const cfg = AREA_SYSTEMS[areaId];
  if (!cfg) return [];
  return cfg.habits
    .filter((h) => PRIMARY_HABIT_AREA[h] === areaId && ALL_TRACKABLE_IDS.includes(h))
    .map((h) => HABIT_META[h])
    .filter(Boolean);
}

/** Todos los hábitos trackeables de los que se quieren rachas. */
export const ALL_STREAK_IDS = ALL_TRACKABLE_IDS;