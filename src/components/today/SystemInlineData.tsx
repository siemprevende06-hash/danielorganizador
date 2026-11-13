import { useRef } from "react";
import { Camera, Clock, Droplets, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HABIT_META } from "@/lib/areaSystemsMap";
import { CHESS_COUNT_KEYS, type ChessResultKey } from "@/lib/daySystems";
import { GAME_COUNT_KEYS } from "@/lib/game";
import type { SystemsData } from "@/hooks/useSystemsTracking";
import { cn } from "@/lib/utils";

const readNumber = (value: string) => Math.max(0, parseInt(value) || 0);

const inputClass =
  "h-5 w-11 border-0 bg-transparent px-0 text-center text-[9px] font-bold tabular-nums shadow-none focus-visible:ring-0";

const chipClass =
  "inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-background/70 px-1 py-0.5";

export interface SystemInlineDataProps {
  systemId: string;
  systems: SystemsData;
  onTimeChange: (id: string, minutes: number) => void;
  onCountChange?: (id: string, count: number) => void;
  onChessResultChange?: (result: ChessResultKey, value: number) => void;
  onWaterToggle?: (id: string) => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onSkipToggle?: (id: string) => void;
  onRestToggle?: (id: string) => void;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  /** Fuerza el input de minutos en filas sin meta (ej. inglés/italiano). */
  showMinutes?: boolean;
  /** Minutos propios cuando no viven en `timeData` (ej. gym). */
  minutes?: number;
}

/**
 * Controles compactos de tracking dentro de una fila de sistema del Panel de
 * control. Replica lo que se puede registrar en la pestaña Sistemas: minutos,
 * contadores, agua, foto de comida, sueño, entreno y saltos/descansos.
 */
export function SystemInlineData({
  systemId,
  systems,
  onTimeChange,
  onCountChange,
  onChessResultChange,
  onWaterToggle,
  onMealPhotoUpload,
  onSkipToggle,
  onRestToggle,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  onWakeTimeChange,
  onSleepTimeChange,
  showMinutes,
  minutes,
}: SystemInlineDataProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const meta = HABIT_META[systemId];
  const system = meta?.system;
  const isGym = systemId === "gym" || systemId === "entrenamiento-fisico";
  const isChess = systemId === "ajedrez";
  const isGame = systemId === "game";
  const sleep = !!meta?.isSleepSchedule;
  const water = !!meta?.hasWater;
  const meal = !!meta?.hasMealPhoto;

  const showMinuteInput =
    !isGym && (showMinutes ?? (!!meta?.hasTime || !!system));
  const minuteValue =
    minutes ?? (isGym ? systems.workoutDuration || 0 : systems.timeData[systemId] || 0);
  const countKey = system?.countKey;
  const countValue = countKey
    ? systems.countData[countKey] || 0
    : systems.countData[systemId] || 0;
  const skipped = !!systems.skipped?.[systemId];
  const rest = !!systems.rest?.[systemId];
  const waterDone = !!systems.waterData?.[systemId];
  const mealUrl = systems.mealPhotos?.[systemId];

  const handlePhotoUpload = async (file: File) => {
    if (!onMealPhotoUpload) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `meals/${Date.now()}_${systemId}.${ext}`;
      const { error } = await supabase.storage.from("user-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("user-images").getPublicUrl(path);
      onMealPhotoUpload(systemId, data.publicUrl);
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir foto");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {showMinuteInput && (
        <label className={chipClass} title="Minutos de hoy">
          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
          <Input
            type="number"
            min={0}
            value={minuteValue || ""}
            onChange={(event) => onTimeChange(systemId, readNumber(event.target.value))}
            placeholder="0"
            aria-label={`Minutos de ${meta?.name ?? systemId}`}
            className={inputClass}
          />
          <span className="text-[7px] text-muted-foreground">min</span>
        </label>
      )}

      {countKey && !isChess && !isGame && (
        <label className={chipClass} title={system?.countLabel ?? "Cantidad"}>
          <Input
            type="number"
            min={0}
            value={countValue || ""}
            onChange={(event) =>
              onCountChange?.(countKey, readNumber(event.target.value))
            }
            placeholder="0"
            aria-label={system?.countLabel ?? "Cantidad"}
            className={cn(inputClass, "w-9 text-indigo-600 dark:text-indigo-400")}
          />
          <span className="text-[7px] text-muted-foreground">
            {system?.countLabel ?? "cant."}
          </span>
        </label>
      )}

      {isChess && (
        <>
          <label className={chipClass} title="Partidas jugadas">
            <span className="text-[7px] font-semibold text-muted-foreground">P</span>
            <Input
              type="number"
              min={0}
              value={systems.countData[CHESS_COUNT_KEYS.games] || ""}
              onChange={(event) =>
                onCountChange?.(
                  CHESS_COUNT_KEYS.games,
                  readNumber(event.target.value),
                )
              }
              placeholder="0"
              aria-label="Partidas de ajedrez"
              className={cn(inputClass, "w-8")}
            />
          </label>
          <label className={chipClass} title="Victorias">
            <span className="text-[7px] font-semibold text-emerald-600 dark:text-emerald-400">V</span>
            <Input
              type="number"
              min={0}
              value={systems.countData[CHESS_COUNT_KEYS.wins] || ""}
              onChange={(event) =>
                onChessResultChange?.("wins", readNumber(event.target.value))
              }
              placeholder="0"
              aria-label="Victorias de ajedrez"
              className={cn(inputClass, "w-8 text-emerald-600 dark:text-emerald-400")}
            />
          </label>
          <label className={chipClass} title="Derrotas">
            <span className="text-[7px] font-semibold text-red-500">D</span>
            <Input
              type="number"
              min={0}
              value={systems.countData[CHESS_COUNT_KEYS.losses] || ""}
              onChange={(event) =>
                onChessResultChange?.("losses", readNumber(event.target.value))
              }
              placeholder="0"
              aria-label="Derrotas de ajedrez"
              className={cn(inputClass, "w-8 text-red-500")}
            />
          </label>
        </>
      )}

      {isGame && (
        <>
          <label className={chipClass} title="Acciones del día">
            <span className="text-[7px] font-semibold text-muted-foreground">Acc</span>
            <Input
              type="number"
              min={0}
              value={systems.countData[GAME_COUNT_KEYS.actions] || ""}
              onChange={(event) =>
                onCountChange?.(
                  GAME_COUNT_KEYS.actions,
                  readNumber(event.target.value),
                )
              }
              placeholder="0"
              aria-label="Acciones de Game"
              className={cn(inputClass, "w-8 text-rose-600 dark:text-rose-400")}
            />
          </label>
          <label className={chipClass} title="Números del día">
            <span className="text-[7px] font-semibold text-muted-foreground">Núm</span>
            <Input
              type="number"
              min={0}
              value={systems.countData[GAME_COUNT_KEYS.numbers] || ""}
              onChange={(event) =>
                onCountChange?.(
                  GAME_COUNT_KEYS.numbers,
                  readNumber(event.target.value),
                )
              }
              placeholder="0"
              aria-label="Números de Game"
              className={cn(inputClass, "w-8 text-rose-600 dark:text-rose-400")}
            />
          </label>
        </>
      )}

      {isGym && (
        <>
          <label className={chipClass} title="Minutos de entreno">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={systems.workoutDuration || ""}
              onChange={(event) =>
                onWorkoutDurationChange?.(readNumber(event.target.value))
              }
              placeholder="0"
              aria-label="Minutos de entreno"
              className={inputClass}
            />
            <span className="text-[7px] text-muted-foreground">min</span>
          </label>
          <select
            value={systems.workoutIntensity || "moderate"}
            onChange={(event) => onWorkoutIntensityChange?.(event.target.value)}
            aria-label="Intensidad del entreno"
            className="h-5 rounded-md border border-border/50 bg-background/70 px-1 text-[8px] font-medium"
          >
            <option value="light">Baja</option>
            <option value="moderate">Media</option>
            <option value="high">Alta</option>
            <option value="extreme">Extrema</option>
          </select>
        </>
      )}

      {sleep && (
        <>
          <label className={chipClass} title="Hora en que me dormí el día anterior">
            <Moon className="h-2.5 w-2.5 text-indigo-500" />
            <Input
              type="time"
              value={systems.sleepTime || ""}
              onChange={(event) => onSleepTimeChange?.(event.target.value)}
              aria-label="Hora en que me dormí"
              className="h-5 w-[58px] border-0 bg-transparent px-0 text-[8px] shadow-none focus-visible:ring-0"
            />
          </label>
          <label className={chipClass} title="Hora en que me levanté hoy">
            <Sun className="h-2.5 w-2.5 text-amber-500" />
            <Input
              type="time"
              value={systems.wakeTime || ""}
              onChange={(event) => onWakeTimeChange?.(event.target.value)}
              aria-label="Hora en que me levanté"
              className="h-5 w-[58px] border-0 bg-transparent px-0 text-[8px] shadow-none focus-visible:ring-0"
            />
          </label>
        </>
      )}

      {water && (
        <button
          type="button"
          onClick={() => onWaterToggle?.(systemId)}
          disabled={!onWaterToggle}
          title={waterDone ? "Quitar agua de hoy" : "Registrar agua de hoy"}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[8px] font-bold transition-colors",
            waterDone
              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
              : "bg-muted text-muted-foreground hover:bg-blue-500/15 hover:text-blue-600",
          )}
        >
          <Droplets className="h-2.5 w-2.5" />
          {waterDone ? "Agua ✓" : "Agua"}
        </button>
      )}

      {meal && onMealPhotoUpload && (
        <>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={(element) => {
              fileRef.current = element;
            }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handlePhotoUpload(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title={mealUrl ? "Cambiar foto de la comida" : "Subir foto de la comida"}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[8px] font-bold transition-colors",
              mealUrl
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-600",
            )}
          >
            <Camera className="h-2.5 w-2.5" />
            {mealUrl ? "Foto ✓" : "Foto"}
          </button>
          {mealUrl && (
            <img
              src={mealUrl}
              alt="Comida registrada"
              className="h-5 w-5 rounded object-cover ring-1 ring-border/60"
            />
          )}
        </>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        {isGym && onRestToggle && (
          <button
            type="button"
            onClick={() => onRestToggle(systemId)}
            title={rest ? "Quitar día de descanso" : "Marcar día de descanso"}
            className={cn(
              "rounded-md px-1 py-0.5 text-[8px] font-semibold transition-colors",
              rest
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-600",
            )}
          >
            {rest ? "Descanso ✓" : "Descanso"}
          </button>
        )}
        {onSkipToggle && (
          <button
            type="button"
            onClick={() => onSkipToggle(systemId)}
            title={skipped ? "Desmarcar saltado" : "Saltar hoy"}
            className={cn(
              "rounded-md px-1 py-0.5 text-[8px] font-semibold transition-colors",
              skipped
                ? "bg-red-500/20 text-red-500"
                : "bg-muted text-muted-foreground hover:bg-red-500/15 hover:text-red-500",
            )}
          >
            {skipped ? "Volver" : "Saltar"}
          </button>
        )}
      </div>
    </div>
  );
}
