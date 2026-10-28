import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  computeLanguagesStats,
  emptyLanguageStats,
  type LanguagesStats,
} from '@/lib/languagePlan';

const EMPTY: LanguagesStats = {
  ingles: emptyLanguageStats(),
  italiano: emptyLanguageStats(),
  totalMinutes: 0,
  activeDays: 0,
  totalSessions: 0,
  skillCoverage: [],
  perDay: [],
};

/**
 * Estadísticas de idiomas de un período usando la fuente canónica:
 * `daily_systems_tracking` (time_data + completions).
 */
export function useLanguageStats(start: Date, end: Date) {
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const query = useQuery<LanguagesStats>({
    queryKey: ['languageStats', startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_systems_tracking')
        .select('tracking_date,time_data,completions')
        .gte('tracking_date', startStr)
        .lte('tracking_date', endStr)
        .order('tracking_date', { ascending: true });

      if (error) throw error;
      return computeLanguagesStats(data ?? []);
    },
    staleTime: 30_000,
  });

  return useMemo(() => ({
    stats: query.data ?? EMPTY,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  }), [query.data, query.isLoading, query.error, query.refetch]);
}
