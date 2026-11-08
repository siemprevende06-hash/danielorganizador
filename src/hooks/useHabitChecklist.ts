import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";

const INDICATOR_QUERY_KEYS = [
  "resultados",
  "resultadosPeriodo",
  "periodAreaTasks",
  "weeklyData",
  "monthlyData",
  "weeklyTasks",
  "monthlyTasks",
  "weeklySystemsTime",
  "weeklyAreaStatsTime",
  "monthlySystemsTime",
  "monthlyAreaStatsTime",
  "languageStats",
  "gameStats",
];

type CompletionMap = Record<string, boolean | string>;
type FlagMap = Record<string, boolean>;
type TimeMap = Record<string, number>;

interface TrackingSnapshot {
  completions: CompletionMap;
  skipped: FlagMap;
  rest: FlagMap;
  timeData: TimeMap;
}

const EMPTY_SNAPSHOT: TrackingSnapshot = {
  completions: {},
  skipped: {},
  rest: {},
  timeData: {},
};

function visibleDone(completions: CompletionMap): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(completions)
      .filter(([key, value]) => !key.startsWith("streak:") && value === true)
      .map(([key]) => [key, true]),
  );
}

/**
 * Marcas de hábitos del día desde Inicio 2.0. Lee y escribe la misma fila de
 * `daily_systems_tracking` que usa Daily, incluidos los espejos `streak:*` que
 * alimentan la tabla de rachas.
 */
export function useHabitChecklist(todayKey = getCubaDate(), onChanged?: () => void) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const snapshotRef = useRef<TrackingSnapshot>(EMPTY_SNAPSHOT);
  const loadingRef = useRef(true);
  const changedRef = useRef(onChanged);
  changedRef.current = onChanged;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadingRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("daily_systems_tracking")
          .select("*")
          .eq("tracking_date", todayKey)
          .maybeSingle();

        if (!alive) return;
        if (error) throw error;

        const row = data as unknown as {
          completions?: CompletionMap | null;
          skipped?: FlagMap | null;
          rest?: FlagMap | null;
          time_data?: TimeMap | null;
        } | null;

        const snapshot: TrackingSnapshot = {
          completions: row?.completions ?? {},
          skipped: row?.skipped ?? {},
          rest: row?.rest ?? {},
          timeData: row?.time_data ?? {},
        };

        snapshotRef.current = snapshot;
        setDone(visibleDone(snapshot.completions));
      } catch (error) {
        console.error("Error loading habit checklist:", error);
        if (alive) {
          snapshotRef.current = EMPTY_SNAPSHOT;
          setDone({});
        }
      } finally {
        if (alive) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    })();

    return () => { alive = false; };
  }, [todayKey]);

  const toggle = useCallback(async (id: string) => {
    // Si la fila aún no se ha cargado, no escribimos para no pisar las demás
    // marcas del día.
    if (loadingRef.current) return;

    const previous = snapshotRef.current;
    const wasDone = previous.completions[id] === true;

    const completions: CompletionMap = { ...previous.completions };
    const skipped: FlagMap = { ...previous.skipped };
    const rest: FlagMap = { ...previous.rest };

    if (wasDone) {
      delete completions[id];
      delete completions[`streak:${id}`];
      delete skipped[id];
      delete rest[id];
    } else {
      completions[id] = true;
      completions[`streak:${id}`] = (previous.timeData[id] ?? 0) >= 30 ? "max" : "min";
      delete skipped[id];
      delete rest[id];
    }

    const next: TrackingSnapshot = { ...previous, completions, skipped, rest };
    snapshotRef.current = next;
    setDone(visibleDone(completions));

    try {
      const payload = {
        tracking_date: todayKey,
        completions,
        skipped,
        rest,
      };
      const { error } = await supabase
        .from("daily_systems_tracking")
        .upsert(payload, { onConflict: "tracking_date" });

      if (error) throw error;

      INDICATOR_QUERY_KEYS.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      changedRef.current?.();
    } catch (error) {
      console.error("Error toggling habit:", error);
      snapshotRef.current = previous;
      setDone(visibleDone(previous.completions));
    }
  }, [todayKey, queryClient]);

  return { done, loading, toggle };
}
