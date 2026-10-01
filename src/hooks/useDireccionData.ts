import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, eachDayOfInterval, format, parseISO, startOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { POINT_B_AREAS } from '@/data/pointB2027';
import { useAreaScores } from '@/hooks/useAreaScores';
import { ALL_TRACKABLE_IDS } from '@/lib/areaSystemsMap';
import { getCubaDate } from '@/lib/cubaTime';
import type { PointBArea, PointBSubAxis } from '@/lib/definitions';
import type { Timeframe } from '@/contexts/TimeframeContext';

export const DIRECCION_WINDOW_DAYS = 120;
export const DIRECCION_HORIZON_DAYS = 14;

/** Dias activos minimos para que una semana completa cuente como racha. */
export const DIRECCION_WEEK_HIT_DAYS = 3;
/** La semana en curso todavia no esta cerrada: basta con este avance para contar. */
const CURRENT_WEEK_HIT_DAYS = 2;

/** Meta diaria por defecto cuando el sistema no tiene time_goal_minutes guardado. */
const DEFAULT_DAILY_GOAL = 30;

/** Etiquetas de la racha semanal, indice 0 = lunes. */
export const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
export const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

/** Metricas que se pronostican en paralelo para cada area. */
export type DireccionMetric = 'minutos' | 'cumplimiento';

export interface DireccionPoint {
  date: string;
  minutes: number;
  /** 0-100 */
  compliance: number;
  /** 0-100, esfuerzo del area en ese dia. */
  rate: number;
}

/** Un dia del strip L M M J V S D. */
export interface DireccionWeekDay {
  date: string;
  /** 0 = lunes ... 6 = domingo */
  index: number;
  letter: string;
  label: string;
  minutes: number;
  /** 0-100 */
  rate: number;
  active: boolean;
  /** Todavia no ocurre (dia futuro de la semana en curso). */
  future: boolean;
  isToday: boolean;
}

export interface DireccionAreaSeries {
  areaId: string;
  label: string;
  icon: string;
  group: string;
  points: DireccionPoint[];
  /** Suma de minutos del periodo para la tarjeta. */
  totalMinutes: number;
  /** % de dias con actividad en el periodo. */
  activeDayRate: number;
  /** Dias consecutivos con actividad (ignora hoy si aun no se registro). */
  streakDays: number;
  /** Semanas consecutivas que alcanzaron el minimo de dias activos. */
  streakWeeks: number;
  /** Mejor racha historica del periodo. */
  bestStreakDays: number;
  /** Esfuerzo / resultados del timeframe actual (0-100). */
  esfuerzo: number;
  resultados: number;

  /** Meta diaria deducida de time_goal_minutes de los sistemas del area. */
  dailyGoalMinutes: number;
  /** Esfuerzo de hoy. */
  todayMinutes: number;
  todayRate: number;
  /** Esfuerzo de los ultimos 7 dias. */
  weekMinutes: number;
  weekRate: number;
  weekDays: DireccionWeekDay[];
  weekActiveDays: number;
  /** Variacion contra los 7 dias anteriores, en %. */
  weekDelta: number;
  /** Cuantos sistemas/habitos del area se consideran en las metricas. */
  trackingCount: number;
}

export interface DireccionData {
  areas: DireccionAreaSeries[];
  /** Serie global de minutos, suma de todas las areas centrales. */
  globalPoints: DireccionPoint[];
  start: Date;
  end: Date;
  days: number;
  todayKey: string;
  hasData: boolean;
  loading: boolean;
}

/** Dias con actividad real en una fila de daily_systems_tracking. */
function complianceFromRow(completions: Record<string, unknown> | null | undefined, timeData: Record<string, unknown> | null | undefined): number {
  const ids = ALL_TRACKABLE_IDS;
  if (!ids.length) return 0;
  let done = 0;
  for (const id of ids) {
    if (completions?.[id]) done++;
    else {
      const minutes = Number(timeData?.[id] ?? 0);
      if (Number.isFinite(minutes) && minutes > 0) done++;
    }
  }
  return Math.round((done / ids.length) * 100);
}

function leafTrackingIds(sub: PointBSubAxis[]): string[] {
  const ids: string[] = [];
  for (const s of sub) {
    if (s.children && s.children.length > 0) ids.push(...leafTrackingIds(s.children));
    else ids.push(...s.trackingIds);
  }
  return ids;
}

/**
 * Todo lo que produce esfuerzo en un area: el propio id del area, sus
 * effortTrackingIds y los trackingIds de las hojas de sus sub-ejes. Sin las
 * hojas, areas como ocio (recompensas) o salud (antes-dormir) perdian dias
 * enteros de datos.
 */
function trackingIdsForArea(area: PointBArea): string[] {
  return [...new Set([area.id, ...area.effortTrackingIds, ...leafTrackingIds(area.sub)])];
}

const AREA_TRACKING_IDS: Record<string, string[]> = Object.fromEntries(
  POINT_B_AREAS.map(area => [area.id, trackingIdsForArea(area)]),
);

function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

interface Cell {
  minutes: number;
  rate: number;
}

function rateFor(minutes: number, goal: number, completed: boolean): number {
  if (completed) return 100;
  if (minutes <= 0) return 0;
  return Math.min(100, Math.round((minutes / Math.max(1, goal)) * 100));
}

function consecutiveActive(points: DireccionPoint[]): number {
  let n = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].minutes > 0) {
      n++;
      continue;
    }
    // El dia de hoy todavia puede estar en curso: no rompe la racha mientras
    // ayer haya actividad.
    if (i === points.length - 1 && points.length > 1 && points[i - 1].minutes > 0) continue;
    break;
  }
  return n;
}

function longestActiveRun(points: DireccionPoint[]): number {
  let best = 0;
  let run = 0;
  for (const p of points) {
    if (p.minutes > 0) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

function consecutiveWeeksHit(points: DireccionPoint[], hitDays: number): number {
  let weeks = 0;
  for (let w = 0; w * 7 < points.length; w++) {
    const end = points.length - w * 7;
    const start = end - 7;
    if (start < 0) break;
    const slice = points.slice(start, end);
    const active = slice.filter(p => p.minutes > 0).length;
    if (active >= (w === 0 ? CURRENT_WEEK_HIT_DAYS : hitDays)) weeks++;
    else break;
  }
  return weeks;
}

export function useDireccionData(timeframe: Timeframe = 'month'): DireccionData {
  const end = useMemo(() => parseISO(getCubaDate()), []);
  const start = useMemo(() => subDays(end, DIRECCION_WINDOW_DAYS - 1), [end]);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  const { scores } = useAreaScores(timeframe, 'ambos');

  const { data, isLoading } = useQuery({
    queryKey: ['direccion-series', startKey, endKey],
    queryFn: async () => {
      const days = eachDayOfInterval({ start, end });

      const [minutesRes, systemsRes] = await Promise.all([
        supabase
          .from('daily_area_stats')
          .select('area_id, stat_date, time_spent_minutes, time_goal_minutes, completed')
          .gte('stat_date', startKey)
          .lte('stat_date', endKey),
        supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions, time_data, workout_duration')
          .gte('tracking_date', startKey)
          .lte('tracking_date', endKey),
      ]);

      if (minutesRes.error) throw minutesRes.error;
      if (systemsRes.error) throw systemsRes.error;

      // Esfuerzo se registra por sistema concreto (lectura, universidad, gym...)
      // y las dos tablas pueden traer el mismo dato por la sincronizacion de
      // Sistemas: conservamos el maximo por sistema/dia para no duplicar, pero
      // conservamos la meta real (time_goal_minutes) para medir el %.
      const cells = new Map<string, Cell>();
      const goals = new Map<string, number>();

      const put = (trackingId: string, date: string, minutes: number, rate: number) => {
        const key = `${trackingId}|${date}`;
        const prev = cells.get(key);
        if (!prev) cells.set(key, { minutes, rate });
        else {
          prev.minutes = Math.max(prev.minutes, minutes);
          prev.rate = Math.max(prev.rate, rate);
        }
      };

      for (const row of minutesRes.data ?? []) {
        const date = row.stat_date;
        const id = row.area_id;
        if (!date || !id) continue;
        const minutes = Number(row.time_spent_minutes) || 0;
        const goal = Number(row.time_goal_minutes) || DEFAULT_DAILY_GOAL;
        goals.set(id, goal);
        put(id, date, minutes, rateFor(minutes, goal, Boolean(row.completed)));
      }

      const complianceByDate = new Map<string, number>();
      for (const row of systemsRes.data ?? []) {
        const date = row.tracking_date;
        if (!date) continue;
        const timeData = (row.time_data ?? {}) as Record<string, unknown>;
        const completions = (row.completions ?? {}) as Record<string, unknown>;

        for (const [trackingId, raw] of Object.entries(timeData)) {
          const minutes = Number(raw) || 0;
          if (minutes <= 0) continue;
          const goal = goals.get(trackingId) ?? DEFAULT_DAILY_GOAL;
          put(trackingId, date, minutes, rateFor(minutes, goal, Boolean(completions[trackingId])));
        }

        const workout = Number(row.workout_duration) || 0;
        if (workout > 0) {
          const goal = goals.get('gym') ?? DEFAULT_DAILY_GOAL;
          put('gym', date, workout, rateFor(workout, goal, false));
        }

        complianceByDate.set(date, complianceFromRow(completions, timeData));
      }

      const dateKeys = days.map(toDateKey);
      const globalPoints: DireccionPoint[] = dateKeys.map(date => ({
        date,
        minutes: 0,
        compliance: complianceByDate.get(date) ?? 0,
        rate: 0,
      }));

      // Lunes de la semana en curso (indice 0 = lunes).
      const monday = startOfWeek(end, { weekStartsOn: 1 });
      const weekKeys = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(monday, i)));

      const areas: DireccionAreaSeries[] = POINT_B_AREAS.map(area => {
        const ids = AREA_TRACKING_IDS[area.id] ?? [area.id];

        const points: DireccionPoint[] = dateKeys.map(date => {
          let minutes = 0;
          let rateSum = 0;
          let present = 0;
          for (const id of ids) {
            const cell = cells.get(`${id}|${date}`);
            if (!cell) continue;
            minutes += cell.minutes;
            rateSum += cell.rate;
            present++;
          }
          return {
            date,
            minutes,
            compliance: complianceByDate.get(date) ?? 0,
            rate: present > 0 ? Math.round(rateSum / present) : 0,
          };
        });

        const byDate = new Map(points.map((p, i) => [p.date, p]));

        let totalMinutes = 0;
        let activeDays = 0;
        for (const p of points) {
          totalMinutes += p.minutes;
          if (p.minutes > 0) activeDays++;
        }

        const goalValues = ids
          .map(id => goals.get(id))
          .filter((g): g is number => typeof g === 'number' && g > 0);
        const dailyGoalMinutes = goalValues.length
          ? Math.round(goalValues.reduce((a, b) => a + b, 0) / goalValues.length)
          : DEFAULT_DAILY_GOAL;

        const weekDays: DireccionWeekDay[] = weekKeys.map((key, index) => {
          const point = byDate.get(key);
          const minutes = point?.minutes ?? 0;
          return {
            date: key,
            index,
            letter: WEEK_LETTERS[index],
            label: WEEK_LABELS[index],
            minutes,
            rate: point?.rate ?? 0,
            active: minutes > 0,
            future: key > endKey,
            isToday: key === endKey,
          };
        });

        const today = points[points.length - 1];
        const weekMinutes = weekDays.reduce((s, d) => s + d.minutes, 0);
        const prevWeekMinutes = points
          .slice(-14, -7)
          .reduce((s, p) => s + p.minutes, 0);

        return {
          areaId: area.id,
          label: area.label,
          icon: area.icon,
          group: area.group,
          points,
          totalMinutes,
          activeDayRate: points.length ? Math.round((activeDays / points.length) * 100) : 0,
          streakDays: consecutiveActive(points),
          streakWeeks: consecutiveWeeksHit(points, DIRECCION_WEEK_HIT_DAYS),
          bestStreakDays: longestActiveRun(points),
          esfuerzo: 0,
          resultados: 0,
          dailyGoalMinutes,
          todayMinutes: today?.minutes ?? 0,
          todayRate: Math.min(100, rateFor(today?.minutes ?? 0, dailyGoalMinutes, false)),
          weekMinutes,
          weekRate: Math.round((weekMinutes / Math.max(1, dailyGoalMinutes * 7)) * 100),
          weekDays,
          weekActiveDays: weekDays.filter(d => d.active).length,
          weekDelta: prevWeekMinutes > 0
            ? Math.round(((weekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100)
            : weekMinutes > 0
              ? 100
              : 0,
          trackingCount: ids.length,
        };
      });

      return { areas, globalPoints, days: days.length };
    },
    staleTime: 5 * 60 * 1000,
  });

  const scoreById = useMemo(() => Object.fromEntries(scores.map(s => [s.id, s])), [scores]);

  const areas = useMemo(() => {
    const base = data?.areas ?? [];
    return base.map(a => {
      const score = scoreById[a.areaId];
      return score ? { ...a, esfuerzo: score.esfuerzo, resultados: score.resultados } : a;
    });
  }, [data?.areas, scoreById]);

  return {
    areas,
    globalPoints: data?.globalPoints ?? [],
    start,
    end,
    days: data?.days ?? DIRECCION_WINDOW_DAYS,
    todayKey: endKey,
    hasData: areas.some(a => a.totalMinutes > 0 || a.esfuerzo > 0 || a.resultados > 0),
    loading: isLoading,
  };
}

export function formatMinutes(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
}

export function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return format(d, 'd MMM', { locale: es });
}