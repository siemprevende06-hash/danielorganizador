import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { coverKey } from "@/hooks/useAreaCovers";
import { systemActualMinutes, type SystemSpeed } from "@/lib/daySystems";
import {
  AREA_SYSTEMS,
  DIAGNOSIS_TONE,
  diagnoseArea,
  GROUP_CONFIG,
  type AreaDiagnosis,
  type HabitMeta,
} from "@/lib/areaSystemsMap";
import type { PointBArea } from "@/lib/definitions";
import type { AreaScore } from "@/hooks/useAreaScores";
import type { SystemStreak } from "@/hooks/useSystemStreaks";
import type { TodayStripItem, TodayTaskItem } from "@/hooks/useTodayFocusItems";
import { cn } from "@/lib/utils";
import HabitSystemCard from "./HabitSystemCard";
import { OrganizacionCard } from "./OrganizacionCard";
import { TareasGeneralesCard } from "./TareasGeneralesCard";

export interface AreaInteraction {
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  countData?: Record<string, number>;
  waterData?: Record<string, boolean>;
  mealPhotos?: Record<string, string>;
  skipped?: Record<string, boolean>;
  wakeTime?: string;
  sleepTime?: string;
  workoutDuration?: number;
  workoutIntensity?: string;
  streaks?: Record<string, SystemStreak>;
  metaMinutesById: Record<string, number>;
  sparks?: Record<string, number[]>;
  weekTotals?: Record<string, number>;
  todayItems?: Record<string, TodayStripItem>;
  generalTasks?: { planned: TodayTaskItem[]; doneCount: number; totalCount: number };
  onToggleGeneralTask?: (id: string, done: boolean) => void;
  subStats?: Record<string, { consistency: number; minutes: number }>;
  getSpeed: (id: string) => SystemSpeed;
  setSpeed: (id: string, s: SystemSpeed) => void;
  covers: Record<string, string>;
  onToggle: (id: string) => void;
  onTimeChange: (id: string, minutes: number) => void;
  onCountChange?: (id: string, count: number) => void;
  onWaterToggle?: (id: string) => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onSkipToggle?: (id: string) => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
}

interface AreaSystemCardProps {
  area: PointBArea;
  score?: AreaScore;
  trackables: HabitMeta[];
  interaction: AreaInteraction;
}

function DiagnosisBadge({ diagnosis }: { diagnosis: AreaDiagnosis }) {
  const tone = DIAGNOSIS_TONE[diagnosis.tone];
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold", tone.bg, tone.border, tone.text)}>
      <span className="text-xs">{diagnosis.icon}</span>
      {diagnosis.short}
    </div>
  );
}

export default function AreaSystemCard({ area, score, trackables, interaction }: AreaSystemCardProps) {
  const config = AREA_SYSTEMS[area.id];
  const group = GROUP_CONFIG[area.group as keyof typeof GROUP_CONFIG] ?? GROUP_CONFIG.construccion;
  const coverUrl = interaction.covers[coverKey("area", area.id)] ?? null;

  const diagnosis = score ? diagnoseArea(score.esfuerzo, score.resultados) : diagnoseArea(0, 0);
  const tone = DIAGNOSIS_TONE[diagnosis.tone];

  const doneCount = trackables.filter(t => interaction.completions[t.id]).length;
  const trackableMinutes = trackables.reduce((sum, t) => {
    const actual = t.system
      ? systemActualMinutes(t.system, { timeData: interaction.timeData })
      : (interaction.timeData[t.id] ?? 0);
    return sum + actual;
  }, 0);

  const ordered = useMemo(() => {
    const idsOrder = config?.habitOrder;
    if (!idsOrder || idsOrder.length === 0) return trackables;
    const byId = new Map(trackables.map(t => [t.id, t]));
    const first = idsOrder.filter(id => byId.has(id)).map(id => byId.get(id)!);
    const restTrack = trackables.filter(t => !idsOrder.includes(t.id));
    return [...first, ...restTrack];
  }, [trackables, config]);

  const splitAt = config?.fullWidthFromIndex ?? 0;
  const topRow = splitAt > 0 ? ordered.slice(0, splitAt) : [];
  const rest = splitAt > 0 ? ordered.slice(splitAt) : ordered;

  const renderHabit = (meta: HabitMeta) => {
    const sys = meta.system;
    const actual = sys
      ? systemActualMinutes(sys, { timeData: interaction.timeData })
      : (interaction.timeData[meta.id] ?? 0);
    const weekRaw = interaction.sparks?.[meta.id] ?? [];
    const weekTotal = (interaction.weekTotals?.[meta.id] ?? 0) + Math.max(0, actual - (weekRaw[6] ?? 0));
    const spark = weekRaw.length === 7 ? [...weekRaw.slice(0, 6), actual] : weekRaw;
    return (
      <HabitSystemCard
        key={meta.id}
        meta={meta}
        done={!!interaction.completions[meta.id]}
        isSkipped={!!interaction.skipped?.[meta.id]}
        actualMinutes={actual}
        metaMinutes={interaction.metaMinutesById[meta.id] ?? 0}
        count={sys?.countKey ? interaction.countData?.[sys.countKey] ?? 0 : undefined}
        speed={interaction.getSpeed(meta.id)}
        spark={spark}
        weekTotal={weekTotal}
        today={interaction.todayItems?.[meta.id]}
        waterDone={!!interaction.waterData?.[meta.id]}
        mealUrl={interaction.mealPhotos?.[meta.id]}
        wakeTime={interaction.wakeTime}
        sleepTime={interaction.sleepTime}
        workoutDuration={interaction.workoutDuration}
        workoutIntensity={interaction.workoutIntensity}
        streak={interaction.streaks?.[meta.id]}
        coverUrl={
          interaction.covers[coverKey(meta.cover?.type ?? "area", meta.cover?.id ?? meta.id)] ??
          coverUrl
        }
        onToggle={() => interaction.onToggle(meta.id)}
        onSkip={() => interaction.onSkipToggle?.(meta.id)}
        onWater={() => interaction.onWaterToggle?.(meta.id)}
        onMealPhotoUpload={interaction.onMealPhotoUpload}
        onTimeChange={(v) => interaction.onTimeChange(meta.id, v)}
        onCountChange={
          sys?.countKey ? (v) => interaction.onCountChange?.(sys.countKey!, v) : undefined
        }
        onSpeedChange={(s) => interaction.setSpeed(meta.id, s)}
        onWorkoutDurationChange={interaction.onWorkoutDurationChange}
        onWorkoutIntensityChange={interaction.onWorkoutIntensityChange}
        onWakeTimeChange={interaction.onWakeTimeChange}
        onSleepTimeChange={interaction.onSleepTimeChange}
      />
    );
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-border/40 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative bg-gradient-to-br border border-border/40">
            {coverUrl ? (
              <img src={coverUrl} alt={area.label} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-lg">{area.icon}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{area.label}</h3>
            <p className="text-[9px] text-muted-foreground truncate">{config?.vision}</p>
          </div>
          <DiagnosisBadge diagnosis={diagnosis} />
          <Link
            to={`/sistemas/${area.id}`}
            className="size-8 shrink-0 grid place-items-center rounded-lg bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
            title="Ver página completa · esfuerzo, resultados y objetivos"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="rounded-lg bg-foreground/5 px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Esfuerzo (30d)</span>
              <span className="font-bold">{score?.esfuerzo ?? 0}%</span>
            </div>
            <Progress value={Math.min(100, score?.esfuerzo ?? 0)} className="h-1" indicatorClassName="bg-blue-500" />
          </div>
          <div className="rounded-lg bg-foreground/5 px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Resultado (Punto B)</span>
              <span className="font-bold">{score?.resultados ?? 0}%</span>
            </div>
            <Progress value={Math.min(100, score?.resultados ?? 0)} className="h-1" indicatorClassName={group.bar} />
          </div>
        </div>

        <p className={cn("text-[9px] leading-relaxed", tone.text)}>
          {diagnosis.message}
        </p>
      </div>

      <div className="p-3 space-y-4">
        {config?.promise && (
          <p className="text-[10px] leading-relaxed text-muted-foreground bg-foreground/5 rounded-lg px-2.5 py-2">
            <span className="font-bold text-foreground">🎯 El sistema </span>
            {config.promise}
          </p>
        )}

        {trackables.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sistema diario
              </h4>
              <span className={cn("text-[9px] font-medium", doneCount === trackables.length ? "text-emerald-500" : "text-muted-foreground")}>
                {doneCount}/{trackables.length}
              </span>
              {trackableMinutes > 0 && (
                <span className="text-[9px] text-muted-foreground ml-auto">{trackableMinutes} min hoy</span>
              )}
            </div>
            {config?.habitSections ? (
              <div className="space-y-3">
                {config.habitSections.map(sec => {
                  const secHabits = trackables.filter(t => sec.habitIds.includes(t.id));
                  if (secHabits.length === 0) return null;
                  const secDone = secHabits.filter(t => interaction.completions[t.id]).length;
                  return (
                    <div key={sec.id} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {sec.emoji && <span className="mr-1">{sec.emoji}</span>}
                          {sec.title}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-medium",
                            secDone === secHabits.length ? "text-emerald-500" : "text-muted-foreground"
                          )}
                        >
                          {secDone}/{secHabits.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {secHabits.map(renderHabit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : topRow.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {topRow.map(renderHabit)}
                </div>
                {rest.map(m => (
                  <div key={m.id} className="grid grid-cols-1 gap-2">
                    {renderHabit(m)}
                  </div>
                ))}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ordered.map(renderHabit)}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl border p-3 text-[10px] leading-relaxed",
              tone.border,
              tone.bg,
              tone.text
            )}
          >
            <span className="font-bold">{diagnosis.icon} Sistema conectado: </span>
            {config?.systemNote ?? "Esta área se nutre de sistemas conectados. Cumple su sistema para que dé resultados."}
          </div>
        )}

        {config?.specialSections?.includes("organizacion") && (
          <OrganizacionCard
            completions={interaction.completions}
            onToggle={interaction.onToggle}
          />
        )}

        {config?.specialSections?.includes("tareas-generales") && interaction.generalTasks && (
          <TareasGeneralesCard
            data={interaction.generalTasks}
            onToggleTask={(id, done) => interaction.onToggleGeneralTask?.(id, done)}
          />
        )}
      </div>
    </Card>
  );
}