import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Check, Star, Flame, Trophy } from "lucide-react";

export type DayStatus = "max" | "min" | "none" | "special";

interface WeekStreakBarProps {
  /** Identificador único persistente (ej: "lectura", "ajedrez", "skincare-noche") */
  habitId: string;
  /** Si se proveen, omite la carga desde DB (modo controlado) */
  weekStatuses?: DayStatus[];
  /** Min minutes to count as "min" effort. Default 0 = any completion */
  minThreshold?: number;
  /** Min minutes to count as "max" effort */
  maxThreshold?: number;
  /** Today's value to compute today's status if no weekStatuses passed */
  todayValue?: number;
  /** Today completed flag (override) */
  todayCompleted?: boolean;
  /** Compact mode (smaller circles) */
  compact?: boolean;
  /** Disparar shake si no se ha hecho cuando el usuario hace click */
  onShake?: () => void;
}

const DAY_LABELS = ["L", "Ma", "Mi", "J", "V", "S", "D"];

/** Lunes de la semana actual (ISO) */
const getMondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dateKey = (d: Date) => d.toISOString().split("T")[0];

/**
 * Calendario semanal L→D con estados max/min/none/special + contador de racha.
 * Persiste en `daily_systems_tracking.completions` keys: `streak:<habitId>:<YYYY-MM-DD>` con valores "max" | "min".
 */
export const WeekStreakBar = ({
  habitId,
  weekStatuses,
  minThreshold = 1,
  maxThreshold = 30,
  todayValue,
  todayCompleted,
  compact = false,
  onShake,
}: WeekStreakBarProps) => {
  const [statuses, setStatuses] = useState<DayStatus[]>(weekStatuses ?? Array(7).fill("none"));
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [shaking, setShaking] = useState<number | null>(null);
  const [pulseStreak, setPulseStreak] = useState(false);

  const monday = useMemo(() => getMondayOfWeek(), []);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }),
    [monday]
  );

  // Cargar estados de la semana desde DB si no son controlados
  useEffect(() => {
    if (weekStatuses) {
      setStatuses(weekStatuses);
      computeStreak(weekStatuses);
      return;
    }
    (async () => {
      const startStr = dateKey(weekDates[0]);
      // Buscamos los últimos 60 días para calcular best/current streaks correctamente
      const sixtyAgo = new Date();
      sixtyAgo.setDate(sixtyAgo.getDate() - 60);
      const { data } = await supabase
        .from("daily_systems_tracking")
        .select("tracking_date, completions")
        .gte("tracking_date", sixtyAgo.toISOString().split("T")[0])
        .order("tracking_date", { ascending: true });

      const map: Record<string, DayStatus> = {};
      const key = `streak:${habitId}`;
      (data || []).forEach((row: any) => {
        const c = (row.completions || {}) as Record<string, string | boolean>;
        const v = c[key];
        if (v === "max" || v === "min") map[row.tracking_date] = v as DayStatus;
        else if (v === true) map[row.tracking_date] = "min";
      });

      const weekArr: DayStatus[] = weekDates.map((d) => {
        const k = dateKey(d);
        if (map[k]) {
          // Domingo con cumplimiento → special
          if (d.getDay() === 0) return "special";
          return map[k];
        }
        return "none";
      });

      // Aplicar override de hoy si se entregó
      const todayIdx = weekDates.findIndex((d) => dateKey(d) === dateKey(new Date()));
      if (todayIdx >= 0) {
        if (typeof todayValue === "number") {
          if (todayValue >= maxThreshold) weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "max";
          else if (todayValue >= minThreshold) weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "min";
        }
        if (todayCompleted && weekArr[todayIdx] === "none") {
          weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "min";
        }
      }

      setStatuses(weekArr);
      computeStreak(weekArr, map);
    })();
  }, [habitId, weekStatuses, todayValue, todayCompleted, minThreshold, maxThreshold]);

  const computeStreak = (week: DayStatus[], allMap?: Record<string, DayStatus>) => {
    // current: días consecutivos desde hoy hacia atrás con status != "none"
    let cur = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = dateKey(d);
      const s = allMap?.[k];
      if (s === "max" || s === "min") cur++;
      else if (i === 0 && week[weekDates.findIndex((wd) => dateKey(wd) === k)] && week[weekDates.findIndex((wd) => dateKey(wd) === k)] !== "none") cur++;
      else break;
    }
    // best: pasada máxima en el mapa
    let best = 0, run = 0;
    if (allMap) {
      const keys = Object.keys(allMap).sort();
      let prev: string | null = null;
      keys.forEach((k) => {
        if (!prev) { run = 1; }
        else {
          const a = new Date(prev);
          const b = new Date(k);
          const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
          run = diff === 1 ? run + 1 : 1;
        }
        prev = k;
        if (run > best) best = run;
      });
    }
    setStreak((prev) => {
      const newBest = Math.max(prev.best, best, cur);
      if (cur > prev.current) setPulseStreak(true);
      return { current: cur, best: newBest };
    });
    setTimeout(() => setPulseStreak(false), 1200);
  };

  const handleClick = (idx: number) => {
    if (statuses[idx] === "none") {
      setShaking(idx);
      onShake?.();
      setTimeout(() => setShaking(null), 500);
    }
  };

  const sizeCircle = compact ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {weekDates.map((d, i) => {
            const status = statuses[i];
            const isToday = dateKey(d) === dateKey(new Date());
            const isSunday = d.getDay() === 0;
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={cn(
                  "rounded-full flex items-center justify-center font-bold transition-all animate-fade-in relative",
                  sizeCircle,
                  status === "max" && "bg-amber-400 text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-[bounce_0.5s_ease-out]",
                  status === "min" && "bg-amber-200 text-amber-900",
                  status === "special" && "bg-gradient-to-br from-yellow-300 to-amber-500 text-white ring-2 ring-amber-400/60 animate-pulse",
                  status === "none" && "bg-muted text-muted-foreground/60",
                  shaking === i && "animate-[wiggle_0.4s_ease-in-out]",
                  isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                aria-label={`${DAY_LABELS[i]} ${status}`}
              >
                {status === "max" && <Check className="h-3 w-3" strokeWidth={3} />}
                {status === "min" && <Check className="h-3 w-3" strokeWidth={2.5} />}
                {status === "special" && <Star className="h-3 w-3 fill-current" />}
                {status === "none" && DAY_LABELS[i]}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-[10px] font-medium transition-all",
            pulseStreak && "scale-110"
          )}
        >
          <span className="flex items-center gap-0.5 text-orange-500">
            <Flame className="h-3 w-3" />
            <span className={cn(pulseStreak && "animate-[bounce_0.5s_ease-out]")}>{streak.current}</span>
          </span>
          {streak.best > 0 && (
            <span className="flex items-center gap-0.5 text-yellow-600">
              <Trophy className="h-3 w-3" />
              {streak.best}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
