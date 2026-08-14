import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sunrise, Sun, SunMedium, Moon, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTime } from "@/hooks/useRoutineBlocksDB";
import type { RoutineBlock } from "@/hooks/useRoutineBlocksDB";
import type { TaskItem } from "@/hooks/useDailyPlanData";

interface PeriodDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  start: number;
  end: number;
  range: string;
}

const PERIODS: PeriodDef[] = [
  { id: "amanecer", label: "Amanecer", icon: <Sunrise className="h-4 w-4" />, start: 300, end: 540, range: "5:00 — 9:00" },
  { id: "manana", label: "Mañana", icon: <Sun className="h-4 w-4" />, start: 540, end: 800, range: "9:00 — 13:20" },
  { id: "tarde", label: "Tarde", icon: <SunMedium className="h-4 w-4" />, start: 800, end: 1110, range: "13:20 — 18:30" },
  { id: "noche", label: "Noche", icon: <Moon className="h-4 w-4" />, start: 1110, end: 1350, range: "18:30 — 22:30" },
];

function formatHora(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}

function formatTotal(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TimePeriodSections({
  blocks,
  tasksByBlock,
}: {
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
}) {
  const grouped = useMemo(() => {
    const sorted = [...blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    return PERIODS.map((p) => {
      const periodBlocks = sorted.filter((b) => {
        const s = parseTime(b.startTime);
        return s >= p.start && s < p.end;
      });
      const minutes = periodBlocks.reduce((s, b) => {
        let e = parseTime(b.endTime);
        const st = parseTime(b.startTime);
        if (e <= st) e += 24 * 60;
        return s + (e - st);
      }, 0);
      const tasks = periodBlocks.flatMap((b) =>
        (tasksByBlock[b.id] || []).map((t) => ({ task: t, block: b }))
      );
      const completed = tasks.filter(({ task }) => task.completed).length;
      return { ...p, blocks: periodBlocks, tasks, minutes, completed };
    });
  }, [blocks, tasksByBlock]);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wide">Sectores del Día</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {grouped.map((p) => {
          const empty = p.blocks.length === 0;
          return (
            <Card key={p.id} className={cn("p-3 space-y-2", empty && "opacity-60")}>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground/5 text-foreground">
                  {p.icon}
                </span>
                <span className="text-sm font-bold">{p.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{p.range}</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                  {p.minutes > 0 ? formatTotal(p.minutes) : "—"}
                </span>
              </div>
              {p.blocks.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">Sin bloques en este periodo</p>
              ) : (
                <div className="space-y-1.5">
                  {p.blocks.map((b) => {
                    const blockTasks = tasksByBlock[b.id] || [];
                    return (
                      <div key={b.id} className="rounded-lg border border-border/60 px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {formatHora(parseTime(b.startTime))}
                          </span>
                          <span className="text-xs font-semibold truncate">{b.title}</span>
                          {blockTasks.length > 0 && (
                            <span className="text-[9px] px-1 py-0.5 rounded-full bg-foreground/5 text-muted-foreground shrink-0">
                              {blockTasks.length}
                            </span>
                          )}
                        </div>
                        {blockTasks.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {blockTasks.map((t) => (
                              <div key={t.id} className="flex items-center gap-1.5 text-[11px]">
                                <span
                                  className={cn(
                                    "w-1 h-1 rounded-full shrink-0",
                                    t.completed ? "bg-green-500" : "bg-primary"
                                  )}
                                />
                                <span className={cn("truncate", t.completed && "line-through text-muted-foreground")}>
                                  {t.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {p.tasks.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  <span>
                    {p.completed}/{p.tasks.length} tareas
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}