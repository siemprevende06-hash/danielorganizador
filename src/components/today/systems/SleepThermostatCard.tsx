import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Flame, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { calcSleepHours, formatSleepHours } from "@/lib/sleep";

const MAX_HOURS = 12;

function ThermostatGauge({ hours }: { hours: number }) {
  const clamped = Math.max(0, Math.min(MAX_HOURS, hours));
  const cx = 100;
  const cy = 100;
  const r = 82;
  // Arco del termostato: de 180° (izquierda) a 0° (derecha), pasando por 90° (arriba)
  const startAngle = 180;
  const endAngle = 0;
  const frac = clamped / MAX_HOURS;
  const currentAngle = startAngle - (startAngle - endAngle) * frac;

  const polar = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const describeArc = (from: number, to: number, radius: number) => {
    const s = polar(from, radius);
    const e = polar(to, radius);
    const large = Math.abs(from - to) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const ticks = Array.from({ length: MAX_HOURS + 1 }, (_, h) => h);
  const majorTicks = [0, 3, 6, 9, 12];
  const tip = polar(currentAngle, r - 22);

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[240px] mx-auto">
      {/* Track */}
      <path d={describeArc(startAngle, endAngle, r)} fill="none" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth={10} strokeLinecap="round" />
      {/* Valor (horas dormidas) */}
      {clamped > 0 && (
        <path d={describeArc(startAngle, currentAngle, r)} fill="none" stroke="#6366f1" strokeWidth={10} strokeLinecap="round" />
      )}
      {/* Ticks */}
      {ticks.map(h => {
        const angle = startAngle - (startAngle - endAngle) * (h / MAX_HOURS);
        const isMajor = majorTicks.includes(h);
        const p1 = polar(angle, r - 12);
        const p2 = polar(angle, r - (isMajor ? 20 : 16));
        return (
          <line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth={1.4} />
        );
      })}
      {/* Etiquetas */}
      {majorTicks.map(h => {
        const angle = startAngle - (startAngle - endAngle) * (h / MAX_HOURS);
        const p = polar(angle, r - 30);
        return (
          <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="hsl(var(--muted-foreground))" className="font-medium">
            {h}
          </text>
        );
      })}
      {/* Aguja */}
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="hsl(var(--foreground))" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#6366f1" />
    </svg>
  );
}

interface SleepThermostatCardProps {
  done: boolean;
  isSkipped: boolean;
  wakeTime?: string;
  sleepTime?: string;
  streak?: { current: number; best: number };
  onToggle: () => void;
  onSkip: () => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
}

export function SleepThermostatCard({
  done,
  isSkipped,
  wakeTime,
  sleepTime,
  streak,
  onToggle,
  onSkip,
  onWakeTimeChange,
  onSleepTimeChange,
}: SleepThermostatCardProps) {
  const hours = calcSleepHours(wakeTime || "", sleepTime);
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

  return (
    <div className={cn("relative rounded-2xl overflow-hidden ring-2 transition-all flex flex-col p-2.5 space-y-2", ringClass, isSkipped ? "bg-red-500/5 dark:bg-red-950/10" : "bg-white/80 dark:bg-zinc-950/80")}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🌙</span>
        <span className={cn("text-[11px] font-bold leading-tight", done && "line-through text-muted-foreground")}>
          Sueño
        </span>
        <span className={cn("ml-auto text-[9px] font-bold shrink-0", statusClass)}>{statusText}</span>
      </div>

      {(streak && (streak.current > 0 || streak.best > 0)) && (
        <span className="flex items-center gap-1.5 text-[9px]">
          {streak.current > 0 && <span className="flex items-center gap-0.5 text-orange-500"><Flame className="h-2 w-2" />{streak.current}</span>}
          {streak.best > 0 && <span className="flex items-center gap-0.5 text-yellow-600"><Trophy className="h-2 w-2" />{streak.best}</span>}
        </span>
      )}

      {/* Termostato */}
      <div className="relative">
        <ThermostatGauge hours={hours} />
        <div className="text-center mt-1">
          <span className={cn("text-2xl font-extrabold tabular-nums leading-none", hours >= 7 ? "text-indigo-600 dark:text-indigo-400" : hours > 0 ? "text-amber-500" : "text-muted-foreground/50")}>
            {formatSleepHours(hours)}
          </span>
        </div>
      </div>

      {/* Horarios */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1 border-t border-border/40">
        <div className="flex items-center gap-1">
          <Sun className="h-2.5 w-2.5 text-amber-500" />
          <Input type="time" value={wakeTime || ""} onChange={e => onWakeTimeChange?.(e.target.value)} className="h-6 w-full text-[9px] px-1" title="Hora de despertar" />
        </div>
        <div className="flex items-center gap-1">
          <Moon className="h-2.5 w-2.5 text-indigo-500" />
          <Input type="time" value={sleepTime || ""} onChange={e => onSleepTimeChange?.(e.target.value)} className="h-6 w-full text-[9px] px-1" title="Hora de acostarse" />
        </div>
      </div>

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