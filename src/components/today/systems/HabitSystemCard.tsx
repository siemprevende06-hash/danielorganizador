import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { systemSpeedOptions, type ChessResultKey, type SpeedOption, type SystemSpeed } from "@/lib/daySystems";
import type { HabitMeta } from "@/lib/areaSystemsMap";
import type { TodayStripItem } from "@/hooks/useTodayFocusItems";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useChessTracking } from "@/hooks/useChessTracking";
import { toast } from "sonner";
import { Clock, Droplets, Camera, ExternalLink, Sun, Moon, Flame, Trophy, Check } from "lucide-react";
import { ReadingPagesInline } from "./ReadingPagesInline";

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

const NS_DONE: Tier = { key: "green", label: "Hecho", border: "border-emerald-500/40", bg: "bg-emerald-500/5", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/40", dot: "bg-emerald-500" };
const NS_SKIP: Tier = { key: "red", label: "Saltado", border: "border-red-500/40", bg: "bg-red-500/5", bar: "bg-red-500", text: "text-red-500", ring: "ring-red-500/40", dot: "bg-red-500" };
const NS_IDLE: Tier = { key: "grey", label: "Sin hacer", border: "border-border/40", bg: "bg-white/50 dark:bg-zinc-950/50", bar: "bg-muted-foreground/40", text: "text-muted-foreground", ring: "ring-border/40", dot: "bg-gray-400" };

interface ChessDailyResultsInlineProps {
  games: number;
  wins: number;
  losses: number;
  onGamesChange: (value: number) => void;
  onResultChange: (result: ChessResultKey, value: number) => void;
}

function ChessDailyResultsInline({ games, wins, losses, onGamesChange, onResultChange }: ChessDailyResultsInlineProps) {
  const { stats, goals, loading } = useChessTracking();
  const readCount = (value: string) => Math.max(0, parseInt(value) || 0);

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-semibold">
        <span>ELO y resultados diarios</span>
        <span className="text-amber-600 dark:text-amber-400">+8 / −8 ELO</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">ELO actual</p>
          <p className="text-lg font-extrabold leading-none tabular-nums text-amber-600 dark:text-amber-400">
            {loading ? "—" : stats.currentElo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Objetivo</p>
          <p className="text-sm font-bold leading-none tabular-nums text-foreground">
            {loading || !goals ? "—" : stats.eloTarget}
          </p>
        </div>
      </div>
      {goals && !loading && (
        <Progress value={stats.eloProgress} className="h-1.5" indicatorClassName="bg-amber-500" />
      )}
      <div className="grid grid-cols-3 gap-1.5">
        <label className="space-y-0.5">
          <span className="text-[8px] text-muted-foreground">Partidas</span>
          <Input
            type="number"
            min={0}
            value={games || ""}
            onChange={event => onGamesChange(readCount(event.target.value))}
            placeholder="0"
            aria-label="Partidas de ajedrez"
            className="h-6 px-1 text-center text-[10px]"
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">Victorias</span>
          <Input
            type="number"
            min={0}
            value={wins || ""}
            onChange={event => onResultChange("wins", readCount(event.target.value))}
            placeholder="0"
            aria-label="Victorias de ajedrez"
            className="h-6 px-1 text-center text-[10px] text-emerald-600 dark:text-emerald-400"
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[8px] font-semibold text-red-500">Derrotas</span>
          <Input
            type="number"
            min={0}
            value={losses || ""}
            onChange={event => onResultChange("losses", readCount(event.target.value))}
            placeholder="0"
            aria-label="Derrotas de ajedrez"
            className="h-6 px-1 text-center text-[10px] text-red-500"
          />
        </label>
      </div>
    </div>
  );
}

export interface HabitSystemCardProps {
  meta: HabitMeta;
  done: boolean;
  isSkipped: boolean;
  actualMinutes: number;
  metaMinutes: number;
  count?: number;
  chessWins?: number;
  chessLosses?: number;
  speed?: SystemSpeed;
  waterDone: boolean;
  mealUrl?: string;
  wakeTime?: string;
  sleepTime?: string;
  workoutDuration?: number;
  workoutIntensity?: string;
  streak?: { current: number; best: number };
  coverUrl?: string | null;
  spark?: number[];
  weekTotal?: number;
  today?: TodayStripItem;
  onToggle: () => void;
  onSkip: () => void;
  onWater: () => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onTimeChange: (v: number) => void;
  onCountChange?: (v: number) => void;
  onChessResultChange?: (result: ChessResultKey, value: number) => void;
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
  chessWins,
  chessLosses,
  speed,
  waterDone,
  mealUrl,
  wakeTime,
  sleepTime,
  workoutDuration,
  workoutIntensity,
  streak,
  coverUrl,
  spark,
  weekTotal,
  today,
  onToggle,
  onSkip,
  onWater,
  onMealPhotoUpload,
  onTimeChange,
  onCountChange,
  onChessResultChange,
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
  const st = tier ?? (done ? NS_DONE : isSkipped ? NS_SKIP : NS_IDLE);

  const showMinutes = isSystem || meta.hasTime || meta.isWorkout;
  const pct = metaMinutes > 0 ? Math.round((actualMinutes / metaMinutes) * 100) : 0;
  const sparkMax = Math.max(1, metaMinutes, ...(spark ?? []));

  const todayEmoji =
    today && today.kind === "libro"
      ? "📖"
      : today && today.kind === "cancion"
        ? "🎹"
        : today && today.kind === "materia"
          ? "🎓"
          : today && today.kind === "emprendimiento"
            ? "🚀"
            : "📦";

  const todayTitle = today
    ? today.kind === "libro"
      ? today.title
      : today.kind === "cancion"
        ? today.title
        : today.name
    : "";

  const todayLabel = today
    ? today.kind === "libro"
      ? today.pagesTotal
        ? `${today.pagesRead}/${today.pagesTotal} págs`
        : `${today.pagesRead} págs`
      : today.kind === "cancion"
        ? `${today.instrument ? today.instrument + " · " : ""}${today.practiceMinutes ?? 0} min`
        : today.kind === "materia" || today.kind === "emprendimiento"
          ? `${today.doneTasks}/${today.totalTasks} tareas · ${today.blockCount} bloques hoy`
          : `${today.doneTasks}/${today.totalTasks} tareas esta semana`
    : "";

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
    <div className={cn("relative rounded-2xl overflow-hidden ring-2 transition-all hover:shadow-sm flex flex-col", st.ring, st.bg)}>
      <div className={cn("h-12 w-full shrink-0 relative bg-gradient-to-br overflow-hidden", getCoverGradient(coverId))}>
        {coverUrl ? (
          <img src={coverUrl} alt={meta.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xl drop-shadow-sm">{meta.emoji}</span>
          </div>
        )}
        <span className={cn("absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900", st.dot)} />
      </div>

      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        {/* Nombre + estado */}
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[11px] font-bold leading-tight truncate", done && "line-through text-muted-foreground")}>
            {meta.name}
          </span>
          <span className={cn("ml-auto text-[9px] font-bold shrink-0", st.text)}>{st.label}</span>
        </div>

        {/* Rachas */}
        {(streak && (streak.current > 0 || streak.best > 0)) && (
          <span className="flex items-center gap-1.5 text-[9px]">
            {streak.current > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" />{streak.current}</span>}
            {streak.best > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Trophy className="h-2 w-2" />{streak.best}</span>}
            {isSystem && meta.system!.streakMinutes > 0 && (
              <span className="text-rose-400 font-semibold">🔥{meta.system!.streakMinutes}'</span>
            )}
          </span>
        )}

        {/* Número grande al estilo "Mis Sistemas" */}
        {showMinutes && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tabular-nums">{actualMinutes}</span>
            <span className="text-[9px] text-muted-foreground">min</span>
            {metaMinutes > 0 && (
              <span className="text-[9px] text-muted-foreground ml-auto">/{metaMinutes}</span>
            )}
          </div>
        )}

        {showMinutes && metaMinutes > 0 && (
          <Progress value={Math.min(100, pct)} className="h-1.5" indicatorClassName={st.bar} />
        )}

        {/* Tendencia 7 días + total semana */}
        {showMinutes && spark && spark.length > 0 && (
          <>
            <div className="flex items-end gap-0.5 h-5 mb-0.5">
              {spark.map((v, i) => (
                <div
                  key={i}
                  className={cn("flex-1 rounded-sm", i === spark.length - 1 ? st.dot : "bg-muted-foreground/25")}
                  style={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
                />
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground">
              Semana: {weekTotal ?? 0} min{meta.system?.countKey ? ` · ${count ?? 0} ${meta.system.countLabel || "repeticiones"}` : ""}
            </p>
          </>
        )}

        {/* ─── Hoy me toca: ítem planificado del día ─── */}
        {today && (
          <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-2 py-1.5">
            {today.kind === "libro" && today.cover ? (
              <img
                src={today.cover}
                alt={today.title}
                className="h-8 w-6 rounded object-cover shrink-0 border border-border/40"
              />
            ) : (
              <span className="text-sm shrink-0 leading-none">{todayEmoji}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold leading-tight truncate">{todayTitle}</p>
              {todayLabel && (
                <p className="text-[8px] text-muted-foreground leading-tight truncate">{todayLabel}</p>
              )}
            </div>
          </div>
        )}

        {/* ─── Agregar datos ─── */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-bold transition-colors",
              done || (isSystem && metaMinutes > 0 && actualMinutes >= metaMinutes)
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            <Check className="h-3 w-3" /> Hecho
          </button>
          {isSystem && speedOptions.length > 0 && onSpeedChange && (
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
          <div className="ml-auto flex items-center gap-1">
            {showMinutes && (
              <>
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  value={actualMinutes || ""}
                  onChange={e => onTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="min"
                  className={cn("h-5 w-12 text-[9px] text-center px-1", st.text)}
                />
              </>
            )}
            {meta.system?.countKey && meta.id !== "ajedrez" && (
              <>
                <Input
                  type="number"
                  min={0}
                  value={count || ""}
                  onChange={e => onCountChange?.(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder={meta.system!.countLabel || "partidas"}
                  className="h-5 w-12 text-[9px] text-center px-1 text-indigo-600 dark:text-indigo-400"
                />
              </>
            )}
            <button
              onClick={onSkip}
              className="px-1.5 py-1 rounded-md text-[9px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title={isSkipped ? "Desmarcar salteado" : "Saltear hoy"}
            >
              {isSkipped ? "Volver" : "Saltar"}
            </button>
          </div>
        </div>

        {meta.id === "ajedrez" && (
          <ChessDailyResultsInline
            games={count ?? 0}
            wins={chessWins ?? 0}
            losses={chessLosses ?? 0}
            onGamesChange={value => onCountChange?.(value)}
            onResultChange={(result, value) => onChessResultChange?.(result, value)}
          />
        )}

        {/* Páginas leídas del libro activo (solo tarjeta de Lectura) */}
        {meta.id === "lectura" && (
          <ReadingPagesInline minutes={actualMinutes} onMinutesChange={onTimeChange} />
        )}

        {/* Acciones extra */}
        {(meta.hasWater || meta.hasMealPhoto || meta.linkTo) && (
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
          </div>
        )}

        {meta.isWorkout && (
          <div className="flex items-center gap-1.5 text-[9px]">
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
          <div className="space-y-1 text-[9px]">
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

      {mealUrl && (
        <div className="px-2.5 pb-2.5">
          <img src={mealUrl} alt={meta.name} className="w-14 h-14 rounded-lg object-cover border" />
        </div>
      )}
    </div>
  );
}