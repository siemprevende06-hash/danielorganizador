import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAreaScores } from '@/hooks/useAreaScores';
import { useSystemStreaks } from '@/hooks/useSystemStreaks';
import { HABIT_META } from '@/lib/areaSystemsMap';
import { systemActualMinutes } from '@/lib/daySystems';
import {
  PLAN_AREAS,
  PLAN_SYSTEM_IDS,
  PLAN_SYSTEM_META,
  getPlanSystemTargetPct,
  type PlanAreaDef,
  type PlanAreaMetrics,
  type PlanAreaStatus,
  type PlanAreaWeakAnchor,
  type PlanAreaWeek,
  type PlanDayStatus,
  type PlanificationScope,
  type PlanSystemMetrics,
} from '@/lib/planSystems';

const TARGETS_STORAGE_KEY = 'daniel_plan_system_targets_v1';

interface PeriodRange {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
}

interface TrackingRow {
  tracking_date: string;
  completions?: Record<string, boolean> | null;
  time_data?: Record<string, number> | null;
  count_data?: Record<string, number> | null;
  workout_duration?: number | null;
  skipped?: Record<string, boolean> | null;
  rest?: Record<string, boolean> | null;
}

interface RawAggregate {
  done: number;
  available: number;
  rest: number;
  skipped: number;
  partial: number;
  minutes: number;
  status: PlanDayStatus[];
  spark: number[];
  days: string[];
  availableFlags: boolean[];
  lastDone: string | null;
  maxGap: number;
  recoveries: number;
  greenWeeks: number;
  totalWeeks: number;
}

export interface PlanSystemMetricsResult {
  systems: Record<string, PlanSystemMetrics>;
  areas: Record<string, PlanAreaMetrics>;
  setTarget: (id: string, pct: number) => void;
  loading: boolean;
  refresh: () => void;
}

function makeRange(start: Date, end: Date): PeriodRange {
  return {
    start,
    end,
    startKey: format(start, 'yyyy-MM-dd'),
    endKey: format(end, 'yyyy-MM-dd'),
  };
}

function rangesFor(scope: PlanificationScope, anchorDate: Date) {
  const current = scope === 'day'
    ? makeRange(startOfDay(anchorDate), startOfDay(anchorDate))
    : scope === 'week'
      ? makeRange(
          startOfWeek(anchorDate, { weekStartsOn: 1 }),
          endOfWeek(anchorDate, { weekStartsOn: 1 }),
        )
      : makeRange(startOfMonth(anchorDate), endOfMonth(anchorDate));

  const previous = scope === 'day'
    ? makeRange(subDays(current.start, 1), subDays(current.start, 1))
    : scope === 'week'
      ? makeRange(subDays(current.start, 7), subDays(current.end, 7))
      : (() => {
          const prevMonth = subMonths(current.start, 1);
          return makeRange(startOfMonth(prevMonth), endOfMonth(prevMonth));
        })();

  const month = makeRange(startOfMonth(anchorDate), endOfMonth(anchorDate));
  const all = [current, previous, month];
  const sortedStarts = all.map(range => range.startKey).sort();
  const sortedEnds = all.map(range => range.endKey).sort();

  return {
    current,
    previous,
    month,
    fetchStartKey: sortedStarts[0],
    fetchEndKey: sortedEnds[sortedEnds.length - 1],
  };
}

function isGymId(id: string): boolean {
  return id === 'gym' || id === 'entrenamiento-fisico';
}

function idVariants(id: string): string[] {
  if (isGymId(id)) return ['gym', 'entrenamiento-fisico'];
  // Idiomas se marca por idioma (inglés / italiano), no por el sistema padre.
  if (id === 'idiomas') return ['idiomas', 'ingles', 'italiano'];
  return [id];
}

function flag(record: Record<string, boolean> | null | undefined, id: string): boolean {
  if (!record) return false;
  return idVariants(id).some(key => !!record[key]);
}

function habitMinutes(id: string, row: TrackingRow | undefined): number {
  if (!row) return 0;
  if (isGymId(id)) return Number(row.workout_duration) || 0;
  const timeData = row.time_data ?? {};
  const meta = HABIT_META[id];
  if (meta?.system) return systemActualMinutes(meta.system, { timeData });
  return Number(timeData[id]) || 0;
}

function weekKeyOf(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const value = new Date(year, month - 1, date, 12, 0, 0);
  return format(startOfWeek(value, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function emptyRaw(): RawAggregate {
  return {
    done: 0,
    available: 0,
    rest: 0,
    skipped: 0,
    partial: 0,
    minutes: 0,
    status: [],
    spark: [],
    days: [],
    availableFlags: [],
    lastDone: null,
    maxGap: 0,
    recoveries: 0,
    greenWeeks: 0,
    totalWeeks: 0,
  };
}

function aggregateRange(
  range: PeriodRange,
  byDate: Map<string, TrackingRow>,
  todayKey: string,
): Record<string, RawAggregate> {
  const days = eachDayOfInterval({ start: range.start, end: range.end })
    .map(day => format(day, 'yyyy-MM-dd'));

  const out: Record<string, RawAggregate> = {};

  for (const id of PLAN_SYSTEM_IDS) {
    const meta = PLAN_SYSTEM_META[id];
    if (!meta) continue;

    const aggregate = emptyRaw();
    aggregate.days = days;

    for (const day of days) {
      const row = byDate.get(day);
      const minutes = habitMinutes(id, row);
      const future = day > todayKey;

      // Los días futuros no cuentan como disponibles ni como fallo.
      if (future) {
        aggregate.status.push('none');
        aggregate.spark.push(0);
        aggregate.availableFlags.push(false);
        continue;
      }

      // Descanso planificado: sale del denominador de cumplimiento.
      if (flag(row?.rest, id)) {
        aggregate.rest += 1;
        aggregate.status.push('rest');
        aggregate.spark.push(minutes);
        aggregate.availableFlags.push(false);
        aggregate.minutes += minutes;
        continue;
      }

      aggregate.available += 1;
      aggregate.availableFlags.push(true);
      aggregate.minutes += minutes;

      const skipped = flag(row?.skipped, id);
      const completed = flag(row?.completions, id);
      // La dosis mínima también convierte minutos en día cumplido (gym 20m,
      // velocidad mínima en los sistemas centrales). Los hábitos binarios solo
      // cuentan si están marcados como cumplidos.
      const doseMet = meta.timed && minutes >= Math.max(1, meta.minimumDose);

      if (skipped) {
        aggregate.skipped += 1;
        aggregate.status.push('skip');
      } else if (completed || doseMet) {
        aggregate.done += 1;
        aggregate.status.push('done');
        aggregate.lastDone = day;
      } else if (minutes > 0) {
        aggregate.partial += 1;
        aggregate.status.push('partial');
      } else {
        aggregate.status.push('none');
      }

      aggregate.spark.push(minutes);
    }

    // Semanas dentro del periodo: verde si cumple ≥80% de los días disponibles.
    const weeks = new Map<string, { done: number; available: number }>();
    days.forEach((day, index) => {
      if (!aggregate.availableFlags[index]) return;
      const key = weekKeyOf(day);
      const entry = weeks.get(key) ?? { done: 0, available: 0 };
      entry.available += 1;
      if (aggregate.status[index] === 'done') entry.done += 1;
      weeks.set(key, entry);
    });
    aggregate.totalWeeks = weeks.size;
    aggregate.greenWeeks = [...weeks.values()]
      .filter(entry => entry.available > 0 && entry.done / entry.available >= 0.8)
      .length;

    // Brecha máxima y recuperaciones (retomar después de fallar).
    let run = 0;
    let gapActive = false;
    days.forEach((_, index) => {
      if (!aggregate.availableFlags[index]) return;
      if (aggregate.status[index] === 'done') {
        if (gapActive) {
          aggregate.recoveries += 1;
          gapActive = false;
        }
        run = 0;
      } else {
        run += 1;
        gapActive = true;
        aggregate.maxGap = Math.max(aggregate.maxGap, run);
      }
    });

    out[id] = aggregate;
  }

  return out;
}

function complianceOf(done: number, available: number): number | null {
  return available > 0 ? Math.round((done / available) * 100) : null;
}

function areaCompliance(area: PlanAreaDef, raw: Record<string, RawAggregate>): number | null {
  let done = 0;
  let available = 0;
  for (const id of area.systems) {
    const entry = raw[id];
    if (!entry) continue;
    done += entry.done;
    available += entry.available;
  }
  return complianceOf(done, available);
}

function idsCompliance(ids: string[], raw: Record<string, RawAggregate>): number | null {
  let done = 0;
  let available = 0;
  for (const id of ids) {
    const entry = raw[id];
    if (!entry) continue;
    done += entry.done;
    available += entry.available;
  }
  return complianceOf(done, available);
}

function buildSystemMetrics(
  id: string,
  current: Record<string, RawAggregate>,
  previous: Record<string, RawAggregate>,
  targets: Record<string, number>,
  streaks: Record<string, { current: number; best: number }>,
  scoreById: Record<string, { esfuerzo: number; resultados: number }>,
): PlanSystemMetrics {
  const meta = PLAN_SYSTEM_META[id];
  const raw = current[id] ?? emptyRaw();
  const prev = previous[id];
  const targetPct = getPlanSystemTargetPct(id, targets);
  const compliance = complianceOf(raw.done, raw.available);
  const previousCompliance = prev
    ? complianceOf(prev.done, prev.available)
    : null;
  const trend = compliance != null && previousCompliance != null
    ? compliance - previousCompliance
    : null;
  const targetDays = raw.available > 0
    ? Math.max(1, Math.round((raw.available * targetPct) / 100))
    : 0;
  const targetMet = targetDays > 0 ? raw.done >= targetDays : null;
  const score = scoreById[meta?.areaId ?? ''];

  return {
    id,
    kind: meta?.kind ?? 'central',
    areaId: meta?.areaId ?? 'desarrollo',
    role: meta?.role ?? 'mantenimiento',
    compliance,
    daysDone: raw.done,
    daysTotal: raw.available,
    daysSkipped: raw.skipped,
    restDays: raw.rest,
    partialDays: raw.partial,
    targetPct,
    targetDays,
    targetMet,
    actualMinutes: Math.round(raw.minutes),
    minimumDose: meta?.minimumDose ?? 1,
    timed: meta?.timed ?? false,
    streak: streaks[id]?.current ?? 0,
    bestStreak: streaks[id]?.best ?? 0,
    maxGap: raw.maxGap,
    recoveries: raw.recoveries,
    trend,
    previousCompliance,
    greenWeeks: raw.greenWeeks,
    totalWeeks: raw.totalWeeks,
    lastDone: raw.lastDone,
    effort: score?.esfuerzo,
    results: score?.resultados,
    status: raw.status,
    spark: raw.spark,
    days: raw.days,
  };
}

function buildAreaMetrics(
  area: PlanAreaDef,
  current: Record<string, RawAggregate>,
  previous: Record<string, RawAggregate>,
  month: Record<string, RawAggregate>,
  systems: Record<string, PlanSystemMetrics>,
  scoreById: Record<string, { esfuerzo: number; resultados: number }>,
): PlanAreaMetrics {
  const compliance = areaCompliance(area, current);
  const previousCompliance = areaCompliance(area, previous);
  const monthCompliance = areaCompliance(area, month);
  const maintenanceIds = area.systems.filter(id => !area.anchors.includes(id));

  const anchorCompliance = idsCompliance(area.anchors, current);
  const maintenanceCompliance = idsCompliance(maintenanceIds, current);

  const activeSystems = area.systems.filter(id => {
    const entry = current[id];
    if (!entry) return false;
    return entry.done > 0
      || entry.partial > 0
      || entry.skipped > 0
      || entry.minutes > 0;
  }).length;

  const anchorScores: PlanAreaWeakAnchor[] = area.anchors.flatMap(id => {
    const entry = current[id];
    if (!entry || entry.available === 0) return [];
    const value = complianceOf(entry.done, entry.available);
    if (value == null) return [];
    return [{
      id,
      name: PLAN_SYSTEM_META[id]?.name ?? id,
      compliance: value,
    }];
  }).sort((a, b) => a.compliance - b.compliance);

  const weekMap = new Map<string, { done: number; available: number }>();
  for (const id of area.systems) {
    const entry = current[id];
    if (!entry) continue;
    entry.days.forEach((day, index) => {
      if (!entry.availableFlags[index]) return;
      const key = weekKeyOf(day);
      const week = weekMap.get(key) ?? { done: 0, available: 0 };
      week.available += 1;
      if (entry.status[index] === 'done') week.done += 1;
      weekMap.set(key, week);
    });
  }

  const weeks: PlanAreaWeek[] = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      compliance: complianceOf(value.done, value.available),
    }));

  const greenWeeks = weeks.filter(week => (week.compliance ?? 0) >= 80).length;

  let status: PlanAreaStatus = 'grey';
  if (compliance != null) {
    const weakest = anchorScores[0]?.compliance ?? null;
    if (weakest != null && weakest < 50) status = 'red';
    else if (compliance >= 80) status = 'green';
    else if (compliance >= 50) status = 'amber';
    else status = 'red';
  }

  const score = scoreById[area.id];

  return {
    id: area.id,
    label: area.label,
    icon: area.icon,
    group: area.group,
    kind: area.kind,
    compliance,
    anchorCompliance,
    maintenanceCompliance,
    activeSystems,
    totalSystems: area.systems.length,
    systemsOnTarget: area.systems.filter(id => systems[id]?.targetMet === true).length,
    weakestAnchor: anchorScores[0] ?? null,
    trend: compliance != null && previousCompliance != null
      ? compliance - previousCompliance
      : null,
    greenWeeks,
    totalWeeks: weeks.length,
    weeks,
    status,
    effort: score?.esfuerzo,
    results: score?.resultados,
    monthCompliance,
  };
}

function readTargets(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    Object.entries(parsed).forEach(([id, value]) => {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) out[id] = Math.max(1, Math.min(100, Math.round(numeric)));
    });
    return out;
  } catch {
    return {};
  }
}

/**
 * Métricas de TODOS los sistemas y áreas para el periodo visible.
 *
 * Una sola consulta a `daily_systems_tracking` cubre periodo actual, anterior
 * y mes. El cumplimiento se mide sobre días disponibles (sin descansos ni
 * futuro), la dosis mínima convierte minutos en día cumplido, y las semanas
 * verdes son las que alcanzan ≥80% de cumplimiento.
 */
export function usePlanSystemMetrics(
  scope: PlanificationScope,
  anchorDate: Date,
): PlanSystemMetricsResult {
  const anchorKey = format(anchorDate, 'yyyy-MM-dd');
  const ranges = useMemo(
    () => rangesFor(scope, new Date(`${anchorKey}T12:00:00`)),
    [scope, anchorKey],
  );

  const { scores } = useAreaScores(
    'sprint',
    'ambos',
    { start: ranges.current.startKey, end: ranges.current.endKey },
  );
  const { streaks, loading: streaksLoading } = useSystemStreaks(PLAN_SYSTEM_IDS);

  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [targets, setTargets] = useState<Record<string, number>>(readTargets);

  const refresh = useCallback(() => setNonce(value => value + 1), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
    } catch {
      // Sin persistencia: las metas siguen funcionando en memoria.
    }
  }, [targets]);

  const setTarget = useCallback((id: string, pct: number) => {
    const value = Math.max(1, Math.min(100, Math.round(pct)));
    setTargets(prev => ({ ...prev, [id]: value }));
  }, []);

  useEffect(() => {
    let alive = true;
    setRowsLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('daily_systems_tracking')
          .select('*')
          .gte('tracking_date', ranges.fetchStartKey)
          .lte('tracking_date', ranges.fetchEndKey);
        if (error) throw error;
        if (alive) setRows((data ?? []) as unknown as TrackingRow[]);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setRowsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ranges.fetchStartKey, ranges.fetchEndKey, nonce]);

  const scoreById = useMemo(
    () => Object.fromEntries(scores.map(score => [score.id, score])),
    [scores],
  );

  const computed = useMemo(() => {
    const byDate = new Map<string, TrackingRow>();
    for (const row of rows) {
      byDate.set(String(row.tracking_date).slice(0, 10), row);
    }
    const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');

    const current = aggregateRange(ranges.current, byDate, todayKey);
    const previous = aggregateRange(ranges.previous, byDate, todayKey);
    const sameMonth = ranges.month.startKey === ranges.current.startKey
      && ranges.month.endKey === ranges.current.endKey;
    const month = sameMonth
      ? current
      : aggregateRange(ranges.month, byDate, todayKey);

    const systems: Record<string, PlanSystemMetrics> = {};
    for (const id of PLAN_SYSTEM_IDS) {
      systems[id] = buildSystemMetrics(id, current, previous, targets, streaks, scoreById);
    }

    const areas: Record<string, PlanAreaMetrics> = {};
    for (const area of PLAN_AREAS) {
      areas[area.id] = buildAreaMetrics(area, current, previous, month, systems, scoreById);
    }

    return { systems, areas };
  }, [rows, ranges, targets, streaks, scoreById]);

  return {
    systems: computed.systems,
    areas: computed.areas,
    setTarget,
    loading: rowsLoading || streaksLoading,
    refresh,
  };
}
