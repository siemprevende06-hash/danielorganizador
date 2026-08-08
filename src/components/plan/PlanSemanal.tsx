import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { GripVertical, CheckCircle2, Circle } from 'lucide-react';

interface WeekTask {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority?: string | null;
  source?: string | null;
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'border-l-red-400 bg-red-50/30 dark:bg-red-950/10',
  medium: 'border-l-amber-300 bg-amber-50/20 dark:bg-amber-950/10',
  low: 'border-l-gray-200',
};

export function PlanSemanal({ weekDays, tasks, queryKeyPrefix }: {
  weekDays: Date[];
  tasks: WeekTask[];
  queryKeyPrefix: string;
}) {
  const queryClient = useQueryClient();
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const dayStr = (d: Date) => format(d, 'yyyy-MM-dd');

  const moveTask = async (taskId: string, targetDay: string) => {
    setMoving(true);
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: `${targetDay}T12:00:00` })
      .eq('id', taskId);
    setMoving(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
    }
    setDragOverDay(null);
    setDraggingId(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) moveTask(taskId, dayStr(day));
    else {
      setDragOverDay(null);
      setDraggingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Plan de la semana</h2>
          <p className="text-xs text-muted-foreground">Arrastra una tarea a otro día para reprogramarla</p>
        </div>
        {moving && <Badge variant="secondary" className="text-xs">Moviendo...</Badge>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {weekDays.map(day => {
          const ds = dayStr(day);
          const dayTasks = tasks.filter(t => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === ds);
          const done = dayTasks.filter(t => t.completed).length;
          const isOver = dragOverDay === ds;
          return (
            <div
              key={ds}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverDay(ds);
              }}
              onDragLeave={() => setDragOverDay(prev => prev === ds ? null : prev)}
              onDrop={(e) => handleDrop(e, day)}
              className={cn(
                'rounded-2xl border-2 transition-all min-h-[180px]',
                isToday(day) && 'ring-2 ring-primary ring-offset-2',
                isOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm'
              )}
            >
              <div className="p-2 border-b border-muted/60">
                <p className="text-[9px] uppercase font-semibold text-muted-foreground/60">{format(day, 'EEE', { locale: es })}</p>
                <div className="flex items-center justify-between">
                  <p className={cn('text-lg font-bold leading-tight', isToday(day) && 'text-primary')}>{format(day, 'd')}</p>
                  <span className="text-[9px] text-muted-foreground">{done}/{dayTasks.length}</span>
                </div>
              </div>
              <div className="p-1.5 space-y-1">
                {dayTasks.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/40 text-center pt-6">Suelta tareas aquí</p>
                )}
                {dayTasks.map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', t.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggingId(t.id);
                    }}
                    onDragEnd={() => { setDraggingId(null); setDragOverDay(null); }}
                    className={cn(
                      'flex items-center gap-1.5 py-1 px-1.5 rounded-lg border-l-2 text-[10px] cursor-grab active:cursor-grabbing select-none',
                      PRIORITY_STYLE[t.priority || 'medium'] || PRIORITY_STYLE.medium,
                      t.completed && 'opacity-60',
                      draggingId === t.id && 'opacity-40'
                    )}
                    title={`Mover a otro día`}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                    {t.completed
                      ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      : <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                    <span className="truncate flex-1">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}