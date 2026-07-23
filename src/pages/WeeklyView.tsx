import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeeklyObjectives } from '@/components/weekly/WeeklyObjectives';
import { WeeklySystemsStats } from '@/components/systems/WeeklySystemsStats';
import { WeeklyGoals } from '@/components/weekly/WeeklyGoals';
import { WeeklyTimeBreakdown } from '@/components/weekly/WeeklyTimeBreakdown';
import { WeeklyTasks } from '@/components/weekly/WeeklyTasks';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { AreaEffortResultsPanel } from '@/components/areas/AreaEffortResultsPanel';
import { LifeAreaScoresPanel } from '@/components/areas/LifeAreaScoresPanel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { MonthlyPlanSummary } from '@/components/monthly-planning/MonthlyPlanSummary';
import { WeeklyReviewStats } from '@/components/self-review/WeeklyReviewStats';

const AREAS = [
  { id: 'universidad', label: 'Universidad', icon: '🎓', color: 'bg-blue-500' },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: '💼', color: 'bg-purple-500' },
  { id: 'gym', label: 'Gym', icon: '💪', color: 'bg-red-500' },
  { id: 'idiomas', label: 'Idiomas', icon: '🌍', color: 'bg-emerald-500' },
  { id: 'proyectos', label: 'Proyectos', icon: '🚀', color: 'bg-amber-500' },
];

export default function WeeklyView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart.toISOString()]);

  const { objectives } = useWeeklyObjectives();

  const { data: weekData } = useQuery({
    queryKey: ['weeklyData', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');
      const [tasksRes, reviewsRes, activityRes, focusRes, habitsRes] = await Promise.all([
        supabase.from('tasks').select('*').gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
        supabase.from('daily_reviews').select('*').gte('review_date', startStr).lte('review_date', endStr),
        supabase.from('activity_tracking').select('*').gte('activity_date', startStr).lte('activity_date', endStr),
        supabase.from('focus_sessions').select('*').gte('start_time', `${startStr}T00:00:00`).lte('start_time', `${endStr}T23:59:59`),
        supabase.from('habit_history').select('*'),
      ]);
      return {
        tasks: tasksRes.data || [],
        reviews: reviewsRes.data || [],
        activities: activityRes.data || [],
        focusSessions: focusRes.data || [],
        habits: habitsRes.data || [],
      };
    }
  });

  const getDayData = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTasks = weekData?.tasks.filter(t => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === dateStr) || [];
    const review = weekData?.reviews.find(r => r.review_date === dateStr);
    const activities = weekData?.activities.filter(a => a.activity_date === dateStr) || [];
    const focusMin = weekData?.focusSessions
      .filter(f => format(new Date(f.start_time), 'yyyy-MM-dd') === dateStr)
      .reduce((sum, f) => sum + (f.duration_minutes || 0), 0) || 0;
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const score = review?.overall_rating ? review.overall_rating * 20 : (total > 0 ? Math.round((completed / total) * 100) : 0);
    const isFuture = isBefore(new Date(), day) && !isToday(day);
    return { tasks: dayTasks, completed, total, score, focusMin, activities, review, isFuture };
  };

  const areaBreakdown = useMemo(() => {
    if (!weekData) return [];
    return AREAS.map(area => {
      const areaTasks = weekData.tasks.filter(t => t.area_id === area.id);
      const completed = areaTasks.filter(t => t.completed).length;
      const obj = objectives.filter(o => o.area === area.id);
      const objProgress = obj.length > 0
        ? Math.round(obj.reduce((s, o) => s + (o.target_value ? Math.min((o.current_value / o.target_value) * 100, 100) : o.completed ? 100 : 0), 0) / obj.length)
        : null;
      return { ...area, tasksDone: completed, tasksTotal: areaTasks.length, objProgress, objCount: obj.length };
    }).filter(a => a.tasksTotal > 0 || a.objCount > 0);
  }, [weekData, objectives]);

  const monthForPlan = weekStart;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Semanal</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={() => setCurrentWeek(new Date())}>Hoy</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <WeeklyReviewStats weekStart={weekStart} />

        {/* Plan Mensual */}
        <MonthlyPlanSummary currentMonth={monthForPlan} />

        {/* Overview section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Resumen</h2>
          {/* Day cards — redesigned */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const d = getDayData(day);
              const active = isToday(day);
              const scoreColor = d.isFuture ? 'border-muted/30' : d.score >= 70 ? 'border-green-500/40 bg-green-500/5' : d.score >= 40 ? 'border-amber-500/40 bg-amber-500/5' : d.score > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-muted/20';
              return (
                <Card key={day.toISOString()} className={cn("border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-2xl transition-all", scoreColor, active && "ring-2 ring-primary ring-offset-2")}>
                  <CardContent className="p-2.5 space-y-2">
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-semibold text-muted-foreground/60">{format(day, 'EEE', { locale: es })}</p>
                      <p className={cn("text-xl font-bold leading-tight mt-0.5", active && "text-primary")}>{format(day, 'd')}</p>
                    </div>
                    {!d.isFuture && (
                      <>
                        <div className="flex justify-center">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                            d.score >= 70 ? "text-green-600 bg-green-500/15" :
                            d.score >= 40 ? "text-amber-600 bg-amber-500/15" :
                            d.score > 0 ? "text-destructive bg-destructive/10" :
                            "text-muted-foreground/40 bg-muted/30"
                          )}>
                            {d.score || '0'}
                          </div>
                        </div>
                        <div className="space-y-0.5 text-[9px] text-muted-foreground text-center">
                          <p>{d.completed}/{d.total} tareas</p>
                          {d.focusMin > 0 && <p className="text-[8px]">⏱ {d.focusMin}m</p>}
                        </div>
                        {d.total > 0 && (
                          <Progress value={(d.completed / d.total) * 100} className="h-0.5" />
                        )}
                      </>
                    )}
                    {d.isFuture && (
                      <p className="text-[9px] text-center text-muted-foreground/30 pt-3">—</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Heatmap */}
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Rendimiento diario</p>
              <div className="flex gap-1.5 h-20 items-end">
                {weekDays.map(day => {
                  const d = getDayData(day);
                  const pct = Math.max(d.score, 3);
                  return (
                    <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] text-muted-foreground/60 font-mono">{d.score > 0 ? d.score : ''}</span>
                      <div className="w-full flex-1 flex flex-col justify-end">
                        <div
                          className={cn(
                            "w-full rounded-lg transition-all min-h-[4px]",
                            d.score >= 70 ? "bg-green-500" : d.score >= 40 ? "bg-amber-500" : d.score > 0 ? "bg-destructive/50" : "bg-muted/30"
                          )}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground/60">{format(day, 'EEEEE', { locale: es })}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Goals section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Metas</h2>
          <WeeklyGoals weekStart={weekStart} weekEnd={weekEnd} />
        </section>

        {/* Time section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Tiempo</h2>
          <WeeklyTimeBreakdown weekStart={weekStart} weekEnd={weekEnd} />
        </section>

        {/* Tasks section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Tareas</h2>
          <WeeklyTasks weekStart={weekStart} weekEnd={weekEnd} />
        </section>

        {/* Objectives section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Objetivos</h2>
          <WeeklyObjectives />
        </section>

        {/* Areas section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Áreas</h2>
          <div className="space-y-2.5">
            {areaBreakdown.length === 0 && (
              <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">Sin actividad por áreas esta semana.</CardContent>
              </Card>
            )}
            {areaBreakdown.map(area => (
              <Card key={area.id} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1 h-10 rounded-full", area.color)} />
                      <div>
                        <p className="font-medium text-sm">{area.icon} {area.label}</p>
                        <p className="text-xs text-muted-foreground">{area.tasksDone}/{area.tasksTotal} tareas · {area.objCount} objetivo{area.objCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {area.objProgress !== null && (
                      <Badge variant="outline" className="font-mono text-[10px] rounded-full">{area.objProgress}%</Badge>
                    )}
                  </div>
                  <Progress value={area.tasksTotal > 0 ? (area.tasksDone / area.tasksTotal) * 100 : 0} className="h-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Systems section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Sistemas</h2>
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl p-4">
            <WeeklySystemsStats weekStart={weekStart} />
          </div>
        </section>

        {/* Effort section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Esfuerzo</h2>
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <LifeAreaScoresPanel periodType="week" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white/80 dark:bg-zinc-900/80 px-3 text-muted-foreground/60">Métricas detalladas</span>
                </div>
              </div>
              <AreaEffortResultsPanel periodType="week" periodStart={weekStart} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
