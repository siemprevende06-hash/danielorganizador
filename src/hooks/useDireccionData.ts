import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { POINT_B_AREAS } from '@/data/pointB2027';
import { useAreaScores } from '@/hooks/useAreaScores';
import { ALL_TRACKABLE_IDS } from '@/lib/areaSystemsMap';
import { getCubaDate } from '@/lib/cubaTime';
import type { Timeframe } from '@/contexts/TimeframeContext';

export const DIRECCION_WINDOW_DAYS = 120;
export const DIRECCION_HORIZON_DAYS = 14;

/** Metricas que se pronostican en paralelo para cada area. */
export type DireccionMetric = 'minutos' | 'cumplimiento';

export interface DireccionPoint {
  date: string;
  minutes: number;
  /** 0-100 */
  compliance: number;
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
  currentStreak: number;
  /** Esfuerzo / resultados del timeframe actual (0-100). */
  esfuerzo: number;
  resultados: number;
}

export interface DireccionData {
  areas: DireccionAreaSeries[];
  /** Serie global de minutos, suma de todas las areas centrales. */
  globalPoints: DireccionPoint[];
  start: Date;
  end: Date;
  days: number;
  hasData: boolean;
  loading: boolean;
}

const CENTRAL_GROUP = 'construccion';

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

function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function useDireccionData(timeframe: Timeframe = 'month'): DireccionData {
  const end = useMemo(() => parseISO(getCubaDate()), []);
  const start = useMemo(() => subDays(end, DIRECCION_WINDOW_DAYS - 1), [end]);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  const centralAreaIds = useMemo(
    () => POINT_B_AREAS.filter(a => a.group === CENTRAL_GROUP).map(a => a.id),
    [],
  );

  const { scores } = useAreaScores(timeframe, 'ambos');

  const { data, isLoading } = useQuery({
    queryKey: ['direccion-series', startKey, endKey],
    queryFn: async () => {
      const days = eachDayOfInterval({ start, end });

      const [minutesRes, systemsRes] = await Promise.all([
        supabase
          .from('daily_area_stats')
          .select('area_id, stat_date, time_spent_minutes, completed')
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

      // Esfuerzo registra por sistema concreto (lectura, universidad, etc.),
      // no por las áreas generales (desarrollo, profesional). Ambas tablas
      // pueden contener el mismo dato por la sincronización de Sistemas, así
      // que conservamos el máximo por día/sistema para no duplicar minutos.
      const minutesByTrackingDate = new Map<string, number>();
      const addMinutes = (date: string, trackingId: string, value: unknown) => {
        const minutes = Number(value) || 0;
        if (!date || !trackingId || minutes <= 0) return;
        const key = `${trackingId}|${date}`;
        minutesByTrackingDate.set(key, Math.max(minutesByTrackingDate.get(key) ?? 0, minutes));
      };

      for (const row of minutesRes.data ?? []) {
        addMinutes(row.stat_date, row.area_id, row.time_spent_minutes);
      }

      const complianceByDate = new Map<string, number>();
      for (const row of systemsRes.data ?? []) {
        const timeData = (row.time_data ?? {}) as Record<string, unknown>;
        for (const [trackingId, minutes] of Object.entries(timeData)) {
          addMinutes(row.tracking_date, trackingId, minutes);
        }
        addMinutes(row.tracking_date, 'gym', row.workout_duration);
        complianceByDate.set(
          row.tracking_date,
          complianceFromRow(row.completions as Record<string, unknown>, timeData),
        );
      }

      const dateKeys = days.map(toDateKey);
      const globalPoints: DireccionPoint[] = dateKeys.map(date => ({
        date,
        minutes: 0,
        compliance: complianceByDate.get(date) ?? 0,
      }));

      const areas: DireccionAreaSeries[] = POINT_B_AREAS.filter(a => a.group === CENTRAL_GROUP).map(area => {
        const points: DireccionPoint[] = dateKeys.map(date => {
          const trackingIds = new Set([area.id, ...area.effortTrackingIds]);
          const minutes = [...trackingIds].reduce(
            (total, trackingId) => total + (minutesByTrackingDate.get(`${trackingId}|${date}`) ?? 0),
            0,
          );
          return { date, minutes, compliance: complianceByDate.get(date) ?? 0 };
        });

        let totalMinutes = 0;
        let activeDays = 0;
        for (const p of points) {
          totalMinutes += p.minutes;
          if (p.minutes > 0) activeDays++;
        }

        let streak = 0;
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i].minutes > 0) streak++;
          else break;
        }

        return {
          areaId: area.id,
          label: area.label,
          icon: area.icon,
          group: area.group,
          points,
          totalMinutes,
          activeDayRate: points.length ? Math.round((activeDays / points.length) * 100) : 0,
          currentStreak: streak,
          esfuerzo: 0,
          resultados: 0,
        };
      });

      return { areas, globalPoints, centralAreaIds, days: days.length };
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