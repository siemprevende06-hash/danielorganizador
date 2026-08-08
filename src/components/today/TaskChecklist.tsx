import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { TaskItem } from '@/hooks/useDailyPlanData';

const GROUPS: { key: string; label: string; color: string }[] = [
  { key: 'universidad', label: 'Universidad', color: 'text-blue-500' },
  { key: 'emprendimiento', label: 'Emprendimiento', color: 'text-purple-500' },
  { key: 'proyectos', label: 'Proyectos', color: 'text-amber-500' },
  { key: 'general', label: 'Tareas generales', color: 'text-muted-foreground' },
];

const ALIAS: Record<string, string> = {
  university: 'universidad',
  entrepreneurship: 'emprendimiento',
  entrepreneur: 'emprendimiento',
  project: 'proyectos',
  proyectos: 'proyectos',
};

const groupOf = (t: TaskItem): string => {
  const raw = t.area_id || t.source;
  if (!raw) return 'general';
  return ALIAS[raw.toLowerCase()] || 'general';
};

export function TaskChecklist({ tasks, onToggle }: {
  tasks: TaskItem[];
  onToggle: (taskId: string) => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (taskId: string) => {
    setToggling(taskId);
    try {
      await onToggle(taskId);
    } finally {
      setToggling(null);
    }
  };

  const done = tasks.filter(t => t.completed).length;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Tareas del día</h3>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
            {done}/{tasks.length} hechas
          </Badge>
        </div>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sin tareas para hoy. Crea una en el panel de tareas.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {GROUPS.map(g => {
              const groupTasks = tasks.filter(t => groupOf(t) === g.key);
              if (groupTasks.length === 0) return null;
              return (
                <div key={g.key} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className={g.color}>•</span>
                    <span>{g.label}</span>
                    <span className="text-[9px] text-muted-foreground/60">({groupTasks.filter(t => t.completed).length}/{groupTasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {groupTasks.map(task => (
                      <div key={task.id}
                        className={cn(
                          'flex items-start gap-2.5 p-2 rounded-xl border text-xs transition-colors',
                          task.completed
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60'
                            : 'border-border/50 hover:bg-muted/30'
                        )}>
                        <button
                          onClick={() => handleToggle(task.id)}
                          className={cn(
                            'mt-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'
                          )}
                          title={task.completed ? 'Desmarcar' : 'Marcar como hecha'}
                        >
                          {toggling === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : task.completed && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('leading-snug break-words', task.completed && 'line-through text-muted-foreground')}>{task.title}</p>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 mt-1">Alta</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}