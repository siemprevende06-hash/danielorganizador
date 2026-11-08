import { POINT_B_AREAS } from '@/data/pointB2027';
import {
  AREA_SYSTEMS,
  HABIT_META,
  getAreaTrackableHabits,
  type PointBGroup,
} from '@/lib/areaSystemsMap';
import { SOSTEN_AREAS, systemSpeedOptions } from '@/lib/daySystems';

// ---------------------------------------------------------------------------
// Catálogo único de Planificación: TODAS las áreas y sistemas que se miden en
// Día / Semana / Mes. Estructurales = cimientos (salud, fuerza, apariencia);
// centrales = construcción (desarrollo, profesional, finanzas). Propósito no
// tiene tracking diario y queda fuera de las tarjetas.
// ---------------------------------------------------------------------------

export type PlanificationScope = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type PlanSystemKind = 'estructural' | 'central';
export type PlanSystemRole = 'ancla' | 'mantenimiento';
export type PlanDayStatus = 'done' | 'partial' | 'skip' | 'rest' | 'none';
export type PlanAreaStatus = 'green' | 'amber' | 'red' | 'grey';

export type PlanAreaId =
  | 'salud'
  | 'fuerza-mental'
  | 'apariencia'
  | 'desarrollo'
  | 'profesional'
  | 'finanzas';

export interface PlanSectionDef {
  id: string;
  title: string;
  emoji?: string;
  systems: string[];
}

export interface PlanAreaDef {
  id: PlanAreaId;
  label: string;
  icon: string;
  group: PointBGroup;
  kind: PlanSystemKind;
  vision?: string;
  systems: string[];
  anchors: string[];
  sections: PlanSectionDef[];
}

export interface PlanSystemDef {
  id: string;
  name: string;
  emoji: string;
  areaId: PlanAreaId;
  kind: PlanSystemKind;
  sectionId: string;
  sectionTitle: string;
  role: PlanSystemRole;
  timed: boolean;
  minimumDose: number;
  defaultTargetPct: number;
}

/** Rendimiento real de un sistema durante el periodo visible. */
export interface PlanSystemMetrics {
  id: string;
  kind: PlanSystemKind;
  areaId: PlanAreaId;
  role: PlanSystemRole;
  /** % de días cumplidos sobre días disponibles (sin descansos ni futuro). */
  compliance: number | null;
  daysDone: number;
  /** Días disponibles para cumplir (transcurridos y sin descanso). */
  daysTotal: number;
  daysSkipped: number;
  restDays: number;
  partialDays: number;
  targetPct: number;
  targetDays: number;
  targetMet: boolean | null;
  actualMinutes: number;
  plannedMinutes?: number;
  /** Páginas leídas en el periodo (solo Lectura). */
  pagesRead?: number;
  minimumDose: number;
  timed: boolean;
  streak: number;
  bestStreak: number;
  /** Mayor cantidad de días seguidos sin cumplir (los descansos no cuentan). */
  maxGap: number;
  /** Veces que retomaste el sistema después de una brecha. */
  recoveries: number;
  /** Diferencia de cumplimiento contra el periodo anterior (puntos). */
  trend: number | null;
  previousCompliance: number | null;
  greenWeeks: number;
  totalWeeks: number;
  lastDone?: string | null;
  effort?: number;
  results?: number;
  status: PlanDayStatus[];
  spark: number[];
  days: string[];
}

/** Métricas de la tarjeta sintética "Tareas generales" de Inicio 2.0. */
export interface PlanTaskMetrics {
  /** Tareas del periodo (con vencimiento dentro del periodo). */
  total: number;
  done: number;
  pending: number;
  /** % de tareas completadas del periodo. */
  completion: number | null;
  /** Días con al menos una tarea y días en los que se completaron todas. */
  daysWithTasks: number;
  daysDone: number;
  partialDays: number;
  streak: number;
  bestStreak: number;
  maxGap: number;
  recoveries: number;
  greenWeeks: number;
  totalWeeks: number;
  trend: number | null;
  /** Solo los días con tareas, para la franja de estados de la tarjeta. */
  status: PlanDayStatus[];
  days: string[];
  /** Estado del día de hoy si tiene tareas. */
  todayStatus?: PlanDayStatus;
}

export interface PlanAreaWeek {
  key: string;
  compliance: number | null;
}

export interface PlanAreaWeakAnchor {
  id: string;
  name: string;
  compliance: number;
}

export interface PlanAreaMetrics {
  id: PlanAreaId;
  label: string;
  icon: string;
  group: PointBGroup;
  kind: PlanSystemKind;
  compliance: number | null;
  anchorCompliance: number | null;
  maintenanceCompliance: number | null;
  activeSystems: number;
  totalSystems: number;
  systemsOnTarget: number;
  weakestAnchor: PlanAreaWeakAnchor | null;
  trend: number | null;
  greenWeeks: number;
  totalWeeks: number;
  weeks: PlanAreaWeek[];
  status: PlanAreaStatus;
  effort?: number;
  results?: number;
  /** Cumplimiento del mes que contiene el periodo visible. */
  monthCompliance: number | null;
}

const STRUCTURAL_AREA_IDS: PlanAreaId[] = ['salud', 'fuerza-mental', 'apariencia'];
const CENTRAL_AREA_IDS: PlanAreaId[] = ['desarrollo', 'profesional', 'finanzas'];

/** Anclas: los sistemas que garantizan que el área no se caiga. */
const AREA_ANCHORS: Record<PlanAreaId, string[]> = {
  salud: ['gym', 'desayuno', 'almuerzo', 'comida', 'horario-regular'],
  'fuerza-mental': ['rutina-activacion', 'rutina-desactivacion', 'habit-sueno', 'no-porn'],
  apariencia: ['skincare-manana', 'skincare-noche'],
  desarrollo: ['lectura', 'idiomas'],
  profesional: ['universidad', 'emprendimiento'],
  finanzas: ['finanzas'],
};

/**
 * Metas de cumplimiento por defecto. Se expresan en % para que funcionen igual
 * en día, semana y mes: gym 5/7 ≈ 71%, sueño 6/7 ≈ 86%, comidas 80%,
 * detox 7/7 = 100%. El usuario puede cambiarlas por sistema.
 */
const TARGET_PCT: Record<string, number> = {
  gym: 71,
  'horario-regular': 86,
  'habit-sueno': 86,
  'rutina-activacion': 86,
  'rutina-desactivacion': 86,
  'alistamiento-desayuno': 86,
  'skincare-manana': 86,
  'skincare-noche': 86,
  'banarme-vestirme': 86,
  'pre-entreno': 80,
  desayuno: 80,
  'merienda-1': 80,
  almuerzo: 80,
  'merienda-2': 80,
  comida: 80,
  'antes-dormir': 80,
  suplementos: 80,
  hidratacion: 80,
  'no-videojuegos': 100,
  'no-porn': 100,
  'no-fap': 100,
  'redes-sociales': 100,
  'mini-nofap': 100,
  'mini-nosocial': 100,
};

const CENTRAL_SECTION_ORDER: Record<PlanAreaId, string[]> = {
  salud: [],
  'fuerza-mental': [],
  apariencia: [],
  desarrollo: ['lectura', 'musica', 'idiomas', 'ajedrez', 'game'],
  profesional: ['universidad', 'emprendimiento', 'proyectos'],
  finanzas: ['finanzas'],
};

const SYSTEM_NAME: Record<string, string> = {
  lectura: 'Lectura',
  musica: 'Música',
  idiomas: 'Idiomas',
  ajedrez: 'Ajedrez',
  game: 'Game',
  universidad: 'Universidad',
  emprendimiento: 'Emprendimiento',
  proyectos: 'Proyectos',
  finanzas: 'Finanzas',
  gym: 'Gym',
};

const SYSTEM_EMOJI: Record<string, string> = {
  lectura: '📖',
  musica: '🎹',
  idiomas: '🌍',
  ajedrez: '♟️',
  game: '🎮',
  universidad: '🎓',
  emprendimiento: '🚀',
  proyectos: '📦',
  finanzas: '💰',
  gym: '💪',
};

/** Pasos disponibles para editar la meta de un sistema desde la tarjeta. */
export const PLAN_TARGET_STEPS = [50, 60, 70, 71, 80, 86, 90, 100] as const;

function cleanName(id: string): string {
  return (HABIT_META[id]?.name ?? id)
    .replace(/^Hábito:\s*/i, '')
    .replace(/^Mini:\s*/i, '');
}

function buildSections(
  areaId: PlanAreaId,
  kind: PlanSystemKind,
  trackableIds: string[],
): PlanSectionDef[] {
  const trackable = new Set(trackableIds);

  if (kind === 'central') {
    const preferred = CENTRAL_SECTION_ORDER[areaId] ?? [];
    const ordered = preferred.filter(id => trackable.has(id));
    const rest = trackableIds.filter(id => !ordered.includes(id));
    return [{
      id: `${areaId}-sistemas`,
      title: 'Sistemas',
      emoji: '⚙️',
      systems: [...ordered, ...rest],
    }];
  }

  const configured = (AREA_SYSTEMS[areaId]?.habitSections ?? [])
    .map(section => ({
      id: section.id,
      title: section.title,
      emoji: section.emoji,
      systems: section.habitIds.filter(id => trackable.has(id)),
    }))
    .filter(section => section.systems.length > 0);

  if (configured.length > 0) return configured;

  const sosten = SOSTEN_AREAS.find(area => area.id === areaId);
  if (sosten) {
    return sosten.subareas
      .map(subarea => ({
        id: subarea.id,
        title: subarea.title,
        emoji: subarea.emoji,
        systems: subarea.habits.map(habit => habit.id).filter(id => trackable.has(id)),
      }))
      .filter(section => section.systems.length > 0);
  }

  return [{
    id: `${areaId}-sistemas`,
    title: 'Sistemas',
    emoji: '⚙️',
    systems: trackableIds,
  }];
}

function buildArea(areaId: PlanAreaId, kind: PlanSystemKind): PlanAreaDef {
  const meta = POINT_B_AREAS.find(area => area.id === areaId);
  const trackableIds = getAreaTrackableHabits(areaId).map(habit => habit.id);
  const sections = buildSections(areaId, kind, trackableIds);
  const systems = [...new Set(sections.flatMap(section => section.systems))];

  return {
    id: areaId,
    label: meta?.label ?? areaId,
    icon: meta?.icon ?? '•',
    group: (meta?.group as PointBGroup | undefined)
      ?? (kind === 'central' ? 'construccion' : 'cimientos'),
    kind,
    vision: AREA_SYSTEMS[areaId]?.vision,
    systems,
    anchors: (AREA_ANCHORS[areaId] ?? []).filter(id => systems.includes(id)),
    sections,
  };
}

export const PLAN_STRUCTURAL_AREAS: PlanAreaDef[] = STRUCTURAL_AREA_IDS
  .map(areaId => buildArea(areaId, 'estructural'));

export const PLAN_CENTRAL_AREAS: PlanAreaDef[] = CENTRAL_AREA_IDS
  .map(areaId => buildArea(areaId, 'central'));

export const PLAN_AREAS: PlanAreaDef[] = [...PLAN_STRUCTURAL_AREAS, ...PLAN_CENTRAL_AREAS];

export const PLAN_AREA_BY_ID: Record<PlanAreaId, PlanAreaDef> = Object.fromEntries(
  PLAN_AREAS.map(area => [area.id, area]),
) as Record<PlanAreaId, PlanAreaDef>;

/** Metadatos resueltos de cada sistema (nombre, área, ancla, dosis y meta). */
export const PLAN_SYSTEM_META: Record<string, PlanSystemDef> = (() => {
  const out: Record<string, PlanSystemDef> = {};

  for (const area of PLAN_AREAS) {
    for (const section of area.sections) {
      for (const id of section.systems) {
        if (out[id]) continue;
        const habit = HABIT_META[id];
        const system = habit?.system;
        const minSpeed = system
          ? systemSpeedOptions(system).find(option => option.id === 'minimo')?.minutes ?? 1
          : 1;
        const timed = area.kind === 'central' || id === 'gym';

        out[id] = {
          id,
          name: SYSTEM_NAME[id] ?? cleanName(id),
          emoji: SYSTEM_EMOJI[id] ?? habit?.emoji ?? '•',
          areaId: area.id,
          kind: area.kind,
          sectionId: section.id,
          sectionTitle: section.title,
          role: area.anchors.includes(id) ? 'ancla' : 'mantenimiento',
          timed,
          minimumDose: id === 'gym' ? 20 : Math.max(1, minSpeed),
          defaultTargetPct: TARGET_PCT[id] ?? 80,
        };
      }
    }
  }

  return out;
})();

export const PLAN_STRUCTURAL_SYSTEM_IDS: string[] = PLAN_STRUCTURAL_AREAS
  .flatMap(area => area.systems);

export const PLAN_CENTRAL_SYSTEM_IDS: string[] = PLAN_CENTRAL_AREAS
  .flatMap(area => area.systems);

/** Lista estable (módulo) para hooks de rachas y consultas en lote. */
export const PLAN_SYSTEM_IDS: string[] = [
  ...PLAN_STRUCTURAL_SYSTEM_IDS,
  ...PLAN_CENTRAL_SYSTEM_IDS,
];

export const PLAN_SYSTEM_AREA: Record<string, PlanAreaId> = Object.fromEntries(
  PLAN_SYSTEM_IDS.map(id => [id, PLAN_SYSTEM_META[id]?.areaId ?? 'desarrollo']),
) as Record<string, PlanAreaId>;

export function getPlanSystemTargetPct(
  id: string,
  overrides?: Record<string, number> | null,
): number {
  const override = overrides?.[id];
  if (typeof override === 'number' && Number.isFinite(override)) {
    return Math.max(1, Math.min(100, Math.round(override)));
  }
  return PLAN_SYSTEM_META[id]?.defaultTargetPct ?? 80;
}
