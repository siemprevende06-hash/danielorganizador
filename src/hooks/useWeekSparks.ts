import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { HABIT_META } from "@/lib/areaSystemsMap";
import { systemActualMinutes } from "@/lib/daySystems";

interface WeekRow {
  tracking_date: string;
  time_data?: Record<string, number>;
  workout_duration?: number;
}

/** Minutos reales de un hábito en una fila del día (mismo criterio que los
 *  sistemas del día: getMinutes si es sistema, workout_duration para gym). */
function minutesFor(id: string, row: WeekRow | undefined): number {
  const td = row?.time_data ?? {};
  const meta = HABIT_META[id];
  if (meta?.system) return systemActualMinutes(meta.system, { timeData: td });
  if (id === "gym") return Number(row?.workout_duration) || 0;
  return td[id] || 0;
}

/**
 * Tendencia de los últimos 7 días para un lote de hábitos (1 sola fetch).
 * Devuelve, por hábito, un array de 7 valores (más viejo → hoy) y el total
 * semanal según lo registrado en `daily_systems_tracking`.
 */
export function useWeekSparks(habitIds: string[]) {
  const ids = useMemo(() => [...new Set(habitIds)].sort(), [habitIds]);

  const [sparks, setSparks] = useState<Record<string, number[]>>({});
  const [weekTotals, setWeekTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (ids.length === 0) {
      setSparks({});
      setWeekTotals({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const start = format(subDays(today, 6), "yyyy-MM-dd");
      const end = format(today, "yyyy-MM-dd");
      const { data } = await supabase
        .from("daily_systems_tracking")
        .select("tracking_date, time_data, workout_duration")
        .gte("tracking_date", start)
        .lte("tracking_date", end);

      const rows = (data ?? []) as WeekRow[];
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) days.push(format(subDays(today, i), "yyyy-MM-dd"));

      const sparksMap: Record<string, number[]> = {};
      const totalsMap: Record<string, number> = {};
      for (const id of ids) {
        const arr: number[] = [];
        let total = 0;
        for (const d of days) {
          const row = rows.find(r => r.tracking_date === d);
          const minutes = minutesFor(id, row);
          arr.push(minutes);
          total += minutes;
        }
        sparksMap[id] = arr;
        totalsMap[id] = total;
      }
      setSparks(sparksMap);
      setWeekTotals(totalsMap);
    } catch (err) {
      console.warn("[useWeekSparks] error:", err);
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    load();
  }, [load]);

  return { sparks, weekTotals, loading, refresh: load };
}