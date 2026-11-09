import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  HABIT_META,
  habitTrackingIds,
  hasHabitTrackingData,
} from "@/lib/areaSystemsMap";
import { systemActualMinutes, systemSpeedOptions } from "@/lib/daySystems";

export type WeekDayStatus = "done" | "partial" | "skip" | "rest" | "none" | "nodata";

export interface WeekSystemsAggregate {
  days: string[];
  daysDone: Record<string, number>;
  daysSkipped: Record<string, number>;
  weekMinutes: Record<string, number>;
  weekCount: Record<string, number>;
  weekStatus: Record<string, WeekDayStatus[]>;
  spark: Record<string, number[]>;
  loading: boolean;
  refresh: () => void;
}

interface WeekRow {
  tracking_date: string;
  completions?: Record<string, boolean>;
  time_data?: Record<string, number>;
  count_data?: Record<string, number>;
  workout_duration?: number;
  skipped?: Record<string, boolean>;
  rest?: Record<string, boolean>;
}

function isGymId(id: string): boolean {
  return id === "gym" || id === "entrenamiento-fisico";
}

function habitDone(id: string, completions: Record<string, boolean>): boolean {
  if (isGymId(id)) return !!(completions.gym || completions["entrenamiento-fisico"]);
  return !!completions[id];
}

function habitMinutes(id: string, row: WeekRow | undefined): number {
  if (!row) return 0;
  if (isGymId(id)) return Number(row.workout_duration) || 0;
  const td = row.time_data ?? {};
  const meta = HABIT_META[id];
  if (meta?.system) return systemActualMinutes(meta.system, { timeData: td });
  return Number(td[id]) || 0;
}

/**
 * Minutos que cuentan como día cumplido (verde). Se toma la opción "Mín" del
 * sistema; para hábitos sin velocidades, cualquier minuto registrado ya cuenta.
 */
function habitTargetMinutes(id: string): number {
  const sys = HABIT_META[id]?.system;
  if (!sys) return 1;
  const opts = systemSpeedOptions(sys);
  return opts.find(o => o.id === "minimo")?.minutes ?? opts[0]?.minutes ?? 1;
}

function habitFlag(map: Record<string, boolean> | null | undefined, id: string): boolean {
  if (!map) return false;
  return habitTrackingIds(id).some(key => !!map[key]);
}

/**
 * Verde (meta), azul (parcial), rojo (saltado o fallo explícito) o gris (sin
 * registro propio del hábito ese día) para cada día del periodo.
 */
function dayStatus(
  isDone: boolean,
  isSkip: boolean,
  isRest: boolean,
  minutes: number,
  target: number,
  hasData: boolean,
): WeekDayStatus {
  if (isSkip) return "skip";
  if (isRest) return "rest";
  if (isDone || (minutes > 0 && minutes >= target)) return "done";
  if (minutes > 0) return "partial";
  return hasData ? "none" : "nodata";
}

/**
 * Agregados de la semana seleccionada por hábito: días cumplidos, minutos,
 * contadores, spark de 7 días y estado por día (hecho/saltado/sin registro).
 * Se alimenta de `daily_systems_tracking` en el rango [weekStart, weekEnd].
 */
export function useWeekSystemsData(
  weekStart: Date,
  weekEnd: Date,
  habitIds: string[]
): WeekSystemsAggregate {
  const ids = useMemo(() => [...new Set(habitIds)].sort(), [habitIds]);
  const startKey = format(weekStart, "yyyy-MM-dd");
  const endKey = format(weekEnd, "yyyy-MM-dd");

  const [rows, setRows] = useState<WeekRow[]>([]);
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
        if (alive) setRows((data ?? []) as unknown as WeekRow[]);
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
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      out.push(format(d, "yyyy-MM-dd"));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey]);

  const aggregate = useMemo(() => {
    const byDate = new Map<string, WeekRow>();
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
      const target = habitTargetMinutes(id);

      for (const d of days) {
        const row = byDate.get(d);
        const completions = (row?.completions ?? {}) as Record<string, boolean>;
        const isDone = habitDone(id, completions);
        const isSkip = habitFlag(row?.skipped, id);
        const isRest = habitFlag(row?.rest, id);
        const m = habitMinutes(id, row);
        const state = dayStatus(isDone, isSkip, isRest, m, target, hasHabitTrackingData(id, row));
        if (state === "done") done++;
        if (isSkip) skipped++;
        minutes += m;
        arr.push(m);
        status.push(state);
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

  return { days, ...aggregate, loading, refresh };
}
