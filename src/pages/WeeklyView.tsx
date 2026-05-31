import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Calendar, Flame, CheckCircle2, Clock, BarChart3, Zap } from 'lucide-react';
import { WeeklyObjectives } from '@/components/weekly/WeeklyObjectives';
import { WeeklySystemsStats } from '@/components/systems/WeeklySystemsStats';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

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

  const { objectives, loading: objectivesLoading, getOverallProgress } = useWeeklyObjectives();

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

  const weekStats = useMemo(() => {
    if (!weekData) return { tasks: 0, totalTasks: 0, focusHours: 0, avgScore: 0, bestStreak: 0 };
    const completed = weekData.tasks.filter(t => t.completed).length;
    const total = weekData.tasks.length;
    const focusMin = weekData.focusSessions.reduce((s, f) => s + (f.duration_minutes || 0), 0);
    const scores = weekDays.map(d => getDayData(d).score).filter(s => s > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    let streak = 0, maxStreak = 0;
    weekDays.forEach(d => {
      const dd = getDayData(d);
      if (dd.score >= 50) { streak++; maxStreak = Math.max(maxStreak, streak); } else { streak = 0; }
    });
    return { tasks: completed, totalTasks: total, focusHours: Math.round(focusMin / 60 * 10) / 10, avgScore: avg, bestStreak: maxStreak };
  }, [weekData, weekDays]);

  const overallProgress = getOverallProgress();

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

  return (
    <div className="container mx-auto px-4 py-24 pb-24 space-y-6 max-w-5xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vista Semanal</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>Hoy</Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Tareas" value={`${weekStats.tasks}/${weekStats.totalTasks}`} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Horas foco" value={`${weekStats.focusHours}h`} />
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Score prom." value={`${weekStats.avgScore}%`} />
        <StatCard icon={<Target className="w-4 h-4" />} label="Objetivos" value={`${overallProgress}%`} />
        <StatCard icon={<Flame className="w-4 h-4" />} label="Mejor racha" value={`${weekStats.bestStreak}d`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="areas">Por Área</TabsTrigger>
          <TabsTrigger value="sistemas">Sistemas</TabsTrigger>
        </TabsList>

        {/* TAB: Overview with day cards */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const d = getDayData(day);
              const active = isToday(day);
              return (
                <Card key={day.toISOString()} className={cn(
                  "transition-all",
                  active && "ring-2 ring-primary",
                  d.isFuture && "opacity-50"
                )}>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-medium text-muted-foreground">
                        {format(day, 'EEE', { locale: es })}
                      </p>
                      <p className={cn("text-lg font-bold", active && "text-primary")}>{format(day, 'd')}</p>
                    </div>

                    {/* Score ring */}
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2",
                        d.score >= 70 ? "border-green-500 text-green-600 bg-green-500/10" :
                        d.score >= 40 ? "border-amber-500 text-amber-600 bg-amber-500/10" :
                        d.score > 0 ? "border-destructive text-destructive bg-destructive/10" :
                        "border-muted text-muted-foreground"
                      )}>
                        {d.isFuture ? '–' : `${d.score}`}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-muted-foreground text-center">
                      <p>✅ {d.completed}/{d.total}</p>
                      {d.focusMin > 0 && <p>⏱ {d.focusMin}m</p>}
                    </div>

                    {/* Mini progress */}
                    {!d.isFuture && d.total > 0 && (
                      <Progress value={d.total > 0 ? (d.completed / d.total) * 100 : 0} className="h-1" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Week heatmap bar */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Rendimiento diario</p>
              <div className="flex gap-1 h-16">
                {weekDays.map(day => {
                  const d = getDayData(day);
                  const pct = Math.max(d.score, 5);
                  return (
                    <div key={day.toISOString()} className="flex-1 flex flex-col justify-end">
                      <div
                        className={cn(
                          "rounded-t transition-all",
                          d.score >= 70 ? "bg-green-500" : d.score >= 40 ? "bg-amber-500" : d.score > 0 ? "bg-destructive/60" : "bg-muted"
                        )}
                        style={{ height: `${pct}%` }}
                      />
                      <p className="text-[9px] text-center text-muted-foreground mt-1">
                        {format(day, 'EEEEE', { locale: es })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Objectives */}
        <TabsContent value="objectives">
          <WeeklyObjectives />
        </TabsContent>

        {/* TAB: Area Breakdown */}
        <TabsContent value="areas" className="space-y-3">
          {areaBreakdown.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No hay actividad por áreas esta semana.</CardContent></Card>
          )}
          {areaBreakdown.map(area => (
            <Card key={area.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-8 rounded-full", area.color)} />
                    <div>
                      <p className="font-medium text-sm">{area.icon} {area.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.tasksDone}/{area.tasksTotal} tareas · {area.objCount} objetivo{area.objCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {area.objProgress !== null && (
                    <Badge variant="outline" className="font-mono">{area.objProgress}%</Badge>
                  )}
                </div>
                <Progress value={area.tasksTotal > 0 ? (area.tasksDone / area.tasksTotal) * 100 : 0} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Systems Stats */}
        <TabsContent value="sistemas" className="space-y-4">
          <WeeklySystemsStats weekStart={weekStart} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
