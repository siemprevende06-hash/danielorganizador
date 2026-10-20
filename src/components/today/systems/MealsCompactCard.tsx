import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Droplets, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { HabitMeta } from "@/lib/areaSystemsMap";
import { WeekCheckStrip } from "./WeekCheckStrip";

export interface MealsCompactCardProps {
  meals: HabitMeta[];
  title?: string;
  emoji?: string;
  /** Fecha ISO (yyyy-MM-dd) del día mostrado. */
  date?: string;
  completions: Record<string, boolean>;
  waterData?: Record<string, boolean>;
  mealPhotos?: Record<string, string>;
  skipped?: Record<string, boolean>;
  onToggle: (id: string) => void;
  onWaterToggle?: (id: string) => void;
  onSkipToggle?: (id: string) => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
}

/**
 * Todas las comidas del día (pre-entreno → antes de dormir + suplementos) en una
 * sola tarjeta compacta: una fila por comida con check, agua, foto y saltar.
 */
export function MealsCompactCard({
  meals,
  title = "Alimentación",
  emoji = "🍽️",
  date,
  completions,
  waterData,
  mealPhotos,
  skipped,
  onToggle,
  onWaterToggle,
  onSkipToggle,
  onMealPhotoUpload,
}: MealsCompactCardProps) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const doneCount = meals.filter(m => completions[m.id]).length;

  const handlePhotoUpload = async (habitId: string, file: File) => {
    if (!onMealPhotoUpload) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `meals/${Date.now()}_${habitId}.${ext}`;
      const { error } = await supabase.storage.from("user-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-images").getPublicUrl(path);
      onMealPhotoUpload(habitId, urlData.publicUrl);
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir foto");
    }
  };

  return (
    <div className="rounded-xl bg-foreground/[0.03] border border-border/40 p-2.5 space-y-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {emoji} {title}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium",
            doneCount === meals.length ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          {doneCount}/{meals.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {meals.map(habit => {
          const done = !!completions[habit.id];
          const isSkipped = !!skipped?.[habit.id];
          const photo = mealPhotos?.[habit.id];
          const waterDone = !!waterData?.[habit.id];

          return (
            <div
              key={habit.id}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors",
                isSkipped
                  ? "border-red-500/40 bg-red-500/5"
                  : done
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-border/50 bg-background/70"
              )}
            >
              <Checkbox
                checked={done}
                onCheckedChange={() => onToggle(habit.id)}
                className="h-4 w-4"
                aria-label={habit.name}
              />

              <button
                onClick={() => onToggle(habit.id)}
                title={habit.name}
                className="shrink-0 grid place-items-center"
                aria-label={`Marcar ${habit.name}`}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={habit.name}
                    className="h-6 w-6 rounded object-cover border border-border/50"
                  />
                ) : (
                  <span className="text-sm leading-none">{habit.emoji}</span>
                )}
              </button>

              <button
                onClick={() => onToggle(habit.id)}
                className={cn(
                  "text-xs font-medium leading-tight truncate min-w-0 flex-1 text-left",
                  done && "line-through text-muted-foreground"
                )}
              >
                {habit.name}
              </button>

              {habit.hasWater && (
                <button
                  onClick={() => onWaterToggle?.(habit.id)}
                  title="300ml"
                  className={cn(
                    "shrink-0 grid place-items-center rounded p-1 transition-colors",
                    waterDone ? "bg-blue-500/20 text-blue-500" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  <Droplets className="h-3.5 w-3.5" />
                </button>
              )}

              {habit.hasMealPhoto && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => {
                      fileRefs.current[habit.id] = el;
                    }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(habit.id, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileRefs.current[habit.id]?.click()}
                    title={photo ? "Cambiar foto" : "Subir foto"}
                    className={cn(
                      "shrink-0 grid place-items-center rounded p-1 transition-colors",
                      photo ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              <button
                onClick={() => onSkipToggle?.(habit.id)}
                title={isSkipped ? "Desmarcar salteado" : "Saltear hoy"}
                className={cn(
                  "shrink-0 grid place-items-center rounded p-1 transition-colors",
                  isSkipped
                    ? "bg-red-500/20 text-red-500"
                    : "bg-muted text-muted-foreground/60 hover:bg-muted/70 hover:text-red-400"
                )}
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Check semanal: verde si ese día se cumplió la alimentación, rojo si no */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Check semanal
        </span>
        <WeekCheckStrip
          habitIds={meals.map(m => m.id)}
          todayDone={doneCount === meals.length}
          date={date}
          className="ml-auto"
        />
      </div>
    </div>
  );
}