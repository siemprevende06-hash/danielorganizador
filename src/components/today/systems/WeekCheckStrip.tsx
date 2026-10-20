import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getCubaDate } from "@/lib/cubaTime";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

interface WeekCheckStripProps {
  /** Hábitos que deben estar cumplidos para que el día quede en verde. */
  habitIds: string[];
  /** Estado en vivo del día visible (se actualiza al tocar los checks). */
  todayDone?: boolean;
  /** Fecha visible yyyy-MM-dd (por defecto hoy, hora Cuba). */
  date?: string;
  /** Para gym: cuenta el `workout_duration` guardado como día hecho. */
  countWorkoutMinutes?: boolean;
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function keyOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lunes (hora Cuba) de la semana a la que pertenece `key`. */
function mondayKeyOf(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const day = local.getDay();
  local.setDate(local.getDate() - day + (day === 0 ? -6 : 1));
  return keyOf(local);
}

/**
 * Check semanal de 7 casillas (L M X J V S D): verde si ese día se cumplió,
 * rojo si no, gris para los días que aún no llegan. Los datos se leen de
 * `daily_systems_tracking` (completions + rest + workout_duration).
 */
export function WeekCheckStrip({
  habitIds,
  todayDone,
  date,
  countWorkoutMinutes = false,
  className,
}: WeekCheckStripProps) {
  const viewedKey = date ?? getCubaDate();
  const idsKey = habitIds.join(",");

  const weekKeys = useMemo(() => {
    const [y, m, d] = mondayKeyOf(viewedKey).split("-").map(Number);
    return Array.from({ length: 7 }, (_, i) => keyOf(new Date(y, m - 1, d + i)));
  }, [viewedKey]);

  const [fetched, setFetched] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .select("tracking_date, completions, rest, workout_duration")
          .gte("tracking_date", weekKeys[0])
          .lte("tracking_date", weekKeys[6])
          .order("tracking_date", { ascending: true });
        if (cancelled) return;
        const byDate: Record<string, boolean> = {};
        for (const row of data ?? []) {
          const c = (row.completions || {}) as Record<string, boolean>;
          const r = (row.rest || {}) as Record<string, boolean>;
          const doneByHabit = habitIds.every(id => !!c[id] || !!r[id]);
          const doneByMinutes = countWorkoutMinutes && (row.workout_duration || 0) > 0;
          byDate[row.tracking_date] = doneByHabit || doneByMinutes;
        }
        setFetched(byDate);
        setLoaded(true);
      } catch {
        if (!cancelled) {
          setFetched({});
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, viewedKey, countWorkoutMinutes]);

  const todayKey = getCubaDate();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {weekKeys.map((key, i) => {
        const isViewed = key === viewedKey;
        const future = key > todayKey;
        const done = isViewed ? !!todayDone : !!fetched[key];
        return (
          <span
            key={key}
            title={`${DAY_LABELS[i]} · ${future ? "pendiente" : done ? "cumplido" : "no cumplido"}`}
            className={cn(
              "grid place-items-center h-5 w-5 rounded-md border text-[9px] font-bold transition-colors",
              future || (isViewed && todayDone === undefined && !loaded) || (!loaded && !isViewed)
                ? "border-border/40 bg-muted/40 text-muted-foreground/40"
                : done
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "border-red-500/50 bg-red-500/15 text-red-500",
              key === todayKey && "ring-1 ring-primary/50"
            )}
          >
            {DAY_LABELS[i]}
          </span>
        );
      })}
    </div>
  );
}
