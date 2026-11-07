import {
  differenceInCalendarDays,
  endOfDay,
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
import type { Necesidad } from '@/lib/definitions';
import type { AreaDiagnosis } from '@/lib/areaSystemsMap';
import type {
  SystemForecastCard,
} from '@/lib/forecasting/systemForecastAdapters';
import type {
  PlanAreaMetrics,
  PlanDayStatus,
  PlanSystemMetrics,
} from '@/lib/planSystems';
import type { MetaSystemDef } from '@/lib/metasSistemas';
import type { PersonalList, PersonalListTask } from '@/hooks/usePersonalLists';
import type { SubAreaScore } from '@/hooks/useAreaScores';
import {
  forecastSeries,
  type ForecastConfidence as EffortConfidence,
  type HoltWintersModelName,
} from '@/lib/forecasting/holtWinters';

// ---------------------------------------------------------------------------
// Lógica pura de la pestaña Alineación.
//
// Todo se deriva de datos que ya existen: el snapshot anual de
// usePlanSystemMetrics, el Mapa de Vida, los pronósticos por sistema y las
// metas personales. Aquí no se guarda nada ni se inventan métricas.
// ---------------------------------------------------------------------------

export type AlignmentLevelId = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type AlignmentStatus = 'green' | 'amber' | 'red' | 'grey';
export type RowTone = AlignmentStatus;

export interface AlignmentLevel {
  id: AlignmentLevelId;
  label: string;
  short: string;
  compliance: number | null;
  done: number;
  available: number;
  minutes: number;
  status: AlignmentStatus;
  startKey: string;
  endKey: string;
}

export const ALIGNMENT_LEVELS: Array<{
  id: AlignmentLevelId;
  label: string;
  short: string;
}> = [
  { id: 'day', label: 'Hoy', short: 'Hoy' },
  { id: 'week', label: 'Semana', short: 'Sem' },
  { id: 'month', label: 'Mes', short: 'Mes' },
  { id: 'quarter', label: 'Trimestre', short: 'Tri' },
  { id: 'year', label: 'Año', short: 'Año' },
];

export interface AlignmentAreaLine {
  id: string;
  label: string;
  icon: string;
  group: string;
  effort: number;
  results: number;
  diagnosis: AreaDiagnosis;
  levels: Record<AlignmentLevelId, number | null>;
  plan: PlanAreaMetrics | null;
  vision?: string;
  systems: string[];
  sub: SubAreaScore[];
}

export interface SystemMapGoal {
  id: string;
  title: string;
  objective?: string;
  date: string | null;
  completed: boolean;
  source: 'system' | 'personal';
  progress: number | null;
}

export interface SystemMapRow {
  system: MetaSystemDef;
  metrics: PlanSystemMetrics | null;
  area: PlanAreaMetrics | null;
  /** Cumplimiento visible: del sistema o, si es un área, del área. */
  compliance: number | null;
  forecast: SystemForecastCard | null;
  todayStatus: PlanDayStatus | null;
  goals: SystemMapGoal[];
  nextGoal: SystemMapGoal | null;
  needs: Necesidad[];
  areaId: string;
  pillarId: string;
  tone: RowTone;
}

/** Cadena corta que explica de dónde sale una necesidad. */
export interface NeedLink {
  needId: string;
  areaId: string | null;
  areaLabel: string | null;
  systemId: string | null;
  systemLabel: string | null;
}

export interface ForecastSummary {
  total: number;
  achieved: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  pending: number;
  withTarget: number;
  health: number | null;
  nearest: SystemForecastCard | null;
}

export interface FutureGoalSummary {
  list: PersonalList;
  daysLeft: number;
  progress: number | null;
}

export interface FutureSummary {
  lists: PersonalList[];
  withSystem: PersonalList[];
  onTrack: number;
  total: number;
  percent: number | null;
  nearest: FutureGoalSummary | null;
  furthest: FutureGoalSummary | null;
  targetKey: string;
  targetLabel: string;
  photo: string | null;
}

export interface PillarSummary {
  id: string;
  label: string;
  short: string;
  icon: string;
  desc: string;
  score: number;
  needs: Necesidad[];
}

export interface RewardImage {
  id: string;
  url: string;
  section: string;
}

export interface VisionPhoto {
  id: string;
  url: string;
  name: string;
  section: string;
}

export interface AlignmentCounts {
  systems: number;
  areas: number;
  needs: number;
  systemGoals: number;
  futureGoals: number;
  completedGoals: number;
  systemsWithGoal: number;
  needsWithSystem: number;
}

export type VerdictTone = 'green' | 'amber' | 'red';

export interface Verdict {
  tone: VerdictTone;
  title: string;
  message: string;
}

export interface EffortForecast {
  series: number[];
  forecast: number[];
  mape: number;
  confidence: EffortConfidence;
  model: HoltWintersModelName;
  reliable: boolean;
  weeklyRate: number;
  projectedWeekly: number;
  days: number;
}

function levelRange(id: AlignmentLevelId, today: Date): { start: Date; end: Date } {
  switch (id) {
    case 'day':
      return { start: startOfDay(today), end: endOfDay(today) };
    case 'week':
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      };
    case 'quarter':
      return { start: startOfQuarter(today), end: endOfQuarter(today) };
    case 'year':
      return { start: startOfYear(today), end: endOfYear(today) };
    case 'month':
    default:
      return { start: startOfMonth(today), end: endOfMonth(today) };
  }
}

function aggregateWindow(
  ids: string[],
  systems: Record<string, PlanSystemMetrics>,
  startKey: string,
  endKey: string,
  todayKey: string,
): { done: number; available: number; minutes: number } {
  let done = 0;
  let available = 0;
  let minutes = 0;

  for (const id of ids) {
    const system = systems[id];
    if (!system) continue;
    system.days.forEach((day, index) => {
      if (day < startKey || day > endKey || day > todayKey) return;
      const status = system.status[index];
      if (status === 'rest') return;
      available += 1;
      if (status === 'done') done += 1;
      minutes += system.spark[index] ?? 0;
    });
  }

  return { done, available, minutes };
}

export function statusFor(compliance: number | null): AlignmentStatus {
  if (compliance == null) return 'grey';
  if (compliance >= 80) return 'green';
  if (compliance >= 50) return 'amber';
  return 'red';
}

export function buildLevels(
  systems: Record<string, PlanSystemMetrics>,
  today: Date,
): AlignmentLevel[] {
  const todayKey = format(today, 'yyyy-MM-dd');
  const ids = Object.keys(systems);

  return ALIGNMENT_LEVELS.map(level => {
    const range = levelRange(level.id, today);
    const startKey = format(range.start, 'yyyy-MM-dd');
    const endKey = format(range.end, 'yyyy-MM-dd');
    const aggregate = aggregateWindow(ids, systems, startKey, endKey, todayKey);
    const compliance = aggregate.available > 0
      ? Math.round((aggregate.done / aggregate.available) * 100)
      : null;

    return {
      ...level,
      compliance,
      done: aggregate.done,
      available: aggregate.available,
      minutes: Math.round(aggregate.minutes),
      status: statusFor(compliance),
      startKey,
      endKey,
    };
  });
}

export function buildAreaLevels(
  areaSystems: string[],
  systems: Record<string, PlanSystemMetrics>,
  today: Date,
): Record<AlignmentLevelId, number | null> {
  const todayKey = format(today, 'yyyy-MM-dd');
  const out = {} as Record<AlignmentLevelId, number | null>;

  for (const level of ALIGNMENT_LEVELS) {
    const range = levelRange(level.id, today);
    const startKey = format(range.start, 'yyyy-MM-dd');
    const endKey = format(range.end, 'yyyy-MM-dd');
    const aggregate = aggregateWindow(areaSystems, systems, startKey, endKey, todayKey);
    out[level.id] = aggregate.available > 0
      ? Math.round((aggregate.done / aggregate.available) * 100)
      : null;
  }

  return out;
}

export function summarizeForecast(cards: SystemForecastCard[]): ForecastSummary {
  const count = (status: string) =>
    cards.filter(card => card.forecast.status === status).length;

  const achieved = count('achieved');
  const onTrack = count('on-track');
  const atRisk = count('at-risk');
  const offTrack = count('off-track');
  const pending = count('no-target') + count('no-data');
  const withTarget = cards.length - pending;
  const health = withTarget > 0 ? (achieved + onTrack) / withTarget : null;

  const nearest = cards
    .filter(card =>
      !!card.forecast.etaDate
      && (card.forecast.status === 'achieved'
        || card.forecast.status === 'on-track'
        || card.forecast.status === 'at-risk'))
    .sort((a, b) => String(a.forecast.etaDate).localeCompare(String(b.forecast.etaDate)))[0] ?? null;

  return {
    total: cards.length,
    achieved,
    onTrack,
    atRisk,
    offTrack,
    pending,
    withTarget,
    health,
    nearest,
  };
}

export function alignmentScore(
  levels: AlignmentLevel[],
  forecast: ForecastSummary,
  areasOnPath: number,
): number {
  const values = levels
    .map(level => level.compliance)
    .filter((value): value is number => value != null);
  const execution = values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const forecastPct = forecast.health == null ? execution : forecast.health * 100;
  const areaPct = (areasOnPath / 10) * 100;

  return Math.round(0.55 * execution + 0.25 * forecastPct + 0.2 * areaPct);
}

export function verdictFor(score: number): Verdict {
  if (score >= 70) {
    return {
      tone: 'green',
      title: 'Sigues en el camino.',
      message: 'Tus sistemas de hoy están alimentando a la persona que quieres ser a los 25.',
    };
  }
  if (score >= 45) {
    return {
      tone: 'amber',
      title: 'Vas en camino, con grietas.',
      message: 'La dirección es correcta, pero hay áreas que no están recibiendo suficiente esfuerzo.',
    };
  }
  return {
    tone: 'red',
    title: 'La cadena está rota.',
    message: 'Hoy el futuro no está recibiendo lo que necesita. Empieza por los cimientos.',
  };
}

export function timeProgress(startKey: string, endKey: string, today: Date): number {
  const start = new Date(`${startKey}T12:00:00`);
  const end = new Date(`${endKey}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  const total = differenceInCalendarDays(end, start);
  const elapsed = differenceInCalendarDays(today, start);
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export function daysUntil(dateKey: string, today: Date): number {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  return differenceInCalendarDays(date, today);
}

export function goalProgressForList(
  list: PersonalList,
  tasks: PersonalListTask[],
): number | null {
  const roots = tasks.filter(task => task.list_id === list.id && !task.parent_id);
  if (roots.length === 0) return null;
  const done = roots.filter(task => task.completed).length;
  return Math.round((done / roots.length) * 100);
}

export function buildEffortForecast(
  systems: Record<string, PlanSystemMetrics>,
  today: Date,
): EffortForecast | null {
  const list = Object.values(systems);
  const first = list[0];
  if (!first || first.days.length === 0) return null;

  const todayKey = format(today, 'yyyy-MM-dd');
  const points = first.days
    .map((day, index) => ({
      day,
      minutes: list.reduce((sum, system) => sum + (system.spark[index] ?? 0), 0),
    }))
    .filter(point => point.day <= todayKey);

  const recent = points.slice(-84);
  if (recent.length < 14) return null;

  const series = recent.map(point => point.minutes);
  const result = forecastSeries(series, { horizon: 28 });
  const weeklyRate = series.slice(-7).reduce((sum, value) => sum + value, 0);
  const projectedWeekly = result.forecast
    .slice(0, 7)
    .reduce((sum, value) => sum + value, 0);

  return {
    series,
    forecast: result.forecast,
    mape: result.mape,
    confidence: result.confidence,
    model: result.model,
    reliable: result.reliable,
    weeklyRate: Math.round(weeklyRate),
    projectedWeekly: Math.round(projectedWeekly),
    days: series.length,
  };
}
