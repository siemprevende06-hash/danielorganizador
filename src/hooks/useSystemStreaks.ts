import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";

export interface SystemStreak {
  current: number;
  best: number;
  last?: string | null;
}

interface StreakRow {
  habit_id: string;
  current_streak?: number;
  longest_streak?: number;
  last_completed_date?: string | null;
}

const toMap = (rows: StreakRow[]): Record<string, SystemStreak> => {
  const m: Record<string, SystemStreak> = {};
  for (const r of rows) {
    m[r.habit_id] = {
      current: r.current_streak || 0,
      best: r.longest_streak || 0,
      last: r.last_completed_date ?? null,
    };
  }
  return m;
};

/**
 * Rachas en LOTE para muchos hábitos a la vez (1 sola fetch en vez de una por
 * hábito). Reutiliza la misma caché offline (`system_habit_streaks::all`) que
 * usa MySystemsSection y reacciona a cambios de la tabla en tiempo real.
 */
export function useSystemStreaks(habitIds: string[]) {
  const ids = useMemo(() => [...new Set(habitIds)].sort(), [habitIds]);

  const [streaks, setStreaks] = useState<Record<string, SystemStreak>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (ids.length === 0) {
      setStreaks({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const cached = await getCached<StreakRow[]>("system_habit_streaks", "all");
      if (cached) {
        const all = toMap(cached);
        const filtered: Record<string, SystemStreak> = {};
        for (const id of ids) {
          const s = all[id];
          if (s) filtered[id] = s;
        }
        setStreaks(filtered);
      }

      const { data } = await supabase
        .from("system_habit_streaks")
        .select("habit_id, current_streak, longest_streak, last_completed_date");

      if (data) {
        await setCache("system_habit_streaks", "all", data, 60_000);
        const all = toMap(data as StreakRow[]);
        const filtered: Record<string, SystemStreak> = {};
        for (const id of ids) {
          const s = all[id];
          if (s) filtered[id] = s;
        }
        setStreaks(filtered);
      }
    } catch {
      // caché ya mostrada; si no hay, queda vacío
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    load();

    const ch = supabase
      .channel("system_habit_streaks_batch")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_habit_streaks" }, load)
      .subscribe();

    const pollTimer = setInterval(load, 60000);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(pollTimer);
    };
  }, [load]);

  return { streaks, loading, refresh: load };
}