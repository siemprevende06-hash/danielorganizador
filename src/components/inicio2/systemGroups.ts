import type { Timeframe } from "@/contexts/TimeframeContext";
import type { PlanAreaId, PlanificationScope } from "@/lib/planSystems";

/**
 * El switch de Inicio 2.0 habla de periodos de tiempo; las métricas de los
 * sistemas hablan de ámbitos de planificación. Este mapa es la única fuente
 * para convertir uno en otro (el sprint se comporta como semana).
 */
export const SCOPE_BY_TIMEFRAME: Record<Timeframe, PlanificationScope> = {
  today: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
  sprint: "week",
};

/** Unidad de los minutos planificados que se muestran en cada tarjeta. */
export const PLANNED_UNIT_BY_SCOPE: Record<PlanificationScope, string> = {
  day: "min día",
  week: "min sem.",
  month: "min mes",
  quarter: "min trim.",
  year: "min año",
};

/**
 * Columnas del grid según cuántas tarjetas tiene el grupo. Así las filas
 * siempre se llenan: 3 tarjetas ocupan 3 columnas y 1 ocupa toda la fila.
 */
export function cardGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2 lg:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
}

export interface SystemCardGroupDef {
  id: string;
  title: string;
  emoji: string;
  note?: string;
  /**
   * Hábitos que forman la tarjeta. Si hay más de uno, el día se considera
   * cumplido cuando se completa al menos el 80% del grupo.
   */
  systemIds: string[];
}

export interface SystemGroupDef {
  areaId: PlanAreaId;
  systemIds: string[];
  note: string;
  /**
   * Tarjetas del área. Si falta, se muestra una tarjeta por cada systemId
   * (comportamiento de Desarrollo, Profesional y Finanzas).
   */
  cards?: SystemCardGroupDef[];
}

/**
 * Sistemas visibles en Inicio 2.0. Las áreas estructurales agrupan sus hábitos
 * en una sola tarjeta por sección (Alimentación, Rutinas, Skin care…), mientras
 * las centrales mantienen una tarjeta por sistema.
 */
export const SYSTEM_GROUPS: SystemGroupDef[] = [
  {
    areaId: "salud",
    systemIds: [
      "pre-entreno",
      "desayuno",
      "merienda-1",
      "almuerzo",
      "merienda-2",
      "comida",
      "antes-dormir",
      "horario-regular",
      "hidratacion",
      "gym",
      "suplementos",
    ],
    note: "Alimentación · Sueño · Hidratación · Gym · Suplementos",
    cards: [
      {
        id: "alimentacion",
        title: "Alimentación",
        emoji: "🍽️",
        note: "7 comidas",
        systemIds: [
          "pre-entreno",
          "desayuno",
          "merienda-1",
          "almuerzo",
          "merienda-2",
          "comida",
          "antes-dormir",
        ],
      },
      {
        id: "sueno",
        title: "Sueño",
        emoji: "🌙",
        note: "horario",
        systemIds: ["horario-regular"],
      },
      {
        id: "hidratacion",
        title: "Hidratación",
        emoji: "💧",
        note: "agua",
        systemIds: ["hidratacion"],
      },
      {
        id: "gym",
        title: "Gym",
        emoji: "💪",
        note: "entreno",
        systemIds: ["gym"],
      },
      {
        id: "suplementos",
        title: "Suplementos",
        emoji: "💊",
        note: "diario",
        systemIds: ["suplementos"],
      },
    ],
  },
  {
    areaId: "fuerza-mental",
    systemIds: [
      "rutina-activacion",
      "alistamiento-desayuno",
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
    ],
    note: "Rutinas · Hábitos · Detox dopamínico",
    cards: [
      {
        id: "rutinas",
        title: "Rutinas",
        emoji: "🔁",
        note: "3 rutinas",
        systemIds: ["rutina-activacion", "alistamiento-desayuno", "rutina-desactivacion"],
      },
      {
        id: "habitos",
        title: "Hábitos",
        emoji: "🎯",
        note: "9 hábitos",
        systemIds: [
          "habit-sueno",
          "habit-rutina-activacion",
          "habit-entrenamiento",
          "habit-desayuno",
          "habit-skincare-am",
          "habit-skincare-pm",
          "habit-rutina-desactivacion",
          "habit-alimentacion",
          "habit-finanzas",
        ],
      },
      {
        id: "detox",
        title: "Detox dopamínico",
        emoji: "🧘",
        note: "4 hábitos",
        systemIds: ["mini-nofap", "mini-nosocial", "no-videojuegos", "no-porn"],
      },
    ],
  },
  {
    areaId: "apariencia",
    systemIds: [
      "skincare-manana",
      "skincare-noche",
      "banarme-vestirme",
      "organizacion-cuarto",
      "organizacion-bano",
      "organizacion-sala",
      "organizacion-platos",
      "barbero-estetica",
    ],
    note: "Skin care · Higiene · Orden · Barbero",
    cards: [
      {
        id: "skincare",
        title: "Skin care AM y PM",
        emoji: "✨",
        note: "AM + PM",
        systemIds: ["skincare-manana", "skincare-noche"],
      },
      {
        id: "banarme-vestirme",
        title: "Bañarme y vestirme",
        emoji: "👔",
        note: "diario",
        systemIds: ["banarme-vestirme"],
      },
      {
        id: "orden-espacio",
        title: "Orden del espacio",
        emoji: "🧹",
        note: "4 espacios",
        systemIds: [
          "organizacion-cuarto",
          "organizacion-bano",
          "organizacion-sala",
          "organizacion-platos",
        ],
      },
      {
        id: "barbero-estetica",
        title: "Barbero y estética",
        emoji: "💈",
        note: "1/mes",
        systemIds: ["barbero-estetica"],
      },
    ],
  },
  {
    areaId: "desarrollo",
    systemIds: ["lectura", "musica", "idiomas", "ajedrez", "game"],
    note: "Lectura · Música · Idiomas · Ajedrez · Game",
  },
  {
    areaId: "profesional",
    systemIds: ["universidad", "emprendimiento", "proyectos", "tareas"],
    note: "Universidad · Emprendimiento · Proyectos · Tareas generales",
  },
  {
    areaId: "finanzas",
    systemIds: ["finanzas"],
    note: "Finanzas",
  },
];

/** Todos los sistemas visibles en Inicio 2.0, en el orden de los grupos. */
export const SYSTEM_IDS = SYSTEM_GROUPS.flatMap(group => group.systemIds);
