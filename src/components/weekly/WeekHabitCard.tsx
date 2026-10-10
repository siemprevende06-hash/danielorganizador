import { cn } from "@/lib/utils";
import { getCoverGradient } from "@/components/areas/AreaCover";
import type { HabitMeta } from "@/lib/areaSystemsMap";
import type { WeekDayStatus } from "@/hooks/useWeekSystemsData";
import type { TodayStripItem } from "@/hooks/useTodayFocusItems";
import { Flame, Trophy } from "lucide-react";

interface WeekTier {
  label: string;
  ring: string;
  bg: string;
  bar: string;
  text: string;
  dot: string;
}

const TIER_FULL: WeekTier = {
  label: "Semana completa",
  ring: "ring-emerald-500/50",
  bg: "bg-emerald-500/5",
  bar: "bg-emerald-500",
  text: "text-emerald-600 dark:text-emerald-400",
  dot: "bg-emerald-500",
};
const TIER_PARTIAL: WeekTier = {
  label: "Parcial",
  ring: "ring-blue-500/50",
  bg: "bg-blue-500/5",
  bar: "bg-blue-500",
  text: "text-blue-500",
  dot: "bg-blue-500",
};
const TIER_SKIP: WeekTier = {
  label: "Saltado",
  ring: "ring-red-500/40",
  bg: "bg-red-500/5",
  bar: "bg-red-500",
  text: "text-red-500",
  dot: "bg-red-500",
};
const TIER_NONE: WeekTier = {
  label: "Sin hacer",
  ring: "ring-border/40",
  bg: "bg-white/80 dark:bg-zinc-950/80",
  bar: "bg-muted-foreground/40",
  text: "text-muted-foreground",
  dot: "bg-gray-400",
};

function weekTier(done: number, total: number, skipped: number): WeekTier {
  if (total > 0 && done >= total) return TIER_FULL;
  if (done > 0) return TIER_PARTIAL;
  if (skipped > 0) return TIER_SKIP;
  return TIER_NONE;
}

const DAY_DOT: Record<WeekDayStatus, string> = {
  done: "bg-emerald-500",
  skip: "bg-red-400/70",
  none: "bg-muted-foreground/20",
};

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export interface WeekHabitCardProps {
  meta: HabitMeta;
  status: WeekDayStatus[];
  spark: number[];
  daysDone: number;
  daysTotal: number;
  daysSkipped: number;
  weekMinutes: number;
  weekCount?: number;
  streak?: { current: number; best: number };
  focus?: TodayStripItem;
  coverUrl?: string | null;
}

function focusInfo(focus: TodayStripItem) {
  const emoji =
    focus.kind === "libro"
      ? "📖"
      : focus.kind === "cancion"
        ? "🎹"
        : focus.kind === "materia"
          ? "🎓"
          : focus.kind === "emprendimiento"
            ? "🚀"
            : "📦";
  const title =
    focus.kind === "libro" || focus.kind === "cancion" ? focus.title : focus.name;
  const label =
    focus.kind === "libro"
      ? focus.pagesTotal
        ? `${focus.pagesRead}/${focus.pagesTotal} págs`
        : `${focus.pagesRead} págs`
      : focus.kind === "cancion"
        ? `${focus.instrument ? focus.instrument + " · " : ""}${focus.practiceMinutes ?? 0} min`
        : `${focus.doneTasks}/${focus.totalTasks} tareas esta semana`;
  return { emoji, title, label };
}

export default function WeekHabitCard({
  meta,
  status,
  spark,
  daysDone,
  daysTotal,
  daysSkipped,
  weekMinutes,
  weekCount,
  streak,
  focus,
  coverUrl,
}: WeekHabitCardProps) {
  const tier = weekTier(daysDone, daysTotal, daysSkipped);
  const coverId = meta.cover?.id ?? meta.id;
  const sparkMax = Math.max(1, ...spark);
  const showCount = !!meta.system?.countKey || meta.hasWater;
  const countLabel = meta.system?.countLabel || (meta.hasWater ? "vasos" : "repeticiones");
  const fi = focus ? focusInfo(focus) : null;

  return (
    <div className={cn("relative rounded-2xl overflow-hidden ring-2 flex flex-col", tier.ring, tier.bg)}>
      <div className={cn("h-12 w-full shrink-0 relative bg-gradient-to-br overflow-hidden", getCoverGradient(coverId))}>
        {coverUrl ? (
          <img src={coverUrl} alt={meta.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xl drop-shadow-sm">{meta.emoji ?? "•"}</span>
          </div>
        )}
        <span className={cn("absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900", tier.dot)} />
      </div>

      <div className="p-2.5 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold leading-tight truncate">{meta.name}</span>
          <span className={cn("ml-auto text-[9px] font-bold shrink-0", tier.text)}>{tier.label}</span>
        </div>

        {(streak && (streak.current > 0 || streak.best > 0)) && (
          <span className="flex items-center gap-1.5 text-[9px]">
            {streak.current > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500">
                <Flame className="h-2 w-2" />
                {streak.current}
              </span>
            )}
            {streak.best > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-600">
                <Trophy className="h-2 w-2" />
                {streak.best}
              </span>
            )}
          </span>
        )}

        {/* Días de la semana: hecho / saltado / sin registro */}
        <div className="flex items-center gap-0.5">
          {status.map((s, i) => (
            <span
              key={i}
              title={DAY_LABELS[i]}
              className={cn("flex-1 h-1.5 rounded-full", DAY_DOT[s])}
            />
          ))}
        </div>

        {/* Tendencia de minutos (7 días) */}
        {spark.some(v => v > 0) && (
          <div className="flex items-end gap-0.5 h-5">
            {spark.map((v, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-sm", i === spark.length - 1 ? tier.bar : "bg-muted-foreground/25")}
                style={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
              />
            ))}
          </div>
        )}

        {/* ─── Objetivo de la semana (áreas centrales) ─── */}
        {fi && focus && (
          <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-2 py-1.5">
            {focus.kind === "libro" && focus.cover ? (
              <img
                src={focus.cover}
                alt={fi.title}
                className="h-8 w-6 rounded object-cover shrink-0 border border-border/40"
              />
            ) : (
              <span className="text-sm shrink-0 leading-none">{fi.emoji}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold leading-tight truncate">{fi.title}</p>
              <p className="text-[8px] text-muted-foreground leading-tight truncate">
                Esta semana: {fi.label}
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-lg font-extrabold tabular-nums">{weekMinutes}</span>
          <span className="text-[9px] text-muted-foreground">min sem.</span>
          <span className={cn("ml-auto text-[9px] font-bold tabular-nums", daysDone >= daysTotal ? "text-emerald-500" : "text-muted-foreground")}>
            {daysDone}/{daysTotal} días
          </span>
        </div>

        {showCount && (
          <p className="text-[9px] text-muted-foreground">
            {weekCount ?? 0} {countLabel} en la semana
          </p>
        )}
      </div>
    </div>
  );
}
