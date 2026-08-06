import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ListTodo, Target, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface MonthlyTasksProps {
  currentMonth: Date;
}

export function MonthlyTasks({ currentMonth }: MonthlyTasksProps) {
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['monthlyTasks', format(monthStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');
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
      queryClient.invalidateQueries({ queryKey: ['monthlyTasks', format(monthStart, 'yyyy-MM-dd')] });
    },
  });

  const weeks = useMemo(() => {
    const seen = new Set<number>();
    const result: { weekNum: number; start: Date; end: Date }[] = [];
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    monthDays.forEach(day => {
      const wn = getWeek(day, { weekStartsOn: 1 });
      if (seen.has(wn)) return;
      seen.add(wn);
      result.push({
        weekNum: wn,
        start: startOfWeek(day, { weekStartsOn: 1 }),
        end: endOfWeek(day, { weekStartsOn: 1 }),
      });
    });
    return result;
  }, [monthStart, monthEnd]);

  const tasksByWeek = useMemo(() => {
    const byWeek: Record<number, any[]> = {};
    weeks.forEach(w => { byWeek[w.weekNum] = []; });
    tasks.forEach((t: any) => {
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      if (!dueDate) return;
      const wn = getWeek(dueDate, { weekStartsOn: 1 });
      if (byWeek[wn]) byWeek[wn].push(t);
    });
    return byWeek;
  }, [tasks, weeks]);

  const filteredByWeek = useMemo(() => {
    if (!selectedArea) return tasksByWeek;
    const filtered: Record<number, any[]> = {};
    Object.entries(tasksByWeek).forEach(([weekNum, weekTasks]) => {
      filtered[Number(weekNum)] = weekTasks.filter((t: any) => t.area_id === selectedArea);
    });
    return filtered;
  }, [tasksByWeek, selectedArea]);

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
              Tareas del Mes — {monthName}
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

      {/* Week columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {weeks.map(week => {
          const weekTasks = filteredByWeek[week.weekNum] || [];
          const done = weekTasks.filter((t: any) => t.completed).length;
          const isCurrentWeek = getWeek(new Date(), { weekStartsOn: 1 }) === week.weekNum;

          return (
            <Card key={week.weekNum} className={cn(
              "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden",
              isCurrentWeek && "ring-2 ring-primary ring-offset-2"
            )}>
              <div className={cn("text-center py-2 border-b border-border/50", isCurrentWeek && "bg-primary/5")}>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground/60">Semana {week.weekNum}</p>
                <p className="text-[9px] text-muted-foreground">
                  {format(week.start, 'd MMM', { locale: es })} – {format(week.end, 'd MMM', { locale: es })}
                </p>
                {weekTasks.length > 0 && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{done}/{weekTasks.length} tareas</p>}
              </div>
              <div className="p-2 space-y-1 min-h-[100px]">
                {weekTasks.length === 0 && (
                  <p className="text-[9px] text-center text-muted-foreground/30 py-4">Sin tareas</p>
                )}
                {weekTasks.slice(0, 6).map((task: any) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask.mutate({ id: task.id, completed: task.completed })}
                    className="w-full flex items-start gap-1.5 text-left p-1.5 rounded hover:bg-muted/50 transition-colors group"
                  >
                    {task.completed
                      ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground/70" />
                    }
                    <span className={cn("text-[10px] leading-tight", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    {task.area_id && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 ml-auto shrink-0 capitalize">{task.area_id.slice(0, 4)}</Badge>
                    )}
                  </button>
                ))}
                {weekTasks.length > 6 && (
                  <p className="text-[8px] text-center text-muted-foreground/40">+{weekTasks.length - 6} más</p>
                )}
                {weekTasks.length > 0 && (
                  <Progress value={weekTasks.length > 0 ? (done / weekTasks.length) * 100 : 0} className="h-0.5 mt-1" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
