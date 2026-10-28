import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChessGoalsSummary {
  startingElo: number;
  /** ELO objetivo global de la página Chess (respaldo del plan mensual). */
  targetElo: number | null;
}

const DEFAULT: ChessGoalsSummary = { startingElo: 1000, targetElo: null };

/** Lee solo las metas de ajedrez; para tarjetas que no necesitan sesiones. */
export function useChessGoalsSummary() {
  const [summary, setSummary] = useState<ChessGoalsSummary>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('chess_goals')
        .select('starting_elo, target_elo')
        .eq('is_active', true)
        .maybeSingle();
      if (cancelled) return;
      setSummary({
        startingElo: Number(data?.starting_elo) || 1000,
        targetElo: Number(data?.target_elo) || null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return summary;
}
