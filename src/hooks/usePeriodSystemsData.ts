import { useCallback, useEffect, useMemo, useState } from "react";
import { format, eachDayOfInterval, isAfter, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { HABIT_META } from "@/lib/areaSystemsMap";
import { systemActualMinutes } from "@/lib/daySystems";
import type { WeekDayStatus } from "./useWeekSystemsData";

export interface PeriodSystemsAggregate {
  days: string[];
  elapsedDays: number;
  daysDone: Record<string, number>;
  daysSkipped: Record<string, number>;
  weekMinutes: Record<string, number>;
  weekCount: Record<string, number>;
  weekStatus: Record<string, WeekDayStatus[]>;
  spark: Record<string, number[]>;
  loading: boolean;
  refresh: () => void;
}

interface PeriodRow {
  tracking_date: string;
  completions?: Record<string, boolean>;
  time_data?: Record<string, number>;
  count_data?: Record<string, number>;
  workout_duration?: number;
  skipped?: Record<string, boolean>;
}

function isGymId(id: string): boolean {
  return id === "gym" || id === "entrenamiento-fisico";
}

function habitDone(id: string, completions: Record<string, boolean>): boolean {
  if (isGymId(id)) return !!(completions.gym || completions["entrenamiento-fisico"]);
  return !!completions[id];
}

function habitMinutes(id: string, row: PeriodRow | undefined): number {
  if (!row) return 0;
  if (isGymId(id)) return Number(row.workout_duration) || 0;
  const td = row.time_data ?? {};
  const meta = HABIT_META[id];
  if (meta?.system) return systemActualMinutes(meta.system, { timeData: td });
  return Number(td[id]) || 0;
}

/**
 * Agregados de un periodo arbitrario [start, end] (mes, trimestre, etc.) por
 * hábito: días cumplidos, minutos, contadores, spark por día y estado por día.
 * `elapsedDays` es el número de días transcurridos desde `start` hasta hoy
 * (o `end`, si el periodo ya terminó) y sirve como denominador de cumplimiento.
 * Se alimenta de `daily_systems_tracking` en el rango.
 */
export function usePeriodSystemsData(
  start: Date,
  end: Date,
  habitIds: string[]
): PeriodSystemsAggregate {
  const ids = useMemo(() => [...new Set(habitIds)].sort(), [habitIds]);
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");

  const [rows, setRows] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("daily_systems_tracking")
          .select("*")
          .gte("tracking_date", startKey)
          .lte("tracking_date", endKey);
        if (error) throw error;
        if (alive) setRows((data ?? []) as unknown as PeriodRow[]);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [startKey, endKey, nonce]);

  const days = useMemo(() => {
    const out: string[] = [];
    for (const d of eachDayOfInterval({ start, end })) {
      out.push(format(d, "yyyy-MM-dd"));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey]);

  const elapsedDays = useMemo(() => {
    const today = startOfDay(new Date());
    if (isAfter(startOfDay(start), today)) return 1;
    const last = isAfter(startOfDay(end), today) ? today : startOfDay(end);
    return Math.max(1, eachDayOfInterval({ start, end: last }).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey]);

  const aggregate = useMemo(() => {
    const byDate = new Map<string, PeriodRow>();
    rows.forEach(r => byDate.set(r.tracking_date, r));

    const daysDone: Record<string, number> = {};
    const daysSkipped: Record<string, number> = {};
    const weekMinutes: Record<string, number> = {};
    const weekCount: Record<string, number> = {};
    const weekStatus: Record<string, WeekDayStatus[]> = {};
    const spark: Record<string, number[]> = {};

    for (const id of ids) {
      let done = 0;
      let skipped = 0;
      let minutes = 0;
      let count = 0;
      const arr: number[] = [];
      const status: WeekDayStatus[] = [];
      const meta = HABIT_META[id];
      const countKey = meta?.system?.countKey ?? (meta?.hasWater ? id : undefined);

      for (const d of days) {
        const row = byDate.get(d);
        const completions = (row?.completions ?? {}) as Record<string, boolean>;
        const isDone = habitDone(id, completions);
        const isSkip = !!row?.skipped?.[id];
        if (isDone) done++;
        if (isSkip) skipped++;
        const m = habitMinutes(id, row);
        minutes += m;
        arr.push(m);
        status.push(isDone ? "done" : isSkip ? "skip" : "none");
        if (countKey) count += Number(row?.count_data?.[countKey]) || 0;
      }

      daysDone[id] = done;
      daysSkipped[id] = skipped;
      weekMinutes[id] = minutes;
      weekStatus[id] = status;
      spark[id] = arr;
      if (countKey) weekCount[id] = count;
    }

    return { daysDone, daysSkipped, weekMinutes, weekCount, weekStatus, spark };
  }, [rows, ids, days]);

  return { days, elapsedDays, ...aggregate, loading, refresh };
}