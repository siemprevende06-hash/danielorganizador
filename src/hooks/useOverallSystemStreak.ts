import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfQuarter, endOfQuarter } from 'date-fns';

export interface OverallStreak {
  current: number;
  longest: number;
}

export function useOverallSystemStreak() {
  const [streak, setStreak] = useState<OverallStreak>({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // 1) Compute current + best-in-quarter from tracking rows
        const today = new Date();
        const qStart = format(startOfQuarter(today), 'yyyy-MM-dd');
        const qEnd = format(endOfQuarter(today), 'yyyy-MM-dd');

        const { data } = await supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions')
          .gte('tracking_date', qStart)
          .lte('tracking_date', qEnd)
          .order('tracking_date', { ascending: false });

        let current = 0;
        let longestInQuarter = 0;
        let lastDate: string | null = null;

        if (data) {
          const pcts = (data as any[]).map(r => {
            const completions = (r.completions || {}) as Record<string, boolean>;
            const entries = Object.entries(completions);
            const done = entries.filter(([, v]) => v).length;
            const total = entries.length;
            return { date: r.tracking_date as string, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
          });

          for (const d of pcts) {
            if (d.pct >= 50) current++;
            else break;
          }

          let temp = 0;
          const asc = [...pcts].reverse();
          for (const d of asc) {
            if (d.pct >= 50) { temp++; longestInQuarter = Math.max(longestInQuarter, temp); }
            else temp = 0;
          }

          if (pcts.length > 0) lastDate = pcts[0].date;
        }

        // 2) Read persisted longest from backend
        const { data: row } = await supabase
          .from('system_overall_streaks' as any)
          .select('longest_streak')
          .eq('id', 1)
          .maybeSingle();

        const persistedLongest = (row as any)?.longest_streak ?? 0;
        const newLongest = Math.max(persistedLongest, longestInQuarter, current);

        // 3) Persist back if it changed
        await supabase
          .from('system_overall_streaks' as any)
          .upsert({
            id: 1,
            current_streak: current,
            longest_streak: newLongest,
            last_date: lastDate,
          }, { onConflict: 'id' });

        if (!cancelled) {
          setStreak({ current, longest: newLongest });
        }

        // 4) One-time migration: clear legacy localStorage cache
        try { localStorage.removeItem('system_overall_streak'); } catch {}
      } catch (err) {
        console.error('Error loading overall streak:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { streak, loading };
}
