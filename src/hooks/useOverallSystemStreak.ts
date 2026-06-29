import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfQuarter, endOfQuarter } from 'date-fns';

export interface OverallStreak {
  current: number;
  longest: number;
}

const LS_KEY = 'system_overall_streak';

function loadFromLS(): OverallStreak | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLS(s: OverallStreak) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

export function useOverallSystemStreak() {
  const [streak, setStreak] = useState<OverallStreak>(() => {
    return loadFromLS() || { current: 0, longest: 0 };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const today = new Date();
        const qStart = format(startOfQuarter(today), 'yyyy-MM-dd');
        const qEnd = format(endOfQuarter(today), 'yyyy-MM-dd');

        const { data } = await supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions')
          .gte('tracking_date', qStart)
          .lte('tracking_date', qEnd)
          .order('tracking_date', { ascending: false });

        if (cancelled) return;

        if (data) {
          const rows = data as any[];
          const pcts = rows.map(r => {
            const completions = (r.completions || {}) as Record<string, boolean>;
            const entries = Object.entries(completions);
            const done = entries.filter(([, v]) => v).length;
            const total = entries.length;
            return { date: r.tracking_date, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
          });

          let current = 0;
          for (const d of pcts) {
            if (d.pct >= 50) current++;
            else break;
          }

          let longest = 0;
          let temp = 0;
          const asc = [...pcts].reverse();
          for (const d of asc) {
            if (d.pct >= 50) { temp++; longest = Math.max(longest, temp); }
            else temp = 0;
          }

          const saved = loadFromLS();
          const overallLongest = Math.max(longest, saved?.longest || 0);
          const result: OverallStreak = { current, longest: overallLongest };

          if (result.current !== streak.current || result.longest !== streak.longest) {
            setStreak(result);
            saveToLS(result);
          }
        }
      } catch (err) {
        console.error('Error loading overall streak:', err);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { streak, loading };
}
