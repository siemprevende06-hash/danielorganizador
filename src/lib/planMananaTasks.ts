import { findDaySystemMeta } from '@/lib/daySystems';

/** Tarea normalizada para la planificación del día. */
export interface PlannerTask {
  id: string;
  title: string;
  /** Origen crudo de la tarea (general, university, project...). */
  source: string;
  /** Sistema del plan de velocidad al que pertenece. */
  systemId: string;
  areaId?: string | null;
  completed: boolean;
  routineBlockId?: string | null;
}

const AREA_TO_SYSTEM: Record<string, string> = {
  universidad: 'universidad',
  emprendimiento: 'emprendimiento',
  proyectos: 'proyectos',
  'proyectos-personales': 'proyectos',
  idiomas: 'idiomas',
  musica: 'musica',
  piano: 'musica',
  guitarra: 'musica',
  lectura: 'lectura',
  ajedrez: 'ajedrez',
  game: 'game',
  tareas: 'tareas',
  general: 'tareas',
};

const SOURCE_TO_SYSTEM: Record<string, string> = {
  university: 'universidad',
  universidad: 'universidad',
  entrepreneurship: 'emprendimiento',
  emprendimiento: 'emprendimiento',
  project: 'proyectos',
  projects: 'proyectos',
  proyectos: 'proyectos',
  idiomas: 'idiomas',
  musica: 'musica',
  lectura: 'lectura',
  ajedrez: 'ajedrez',
  game: 'game',
  general: 'tareas',
};

/** Sistema al que pertenece una tarea según su área u origen. */
export function systemIdForTask(task: {
  source?: string | null;
  areaId?: string | null;
  area_id?: string | null;
}): string {
  const areaId = task.areaId ?? task.area_id ?? null;
  if (areaId && AREA_TO_SYSTEM[areaId]) return AREA_TO_SYSTEM[areaId];
  const source = (task.source ?? '').toLowerCase();
  return SOURCE_TO_SYSTEM[source] ?? 'tareas';
}

export const PLAN_SYSTEM_EMOJI: Record<string, string> = {
  universidad: '🎓',
  emprendimiento: '🚀',
  proyectos: '📦',
  tareas: '✅',
  musica: '🎹',
  idiomas: '🌍',
  game: '🎲',
  ajedrez: '♟️',
  lectura: '📖',
};

export function planSystemName(systemId: string): string {
  return findDaySystemMeta(systemId)?.system.name ?? systemId;
}

export function planSystemEmoji(systemId: string): string {
  return PLAN_SYSTEM_EMOJI[systemId] ?? '🧩';
}

/** Etiqueta corta para la bandeja y las tarjetas. */
export const TASK_SOURCE_LABEL: Record<string, string> = {
  general: 'General',
  university: 'Universidad',
  universidad: 'Universidad',
  entrepreneurship: 'Emprendimiento',
  emprendimiento: 'Emprendimiento',
  project: 'Proyecto',
  projects: 'Proyecto',
  proyectos: 'Proyecto',
  idiomas: 'Idiomas',
  musica: 'Música',
  lectura: 'Lectura',
  ajedrez: 'Ajedrez',
  game: 'Game',
};
