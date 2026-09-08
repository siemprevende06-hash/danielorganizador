import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import {
  DAY_SYSTEMS,
  SOSTEN_AREAS,
  systemActualMinutes,
  type DaySystem,
  type DaySystemArea,
  type SostenHabit,
  type SostenSubarea,
  type SpeedOption,
} from "@/lib/daySystems";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Trophy, Zap, Sun, Shield, Sparkles, Clock, Gauge, Droplets, Camera, ExternalLink, Dumbbell, Moon } from "lucide-react";

const AREA_ICONS: Record<string, React.ReactNode> = {
  "prof-acad": <Zap className="h-3.5 w-3.5" />,
  desarrollo: <Sparkles className="h-3.5 w-3.5" />,
  finanzas: <Gauge className="h-3.5 w-3.5" />,
  salud: <Sun className="h-3.5 w-3.5" />,
  "fuerza-mental": <Sparkles className="h-3.5 w-3.5" />,
  apariencia: <Sparkles className="h-3.5 w-3.5" />,
};

type TierKey = "red" | "grey" | "blue" | "green" | "gold";

interface Tier {
  key: TierKey;
  label: string;
  border: string;
  bg: string;
  bar: string;
  text: string;
  hex: string;
}

const TIERS: Record<TierKey, Tier> = {
  red: {
    key: "red",
    label: "No hice",
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    bar: "bg-red-500",
    text: "text-red-500",
    hex: "#ef4444",
  },
  grey: {
    key: "grey",
    label: "Sin datos",
    border: "border-border/40",
    bg: "bg-white/80 dark:bg-zinc-950/80",
    bar: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    hex: "#64748b",
  },
  blue: {
    key: "blue",
    label: "Mínimo",
    border: "border-blue-500/50",
    bg: "bg-blue-500/5",
    bar: "bg-blue-500",
    text: "text-blue-500",
    hex: "#3b82f6",
  },
  green: {
    key: "green",
    label: "Máximo",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/5",
    bar: "bg-emerald-500",
    text: "text-emerald-500",
    hex: "#10b981",
  },
  gold: {
    key: "gold",
    label: "Extra",
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    bar: "bg-amber-500",
    text: "text-amber-500",
    hex: "#f59e0b",
  },
};

function getTier(actual: number, skipped: boolean, meta: number, speedOptions: SpeedOption[]): Tier {
  if (skipped) return TIERS.red;
  const baseMin = speedOptions.find(o => o.id === "minimo")?.minutes ?? 0;
  const extra = speedOptions.find(o => o.id === "extra")?.minutes ?? 0;
  if (actual <= 0) return TIERS.grey;
  if (extra > 0 && actual >= extra) return TIERS.gold;
  // La velocidad elegida (mín/máx/extra) actúa como tiempo máximo del sistema
  if (meta > 0 && actual >= meta) return TIERS.green;
  if (baseMin > 0 && actual >= baseMin) return TIERS.blue;
  return TIERS.grey;
}

function SystemCover({ type, id, name, emoji, fallbackUrl }: { type: "area" | "sub"; id: string; name: string; emoji?: string; fallbackUrl?: string | null }) {
  const { covers } = useAreaCovers();
  const url = covers[coverKey(type, id)] ?? fallbackUrl ?? null;
  return (
    <div className={cn("relative bg-gradient-to-br overflow-hidden", getCoverGradient(id))}>
      {url ? (
        <img src={url} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-lg drop-shadow-sm">{emoji || "🖼️"}</span>
        </div>
      )}
    </div>
  );
}

function CentralSystemCard({
  system,
  completed,
  skipped,
  actualMinutes,
  meta,
  count,
  streakLabel,
  streak,
  onToggle,
  onTimeChange,
  onCountChange,
  areaCoverUrl,
}: {
  system: DaySystem;
  completed: boolean;
  skipped: boolean;
  actualMinutes: number;
  meta: number;
  count?: number;
  streakLabel?: string;
  streak?: { current: number; best: number };
  onToggle: () => void;
  onTimeChange: (minutes: number) => void;
  onCountChange?: (count: number) => void;
}) {
  const tier = getTier(actualMinutes, skipped, meta, system.speedOptions);
  const pct = meta > 0 ? Math.round((actualMinutes / meta) * 100) : 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border transition-all hover:shadow-md group flex flex-col",
        tier.border,
        tier.bg
      )}
    >
      <div className="h-16 w-full shrink-0">
        <SystemCover type={system.cover.type} id={system.cover.id} name={system.name} />
      </div>
      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          <Checkbox
            checked={completed || actualMinutes >= meta}
            onCheckedChange={onToggle}
            className="h-4 w-4 data-[state=checked]:bg-primary"
          />
          <span className={cn("text-xs font-semibold truncate", (completed || actualMinutes >= meta) && "line-through text-muted-foreground")}>
            {system.name}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <Clock className={cn("h-3 w-3 shrink-0", tier.text)} />
            <Input
              type="number"
              min={0}
              value={actualMinutes || ""}
              onChange={e => onTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="min"
              className={cn("h-6 w-16 text-center text-[10px] px-1", tier.text)}
            />
          </div>
          {system.countKey && (
            <div className="flex items-center gap-1 min-w-0">
              <Input
                type="number"
                min={0}
                value={count || ""}
                onChange={e => onCountChange?.(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="partidas"
                className="h-6 w-16 text-center text-[10px] px-1 text-indigo-600 dark:text-indigo-400"
              />
            </div>
          )}
          <span className="text-[9px] text-muted-foreground shrink-0">
            <span className="font-mono font-semibold text-foreground">{meta}</span> min
          </span>
        </div>

        <Progress
          value={Math.min(100, pct)}
          className="h-1.5"
          indicatorClassName={tier.bar}
        />

        <div className="flex items-center justify-between gap-1 text-[9px]">
          <span className={cn("font-medium flex items-center gap-1", tier.text)}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tier.hex }}
            />
            {tier.label}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {streakLabel && (
              <span className={cn("font-medium flex items-center gap-0.5", streakLabel.startsWith("🔥") ? "text-orange-500" : "text-yellow-600")}>
                {streakLabel}
              </span>
            )}
            {streak && (streak.current > 0 || streak.best > 0) && (
              <span className="flex items-center gap-1">
                {streak.current > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500">
                    <Flame className="h-2.5 w-2.5" />
                    {streak.current}
                  </span>
                )}
                {streak.best > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-600">
                    <Trophy className="h-2.5 w-2.5" />
                    {streak.best}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DaySystemsSection({
  completions,
  timeData,
  workoutDuration,
  onToggle,
  onTimeChange,
  skipped,
  streaks,
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
  const { getMinutes } = useSystemSpeed();
  const covers = useAreaCovers();

  const centralAreas = useMemo(() => DAY_SYSTEMS.filter(a => a.kind === "central"), []);
  const structuralAreas = useMemo(() => DAY_SYSTEMS.filter(a => a.kind === "estructural"), []);

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Áreas Centrales
        </h2>
        {centralAreas.map(area => (
          <AreaGroup
            key={area.id}
            area={area}
            completions={completions}
            timeData={timeData}
            onToggle={onToggle}
            onTimeChange={onTimeChange}
            skipped={skipped}
            getMinutes={getMinutes}
            covers={covers}
            streaks={streaks}
            countData={countData}
            onCountChange={onCountChange}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-blue-500" /> Áreas Estructurales
        </h2>
        {structuralAreas.map(area => (
          <EstructuralAreaCard
            key={area.id}
            area={area}
            completions={completions}
            skipped={skipped}
            timeData={timeData}
            onToggle={onToggle}
            onTimeChange={onTimeChange}
            onSkipToggle={onSkipToggle}
            covers={covers}
            waterData={waterData}
            onWaterToggle={onWaterToggle}
            mealPhotos={mealPhotos}
            onMealPhotoUpload={onMealPhotoUpload}
            wakeTime={wakeTime}
            sleepTime={sleepTime}
            onWakeTimeChange={onWakeTimeChange}
            onSleepTimeChange={onSleepTimeChange}
            workoutDuration={workoutDuration}
            workoutIntensity={workoutIntensity}
            onWorkoutDurationChange={onWorkoutDurationChange}
            onWorkoutIntensityChange={onWorkoutIntensityChange}
            streaks={streaks}
          />
        ))}
      </div>
    </div>
  );
}

function AreaGroup({
  area,
  completions,
  timeData,
  onToggle,
  onTimeChange,
  skipped,
  getMinutes,
  covers,
  streaks,
  countData,
  onCountChange,
}: {
  area: DaySystemArea;
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  onToggle: (id: string) => void;
  onTimeChange: (id: string, minutes: number) => void;
  skipped?: Record<string, boolean>;
  getMinutes: (sysId: string) => number;
  covers: ReturnType<typeof useAreaCovers>;
  streaks?: Record<string, { current: number; best: number }>;
  countData?: Record<string, number>;
  onCountChange?: (id: string, count: number) => void;
}) {
  const coverUrl = covers.covers[coverKey(area.cover.type, area.cover.id)] ?? null;
  const done = !!completions[area.id];

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-border/40 flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative bg-gradient-to-br border border-border/40">
          {coverUrl ? (
            <img src={coverUrl} alt={area.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-lg">{AREA_ICONS[area.id]}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{area.name}</h3>
          <p className="text-[9px] text-muted-foreground">
            {area.kind === "central" ? `${area.systems.length} sistemas del día` : "Desde Sostén"}
          </p>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {area.systems.map(sys => {
            const meta = getMinutes(sys.id);
            const actual = systemActualMinutes(sys, { timeData });
            const isDone = !!completions[sys.id];
            const isSkipped = !!skipped?.[sys.id];
            const streak = streaks?.[sys.id];
            const count = sys.countKey ? countData?.[sys.countKey] ?? 0 : undefined;
            const streakLabel =
              sys.streakMinutes > 0
                ? sys.streakMinutes === 30
                  ? "🏆30'"
                  : "🔥5'"
                : undefined;
            return (
              <CentralSystemCard
                key={sys.id}
                system={sys}
                completed={isDone}
                skipped={isSkipped}
                actualMinutes={actual}
                meta={meta}
                count={count}
                streakLabel={streakLabel}
                onToggle={() => onToggle(sys.id)}
                onTimeChange={v => onTimeChange(sys.id, v)}
                onCountChange={sys.countKey ? (v => onCountChange?.(sys.countKey!, v)) : undefined}
                streak={streak}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface EstructuralProps {
  area: DaySystemArea;
  completions: Record<string, boolean>;
  skipped?: Record<string, boolean>;
  timeData: Record<string, number>;
  onToggle: (id: string) => void;
  onTimeChange?: (id: string, minutes: number) => void;
  onSkipToggle?: (id: string) => void;
  covers: ReturnType<typeof useAreaCovers>;
  waterData?: Record<string, boolean>;
  onWaterToggle?: (id: string) => void;
  mealPhotos?: Record<string, string>;
  onMealPhotoUpload?: (id: string, url: string) => void;
  wakeTime?: string;
  sleepTime?: string;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  workoutDuration?: number;
  workoutIntensity?: string;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  streaks?: Record<string, { current: number; best: number }>;
}

function EstructuralAreaCard({
  area,
  completions,
  skipped,
  timeData,
  onToggle,
  onTimeChange,
  onSkipToggle,
  covers,
  waterData,
  onWaterToggle,
  mealPhotos,
  onMealPhotoUpload,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  workoutDuration,
  workoutIntensity,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  streaks,
}: EstructuralProps) {
  const areaDef = SOSTEN_AREAS.find(a => a.id === area.id);
  const coverUrl = covers.covers[coverKey(area.cover.type, area.cover.id)] ?? null;
  const allHabits = areaDef?.subareas.flatMap(s => s.habits) ?? [];
  const doneCount = allHabits.filter(h => completions[h.id]).length;
  const pct = allHabits.length > 0 ? Math.round((doneCount / allHabits.length) * 100) : 0;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative bg-gradient-to-br border border-border/40">
            {coverUrl ? (
              <img src={coverUrl} alt={area.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-lg">{AREA_ICONS[area.id]}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{area.name}</h3>
            <p className="text-[9px] text-muted-foreground">
              {doneCount}/{allHabits.length} completados
            </p>
          </div>
          <Progress value={pct} className="w-16 h-1.5" indicatorClassName="bg-blue-500" />
        </div>
      </div>
      <CardContent className="p-3 space-y-4">
        {(areaDef?.subareas ?? []).map(subarea => (
          <SubareaBlock
            key={subarea.id}
            subarea={subarea}
            completions={completions}
            skipped={skipped}
            timeData={timeData}
            onToggle={onToggle}
            onTimeChange={onTimeChange}
            onSkipToggle={onSkipToggle}
            waterData={waterData}
            onWaterToggle={onWaterToggle}
            mealPhotos={mealPhotos}
            onMealPhotoUpload={onMealPhotoUpload}
            wakeTime={wakeTime}
            sleepTime={sleepTime}
            onWakeTimeChange={onWakeTimeChange}
            onSleepTimeChange={onSleepTimeChange}
            workoutDuration={workoutDuration}
            workoutIntensity={workoutIntensity}
            onWorkoutDurationChange={onWorkoutDurationChange}
            onWorkoutIntensityChange={onWorkoutIntensityChange}
            streaks={streaks}
            areaCoverUrl={coverUrl}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SubareaBlock({
  subarea,
  completions,
  skipped,
  timeData,
  onToggle,
  onTimeChange,
  onSkipToggle,
  waterData,
  onWaterToggle,
  mealPhotos,
  onMealPhotoUpload,
  wakeTime,
  sleepTime,
  onWakeTimeChange,
  onSleepTimeChange,
  workoutDuration,
  workoutIntensity,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  streaks,
  areaCoverUrl,
}: {
  subarea: SostenSubarea;
  completions: Record<string, boolean>;
  skipped?: Record<string, boolean>;
  timeData: Record<string, number>;
  onToggle: (id: string) => void;
  onTimeChange?: (id: string, minutes: number) => void;
  onSkipToggle?: (id: string) => void;
  waterData?: Record<string, boolean>;
  onWaterToggle?: (id: string) => void;
  mealPhotos?: Record<string, string>;
  onMealPhotoUpload?: (id: string, url: string) => void;
  wakeTime?: string;
  sleepTime?: string;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  workoutDuration?: number;
  workoutIntensity?: string;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  streaks?: Record<string, { current: number; best: number }>;
  areaCoverUrl?: string | null;
}) {
  const doneCount = subarea.habits.filter(h => completions[h.id]).length;

  return (
    <div key={subarea.id} className="space-y-2">
      <div className="flex items-center gap-1.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>{subarea.emoji}</span> {subarea.title}
        </h4>
        <span className={cn("text-[9px] font-medium", doneCount === subarea.habits.length ? "text-emerald-500" : "text-muted-foreground")}>
          {doneCount}/{subarea.habits.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {subarea.habits.map(habit => (
          <EstructuralHabitCard
            key={habit.id}
            habit={habit}
            coverId={subarea.id}
            done={!!completions[habit.id]}
            isSkipped={!!skipped?.[habit.id]}
            timeValue={timeData[habit.id] || 0}
            hasTime={!!habit.hasTime}
            hasWater={!!habit.hasWater}
            waterDone={!!waterData?.[habit.id]}
            mealUrl={mealPhotos?.[habit.id]}
            hasWorkout={!!habit.isWorkout}
            workoutDuration={workoutDuration}
            workoutIntensity={workoutIntensity}
            hasSleep={!!habit.isSleepSchedule}
            wakeTime={wakeTime}
            sleepTime={sleepTime}
            streak={streaks?.[habit.id]}
            areaCoverUrl={areaCoverUrl}
            onToggle={() => onToggle(habit.id)}
            onSkip={() => onSkipToggle?.(habit.id)}
            onWater={() => onWaterToggle?.(habit.id)}
            onMealPhotoUpload={onMealPhotoUpload}
            onTimeChange={v => onTimeChange?.(habit.id, v)}
            onWorkoutDurationChange={onWorkoutDurationChange}
            onWorkoutIntensityChange={onWorkoutIntensityChange}
            onWakeTimeChange={onWakeTimeChange}
            onSleepTimeChange={onSleepTimeChange}
          />
        ))}
      </div>
    </div>
  );
}

function EstructuralHabitCard({
  habit,
  coverId,
  done,
  isSkipped,
  hasTime,
  timeValue,
  hasWater,
  waterDone,
  mealUrl,
  hasWorkout,
  workoutDuration,
  workoutIntensity,
  hasSleep,
  wakeTime,
  sleepTime,
  streak,
  areaCoverUrl,
  onToggle,
  onSkip,
  onWater,
  onMealPhotoUpload,
  onTimeChange,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  onWakeTimeChange,
  onSleepTimeChange,
}: {
  habit: SostenHabit;
  coverId: string;
  done: boolean;
  isSkipped: boolean;
  hasTime: boolean;
  timeValue: number;
  hasWater: boolean;
  waterDone: boolean;
  mealUrl?: string;
  hasWorkout: boolean;
  workoutDuration?: number;
  workoutIntensity?: string;
  hasSleep: boolean;
  wakeTime?: string;
  sleepTime?: string;
  streak?: { current: number; best: number };
  areaCoverUrl?: string | null;
  onToggle: () => void;
  onSkip: () => void;
  onWater: () => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onTimeChange?: (v: number) => void;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (file: File) => {
    if (!onMealPhotoUpload) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `meals/${Date.now()}_${habit.id}.${ext}`;
      const { error } = await supabase.storage.from("user-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-images").getPublicUrl(path);
      onMealPhotoUpload(habit.id, urlData.publicUrl);
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir foto");
    }
  };

  const border = done
    ? "border-emerald-500/40 bg-emerald-500/5"
    : isSkipped
    ? "border-red-500/40 bg-red-500/5"
    : "border-border/60 bg-background/40";

  return (
    <div className={cn("relative rounded-xl overflow-hidden border transition-all hover:shadow-sm flex flex-col", border)}>
      <div className={cn("h-12 w-full shrink-0 relative bg-gradient-to-br overflow-hidden", getCoverGradient(coverId))}>
        {areaCoverUrl ? (
          <img src={areaCoverUrl} alt={habit.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-lg drop-shadow-sm">{habit.emoji}</span>
          </div>
        )}
      </div>
      <div className="p-2 space-y-1.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 flex-1">
          <Checkbox
            checked={done}
            onCheckedChange={onToggle}
            className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-primary"
          />
          <div className="min-w-0 flex-1">
            <span className={cn("text-[10px] font-semibold block leading-tight", done && "line-through text-muted-foreground")}>
              {habit.name}
            </span>
            {(streak && (streak.current > 0 || streak.best > 0)) && (
              <span className="flex items-center gap-1 text-[9px]">
                {streak.current > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" />{streak.current}</span>}
                {streak.best > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Trophy className="h-2 w-2" />{streak.best}</span>}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasTime && (
            <div className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                value={timeValue || ""}
                onChange={e => onTimeChange?.(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="min"
                className="h-5 w-14 text-[9px] text-center px-1"
              />
            </div>
          )}
          {hasWater && (
            <button
              onClick={onWater}
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-colors",
                waterDone ? "bg-blue-500/20 text-blue-500" : "bg-muted text-muted-foreground"
              )}
            >
              <Droplets className="h-2.5 w-2.5" /> 300ml
            </button>
          )}
          {habit.hasMealPhoto && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={el => { fileRef.current = el; }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-colors",
                  mealUrl ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                )}
              >
                <Camera className="h-2.5 w-2.5" /> {mealUrl ? "✓" : "Foto"}
              </button>
            </>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              {isSkipped ? "Hecho" : "Saltar"}
            </button>
          )}
          {habit.linkTo && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(habit.linkTo!); }}
              className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" /> Ver
            </button>
          )}
        </div>
      </div>

      {mealUrl && (
        <div className="px-2 pb-2">
          <img src={mealUrl} alt={habit.name} className="w-16 h-16 rounded-lg object-cover border" />
        </div>
      )}

      {hasWorkout && (
        <div className="px-2 pb-2 flex items-center gap-1.5 text-[9px]">
          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
          <Input
            type="number"
            min={0}
            value={workoutDuration || ""}
            onChange={e => onWorkoutDurationChange?.(parseInt(e.target.value) || 0)}
            placeholder="min"
            className="h-5 w-14 text-[9px] text-center px-1"
          />
          <select
            value={workoutIntensity || "moderate"}
            onChange={e => onWorkoutIntensityChange?.(e.target.value)}
            className="h-5 text-[9px] rounded-md border bg-background px-1"
          >
            <option value="light">Baja</option>
            <option value="moderate">Media</option>
            <option value="high">Alta</option>
            <option value="extreme">Extrema</option>
          </select>
        </div>
      )}

      {hasSleep && (
        <div className="px-2 pb-2 space-y-1 text-[9px]">
          <div className="flex items-center gap-1">
            <Sun className="h-2.5 w-2.5 text-amber-500" />
            <Input type="time" value={wakeTime || ""} onChange={e => onWakeTimeChange?.(e.target.value)} className="h-5 w-20 text-[9px]" />
          </div>
          <div className="flex items-center gap-1">
            <Moon className="h-2.5 w-2.5 text-indigo-500" />
            <Input type="time" value={sleepTime || ""} onChange={e => onSleepTimeChange?.(e.target.value)} className="h-5 w-20 text-[9px]" />
          </div>
        </div>
      )}
    </div>
  );
}