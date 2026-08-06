import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { startOfWeek, endOfWeek, format, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useGoalProgress, Goal as GoalType, GoalTask } from '@/hooks/useGoalProgress';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { Target, CheckCircle2, Calendar, Clock, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface WeeklyGoalsProps {
  weekStart: Date;
  weekEnd: Date;
}

export function WeeklyGoals({ weekStart, weekEnd }: WeeklyGoalsProps) {
  const { goals, loading: goalsLoading, fetchGoalTasks } = useGoalProgress();
  const { objectives } = useWeeklyObjectives();
  const [goalTasksMap, setGoalTasksMap] = useState<Map<string, GoalTask[]>>(new Map());
  const [twelveWeekGoals, setTwelveWeekGoals] = useState<any[]>([]);

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'completed');

  useEffect(() => {
    if (activeGoals.length > 0) {
      activeGoals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        setGoalTasksMap(prev => new Map(prev).set(goal.id, tasks));
      });
    }
  }, [goals]);

  useEffect(() => {
    supabase.from('twelve_week_goals')
      .select('*')
      .eq('year', 2026)
      .order('category')
      .then(({ data }) => setTwelveWeekGoals(data || []));
  }, []);

  const getWeekTasks = (tasks: GoalTask[]) => {
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const d = parseISO(t.due_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
  };

  if (goalsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground animate-pulse">Cargando metas...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Objectives */}
      {objectives.length > 0 && (
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Objetivos de la Semana
              </h3>
              <Badge variant="outline" className="text-[10px] rounded-full">
                {objectives.length} activos
              </Badge>
            </div>
            <div className="space-y-2">
              {objectives.map(obj => {
                const pct = obj.target_value
                  ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100))
                  : obj.completed ? 100 : 0;
                return (
                  <div key={obj.id} className="flex items-center gap-3 text-sm">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", obj.completed ? "bg-green-500" : "bg-amber-500")} />
                    <span className={cn("flex-1 truncate", obj.completed && "line-through text-muted-foreground")}>{obj.title}</span>
                    {obj.target_value && (
                      <span className="text-xs text-muted-foreground font-mono">{obj.current_value}/{obj.target_value}</span>
                    )}
                    <Progress value={pct} className="w-16 h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quarterly Goals */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Metas Trimestrales Activas
        </h3>
        <Link to="/goals">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay metas activas</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Crea metas trimestrales para verlas aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeGoals.map(goal => {
            const allTasks = goalTasksMap.get(goal.id) || [];
            const weekTasks = getWeekTasks(allTasks);
            const completed = weekTasks.filter(t => t.completed).length;
            const isCore = goal.progress_percentage >= 50;

            return (
              <Card key={goal.id} className={cn(
                "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md",
                isCore && "ring-1 ring-primary/20"
              )}>
                {isCore && <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{goal.title}</p>
                        {isCore && <Badge className="text-[9px] h-4 rounded-full bg-primary/10 text-primary border-0 shrink-0">Core</Badge>}
                      </div>
                      {goal.area_id && (
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{goal.area_id}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {goal.progress_percentage}%
                    </Badge>
                  </div>

                  <Progress value={goal.progress_percentage} className="h-1.5" />

                  {weekTasks.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Esta semana ({completed}/{weekTasks.length})
                      </p>
                      {weekTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className={cn("w-3 h-3 shrink-0", task.completed ? "text-green-500" : "text-muted-foreground/30")} />
                          <span className={cn("truncate", task.completed && "line-through")}>{task.title}</span>
                          {task.due_date && (
                            <span className="text-[9px] text-muted-foreground/60 ml-auto shrink-0">
                              {format(parseISO(task.due_date), 'EEE', { locale: es })}
                            </span>
                          )}
                        </div>
                      ))}
                      {weekTasks.length > 3 && (
                        <p className="text-[10px] text-muted-foreground/60 pl-5">+{weekTasks.length - 3} más</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {allTasks.filter(t => t.completed).length}/{allTasks.length} tareas
                    </span>
                    {goal.target_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(goal.target_date), 'd MMM', { locale: es })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 12-Week Goals */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              Metas 12 Semanas
            </h3>
            <Link to="/12-week-year">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                Ver <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {twelveWeekGoals.filter(g => g.status !== 'completed' || g.progress_percentage > 0).slice(0, 6).map(goal => (
              <div key={goal.id} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{goal.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{goal.progress_percentage}%</span>
                  </div>
                  <Progress value={goal.progress_percentage} className="h-1 mt-0.5" />
                </div>
              </div>
            ))}
            {twelveWeekGoals.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">Sin metas de 12 semanas configuradas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
