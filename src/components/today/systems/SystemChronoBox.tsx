import { Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRange, type ChronoRange } from "@/lib/systemSchedule";

interface SystemChronoBoxProps {
  fixed: ChronoRange[];
  extra: ChronoRange[];
  showCount?: boolean;
  className?: string;
  /** Minutos registrados en el bloque fijo. */
  fixedMinutes?: number;
  /** Minutos registrados en el avance extra. */
  extraMinutes?: number;
  onFixedMinutesChange?: (minutes: number) => void;
  onExtraMinutesChange?: (minutes: number) => void;
  /** Total del día (fijo + extra). */
  totalMinutes?: number;
}

function readCount(value: string): number {
  return Math.max(0, parseInt(value, 10) || 0);
}

export function SystemChronoBox({
  fixed,
  extra,
  showCount,
  className,
  fixedMinutes,
  extraMinutes,
  onFixedMinutesChange,
  onExtraMinutesChange,
  totalMinutes,
}: SystemChronoBoxProps) {
  const hasExtra = extra.length > 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="rounded-lg border border-border/40 bg-muted/40 px-2 py-1.5 space-y-1">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          Bloque fijo
        </div>
        {fixed.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/70">Sin bloque fijo</p>
        ) : (
          <p className="text-[10px] font-medium leading-tight">
            {showCount && (
              <span className="font-bold">
                {fixed.length} {fixed.length === 1 ? "bloque" : "bloques"} ·{" "}
              </span>
            )}
            {fixed.map(formatRange).join(" · ")}
          </p>
        )}
        {onFixedMinutesChange && (
          <label className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            Tiempo
            <Input
              type="number"
              min={0}
              value={fixedMinutes ?? 0}
              onChange={(e) => onFixedMinutesChange(readCount(e.target.value))}
              placeholder="min"
              aria-label="Minutos del bloque fijo"
              className="h-5 w-12 text-[10px] text-center px-1"
            />
            min
          </label>
        )}
      </div>

      {hasExtra && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 space-y-1">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="h-2.5 w-2.5" />
            Avance extra
          </div>
          <div className="space-y-0.5">
            {extra.map((block, index) => (
              <p key={`${block.title}-${index}`} className="text-[10px] leading-tight">
                <span className="font-medium">{block.title}</span>
                <span className="text-muted-foreground">
                  {" "}· {formatRange(block)} · {block.minutes} min
                </span>
              </p>
            ))}
          </div>
          {onExtraMinutesChange && (
            <label className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              Tiempo
              <Input
                type="number"
                min={0}
                value={extraMinutes ?? 0}
                onChange={(e) => onExtraMinutesChange(readCount(e.target.value))}
                placeholder="min"
                aria-label="Minutos del avance extra"
                className="h-5 w-12 text-[10px] text-center px-1"
              />
              min
            </label>
          )}
        </div>
      )}

      {totalMinutes !== undefined && (
        <p className="text-[9px] text-right text-muted-foreground">
          Total del día: <span className="font-bold text-foreground">{totalMinutes} min</span>
        </p>
      )}
    </div>
  );
}
