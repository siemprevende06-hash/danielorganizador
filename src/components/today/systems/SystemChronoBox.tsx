import { Clock, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRange, type ChronoRange } from "@/lib/systemSchedule";

interface SystemChronoBoxProps {
  fixed: ChronoRange[];
  extra: ChronoRange[];
  showCount?: boolean;
  className?: string;
}

export function SystemChronoBox({ fixed, extra, showCount, className }: SystemChronoBoxProps) {
  const extraMinutes = extra.reduce((sum, block) => sum + block.minutes, 0);
  const hasExtra = extra.length > 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="rounded-lg border border-border/40 bg-muted/40 px-2 py-1.5">
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
      </div>

      <div
        className={cn(
          "rounded-lg border px-2 py-1.5",
          hasExtra
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-dashed border-border/50 bg-muted/20"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
            hasExtra ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"
          )}
        >
          {hasExtra ? <Sparkles className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
          Avance extra
          {hasExtra && <span className="ml-auto tabular-nums">{extraMinutes} min</span>}
        </div>
        {hasExtra ? (
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
        ) : (
          <p className="text-[10px] text-muted-foreground/60">Sin planificar</p>
        )}
      </div>
    </div>
  );
}
