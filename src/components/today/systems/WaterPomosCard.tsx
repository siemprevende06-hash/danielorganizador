import { cn } from "@/lib/utils";
import { Check, Droplets, Flame, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const POMO_ML = 300;
const TARGET_POMOS = 8; // 8 × 300 ml = 2400 ml / día
const TARGET_ML = POMO_ML * TARGET_POMOS;

interface WaterPomosCardProps {
  done: boolean;
  isSkipped: boolean;
  count: number;
  streak?: { current: number; best: number };
  onToggle: () => void;
  onSkip: () => void;
  onDrink: (count: number) => void;
}

function Glass({ filled, active, onClick }: { filled: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-8 h-11 rounded-b-xl rounded-t-md border-2 transition-all duration-200 overflow-hidden group",
        filled
          ? "border-sky-400/80 bg-sky-50 dark:bg-sky-950/40"
          : "border-muted-foreground/25 bg-white/50 dark:bg-zinc-900/40 hover:border-sky-400/60"
      )}
    >
      {/* Agua */}
      {filled && (
        <>
          <span className="water-fill absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-sky-500 to-sky-400/80">
            {/* Ola animada */}
            <span className="water-wave absolute inset-x-0 -top-1 h-2.5 bg-sky-300/90" />
          </span>
          {/* Burbujas */}
          <span className="water-bubble absolute bottom-2 left-1.5 w-1 h-1 rounded-full bg-white/80" />
          <span className="water-bubble absolute bottom-4 right-1.5 w-1.5 h-1.5 rounded-full bg-white/70" style={{ animationDelay: "0.6s" }} />
          <span className="water-bubble absolute bottom-6 left-2 w-0.5 h-0.5 rounded-full bg-white/70" style={{ animationDelay: "1.2s" }} />
        </>
      )}
      {!filled && (
        <span className="absolute inset-x-0 top-2 h-1.5 mx-2 rounded-full border-t-2 border-muted-foreground/25" />
      )}
      {filled && active && (
        <span className="absolute inset-0 bg-sky-400/20 animate-pulse" />
      )}
    </button>
  );
}

export function WaterPomosCard({ done, isSkipped, count, streak, onToggle, onSkip, onDrink }: WaterPomosCardProps) {
  const [pulsing, setPulsing] = useState<number | null>(null);

  const ml = count * POMO_ML;
  const pct = Math.round((count / TARGET_POMOS) * 100);

  const statusText = done ? "Hecho" : isSkipped ? "Saltado" : "Sin hacer";
  const statusClass = done
    ? "text-emerald-600 dark:text-emerald-400"
    : isSkipped
      ? "text-red-500"
      : "text-muted-foreground";
  const ringClass = done
    ? "ring-emerald-500/40"
    : isSkipped
      ? "ring-red-500/40"
      : "ring-border/40";

  const handleTap = (index: number) => {
    if (index < count) {
      // Quitar ese vaso y los que estén por encima
      onDrink(index);
    } else {
      // Tomar hasta ese vaso (rellena los anteriores)
      onDrink(index + 1);
    }
  };

  return (
    <div className={cn("relative rounded-2xl overflow-hidden ring-2 transition-all flex flex-col p-2.5 space-y-2", ringClass, isSkipped ? "bg-red-500/5 dark:bg-red-950/10" : "bg-white/80 dark:bg-zinc-950/80")}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">💧</span>
        <span className={cn("text-[11px] font-bold leading-tight", done && "line-through text-muted-foreground")}>
          Hidratación
        </span>
        <span className={cn("ml-auto text-[9px] font-bold shrink-0", statusClass)}>{statusText}</span>
      </div>

      {/* Rachas */}
      {(streak && (streak.current > 0 || streak.best > 0)) && (
        <span className="flex items-center gap-1.5 text-[9px]">
          {streak.current > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" />{streak.current}</span>}
          {streak.best > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Trophy className="h-2 w-2" />{streak.best}</span>}
        </span>
      )}

      {/* Pomos de 300ml */}
      <div className="grid grid-cols-4 gap-x-4 gap-y-2 justify-items-center">
        {Array.from({ length: TARGET_POMOS }).map((_, i) => {
          const filled = i < count;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Glass
                filled={filled}
                active={pulsing === i}
                onClick={() => {
                  setPulsing(i);
                  handleTap(i);
                  setTimeout(() => setPulsing(null), 350);
                }}
              />
              <span className={cn("text-[8px] tabular-nums font-medium", filled ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground/60")}>
                {POMO_ML}ml
              </span>
            </div>
          );
        })}
      </div>

      {/* Total bebido */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <Droplets className="h-3 w-3 text-sky-500 shrink-0" />
        <span className="text-lg font-extrabold tabular-nums leading-none">{ml}</span>
        <span className="text-[9px] text-muted-foreground">ml de {TARGET_ML} ml</span>
      </div>
      <Progress value={Math.min(100, pct)} className="h-1.5" indicatorClassName="bg-sky-500" />

      <div className="flex items-center gap-1.5 pt-1">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-bold transition-colors",
            done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          <Check className="h-3 w-3" /> Hecho
        </button>
        <button
          onClick={onSkip}
          className="px-1.5 py-1 rounded-md text-[9px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
          title={isSkipped ? "Desmarcar salteado" : "Saltear hoy"}
        >
          {isSkipped ? "Volver" : "Saltar"}
        </button>
      </div>
    </div>
  );
}