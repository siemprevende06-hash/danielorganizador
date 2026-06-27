import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek, getWeek, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, CheckCircle2, Target, Flame, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyAreaGoals } from '@/components/monthly/MonthlyAreaGoals';
import { MonthlySystemsStats } from '@/components/systems/MonthlySystemsStats';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { AreaEffortResultsPanel } from '@/components/areas/AreaEffortResultsPanel';

interface DayData {
  date: Date;
  tasksCompleted: number;
  tasksTotal: number;
  score: number;
  isToday: boolean;
  isFuture: boolean;
  focusMin: number;
  reviewRating: number | null;
}

const AREAS_META: Record<string, { icon: string; color: string }> = {
  universidad: { icon: '🎓', color: 'bg-blue-500' },
  emprendimiento: { icon: '💼', color: 'bg-purple-500' },
  gym: { icon: '💪', color: 'bg-red-500' },
  idiomas: { icon: '🌍', color: 'bg-emerald-500' },
  proyectos: { icon: '🚀', color: 'bg-amber-500' },
  lectura: { icon: '📖', color: 'bg-cyan-500' },
  musica: { icon: '🎵', color: 'bg-pink-500' },
};

export default function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    const s = format(monthStart, 'yyyy-MM-dd');
    const e = format(monthEnd, 'yyyy-MM-dd');

    const [tasksRes, eTasksRes, reviewsRes, focusRes] = await Promise.all([
      supabase.from('tasks').select('*').gte('due_date', `${s}T00:00:00`).lte('due_date', `${e}T23:59:59`),
      supabase.from('entrepreneurship_tasks').select('*').gte('due_date', s).lte('due_date', e),
      supabase.from('daily_reviews').select('*').gte('review_date', s).lte('review_date', e),
      supabase.from('focus_sessions').select('*').gte('start_time', `${s}T00:00:00`).lte('start_time', `${e}T23:59:59`),
    ]);

    const allTasks = [...(tasksRes.data || []), ...(eTasksRes.data || [])];
    const reviews = reviewsRes.data || [];
    const focus = focusRes.data || [];
    const today = new Date();
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    setRawTasks(tasksRes.data || []);
    setFocusSessions(focus);

    const data: DayData[] = monthDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = allTasks.filter(t => {
        const d = t.due_date?.split('T')[0];
        return d === dayStr;
      });
      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;
      const review = reviews.find(r => r.review_date === dayStr);
      const fMin = focus.filter(f => format(new Date(f.start_time), 'yyyy-MM-dd') === dayStr).reduce((a, f) => a + (f.duration_minutes || 0), 0);
      const score = review?.overall_rating ? review.overall_rating * 20 : (total > 0 ? Math.round((completed / total) * 100) : 0);
      return {
        date: day,
        tasksCompleted: completed,
        tasksTotal: total,
        score: isBefore(today, day) && !isSameDay(today, day) ? 0 : score,
        isToday: isSameDay(day, today),
        isFuture: isAfter(day, today) && !isSameDay(day, today),
        focusMin: fMin,
        reviewRating: review?.overall_rating ?? null,
      };
    });

    setDaysData(data);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const past = daysData.filter(d => !d.isFuture);
    const totalCompleted = past.reduce((s, d) => s + d.tasksCompleted, 0);
    const totalTasks = past.reduce((s, d) => s + d.tasksTotal, 0);
    const productive = past.filter(d => d.score >= 50).length;
    const scores = past.filter(d => d.score > 0).map(d => d.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const focusH = Math.round(past.reduce((s, d) => s + d.focusMin, 0) / 60 * 10) / 10;

    const mid = Math.floor(past.length / 2);
    const h1 = past.slice(0, mid);
    const h2 = past.slice(mid);
    const a1 = h1.length > 0 ? h1.reduce((s, d) => s + d.score, 0) / h1.length : 0;
    const a2 = h2.length > 0 ? h2.reduce((s, d) => s + d.score, 0) / h2.length : 0;
    const trend: 'up' | 'down' | 'stable' = a2 > a1 + 5 ? 'up' : a2 < a1 - 5 ? 'down' : 'stable';

    const best = past.length > 0 ? past.reduce((b, d) => d.score > b.score ? d : b, past[0]) : null;

    return { totalCompleted, totalTasks, productive, totalDays: past.length, avg, trend, focusH, best };
  }, [daysData]);

  // Area breakdown
  const areaStats = useMemo(() => {
    const byArea: Record<string, { done: number; total: number }> = {};
    rawTasks.forEach(t => {
      const area = t.area_id || 'general';
      if (!byArea[area]) byArea[area] = { done: 0, total: 0 };
      byArea[area].total++;
      if (t.completed) byArea[area].done++;
    });
    return Object.entries(byArea)
      .map(([id, d]) => ({ id, ...d, meta: AREAS_META[id] }))
      .sort((a, b) => b.total - a.total);
  }, [rawTasks]);

  // Weekly breakdown
  const weeklyBreakdown = useMemo(() => {
    const weeks: { weekNum: number; start: Date; end: Date; score: number; tasks: number; done: number }[] = [];
    const seen = new Set<number>();
    daysData.forEach(d => {
      const wn = getWeek(d.date, { weekStartsOn: 1 });
      if (seen.has(wn)) return;
      seen.add(wn);
      const ws = startOfWeek(d.date, { weekStartsOn: 1 });
      const we = endOfWeek(d.date, { weekStartsOn: 1 });
      const wDays = daysData.filter(dd => dd.date >= ws && dd.date <= we && !dd.isFuture);
      const tasks = wDays.reduce((s, dd) => s + dd.tasksTotal, 0);
      const done = wDays.reduce((s, dd) => s + dd.tasksCompleted, 0);
      const scores = wDays.filter(dd => dd.score > 0).map(dd => dd.score);
      const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      weeks.push({ weekNum: wn, start: ws, end: we, score, tasks, done });
    });
    return weeks;
  }, [daysData]);

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() + (dir === 'prev' ? -1 : 1));
      return n;
    });
  };

  const firstDayOfMonth = monthStart.getDay();
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-5xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h1>
          <p className="text-sm text-muted-foreground">Vista mensual de productividad</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat icon={<BarChart3 className="w-4 h-4" />} label="Score prom." value={`${stats.avg}%`}
          extra={stats.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-500" /> : stats.trend === 'down' ? <TrendingDown className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />} />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Tareas" value={`${stats.totalCompleted}/${stats.totalTasks}`} />
        <MiniStat icon={<Flame className="w-4 h-4" />} label="Días productivos" value={`${stats.productive}/${stats.totalDays}`} />
        <MiniStat icon={<Clock className="w-4 h-4" />} label="Horas foco" value={`${stats.focusH}h`} />
        <MiniStat icon={<Target className="w-4 h-4" />} label="Mejor día"
          value={stats.best ? `${stats.best.score}%` : '–'}
          extra={stats.best ? <span className="text-[9px] text-muted-foreground">{format(stats.best.date, 'd MMM', { locale: es })}</span> : null} />
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="weeks">Semanas</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="esfuerzo">Esfuerzo</TabsTrigger>
          <TabsTrigger value="sistemas">Sistemas</TabsTrigger>
        </TabsList>

        {/* Calendar tab */}
        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="animate-pulse grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startPadding }).map((_, i) => <div key={`p-${i}`} />)}
                    {daysData.map(day => (
                      <div
                        key={day.date.toISOString()}
                        className={cn(
                          "aspect-square rounded-lg p-1.5 flex flex-col items-center justify-center transition-all text-xs border",
                          day.isFuture && "opacity-30 border-transparent",
                          day.isToday && "ring-2 ring-primary",
                          !day.isFuture && day.score >= 70 && "bg-green-500/15 border-green-500/30",
                          !day.isFuture && day.score >= 40 && day.score < 70 && "bg-amber-500/15 border-amber-500/30",
                          !day.isFuture && day.score > 0 && day.score < 40 && "bg-destructive/15 border-destructive/30",
                          !day.isFuture && day.score === 0 && "bg-muted/50 border-transparent",
                        )}
                      >
                        <span className={cn("font-bold", day.isToday && "text-primary")}>
                          {format(day.date, 'd')}
                        </span>
                        {!day.isFuture && day.score > 0 && (
                          <span className="text-[9px] text-muted-foreground font-mono">{day.score}%</span>
                        )}
                        {!day.isFuture && day.tasksTotal > 0 && (
                          <span className="text-[8px] text-muted-foreground">
                            {day.tasksCompleted}/{day.tasksTotal}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground justify-center">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" /> ≥70%</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" /> 40-69%</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> &lt;40%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events tab */}
        <TabsContent value="events">
          <NotionCalendar />
        </TabsContent>

        {/* Weeks tab */}
        <TabsContent value="weeks" className="space-y-3">
          {weeklyBreakdown.map(w => (
            <Card key={w.weekNum}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">Semana {w.weekNum}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(w.start, 'd MMM', { locale: es })} – {format(w.end, 'd MMM', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={w.score >= 70 ? 'default' : w.score >= 40 ? 'secondary' : 'outline'}>
                      {w.score}%
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{w.done}/{w.tasks} tareas</p>
                  </div>
                </div>
                <Progress value={w.tasks > 0 ? (w.done / w.tasks) * 100 : 0} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Areas tab */}
        <TabsContent value="areas" className="space-y-3">
          {areaStats.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Sin tareas este mes.</CardContent></Card>
          )}
          {areaStats.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-8 rounded-full", a.meta?.color || 'bg-muted-foreground')} />
                    <div>
                      <p className="font-medium text-sm">{a.meta?.icon || '📋'} {a.id}</p>
                      <p className="text-xs text-muted-foreground">{a.done} de {a.total} tareas</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold font-mono">{a.total > 0 ? Math.round((a.done / a.total) * 100) : 0}%</span>
                </div>
                <Progress value={a.total > 0 ? (a.done / a.total) * 100 : 0} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Goals tab */}
        <TabsContent value="goals">
          <MonthlyAreaGoals currentMonth={currentMonth} />
        </TabsContent>

        <TabsContent value="sistemas">
          <MonthlySystemsStats monthDate={currentMonth} />
        </TabsContent>

        <TabsContent value="esfuerzo">
          <Card>
            <CardContent className="p-4">
              <AreaEffortResultsPanel periodType="month" periodStart={monthStart} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon, label, value, extra }: { icon: React.ReactNode; label: string; value: string; extra?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold leading-none">{value}</p>
            {extra}
          </div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

