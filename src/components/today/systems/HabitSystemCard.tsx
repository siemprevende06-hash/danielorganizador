import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { systemSpeedOptions, type SpeedOption, type SystemSpeed } from "@/lib/daySystems";
import type { HabitMeta } from "@/lib/areaSystemsMap";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Droplets, Camera, ExternalLink, Sun, Moon, Flame, Trophy } from "lucide-react";

type TierKey = "red" | "grey" | "blue" | "green" | "gold";

interface Tier {
  key: TierKey;
  label: string;
  border: string;
  bg: string;
  bar: string;
  text: string;
  ring: string;
  dot: string;
}

const TIERS: Record<TierKey, Tier> = {
  red: { key: "red", label: "No hice", border: "border-red-500/50", bg: "bg-red-500/5", bar: "bg-red-500", text: "text-red-500", ring: "ring-red-500/50", dot: "bg-red-500" },
  grey: { key: "grey", label: "Sin datos", border: "border-border/40", bg: "bg-white/80 dark:bg-zinc-950/80", bar: "bg-muted-foreground/40", text: "text-muted-foreground", ring: "ring-border/40", dot: "bg-gray-400" },
  blue: { key: "blue", label: "Mínimo", border: "border-blue-500/50", bg: "bg-blue-500/5", bar: "bg-blue-500", text: "text-blue-500", ring: "ring-blue-500/50", dot: "bg-blue-500" },
  green: { key: "green", label: "Máximo", border: "border-emerald-500/50", bg: "bg-emerald-500/5", bar: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/50", dot: "bg-emerald-500" },
  gold: { key: "gold", label: "Extra", border: "border-amber-500/50", bg: "bg-amber-500/5", bar: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/60", dot: "bg-amber-400" },
};

function getTier(actual: number, skipped: boolean, meta: number, speedOptions: SpeedOption[]): Tier {
  if (skipped) return TIERS.red;
  const baseMin = speedOptions.find(o => o.id === "minimo")?.minutes ?? 0;
  const extra = speedOptions.find(o => o.id === "extra")?.minutes ?? 0;
  if (actual <= 0) return TIERS.grey;
  if (extra > 0 && actual >= extra) return TIERS.gold;
  if (meta > 0 && actual >= meta) return TIERS.green;
  if (baseMin > 0 && actual >= baseMin) return TIERS.blue;
  return TIERS.grey;
}

const SPEED_STYLE: Record<SystemSpeed, { active: string }> = {
  minimo: { active: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30" },
  maximo: { active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  extra: { active: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  racha: { active: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
};

export interface HabitSystemCardProps {
  meta: HabitMeta;
  done: boolean;
  isSkipped: boolean;
  actualMinutes: number;
  metaMinutes: number;
  count?: number;
  speed?: SystemSpeed;
  waterDone: boolean;
  mealUrl?: string;
  wakeTime?: string;
  sleepTime?: string;
  workoutDuration?: number;
  workoutIntensity?: string;
  streak?: { current: number; best: number };
  coverUrl?: string | null;
  onToggle: () => void;
  onSkip: () => void;
  onWater: () => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onTimeChange: (v: number) => void;
  onCountChange?: (v: number) => void;
  onSpeedChange?: (s: SystemSpeed) => void;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
}

export default function HabitSystemCard({
  meta,
  done,
  isSkipped,
  actualMinutes,
  metaMinutes,
  count,
  speed,
  waterDone,
  mealUrl,
  wakeTime,
  sleepTime,
  workoutDuration,
  workoutIntensity,
  streak,
  coverUrl,
  onToggle,
  onSkip,
  onWater,
  onMealPhotoUpload,
  onTimeChange,
  onCountChange,
  onSpeedChange,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  onWakeTimeChange,
  onSleepTimeChange,
}: HabitSystemCardProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isSystem = !!meta.system;
  const speedOptions = isSystem ? systemSpeedOptions(meta.system!) : [];
  const tier = isSystem ? getTier(actualMinutes, isSkipped, metaMinutes, speedOptions) : null;

  const cardStyle = isSystem
    ? cn("ring-2", tier!.ring, tier!.bg)
    : done
    ? "border border-emerald-500/40 bg-emerald-500/5"
    : isSkipped
    ? "border border-red-500/40 bg-red-500/5"
    : "border border-border/60 bg-background/40";

  const pct = metaMinutes > 0 ? Math.round((actualMinutes / metaMinutes) * 100) : 0;

  const handlePhotoUpload = async (file: File) => {
    if (!onMealPhotoUpload) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `meals/${Date.now()}_${meta.id}.${ext}`;
      const { error } = await supabase.storage.from("user-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-images").getPublicUrl(path);
      onMealPhotoUpload(meta.id, urlData.publicUrl);
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir foto");
    }
  };

  const coverId = meta.cover?.id ?? meta.id;

  return (
    <div className={cn("relative rounded-xl overflow-hidden transition-all hover:shadow-sm flex flex-col", cardStyle)}>
      <div className={cn("h-14 w-full shrink-0 relative bg-gradient-to-br overflow-hidden", getCoverGradient(coverId))}>
        {coverUrl ? (
          <img src={coverUrl} alt={meta.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xl drop-shadow-sm">{meta.emoji}</span>
          </div>
        )}
        {isSystem && tier && (
          <span className={cn("absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900", tier.dot)} />
        )}
      </div>

      <div className="p-2 space-y-1.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 flex-1">
          <Checkbox
            checked={done || (isSystem && metaMinutes > 0 && actualMinutes >= metaMinutes)}
            onCheckedChange={onToggle}
            className="h-3.5 w-3.5 shrink-0 data-[state=checked]:bg-primary"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className={cn("text-[10px] font-semibold block leading-tight truncate", done && "line-through text-muted-foreground")}>
                {meta.name}
              </span>
              {isSystem && tier && <span className={cn("text-[9px] font-semibold shrink-0", tier.text)}>{tier.label}</span>}
            </div>
            {(streak && (streak.current > 0 || streak.best > 0)) && (
              <span className="flex items-center gap-1.5 text-[9px]">
                {streak.current > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" />{streak.current}</span>}
                {streak.best > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Trophy className="h-2 w-2" />{streak.best}</span>}
                {isSystem && meta.system!.streakMinutes > 0 && (
                  <span className="text-rose-400 font-semibold">🔥{meta.system!.streakMinutes}'</span>
                )}
              </span>
            )}
          </div>
        </div>

        {isSystem && speedOptions.length > 0 && onSpeedChange && (
          <div className="flex items-center gap-1 flex-wrap">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={actualMinutes || ""}
              onChange={e => onTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="min"
              className={cn("h-5 w-14 text-[9px] text-center px-1", tier?.text)}
            />
            <span className="text-[9px] text-muted-foreground">/ {metaMinutes}</span>
            {meta.system!.countKey && (
              <>
                <Input
                  type="number"
                  min={0}
                  value={count || ""}
                  onChange={e => onCountChange?.(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder={meta.system!.countLabel || "partidas"}
                  className="h-5 w-14 text-[9px] text-center px-1 text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-[9px] text-muted-foreground hidden sm:inline">{meta.system!.countLabel || "partidas"}</span>
              </>
            )}
            {meta.system!.speedOptions.length > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                {speedOptions.map(opt => {
                  const active = speed === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSpeedChange!(opt.id)}
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors border",
                        active ? SPEED_STYLE[opt.id].active : "bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isSystem && meta.hasTime && (
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={actualMinutes || ""}
              onChange={e => onTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="min"
              className="h-5 w-14 text-[9px] text-center px-1"
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          {meta.hasWater && (
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
          {meta.hasMealPhoto && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={el => { fileRef.current = el; }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                  e.target.value = "";
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
          {meta.linkTo && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(meta.linkTo!); }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" /> Ver
            </button>
          )}
          <div className="ml-auto" />
          <button
            onClick={onSkip}
            className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            {isSkipped ? "Hecho" : "Saltar"}
          </button>
        </div>

        {isSystem && metaMinutes > 0 && (
          <Progress value={Math.min(100, pct)} className="h-1.5 mt-auto" indicatorClassName={tier!.bar} />
        )}
      </div>

      {mealUrl && (
        <div className="px-2 pb-2">
          <img src={mealUrl} alt={meta.name} className="w-14 h-14 rounded-lg object-cover border" />
        </div>
      )}

      {meta.isWorkout && (
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

      {meta.isSleepSchedule && (
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