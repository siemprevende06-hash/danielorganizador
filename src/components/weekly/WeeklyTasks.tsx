import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, Target, ListTodo, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface WeeklyTasksProps {
  weekStart: Date;
  weekEnd: Date;
}

const AREA_COLORS: Record<string, string> = {
  universidad: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  emprendimiento: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  proyectos: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  gym: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  idiomas: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function WeeklyTasks({ weekStart, weekEnd }: WeeklyTasksProps) {
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart.getTime(), weekEnd.getTime()]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['weeklyTasks', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', `${startStr}T00:00:00`)
        .lte('due_date', `${endStr}T23:59:59`)
        .order('due_date');
      return data || [];
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyTasks', format(weekStart, 'yyyy-MM-dd')] });
    },
  });

  const tasksByDay = useMemo(() => {
    const byDay: Record<string, any[]> = {};
    weekDays.forEach(d => { byDay[format(d, 'yyyy-MM-dd')] = []; });
    tasks.forEach((t: any) => {
      const dayStr = t.due_date?.split('T')[0];
      if (dayStr && byDay[dayStr]) {
        byDay[dayStr].push(t);
      }
    });
    return byDay;
  }, [tasks, weekDays]);

  const filteredByDay = useMemo(() => {
    if (!selectedArea) return tasksByDay;
    const filtered: Record<string, any[]> = {};
    Object.entries(tasksByDay).forEach(([day, dayTasks]) => {
      filtered[day] = dayTasks.filter((t: any) => t.area_id === selectedArea);
    });
    return filtered;
  }, [tasksByDay, selectedArea]);

  const allAreas = useMemo(() => {
    const areas = new Set<string>();
    tasks.forEach((t: any) => { if (t.area_id) areas.add(t.area_id); });
    return Array.from(areas);
  }, [tasks]);

  const totalCompleted = tasks.filter((t: any) => t.completed).length;
  const totalTasks = tasks.length;
  const overallPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground animate-pulse">Cargando tareas...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5" />
              Tareas de la Semana
            </h3>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg font-bold">{totalCompleted}/{totalTasks}</span>
            <Progress value={overallPct} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground">{overallPct}%</span>
          </div>

          {/* Area filter */}
          {allAreas.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <button
                onClick={() => setSelectedArea(null)}
                className={cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors",
                  !selectedArea ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Todas
              </button>
              {allAreas.map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area === selectedArea ? null : area)}
                  className={cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors capitalize",
                    selectedArea === area
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTasks = filteredByDay[dayStr] || [];
          const done = dayTasks.filter((t: any) => t.completed).length;
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Card key={dayStr} className={cn(
              "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden",
              isToday && "ring-2 ring-primary ring-offset-2"
            )}>
              <div className={cn(
                "text-center py-2 border-b border-border/50",
                isToday && "bg-primary/5"
              )}>
                <p className="text-[9px] uppercase font-semibold text-muted-foreground/60">{DAY_LABELS[i]}</p>
                <p className={cn("text-base font-bold leading-tight", isToday && "text-primary")}>{format(day, 'd')}</p>
                {dayTasks.length > 0 && (
                  <p className="text-[9px] text-muted-foreground/60">{done}/{dayTasks.length}</p>
                )}
              </div>
              <div className="p-1.5 space-y-1 min-h-[80px]">
                {dayTasks.length === 0 && (
                  <p className="text-[9px] text-center text-muted-foreground/30 py-4">—</p>
                )}
                {dayTasks.slice(0, 4).map((task: any) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask.mutate({ id: task.id, completed: task.completed })}
                    className="w-full flex items-start gap-1.5 text-left p-1 rounded hover:bg-muted/50 transition-colors group"
                  >
                    {task.completed
                      ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground/70" />
                    }
                    <span className={cn(
                      "text-[10px] leading-tight",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </button>
                ))}
                {dayTasks.length > 4 && (
                  <p className="text-[8px] text-center text-muted-foreground/40">+{dayTasks.length - 4} más</p>
                )}
                {dayTasks.length > 0 && (
                  <Progress value={dayTasks.length > 0 ? (done / dayTasks.length) * 100 : 0} className="h-0.5 mt-1" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
