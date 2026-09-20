import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { POINT_B_AREAS } from "@/data/pointB2027";
import { AREA_SYSTEMS } from "@/lib/areaSystemsMap";

export type EffortWindow = "hoy" | "semana" | "mes" | "trimestre" | "anio";

export interface EffortDay {
  date: string;
  effort: number | null;
  minutes: number;
  done: number;
  total: number;
}

const WINDOW_DAYS: Record<EffortWindow, number> = {
  hoy: 0,
  semana: 6,
  mes: 29,
  trimestre: 89,
  anio: 364,
};

function dayCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`).getTime();
  const e = new Date(`${end}T00:00:00`).getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

function windowRange(windowKey: EffortWindow): { start: string; end: string } {
  const today = new Date();
  const end = format(today, "yyyy-MM-dd");
  const days = WINDOW_DAYS[windowKey];
  return { start: format(subDays(today, days), "yyyy-MM-dd"), end };
}

const todayKey = () => format(new Date(), "yyyy-MM-dd");

interface StatsRow {
  area_id: string;
  stat_date: string;
  time_spent_minutes: number;
  time_goal_minutes: number;
}

interface SysRow {
  tracking_date: string;
  completions?: Record<string, boolean>;
  time_data?: Record<string, number>;
}

export function useAreaDetailData(areaId: string) {
  const area = useMemo(() => POINT_B_AREAS.find(a => a.id === areaId), [areaId]);
  const config = useMemo(() => AREA_SYSTEMS[areaId], [areaId]);

  const effortIds = useMemo(() => area?.effortTrackingIds ?? [], [area]);
  const hierarchyIds = useMemo(() => config?.hierarchyAreas ?? [], [config]);
  const statsIds = useMemo(
    () => [...new Set([...effortIds, ...hierarchyIds])],
    [effortIds, hierarchyIds]
  );

  const [consistency, setConsistency] = useState<Record<EffortWindow, number>>({
    hoy: 0,
    semana: 0,
    mes: 0,
    trimestre: 0,
    anio: 0,
  });
  const [series, setSeries] = useState<EffortDay[]>([]);
  const [today, setToday] = useState({ done: 0, total: 0, minutes: 0 });
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [todayTimeData, setTodayTimeData] = useState<Record<string, number>>({});
  const [minutesInWindow, setMinutesInWindow] = useState<Record<EffortWindow, Record<string, number>>>({
    hoy: {},
    semana: {},
    mes: {},
    trimestre: {},
    anio: {},
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!area || statsIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { start, end } = windowRange("anio");

    try {
      const [statsRes, sysRes] = await Promise.all([
        supabase
          .from("daily_area_stats")
          .select("area_id, stat_date, time_spent_minutes, time_goal_minutes")
          .in("area_id", statsIds)
          .gte("stat_date", start)
          .lte("stat_date", end),
        supabase
          .from("daily_systems_tracking")
          .select("tracking_date, completions, time_data")
          .gte("tracking_date", start)
          .lte("tracking_date", end),
      ]);

      const statsRows: StatsRow[] = (statsRes.data ?? []) as StatsRow[];
      const sysRows: SysRow[] = (sysRes.data ?? []) as SysRow[];

      const completionsMap = new Map<string, Set<string>>();
      for (const row of sysRows) {
        const done = new Set<string>();
        const comp = row.completions ?? {};
        for (const [k, v] of Object.entries(comp)) {
          if (k.startsWith("streak:")) continue;
          if (v) done.add(k);
        }
        completionsMap.set(row.tracking_date, done);
      }

      const timeMap = new Map<string, Record<string, number>>();
      for (const row of sysRows) timeMap.set(row.tracking_date, row.time_data ?? {});

      // Filas de esfuerzo (área-por-día, deduplicadas como useConsistencyScores)
      const rows: Array<{ id: string; date: string; spent: number; goal: number; done: boolean }> = [];
      const seen = new Set<string>();
      for (const r of statsRows) {
        const key = `${r.area_id}|${r.stat_date}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const done = completionsMap.get(r.stat_date)?.has(r.area_id) ?? false;
        rows.push({
          id: r.area_id,
          date: r.stat_date,
          spent: r.time_spent_minutes || 0,
          goal: r.time_goal_minutes || 30,
          done,
        });
      }
      for (const id of effortIds) {
        if (!seen.has(`${id}|${todayKey()}`)) {
          rows.push({ id, date: todayKey(), spent: 0, goal: 30, done: completionsMap.get(todayKey())?.has(id) ?? false });
        }
      }

      const rate = (r: (typeof rows)[number]) => (r.done ? 100 : Math.min(100, Math.round((r.spent / (r.goal || 30)) * 100)));

      // Consistencia por ventana: tasa diaria = promedio de las filas de ese día;
      // el % de la ventana es la suma de tasas diarias / total de días (días sin
      // registrar cuentan 0, así nadie muestra 100% falso).
      const cons: Record<EffortWindow, number> = { hoy: 0, semana: 0, mes: 0, trimestre: 0, anio: 0 };
      (Object.keys(WINDOW_DAYS) as EffortWindow[]).forEach(w => {
        const range = windowRange(w);
        const days = dayCount(range.start, range.end);
        const byDay = new Map<string, number[]>();
        for (const r of rows) {
          if (r.date < range.start || r.date > range.end) continue;
          const arr = byDay.get(r.date) ?? [];
          arr.push(rate(r));
          byDay.set(r.date, arr);
        }
        if (byDay.size === 0) {
          cons[w] = 0;
          return;
        }
        const totalPoints = Array.from(byDay.values()).reduce(
          (s, arr) => s + arr.reduce((a, b) => a + b, 0) / arr.length,
          0
        );
        cons[w] = Math.min(100, Math.round(totalPoints / days));
      });
      setConsistency(cons);

      // Serie de los últimos 30 días (esfuerzo diario = promedio de las tasas del día)
      const seriesList: EffortDay[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const dayRows = rows.filter(r => r.date === d && effortIds.includes(r.id));
        const doneCount = dayRows.filter(r => r.done).length;
        seriesList.push({
          date: d,
          effort: dayRows.length > 0 ? Math.round(dayRows.reduce((s, r) => s + rate(r), 0) / dayRows.length) : null,
          minutes: dayRows.reduce((s, r) => s + r.spent, 0),
          done: doneCount,
          total: effortIds.length,
        });
      }
      setSeries(seriesList);

      setToday({
        done: seriesList[seriesList.length - 1]?.done ?? 0,
        total: effortIds.length,
        minutes: seriesList[seriesList.length - 1]?.minutes ?? 0,
      });

      setTodayCompletions(
        Object.fromEntries([...(completionsMap.get(todayKey()) ?? [])].map(id => [id, true]))
      );
      setTodayTimeData(timeMap.get(todayKey()) ?? {});

      // Minutos reales por área de jerarquía en cada ventana (desde time_data)
      const minMap: Record<EffortWindow, Record<string, number>> = { hoy: {}, semana: {}, mes: {}, trimestre: {}, anio: {} };
      (Object.keys(WINDOW_DAYS) as EffortWindow[]).forEach(w => {
        const range = windowRange(w);
        const perArea: Record<string, number> = {};
        for (const a of hierarchyIds) perArea[a] = 0;
        for (const row of sysRows) {
          if (row.tracking_date < range.start || row.tracking_date > range.end) continue;
          const td = row.time_data ?? {};
          for (const a of hierarchyIds) perArea[a] = (perArea[a] ?? 0) + (td[a] || 0);
        }
        minMap[w] = perArea;
      });
      setMinutesInWindow(minMap);
    } catch (err) {
      console.warn("[useAreaDetailData] error:", err);
    } finally {
      setLoading(false);
    }
  }, [area, effortIds, hierarchyIds, statsIds]);

  useEffect(() => {
    load();
  }, [load]);

  const minutesIn = useCallback(
    (hierarchyArea: string, w: EffortWindow): number => minutesInWindow[w]?.[hierarchyArea] ?? 0,
    [minutesInWindow]
  );

  return { loading, consistency, series, today, todayCompletions, todayTimeData, minutesIn };
}