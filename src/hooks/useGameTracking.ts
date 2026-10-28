import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  computeGamePeriodStats,
  emptyGameStats,
  gameLevel,
  type GameDayExtras,
  type GamePeriodStats,
} from '@/lib/game';

interface GameTrackingResult {
  stats: GamePeriodStats;
  totalXp: number;
  level: ReturnType<typeof gameLevel>;
}

const EMPTY: GameTrackingResult = {
  stats: emptyGameStats(),
  totalXp: 0,
  level: gameLevel(0),
};

function countByDay(rows: Array<Record<string, any>> | null | undefined, field = 'fecha'): Record<string, number> {
  const out: Record<string, number> = {};
  (rows ?? []).forEach(row => {
    const day = String(row[field] ?? '').slice(0, 10);
    if (!day) return;
    out[day] = (out[day] || 0) + 1;
  });
  return out;
}

/**
 * Estadísticas de Game para un período + XP total histórico (para el nivel).
 * Sin fechas usa el día de hoy.
 */
export function useGameTracking(start?: Date, end?: Date) {
  const from = start ?? new Date();
  const to = end ?? start ?? new Date();
  const startStr = format(from, 'yyyy-MM-dd');
  const endStr = format(to, 'yyyy-MM-dd');

  const query = useQuery<GameTrackingResult>({
    queryKey: ['gameStats', startStr, endStr],
    queryFn: async () => {
      const [periodRes, allRes, citasRes, socialRes, intimacyRes, allCitasRes, allSocialRes] = await Promise.all([
        supabase
          .from('daily_systems_tracking')
          .select('tracking_date,time_data,count_data')
          .gte('tracking_date', startStr)
          .lte('tracking_date', endStr)
          .order('tracking_date', { ascending: true }),
        supabase
          .from('daily_systems_tracking')
          .select('tracking_date,time_data,count_data')
          .order('tracking_date', { ascending: true }),
        supabase.from('citas').select('fecha').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('eventos_sociales').select('fecha').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('intimidad_tracking').select('fecha').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('citas').select('fecha'),
        supabase.from('eventos_sociales').select('fecha'),
      ]);

      if (periodRes.error) throw periodRes.error;

      const extras: GameDayExtras = {
        citasByDay: countByDay(citasRes.data),
        socialByDay: countByDay(socialRes.data),
        intimacyByDay: countByDay(intimacyRes.data),
      };

      const stats = computeGamePeriodStats(periodRes.data ?? [], extras);
      // El XP histórico ya está en las filas diarias (incluidos los 129 XP de
      // formación); no se añade ninguna base extra. Las citas y eventos
      // sociales sí se suman porque viven en sus propias tablas.
      const allTime = computeGamePeriodStats(allRes.data ?? [], {
        citasByDay: countByDay(allCitasRes.data),
        socialByDay: countByDay(allSocialRes.data),
      });
      const totalXp = allTime.xp;

      return { stats, totalXp, level: gameLevel(totalXp) };
    },
    staleTime: 20_000,
  });

  return useMemo(() => ({
    stats: query.data?.stats ?? EMPTY.stats,
    totalXp: query.data?.totalXp ?? EMPTY.totalXp,
    level: query.data?.level ?? EMPTY.level,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  }), [query.data, query.isLoading, query.error, query.refetch]);
}
