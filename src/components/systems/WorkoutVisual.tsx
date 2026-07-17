import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Zap, Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";

interface Props {
  duration: number;
  intensity: string;
  onDurationChange: (v: number) => void;
  onIntensityChange: (v: string) => void;
  completed: boolean;
  onToggleCompleted: () => void;
}

const INTENSITIES: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "light",    label: "Suave",   icon: Heart,    color: "from-blue-400 to-blue-500" },
  { id: "moderate", label: "Media",   icon: Activity, color: "from-emerald-400 to-emerald-500" },
  { id: "high",     label: "Alta",    icon: Flame,    color: "from-orange-400 to-orange-500" },
  { id: "extreme",  label: "Extrema", icon: Zap,      color: "from-red-500 to-rose-600" },
];

const GOAL_MIN = 60;
const MIN_THRESHOLD = 30;

export const WorkoutVisual = ({
  duration, intensity, onDurationChange, onIntensityChange,
  completed, onToggleCompleted,
}: Props) => {
  const pct = Math.min(100, Math.round((duration / GOAL_MIN) * 100));
  const intensityInfo = INTENSITIES.find((i) => i.id === intensity) || INTENSITIES[1];
  const Icon = intensityInfo.icon;

  const ringColor = duration >= GOAL_MIN
    ? "ring-green-500/60"
    : duration >= MIN_THRESHOLD
    ? "ring-blue-500/60"
    : duration > 0
    ? "ring-amber-500/60"
    : "ring-red-500/40";

  // Calorías estimadas (simple, multiplicador por intensidad)
  const multiplier = { light: 5, moderate: 8, high: 11, extreme: 14 }[intensity] || 8;
  const estCal = duration * multiplier;

  return (
    <Card className={cn("overflow-hidden ring-2 transition-all", ringColor)}>
      {/* Hero gradient header con visual de intensidad */}
      <div className={cn("p-4 bg-gradient-to-br text-white relative overflow-hidden", intensityInfo.color)}>
        <div className="absolute -right-4 -top-4 opacity-20">
          <Dumbbell className="h-24 w-24" />
        </div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-5 w-5" />
              <span className="font-semibold">Entrenamiento</span>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {duration}
              <span className="text-sm font-normal opacity-80">min</span>
            </p>
            <p className="text-[11px] opacity-90">~{estCal} kcal · {intensityInfo.label}</p>
          </div>
          <button
            onClick={onToggleCompleted}
            className={cn(
              "w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center transition-all",
              completed && "bg-white text-emerald-600 scale-110"
            )}
          >
            <Icon className={cn("h-5 w-5", completed ? "" : "text-white")} />
          </button>
        </div>

        {/* Visual progress bar (gradient fill) */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] opacity-80">
          <span>0</span>
          <span>Min {MIN_THRESHOLD}</span>
          <span>Meta {GOAL_MIN}</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Toggle completed */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleCompleted}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border",
              completed ? "bg-green-500 text-white border-green-500" : "bg-muted text-muted-foreground border-border hover:border-green-400"
            )}>
            <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
              completed ? "border-white" : "border-muted-foreground/50"
            )}>
              {completed && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            {completed ? "Hecho" : "Sin hacer"}
          </button>
          <span className="text-[9px] text-muted-foreground">Marca si entrenaste hoy</span>
        </div>

        {/* Selector de intensidad como chips */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Intensidad</p>
          <div className="grid grid-cols-4 gap-1.5">
            {INTENSITIES.map((it) => {
              const ItIcon = it.icon;
              const active = intensity === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => onIntensityChange(it.id)}
                  className={cn(
                    "p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all border",
                    active
                      ? `bg-gradient-to-br ${it.color} text-white border-transparent shadow-md scale-105`
                      : "bg-muted hover:bg-muted/70 text-muted-foreground border-border"
                  )}
                >
                  <ItIcon className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-medium">{it.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input duración + quick adds */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Duración</p>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              value={duration || ""}
              onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
              className="h-8 text-sm font-bold text-center flex-1"
              placeholder="min"
            />
            <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" onClick={() => onDurationChange(duration + 15)}>+15</Button>
            <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" onClick={() => onDurationChange(duration + 30)}>+30</Button>
            <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" onClick={() => onDurationChange(duration + 60)}>+60</Button>
          </div>
        </div>

        <WeekStreakBar habitId="entrenamiento-fisico" todayValue={duration} minThreshold={MIN_THRESHOLD} maxThreshold={GOAL_MIN} compact />
      </div>
    </Card>
  );
};
