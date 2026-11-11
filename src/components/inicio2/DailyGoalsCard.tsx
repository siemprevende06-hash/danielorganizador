import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ListTodo, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TaskItem } from "@/hooks/useDailyPlanData";
import { cn } from "@/lib/utils";
import { EmptyState, ScoreRing, SectionHeader } from "./shared";

export function DailyGoalsCard({
  tasks,
  completedTasks,
  blocks,
  completedBlocks,
  dayScore,
  toggleTaskDone,
  loading,
  maxTasks = 6,
}: {
  tasks: TaskItem[];
  completedTasks: TaskItem[];
  blocks: unknown[];
  completedBlocks: unknown[];
  dayScore: number;
  toggleTaskDone: (taskId: string) => void;
  loading?: boolean;
  /** Máximo de tareas visibles antes de mostrar "+N tareas más". */
  maxTasks?: number;
}) {
  const taskPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const blockPct = blocks.length > 0 ? Math.round((completedBlocks.length / blocks.length) * 100) : 0;

  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      }),
    [tasks],
  );

  const visibleTasks = orderedTasks.slice(0, Math.max(0, maxTasks));

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Target className="h-4 w-4" />}
        title="Metas del día"
        subtitle="Tu avance en tareas y bloques de hoy"
        action={
          <Link
            to="/day-planner"
            className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Planificar →
          </Link>
        }
      />

      <Card className="flex h-full flex-col p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <ScoreRing value={dayScore} size={92} label="del día" />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ListTodo className="h-3 w-3" /> Tareas
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {completedTasks.length}/{tasks.length}
                    </span>
                  </div>
                  <Progress value={taskPct} className="h-1.5" indicatorClassName="bg-blue-500" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" /> Bloques
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {completedBlocks.length}/{blocks.length}
                    </span>
                  </div>
                  <Progress value={blockPct} className="h-1.5" indicatorClassName="bg-emerald-500" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tareas de hoy</h3>
              <Link to="/tasks" className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                Ver todas →
              </Link>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="mt-2">
                <EmptyState message="Sin tareas para hoy. Agrega nuevas desde Tareas o Planificar." />
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task.id)}
                      className="shrink-0 rounded-full p-0.5 transition-transform hover:scale-110"
                      aria-label={task.completed ? `Desmarcar ${task.title}` : `Completar ${task.title}`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-xs",
                        task.completed ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.source === "entrepreneurship" ? (
                      <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[9px] font-medium">
                        {task.sourceName || "Emprendimiento"}
                      </Badge>
                    ) : null}
                  </div>
                ))}
                {orderedTasks.length > visibleTasks.length ? (
                  <p className="px-2 pt-1 text-[10px] text-muted-foreground">
                    +{orderedTasks.length - visibleTasks.length} tareas más
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
