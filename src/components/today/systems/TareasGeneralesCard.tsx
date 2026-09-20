import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ListChecks, CheckCircle2 } from "lucide-react";
import type { TodayTaskItem } from "@/hooks/useTodayFocusItems";
import { cn } from "@/lib/utils";

interface TareasGeneralesCardProps {
  data: { planned: TodayTaskItem[]; doneCount: number; totalCount: number } | null;
  onToggleTask: (id: string, done: boolean) => void;
}

const OBJETIVOS = [
  { key: "min", label: "Min", value: 1 },
  { key: "normal", label: "Normal", value: 3 },
  { key: "max", label: "Max", value: 5 },
];

export function TareasGeneralesCard({ data, onToggleTask }: TareasGeneralesCardProps) {
  const total = data?.totalCount ?? 0;
  const done = data?.doneCount ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-foreground/[0.03] border border-border/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Tareas Generales
        </span>
        <span className="ml-auto text-[10px] font-bold tabular-nums">
          {done}
          <span className="text-muted-foreground font-medium">/{total}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        {OBJETIVOS.map(o => (
          <span
            key={o.key}
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
              o.key === "normal"
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-transparent"
            )}
          >
            {o.label} {o.value}
          </span>
        ))}
        <span className="text-[9px] text-muted-foreground ml-auto">min 1 · normal 3 · máx 5</span>
      </div>

      {total > 0 && (
        <Progress
          value={pct}
          className="h-1.5"
          indicatorClassName={done === total ? "bg-emerald-500" : "bg-primary"}
        />
      )}

      <div className="max-h-40 overflow-y-auto space-y-1">
        {data && data.planned.length > 0 ? (
          data.planned.map(item => (
            <button
              key={item.id}
              onClick={() => onToggleTask(item.id, item.done)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                item.done ? "bg-emerald-500/10" : "bg-background/70 hover:bg-background"
              )}
            >
              <Checkbox
                checked={item.done}
                onCheckedChange={() => onToggleTask(item.id, item.done)}
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight truncate",
                  item.done && "line-through text-muted-foreground"
                )}
              >
                {item.title}
              </span>
              {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />}
            </button>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground px-1 py-1">
            Sin tareas generales planificadas para hoy.
          </p>
        )}
      </div>
    </div>
  );
}