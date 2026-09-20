import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronDown, ChevronRight, Minus } from "lucide-react";
import type { ResultLeafConnector } from "@/lib/resultConnections";
import { cn } from "@/lib/utils";

interface ResultLeavesProps {
  leaves: ResultLeafConnector[];
  group: { bar: string };
  maxResults?: number;
}

function fmtMin(m: number): string {
  if (m <= 0) return "0";
  if (m < 60) return `${Math.round(m)}min`;
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
}

function fmtVal(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function ResultLeaves({ leaves, group, maxResults }: ResultLeavesProps) {
  const shown = maxResults != null ? leaves.slice(0, maxResults) : leaves;
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-1.5">
      {shown.map(leaf => {
        const pct = Math.min(100, leaf.pct);
        const hasTarget = leaf.target > leaf.start || leaf.current > leaf.start;
        const hasConn = leaf.connections.length > 0;
        const isOpen = open.has(leaf.id);
        const visible = isOpen ? leaf.connections : leaf.connections.slice(0, 2);
        const hidden = leaf.connections.length - visible.length;

        return (
          <div key={leaf.id} className="rounded-xl bg-foreground/5 p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium w-28 truncate shrink-0">{leaf.label}</span>
              <Progress value={pct} className="h-1.5 flex-1" indicatorClassName={group.bar} />
              <div className="w-28 text-right shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold tabular-nums">{leaf.pct}%</div>
                <div className="text-[9px] text-muted-foreground tabular-nums">
                  {hasTarget
                    ? `${fmtVal(leaf.current)}${leaf.unit} → ${leaf.target}${leaf.unit}`
                    : leaf.minutes > 0
                      ? `${fmtMin(leaf.minutes)} en 30d`
                      : ""}
                </div>
              </div>
            </div>

            {hasConn && (
              <div className="space-y-1">
                {visible.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-[9px] min-w-0">
                    <span
                      className={cn(
                        "size-3.5 grid place-items-center rounded-full shrink-0",
                        c.todayDone ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.todayDone ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                    </span>
                    <span className="font-medium truncate">
                      {c.emoji ? `${c.emoji} ` : ""}
                      {c.name}
                    </span>
                    {c.todayMinutes > 0 && (
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {fmtMin(c.todayMinutes)} hoy
                      </span>
                    )}
                    {c.consistency > 0 && (
                      <span
                        className={cn(
                          "tabular-nums font-bold shrink-0",
                          c.consistency >= 50 ? "text-emerald-500" : "text-muted-foreground"
                        )}
                      >
                        ⚡{c.consistency}%
                      </span>
                    )}
                  </div>
                ))}
                {!isOpen && hidden > 0 && (
                  <button
                    onClick={() => toggle(leaf.id)}
                    className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {hidden} más
                  </button>
                )}
                {isOpen && (
                  <button
                    onClick={() => toggle(leaf.id)}
                    className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Mostrar menos
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}