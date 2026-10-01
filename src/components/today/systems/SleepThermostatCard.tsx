import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Flame, Trophy, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { calcSleepHours, formatSleepHours, minutesToTime } from "@/lib/sleep";

const MAX_HOURS = 12;
const STEP_HOURS = 0.25;

function ThermostatGauge({
  hours,
  onHoursChange,
}: {
  hours: number;
  onHoursChange: (hours: number) => void;
}) {
  const cx = 100;
  const cy = 100;
  const r = 82;
  // Arco del termostato: de 180° (izquierda) a 0° (derecha), pasando por 90° (arriba)
  const startAngle = 180;
  const endAngle = 0;
  const clamped = Math.max(0, Math.min(MAX_HOURS, hours));

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? clamped;

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
  const tip = polar(startAngle - (startAngle - endAngle) * (shown / MAX_HOURS), r - 22);

  const snap = (value: number) =>
    Math.max(0, Math.min(MAX_HOURS, Math.round(value / STEP_HOURS) * STEP_HOURS));

  const hoursFromPointer = (clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    // viewBox 200x130 con preserveAspectRatio por defecto (meet): escala uniforme
    const scale = Math.min(rect.width / 200, rect.height / 130);
    const offsetX = (rect.width - 200 * scale) / 2;
    const offsetY = (rect.height - 130 * scale) / 2;
    const x = (clientX - rect.left - offsetX) / scale;
    const y = (clientY - rect.top - offsetY) / scale;
    const deg = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
    return snap((Math.max(0, Math.min(180, deg)) / 180) * MAX_HOURS);
  };

  const commit = (value: number | null) => {
    if (value === null) return;
    if (Math.abs(value - clamped) > 0.001) onHoursChange(value);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 130"
      role="slider"
      tabIndex={0}
      aria-label="Horas de sueño"
      aria-valuemin={0}
      aria-valuemax={MAX_HOURS}
      aria-valuenow={Number(shown.toFixed(2))}
      className="w-full max-w-[240px] mx-auto cursor-pointer touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-lg"
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(hoursFromPointer(e.clientX, e.clientY));
      }}
      onPointerMove={e => {
        if (dragging === null) return;
        setDragging(hoursFromPointer(e.clientX, e.clientY));
      }}
      onPointerUp={e => {
        const value = hoursFromPointer(e.clientX, e.clientY) ?? dragging;
        setDragging(null);
        commit(value);
      }}
      onPointerCancel={() => setDragging(null)}
      onKeyDown={e => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onHoursChange(snap(clamped + STEP_HOURS));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onHoursChange(snap(clamped - STEP_HOURS));
        } else if (e.key === "Home") {
          e.preventDefault();
          onHoursChange(0);
        } else if (e.key === "End") {
          e.preventDefault();
          onHoursChange(MAX_HOURS);
        }
      }}
    >
      {/* Track */}
      <path d={describeArc(startAngle, endAngle, r)} fill="none" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth={10} strokeLinecap="round" />
      {/* Valor (horas dormidas) */}
      {clamped > 0 && (
        <path d={describeArc(startAngle, startAngle - (startAngle - endAngle) * (shown / MAX_HOURS), r)} fill="none" stroke="#6366f1" strokeWidth={10} strokeLinecap="round" />
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
  onHoursChange?: (hours: number) => void;
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
  onHoursChange,
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

  const setHours = (value: number) => {
    const next = Math.max(0, Math.min(MAX_HOURS, Math.round(value * 4) / 4));
    if (next === hours) return;
    if (onHoursChange) {
      onHoursChange(next);
      return;
    }
    // Fallback: recalcula la hora de acostarse desde la de despertar.
    const [wh, wm] = (wakeTime || "").split(":").map(Number);
    if (!isNaN(wh) && !isNaN(wm)) onSleepTimeChange?.(minutesToTime(wh * 60 + wm - next * 60));
  };

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

      {/* Termostato: arrastra la aguja para fijar las horas */}
      <div className="relative">
        <ThermostatGauge hours={hours} onHoursChange={setHours} />
        <div className="text-center mt-1 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setHours(hours - 0.5)}
            className="grid place-items-center size-5 rounded-md bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            title="Quitar 30 min"
            aria-label="Quitar 30 minutos"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className={cn("text-2xl font-extrabold tabular-nums leading-none min-w-[52px]", hours >= 7 ? "text-indigo-600 dark:text-indigo-400" : hours > 0 ? "text-amber-500" : "text-muted-foreground/50")}>
            {formatSleepHours(hours)}
          </span>
          <button
            onClick={() => setHours(hours + 0.5)}
            className="grid place-items-center size-5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Sumar 30 min"
            aria-label="Sumar 30 minutos"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <p className="text-center text-[8px] text-muted-foreground mt-0.5">Arrastra la aguja para fijar las horas</p>
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