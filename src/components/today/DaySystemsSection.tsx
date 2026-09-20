import { useCallback, useMemo, useState } from "react";
import { useAreaCovers } from "@/hooks/useAreaCovers";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import { useSystemStreaks } from "@/hooks/useSystemStreaks";
import { useWeekSparks } from "@/hooks/useWeekSparks";
import { useTodayFocusItems } from "@/hooks/useTodayFocusItems";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_TRACKABLE_IDS,
  GROUP_CONFIG,
  HABIT_META,
  diagnoseArea,
  getAreaTrackableHabits,
  type PointBGroup,
} from "@/lib/areaSystemsMap";
import { systemMinForSpeed } from "@/lib/daySystems";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBArea } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Hammer, Layers, Trophy, LayoutGrid } from "lucide-react";
import AreaSystemCard, { type AreaInteraction } from "./systems/AreaSystemCard";

const GROUP_ORDER: PointBGroup[] = ["cimientos", "construccion", "recompensas"];

export function DaySystemsSection({
  completions,
  timeData,
  workoutDuration,
  onToggle,
  onTimeChange,
  skipped,
  countData,
  onCountChange,
  waterData,
  onWaterToggle,
  mealPhotos,
  onMealPhotoUpload,
  onSkipToggle,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  workoutIntensity,
  onWorkoutIntensityChange,
  onWorkoutDurationChange,
}: {
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  workoutDuration: number;
  onToggle: (id: string) => void;
  onTimeChange: (id: string, minutes: number) => void;
  skipped?: Record<string, boolean>;
  streaks?: Record<string, { current: number; best: number }>;
  countData?: Record<string, number>;
  onCountChange?: (id: string, count: number) => void;
  waterData?: Record<string, boolean>;
  onWaterToggle?: (id: string) => void;
  mealPhotos?: Record<string, string>;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onSkipToggle?: (id: string) => void;
  wakeTime?: string;
  sleepTime?: string;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  workoutIntensity?: string;
  onWorkoutIntensityChange?: (v: string) => void;
  onWorkoutDurationChange?: (v: number) => void;
}) {
  const { getSpeed, setSpeed } = useSystemSpeed();
  const covers = useAreaCovers();
  const { scores, subStats } = useAreaScores("month", "ambos");
  const { streaks } = useSystemStreaks(ALL_TRACKABLE_IDS);
  const { sparks, weekTotals } = useWeekSparks(ALL_TRACKABLE_IDS);
  const { items: todayItems, generalTasks, refresh: refreshToday } = useTodayFocusItems();

  const toggleGeneralTask = useCallback(
    async (id: string, done: boolean) => {
      await supabase.from("tasks").update({ completed: !done }).eq("id", id);
      refreshToday();
    },
    [refreshToday]
  );

  const [activeGroup, setActiveGroup] = useState<PointBGroup | "todas">("todas");

  const scoreById = useMemo(
    () => Object.fromEntries(scores.map(s => [s.id, s])),
    [scores]
  );

  const metaMinutesById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const id of ALL_TRACKABLE_IDS) {
      const meta = HABIT_META[id];
      if (meta?.system) {
        m[id] = systemMinForSpeed(meta.system, getSpeed(meta.system.id));
      }
    }
    return m;
  }, [getSpeed]);

  const groups = useMemo(() => {
    const g: Record<PointBGroup, PointBArea[]> = {
      cimientos: [],
      construccion: [],
      recompensas: [],
    };
    for (const area of POINT_B_AREAS) {
      if (area.id === "proposito") continue;
      g[area.group].push(area);
    }
    return g;
  }, []);

  const groupHealth = useMemo(() => {
    const h: Record<PointBGroup, { total: number; atencion: number; ok: number }> = {
      cimientos: { total: 0, atencion: 0, ok: 0 },
      construccion: { total: 0, atencion: 0, ok: 0 },
      recompensas: { total: 0, atencion: 0, ok: 0 },
    };
    for (const s of scores) {
      const area = POINT_B_AREAS.find(a => a.id === s.id);
      if (!area || area.id === "proposito") continue;
      const d = diagnoseArea(s.esfuerzo, s.resultados);
      h[area.group].total++;
      if (d.key === "roto" || d.key === "abandonado") h[area.group].atencion++;
      else if (d.key === "funcionando") h[area.group].ok++;
    }
    return h;
  }, [scores]);

  const interaction: AreaInteraction = {
    completions,
    timeData,
    countData,
    waterData,
    mealPhotos,
    skipped,
    wakeTime,
    sleepTime,
    workoutDuration,
    workoutIntensity,
    streaks,
    metaMinutesById,
    sparks,
    weekTotals,
    todayItems,
    generalTasks,
    onToggleGeneralTask: toggleGeneralTask,
    subStats,
    getSpeed,
    setSpeed,
    covers: covers.covers,
    onToggle,
    onTimeChange,
    onCountChange,
    onWaterToggle,
    onMealPhotoUpload,
    onSkipToggle,
    onWakeTimeChange,
    onSleepTimeChange,
    onWorkoutDurationChange,
    onWorkoutIntensityChange,
  };

  return (
    <div className="space-y-5">
      {/* ─── Divisiones del Punto B: toques la división y te salen sus áreas ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveGroup("todas")}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left transition-colors",
            activeGroup === "todas"
              ? "border-primary bg-primary/10"
              : "border-border/60 bg-background/60 hover:bg-background"
          )}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" /> Todas
          </span>
          <span className="text-[9px] text-muted-foreground">Ver las tres divisiones</span>
        </button>
        {GROUP_ORDER.map(g => {
          const cfg = GROUP_CONFIG[g];
          const health = groupHealth[g];
          const Icon = g === "cimientos" ? Layers : g === "construccion" ? Hammer : Trophy;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                activeGroup === g
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/60 hover:bg-background"
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                <Icon className={cn("h-3.5 w-3.5", cfg.ring)} />
                {cfg.sectionTitle}
              </span>
              <span className="block text-[9px] text-muted-foreground">{cfg.note}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px]">
                <span className="px-1.5 py-0.5 rounded-md bg-foreground/5 text-muted-foreground font-bold">
                  {health.total} áreas
                </span>
                {health.ok > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    ✅ {health.ok}
                  </span>
                )}
                {health.atencion > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 font-bold">
                    🧨 {health.atencion}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {GROUP_ORDER.filter(g => activeGroup === "todas" || activeGroup === g).map(g => {
        const cfg = GROUP_CONFIG[g];
        const areas = groups[g];
        return (
          <section key={g} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                {cfg.sectionTitle}
              </h2>
              <span className="text-[9px] text-muted-foreground hidden sm:inline">{cfg.sectionNote}</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {areas.map(area => (
                <AreaSystemCard
                  key={area.id}
                  area={area}
                  score={scoreById[area.id]}
                  trackables={getAreaTrackableHabits(area.id)}
                  interaction={interaction}
                  hideCover={area.group === "cimientos"}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}