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
  AREA_STATE_COLOR,
  GROUP_CONFIG,
  HABIT_META,
  areaStateColor,
  diagnoseArea,
  getAreaTrackableHabits,
  type AreaStateColor,
  type PointBGroup,
} from "@/lib/areaSystemsMap";
import { systemMinForSpeed, type ChessResultKey } from "@/lib/daySystems";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBArea } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Hammer, Layers, Trophy } from "lucide-react";
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
  onChessResultChange,
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
  onChessResultChange?: (result: ChessResultKey, value: number) => void;
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

  // Sin botón "Todas": null = ver las tres divisiones; clic en la activa la filtra.
  const [activeGroup, setActiveGroup] = useState<PointBGroup | null>(null);

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

  /** Estado visual (verde/rojo/azul/gris) de cada área interna de cada división. */
  const areaStates = useMemo(() => {
    const map: Record<string, { color: AreaStateColor; diagnosis: ReturnType<typeof diagnoseArea> }> = {};
    for (const area of POINT_B_AREAS) {
      const s = scoreById[area.id];
      const diagnosis = diagnoseArea(s?.esfuerzo ?? 0, s?.resultados ?? 0);
      map[area.id] = { color: areaStateColor(diagnosis), diagnosis };
    }
    return map;
  }, [scoreById]);

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
    onChessResultChange,
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
      {/* ─── Divisiones del Punto B: cada botón muestra los iconos de sus áreas
          internas, coloreados por su estado (verde / rojo / azul / gris) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {GROUP_ORDER.map(g => {
          const cfg = GROUP_CONFIG[g];
          const health = groupHealth[g];
          const Icon = g === "cimientos" ? Layers : g === "construccion" ? Hammer : Trophy;
          const isActive = activeGroup === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(prev => (prev === g ? null : g))}
              aria-pressed={isActive}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors space-y-1.5",
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/60 hover:bg-background"
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                <Icon className={cn("h-3.5 w-3.5", cfg.ring)} />
                {cfg.sectionTitle}
              </span>
              <span className="block text-[9px] text-muted-foreground">{cfg.note}</span>

              {/* Iconos de las áreas internas de esta división, coloreados por estado */}
              <span className="flex flex-wrap items-center gap-1">
                {groups[g].map(area => {
                  const st = areaStates[area.id];
                  const color = AREA_STATE_COLOR[st?.color ?? "grey"];
                  return (
                    <span
                      key={area.id}
                      title={`${area.label} · ${st?.diagnosis.label ?? "Sin datos"}`}
                      className={cn(
                        "grid place-items-center size-6 rounded-lg border text-[13px] leading-none transition-colors",
                        color.chip,
                        isActive && "ring-1 ring-primary/40"
                      )}
                    >
                      {area.icon}
                    </span>
                  );
                })}
              </span>

              <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px]">
                <span className="px-1.5 py-0.5 rounded-md bg-foreground/5 text-muted-foreground font-bold">
                  {health.total} áreas
                </span>
                {(["green", "red", "blue", "grey"] as AreaStateColor[]).map(c => {
                  const n = groups[g].filter(a => (areaStates[a.id]?.color ?? "grey") === c).length;
                  if (n === 0) return null;
                  return (
                    <span
                      key={c}
                      title={AREA_STATE_COLOR[c].label}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-bold",
                        AREA_STATE_COLOR[c].chip
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", AREA_STATE_COLOR[c].dot)} />
                      {n}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>

      {GROUP_ORDER.filter(g => activeGroup === null || activeGroup === g).map(g => {
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