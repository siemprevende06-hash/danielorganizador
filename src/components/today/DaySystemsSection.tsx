import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAreaCovers } from "@/hooks/useAreaCovers";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import { useSystemStreaks } from "@/hooks/useSystemStreaks";
import {
  ALL_TRACKABLE_IDS,
  GROUP_CONFIG,
  HABIT_META,
  diagnoseArea,
  getAreaTrackableHabits,
  type PointBGroup,
} from "@/lib/areaSystemsMap";
import { systemActualMinutes, systemMinForSpeed } from "@/lib/daySystems";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBArea } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  const { scores, averages, loading } = useAreaScores("month", "ambos");
  const { streaks } = useSystemStreaks(ALL_TRACKABLE_IDS);

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

  const todayDone = useMemo(
    () => ALL_TRACKABLE_IDS.filter(id => completions[id]).length,
    [completions]
  );

  const todayMinutes = useMemo(() => {
    let total = 0;
    for (const id of ALL_TRACKABLE_IDS) {
      const meta = HABIT_META[id];
      if (!meta) continue;
      total += meta.system
        ? systemActualMinutes(meta.system, { timeData })
        : (timeData[id] ?? 0);
    }
    return total;
  }, [timeData]);

  const groups = useMemo(() => {
    const g: Record<PointBGroup, PointBArea[]> = {
      cimientos: [],
      construccion: [],
      recompensas: [],
    };
    for (const area of POINT_B_AREAS) g[area.group].push(area);
    return g;
  }, []);

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
      <SummaryHeader
        averages={averages}
        scores={scores}
        loading={loading}
        todayDone={todayDone}
        todayTotal={ALL_TRACKABLE_IDS.length}
        todayMinutes={todayMinutes}
      />

      <ChaosBanner scores={scores} loading={loading} />

      {GROUP_ORDER.map(g => {
        const cfg = GROUP_CONFIG[g];
        const areas = groups[g];
        return (
          <section key={g} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                {cfg.label}
              </h2>
              <span className="text-[9px] text-muted-foreground hidden sm:inline">{cfg.note}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {areas.map(area => (
                <AreaSystemCard
                  key={area.id}
                  area={area}
                  score={scoreById[area.id]}
                  trackables={getAreaTrackableHabits(area.id)}
                  interaction={interaction}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SummaryHeader({
  averages,
  scores,
  loading,
  todayDone,
  todayTotal,
  todayMinutes,
}: {
  averages: { esfuerzo: number; resultados: number };
  scores: ReturnType<typeof useAreaScores>["scores"];
  loading: boolean;
  todayDone: number;
  todayTotal: number;
  todayMinutes: number;
}) {
  const counts = useMemo(() => {
    let funcionando = 0;
    let roto = 0;
    let caos = 0;
    let heredado = 0;
    for (const s of scores) {
      const d = diagnoseArea(s.esfuerzo, s.resultados);
      if (d.key === "funcionando") funcionando++;
      else if (d.key === "roto") roto++;
      else if (d.key === "abandonado") caos++;
      else if (d.key === "heredado") heredado++;
    }
    return { funcionando, roto, caos, heredado };
  }, [scores]);

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/15 via-background to-background backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sistemas y Resultados
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-background/80 dark:bg-zinc-950/40 border border-border/50 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Punto B global</span>
              <span className="font-bold text-foreground">{averages.resultados}%</span>
            </div>
            <Progress value={Math.min(100, averages.resultados)} className="h-1.5" indicatorClassName="bg-primary" />
          </div>
          <div className="rounded-xl bg-background/80 dark:bg-zinc-950/40 border border-border/50 p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Esfuerzo 30 días</span>
              <span className="font-bold text-foreground">{averages.esfuerzo}%</span>
            </div>
            <Progress value={Math.min(100, averages.esfuerzo)} className="h-1.5" indicatorClassName="bg-amber-500" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            Hoy {todayDone}/{todayTotal} ✓
          </span>
          <span className="px-2 py-1 rounded-lg bg-foreground/5 text-muted-foreground font-semibold">
            {todayMinutes} min
          </span>
          {!loading ? (
            <>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                ✅ {counts.funcionando}
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                ⚙️ {counts.roto}
              </span>
              <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 font-semibold">
                🧨 {counts.caos}
              </span>
              <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                🎓 {counts.heredado}
              </span>
            </>
          ) : (
            <span className="px-2 py-1 rounded-lg bg-foreground/5 text-muted-foreground animate-pulse">
              Diagnóstico…
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function ChaosBanner({
  scores,
  loading,
}: {
  scores: ReturnType<typeof useAreaScores>["scores"];
  loading: boolean;
}) {
  const onFire = useMemo(() => {
    if (loading) return [];
    return scores
      .map(s => {
        const area = POINT_B_AREAS.find(a => a.id === s.id);
        if (!area) return null;
        return { area, diagnosis: diagnoseArea(s.esfuerzo, s.resultados) };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .filter(x => x.diagnosis.key === "abandonado" || x.diagnosis.key === "roto");
  }, [scores, loading]);

  if (onFire.length === 0) {
    if (loading) return null;
    if (scores.some(s => s.esfuerzo > 0 || s.resultados > 0)) {
      return (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Todo en marcha: ningún sistema roto ni abandonado.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 space-y-2">
      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Áreas que necesitan atención
      </p>
      <div className="flex flex-wrap gap-1.5">
        {onFire.map(({ area, diagnosis }) => (
          <span
            key={area.id}
            className="px-2 py-1 rounded-lg border text-[9px] font-bold bg-background/70"
          >
            {diagnosis.icon} {area.label}
            <span className="text-muted-foreground font-medium"> · {diagnosis.short}</span>
          </span>
        ))}
      </div>
    </div>
  );
}