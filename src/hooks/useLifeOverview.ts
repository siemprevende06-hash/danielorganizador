import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { DAY_SYSTEMS, systemActualMinutes, type DaySystem } from "@/lib/daySystems";

export interface LifeTrendPoint {
  label: string;
  fullLabel: string;
  consistency: number;
  minutes: number;
}

export interface LifeSystemSummary {
  id: string;
  name: string;
  area: string;
  icon: string;
  route: string;
  totalMinutes: number;
  avgMinutes: number;
  targetMinutes: number;
  compliance: number;
  daysDone: number;
  streak: number;
}

interface TrackingRow {
  tracking_date: string;
  completions: Record<string, boolean> | null;
  time_data: Record<string, number> | null;
  workout_duration: number | null;
  water_data: Record<string, boolean> | null;
  block_completions: Record<string, boolean> | null;
}

const PERIOD_DAYS: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

// Se consulta el máximo periodo para poder calcular la racha real aunque el
// usuario esté viendo solo "hoy" o "esta semana".
const HISTORY_DAYS = 90;

const SYSTEM_TARGETS: Record<string, number> = {
  universidad: 120,
  emprendimiento: 60,
  proyectos: 60,
  tareas: 60,
  lectura: 30,
  idiomas: 60,
  musica: 30,
  ajedrez: 15,
  game: 20,
  gym: 60,
  finanzas: 15,
};

const SYSTEM_ICONS: Record<string, string> = {
  universidad: "🎓",
  emprendimiento: "💼",
  proyectos: "🚀",
  tareas: "✅",
  lectura: "📖",
  idiomas: "🌍",
  musica: "🎵",
  ajedrez: "♟️",
  game: "🎯",
  gym: "💪",
  finanzas: "💰",
};

const SYSTEM_ROUTES: Record<string, string> = {
  universidad: "/university",
  emprendimiento: "/entrepreneurship",
  proyectos: "/projects",
  tareas: "/tasks",
  lectura: "/reading-library",
  idiomas: "/languages-dashboard",
  musica: "/music-dashboard",
  ajedrez: "/chess",
  game: "/systems",
  gym: "/gym",
  finanzas: "/finance",
};

const GYM_SYSTEM: DaySystem = {
  id: "gym",
  name: "Gym",
  cover: { type: "area", id: "salud" },
  streakMinutes: 0,
  speedOptions: [],
};

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseRowMetrics(row?: TrackingRow) {
  const completions = (row?.completions || {}) as Record<string, boolean>;
  const entries = Object.entries(completions).filter(([key]) => !key.startsWith("streak:"));
  const total = entries.length;
  const done = entries.filter(([, value]) => value).length;
  const consistency = total > 0 ? Math.round((done / total) * 100) : 0;
  const timeData = (row?.time_data || {}) as Record<string, number>;
  const minutes = Object.values(timeData).reduce((sum, value) => sum + numberValue(value), 0)
    + numberValue(row?.workout_duration);
  const water = Object.values((row?.water_data || {}) as Record<string, boolean>).filter(Boolean).length;
  const blocks = Object.values((row?.block_completions || {}) as Record<string, boolean>).filter(Boolean).length;

  return {
    consistency,
    minutes,
    water,
    blocks,
    done,
    total,
    active: done > 0 || minutes > 0,
    hasRow: !!row,
  };
}

function buildTrend(
  timeframe: Timeframe,
  dateKeys: string[],
  byDate: Map<string, TrackingRow>,
  end: Date,
): LifeTrendPoint[] {
  if (timeframe === "today" || timeframe === "week") {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = subDays(end, 6 - index);
      const key = format(date, "yyyy-MM-dd");
      const metrics = parseRowMetrics(byDate.get(key));
      return {
        label: format(date, "EEE", { locale: es }).replace(".", ""),
        fullLabel: format(date, "EEEE d MMM", { locale: es }),
        consistency: metrics.consistency,
        minutes: metrics.minutes,
      };
    });
  }

  if (timeframe === "month") {
    const chunks: string[][] = [];
    for (let index = 0; index < dateKeys.length; index += 5) {
      chunks.push(dateKeys.slice(index, index + 5));
    }
    return chunks.map((keys) => {
      const points = keys.map((key) => parseRowMetrics(byDate.get(key)));
      const first = parseISO(keys[0]);
      const last = parseISO(keys[keys.length - 1]);
      return {
        label: `${format(first, "d")}–${format(last, "d MMM", { locale: es })}`,
        fullLabel: `${format(first, "d MMM", { locale: es })} – ${format(last, "d MMM", { locale: es })}`,
        consistency: points.length ? Math.round(points.reduce((sum, p) => sum + p.consistency, 0) / points.length) : 0,
        minutes: points.reduce((sum, p) => sum + p.minutes, 0),
      };
    });
  }

  const monthGroups = new Map<string, string[]>();
  for (const key of dateKeys) {
    const monthKey = key.slice(0, 7);
    if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, []);
    monthGroups.get(monthKey)!.push(key);
  }

  return Array.from(monthGroups.entries()).map(([monthKey, keys]) => {
    const points = keys.map((key) => parseRowMetrics(byDate.get(key)));
    const date = parseISO(`${monthKey}-01`);
    return {
      label: format(date, "MMM", { locale: es }),
      fullLabel: format(date, "MMMM yyyy", { locale: es }),
      consistency: points.length ? Math.round(points.reduce((sum, p) => sum + p.consistency, 0) / points.length) : 0,
      minutes: points.reduce((sum, p) => sum + p.minutes, 0),
    };
  });
}

export function useLifeOverview(timeframe: Timeframe) {
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const days = PERIOD_DAYS[timeframe] ?? 7;
  // Para el año hace falta un histórico mayor; en el resto basta con 90 días.
  const historyDays = Math.max(HISTORY_DAYS, days);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const end = new Date();
      const start = subDays(end, historyDays - 1);

      try {
        const [trackingRes, streaksRes] = await Promise.all([
          supabase
            .from("daily_systems_tracking")
            .select("tracking_date, completions, time_data, workout_duration, water_data, block_completions")
            .gte("tracking_date", format(start, "yyyy-MM-dd"))
            .lte("tracking_date", format(end, "yyyy-MM-dd"))
            .order("tracking_date", { ascending: true }),
          supabase
            .from("system_habit_streaks")
            .select("habit_id, current_streak"),
        ]);

        if (cancelled) return;

        setRows((trackingRes.data || []) as TrackingRow[]);
        const streakMap: Record<string, number> = {};
        (streaksRes.data || []).forEach((row) => {
          streakMap[row.habit_id] = numberValue(row.current_streak);
        });
        setStreaks(streakMap);
      } catch (error) {
        console.error("Error loading life overview:", error);
        if (!cancelled) {
          setRows([]);
          setStreaks({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [timeframe, days, historyDays]);

  return useMemo(() => {
    const end = new Date();
    const start = subDays(end, days - 1);
    const dateKeys = Array.from({ length: days }).map((_, index) =>
      format(subDays(end, days - 1 - index), "yyyy-MM-dd"),
    );
    const byDate = new Map(rows.map((row) => [row.tracking_date, row]));
    const daily = dateKeys.map((key) => ({ key, ...parseRowMetrics(byDate.get(key)) }));
    const startKey = format(start, "yyyy-MM-dd");
    const periodRows = rows.filter((row) => row.tracking_date >= startKey);

    const totalMinutes = daily.reduce((sum, day) => sum + day.minutes, 0);
    const avgConsistency = days > 0
      ? Math.round(daily.reduce((sum, day) => sum + day.consistency, 0) / days)
      : 0;
    const activeDays = daily.filter((day) => day.active).length;
    const trackedDays = daily.filter((day) => day.hasRow).length;
    const waterGlasses = daily.reduce((sum, day) => sum + day.water, 0);
    const workouts = periodRows.filter((row) => numberValue(row.workout_duration) > 0).length;

    const todayKey = format(end, "yyyy-MM-dd");
    const streakStartOffset = byDate.has(todayKey) ? 0 : 1;
    let currentStreak = 0;
    for (let offset = streakStartOffset; offset < historyDays; offset++) {
      const key = format(subDays(end, offset), "yyyy-MM-dd");
      const metrics = parseRowMetrics(byDate.get(key));
      if (metrics.hasRow && metrics.consistency >= 50) currentStreak++;
      else break;
    }

    const systemDefinitions = [
      ...DAY_SYSTEMS
        .filter((area) => area.kind === "central")
        .flatMap((area) => area.systems.map((system) => ({ system, area: area.name }))),
      { system: GYM_SYSTEM, area: "Salud y Bienestar" },
    ];

    const systems: LifeSystemSummary[] = systemDefinitions.map(({ system, area }) => {
      const total = periodRows.reduce((sum, row) => {
        const timeData = (row.time_data || {}) as Record<string, number>;
        if (system.id === "gym") return sum + numberValue(row.workout_duration);
        return sum + systemActualMinutes(system, { timeData });
      }, 0);
      const completionKey = system.id === "gym" ? "entrenamiento-fisico" : system.id;
      const daysDone = periodRows.filter((row) => !!(row.completions || {})[completionKey]).length;
      const target = SYSTEM_TARGETS[system.id] || 30;
      const avgMinutes = Math.round((total / Math.max(1, days)) * 10) / 10;
      const compliance = target > 0 ? Math.round((avgMinutes / target) * 100) : 0;

      return {
        id: system.id,
        name: system.name,
        area,
        icon: SYSTEM_ICONS[system.id] || "🔹",
        route: SYSTEM_ROUTES[system.id] || "/systems",
        totalMinutes: Math.round(total),
        avgMinutes,
        targetMinutes: target,
        compliance,
        daysDone,
        streak: streaks[system.id] || (system.id === "gym" ? streaks["entrenamiento-fisico"] || 0 : 0),
      };
    });

    return {
      loading,
      days,
      start,
      end,
      totalMinutes,
      avgConsistency,
      activeDays,
      trackedDays,
      currentStreak,
      workouts,
      waterGlasses,
      trend: buildTrend(timeframe, dateKeys, byDate, end),
      systems,
      hasData: periodRows.length > 0,
    };
  }, [rows, streaks, timeframe, days, historyDays, loading]);
}
