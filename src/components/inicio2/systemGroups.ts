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

export interface SystemGroupDef {
  areaId: PlanAreaId;
  systemIds: string[];
  note: string;
}

/**
 * Mismos sistemas que se siguen en la pestaña Planificación de Daily:
 * los centrales (Desarrollo, Profesional y Finanzas) más Gym, que se agrupa
 * dentro de Salud.
 */
export const SYSTEM_GROUPS: SystemGroupDef[] = [
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
  {
    areaId: "salud",
    systemIds: ["gym"],
    note: "Gym",
  },
];

/** Todos los sistemas visibles en Inicio 2.0, en el orden de los grupos. */
export const SYSTEM_IDS = SYSTEM_GROUPS.flatMap(group => group.systemIds);
