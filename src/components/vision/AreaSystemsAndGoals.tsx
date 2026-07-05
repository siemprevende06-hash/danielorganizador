import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Plus, Settings2 } from 'lucide-react';
import type { PointBMetric } from '@/hooks/usePointBMetrics';
import type { IdentitySystem } from '@/lib/definitions';

interface Props {
  areaName: string;
  areaIcon: string;
  systems: IdentitySystem[];
  dailyStates: Record<string, Record<string, boolean>>;
  metrics: PointBMetric[];
  onToggleTask: (systemId: string, taskId: string) => void;
  onToggleActive: (systemId: string, isActive: boolean) => void;
  onEditSystem: (system: IdentitySystem) => void;
  onAddMetric: () => void;
  onEditMetric: (metric: PointBMetric) => void;
  onDeleteMetric: (metricId: string) => void;
}

export function AreaSystemsAndGoals({
  areaName,
  areaIcon,
  systems,
  dailyStates,
  metrics,
  onToggleTask,
  onToggleActive,
  onEditSystem,
  onAddMetric,
  onEditMetric,
  onDeleteMetric,
}: Props) {
  const activeSystems = systems.filter(s => s.is_active);
  const hasContent = activeSystems.length > 0 || metrics.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="h-px bg-border/50" />

      {/* Systems */}
      {activeSystems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">⚙️ Sistemas activos</span>
          </div>
          <div className="space-y-1.5">
            {activeSystems.map(sys => {
              const states = dailyStates[sys.id] || {};
              const allDone = sys.tasks.length > 0 && sys.tasks.every(t => states[t.id]);
              const doneCount = sys.tasks.filter(t => states[t.id]).length;
              return (
                <div
                  key={sys.id}
                  className="rounded-lg border border-primary/10 bg-primary/[0.02] p-2.5 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium flex-1",
                      allDone && "line-through text-muted-foreground/60"
                    )}>
                      {sys.name}
                    </span>
                    {sys.tasks.length > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {doneCount}/{sys.tasks.length}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => onEditSystem(sys)}
                    >
                      <Settings2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>

                  {sys.description && (
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{sys.description}</p>
                  )}

                  {sys.tasks.length > 0 && (
                    <div className="space-y-1 pl-0.5">
                      {sys.tasks.map(task => (
                        <label
                          key={task.id}
                          className={cn(
                            "flex items-center gap-1.5 cursor-pointer py-0.5",
                            allDone && "line-through text-muted-foreground/50",
                          )}
                        >
                          <Checkbox
                            checked={states[task.id] || false}
                            onCheckedChange={() => onToggleTask(sys.id, task.id)}
                            className="h-3 w-3"
                          />
                          <span className="text-[11px] leading-tight">{task.description}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {sys.tasks.length > 0 && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500/60 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((doneCount / sys.tasks.length) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Metrics */}
      {metrics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">📊 Metas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {metrics.map(metric => {
              const pct = metric.target_value > 0
                ? Math.min(100, Math.round((metric.current_value / metric.target_value) * 100))
                : 0;
              const getColor = (v: number) => v >= 80 ? 'text-green-500' : v >= 40 ? 'text-amber-500' : 'text-red-500';
              const getBarColor = (v: number) => v >= 80 ? 'bg-green-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
              return (
                <div
                  key={metric.id}
                  className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">{metric.metric_name}</span>
                      <span className={cn("text-xs font-bold shrink-0", getColor(pct))}>
                        {metric.current_value}/{metric.target_value}
                        <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{metric.unit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", getBarColor(pct))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className={cn("text-[10px] font-medium", getColor(pct))}>{pct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditMetric(metric)}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDeleteMetric(metric.id)}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add metric button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground w-full"
        onClick={onAddMetric}
      >
        <Plus className="h-3 w-3" /> Agregar meta
      </Button>
    </div>
  );
}
