import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock3, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatTimeDisplay, parseTime, type RoutineBlock } from "@/hooks/useRoutineBlocksDB";
import type { TaskItem } from "@/hooks/useDailyPlanData";
import { cn } from "@/lib/utils";
import { EmptyState, SectionHeader } from "./shared";

function useNowMinutes() {
  const [now, setNow] = useState(() => {
    const date = new Date();
    return date.getHours() * 60 + date.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      setNow(date.getHours() * 60 + date.getMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export function TodayRoutineCard({
  blocks,
  tasksByBlock,
  isBlockCompleted,
  toggleBlockComplete,
  loading,
}: {
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
  isBlockCompleted: (id: string) => boolean;
  toggleBlockComplete: (id: string) => void;
  loading?: boolean;
}) {
  const nowMinutes = useNowMinutes();

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
    [blocks],
  );

  const currentBlock = useMemo(
    () => sortedBlocks.find((block) => nowMinutes >= parseTime(block.startTime) && nowMinutes < parseTime(block.endTime)),
    [sortedBlocks, nowMinutes],
  );

  const nextBlock = useMemo(
    () => sortedBlocks.find((block) => parseTime(block.startTime) > nowMinutes),
    [sortedBlocks, nowMinutes],
  );

  const focusBlock = currentBlock || nextBlock;
  const completed = sortedBlocks.filter((block) => isBlockCompleted(block.id)).length;
  const progress = sortedBlocks.length > 0 ? Math.round((completed / sortedBlocks.length) * 100) : 0;
  const focusTasks = focusBlock ? tasksByBlock[focusBlock.id] || [] : [];

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Clock3 className="h-4 w-4" />}
        title="Rutina de hoy"
        subtitle="Bloques del día y lo que toca ahora"
        action={
          <Link
            to="/routine-day"
            className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver rutina →
          </Link>
        }
      />

      <Card className="flex h-full flex-col p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : sortedBlocks.length === 0 ? (
          <EmptyState message="No hay bloques de rutina configurados para hoy." />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-[10px] font-semibold tabular-nums">
                {completed}/{sortedBlocks.length} bloques
              </Badge>
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-1.5"
              indicatorClassName={progress >= 100 ? "bg-emerald-500" : "bg-blue-500"}
            />

            {focusBlock ? (
              <div
                className={cn(
                  "mt-3 rounded-xl border p-3",
                  currentBlock
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-blue-500/20 bg-blue-500/5",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      currentBlock
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", currentBlock ? "animate-pulse bg-emerald-500" : "bg-blue-500")} />
                    {currentBlock ? "Ahora" : "Siguiente"}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {formatTimeDisplay(focusBlock.startTime)} – {formatTimeDisplay(focusBlock.endTime)}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-bold text-foreground">{focusBlock.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  {focusTasks.length > 0
                    ? `${focusTasks.filter((task) => task.completed).length}/${focusTasks.length} tareas completadas`
                    : "Sin tareas asignadas a este bloque"}
                </div>
              </div>
            ) : null}

            <div className="mt-3 max-h-[280px] space-y-1 overflow-y-auto pr-1">
              {sortedBlocks.map((block) => {
                const done = isBlockCompleted(block.id);
                const isCurrent = currentBlock?.id === block.id;
                const taskCount = (tasksByBlock[block.id] || []).length;
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                      isCurrent ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/40",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleBlockComplete(block.id)}
                      className="shrink-0 rounded-full p-0.5 transition-transform hover:scale-110"
                      aria-label={done ? `Desmarcar ${block.title}` : `Completar ${block.title}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </button>
                    <span className="w-[68px] shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {formatTimeDisplay(block.startTime)}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-xs",
                        done ? "text-muted-foreground line-through" : "text-foreground",
                        isCurrent && "font-semibold",
                      )}
                    >
                      {block.title}
                    </span>
                    {taskCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-muted-foreground">
                        {taskCount}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
