import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemStreak {
  current: number;
  best: number;
  last?: string | null;
}

/**
 * Lee la racha persistida en `system_habit_streaks` (calculada por trigger en BD).
 */
export function useSystemHabitStreak(habitId: string) {
  const [streak, setStreak] = useState<SystemStreak>({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("system_habit_streaks")
        .select("current_streak, longest_streak, last_completed_date")
        .eq("habit_id", habitId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setStreak({
          current: data.current_streak || 0,
          best: data.longest_streak || 0,
          last: data.last_completed_date,
        });
      }
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`system_streak_${habitId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_habit_streaks", filter: `habit_id=eq.${habitId}` },
        load
      )
      .subscribe();

    const pollTimer = setInterval(load, 30000);

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
      clearInterval(pollTimer);
    };
  }, [habitId]);

  return { streak, loading };
}
