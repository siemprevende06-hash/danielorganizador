import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { PlanificationScope } from '@/lib/planSystems';

// ---------------------------------------------------------------------------
// Catálogo de Metas Sistemas: los 13 nombres que se muestran como tarjetas,
// agrupados exactamente como se pidió. Cada nombre es un sistema/área suelto.
// ---------------------------------------------------------------------------

export type MetasScope = PlanificationScope | 'someday' | 'vision';

export interface MetaSystemDef {
  id: string;
  label: string;
  emoji: string;
  /** Las tres primeras son áreas de vida; el resto son sistemas. */
  kind: 'area' | 'system';
}

export interface MetaSystemGroup {
  id: string;
  title: string;
  note?: string;
  dot: string;
  systems: MetaSystemDef[];
}

export const METAS_SYSTEM_GROUPS: MetaSystemGroup[] = [
  {
    id: 'estructurales',
    title: 'Áreas Estructurales',
    note: 'Salud · Fuerza mental · Apariencia',
    dot: 'bg-blue-500',
    systems: [
      { id: 'salud', label: 'Salud', emoji: '🩺', kind: 'area' },
      { id: 'fuerza-mental', label: 'Fuerza Mental', emoji: '🧠', kind: 'area' },
      { id: 'apariencia', label: 'Apariencia', emoji: '✨', kind: 'area' },
    ],
  },
  {
    id: 'centrales',
    title: 'Áreas Centrales',
    note: 'Profesional / Académico',
    dot: 'bg-sky-500',
    systems: [
      { id: 'universidad', label: 'Universidad', emoji: '🎓', kind: 'system' },
      { id: 'emprendimiento', label: 'Emprendimiento', emoji: '🚀', kind: 'system' },
      { id: 'proyectos', label: 'Proyectos', emoji: '📦', kind: 'system' },
    ],
  },
  {
    id: 'desarrollo',
    title: 'Desarrollo Personal',
    note: 'Lectura · Ajedrez · Game · Idiomas · Música · Gym',
    dot: 'bg-violet-500',
    systems: [
      { id: 'lectura', label: 'Lectura', emoji: '📖', kind: 'system' },
      { id: 'ajedrez', label: 'Ajedrez', emoji: '♟️', kind: 'system' },
      { id: 'game', label: 'Game', emoji: '🎮', kind: 'system' },
      { id: 'idiomas', label: 'Idiomas', emoji: '🌍', kind: 'system' },
      { id: 'musica', label: 'Música', emoji: '🎹', kind: 'system' },
      { id: 'gym', label: 'Gym', emoji: '💪', kind: 'system' },
    ],
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    note: 'Dinero · Ahorro · Ingresos',
    dot: 'bg-emerald-500',
    systems: [
      { id: 'finanzas', label: 'Finanzas', emoji: '💰', kind: 'system' },
    ],
  },
];

export const METAS_SYSTEMS: MetaSystemDef[] = METAS_SYSTEM_GROUPS.flatMap(group => group.systems);

export const METAS_SYSTEM_BY_ID: Record<string, MetaSystemDef> = Object.fromEntries(
  METAS_SYSTEMS.map(system => [system.id, system]),
);

export const METAS_SYSTEM_LABELS: Record<string, string> = Object.fromEntries(
  METAS_SYSTEMS.map(system => [system.id, system.label]),
);

export const METAS_AREA_IDS = METAS_SYSTEMS
  .filter(system => system.kind === 'area')
  .map(system => system.id);

export const METAS_SYSTEM_IDS = METAS_SYSTEMS
  .filter(system => system.kind === 'system')
  .map(system => system.id);

export interface GoalPeriodRange {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
}

function makeRange(start: Date, end: Date): GoalPeriodRange {
  return {
    start,
    end,
    startKey: format(start, 'yyyy-MM-dd'),
    endKey: format(end, 'yyyy-MM-dd'),
  };
}

/** Rango exacto de fechas que cubre cada vista. */
export function goalPeriodRange(
  scope: PlanificationScope,
  anchorDate: Date,
): GoalPeriodRange {
  switch (scope) {
    case 'day':
      return makeRange(startOfDay(anchorDate), startOfDay(anchorDate));
    case 'week':
      return makeRange(
        startOfWeek(anchorDate, { weekStartsOn: 1 }),
        endOfWeek(anchorDate, { weekStartsOn: 1 }),
      );
    case 'quarter':
      return makeRange(startOfQuarter(anchorDate), endOfQuarter(anchorDate));
    case 'year':
      return makeRange(startOfYear(anchorDate), endOfYear(anchorDate));
    case 'month':
    default:
      return makeRange(startOfMonth(anchorDate), endOfMonth(anchorDate));
  }
}

/** Etiqueta legible del periodo visible. */
export function goalPeriodLabel(scope: PlanificationScope, anchorDate: Date): string {
  switch (scope) {
    case 'day':
      return format(anchorDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    case 'week': {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth) {
        return `Semana del ${format(start, 'd', { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
      }
      return `Semana del ${format(start, "d 'de' MMM", { locale: es })} al ${format(end, "d 'de' MMM yyyy", { locale: es })}`;
    }
    case 'quarter': {
      const quarter = Math.floor(anchorDate.getMonth() / 3) + 1;
      const start = startOfQuarter(anchorDate);
      const end = endOfQuarter(anchorDate);
      return `Q${quarter} ${anchorDate.getFullYear()} · ${format(start, 'MMM', { locale: es })} – ${format(end, 'MMM', { locale: es })}`;
    }
    case 'year':
      return `${anchorDate.getFullYear()}`;
    case 'month':
    default:
      return format(anchorDate, 'MMMM yyyy', { locale: es });
  }
}

/** Fecha por defecto al crear una meta en la vista actual. */
export function defaultGoalDate(scope: MetasScope, anchorDate: Date): string {
  if (scope === 'someday' || scope === 'vision') return '';
  const range = goalPeriodRange(scope, anchorDate);
  const today = startOfDay(new Date());
  if (today >= range.start && today <= range.end) {
    return format(today, 'yyyy-MM-dd');
  }
  return range.startKey;
}

/** Mueve el periodo visible hacia delante o hacia atrás. */
export function shiftGoalPeriod(
  scope: MetasScope,
  anchorDate: Date,
  direction: -1 | 1,
): Date {
  if (scope === 'someday' || scope === 'vision') return anchorDate;
  switch (scope) {
    case 'day':
      return addDays(anchorDate, direction);
    case 'week':
      return addWeeks(anchorDate, direction);
    case 'month':
      return addMonths(anchorDate, direction);
    case 'quarter':
      return addQuarters(anchorDate, direction);
    case 'year':
      return addYears(anchorDate, direction);
    default:
      return anchorDate;
  }
}

export function formatGoalDate(dateKey: string): string {
  const date = new Date(`${dateKey.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return format(date, 'd MMM yyyy', { locale: es });
}
