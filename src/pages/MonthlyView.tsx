import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek, getWeek, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, CheckCircle2, Target, Flame, Clock, BarChart3, Trophy, Book, Music, FolderKanban, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MonthlyGoals } from '@/components/monthly/MonthlyGoals';
import { MonthlyTimeBreakdown } from '@/components/monthly/MonthlyTimeBreakdown';
import { MonthlyTasks } from '@/components/monthly/MonthlyTasks';
import { MonthlySystemsStats } from '@/components/systems/MonthlySystemsStats';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { AreaEffortResultsPanel } from '@/components/areas/AreaEffortResultsPanel';
import { LifeAreaScoresPanel } from '@/components/areas/LifeAreaScoresPanel';
import { useOverallSystemStreak } from '@/hooks/useOverallSystemStreak';
import { useTrimestralPlan, getQuarterFromDate } from '@/hooks/useTrimestralPlan';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';

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
  const { streak: overallStreak } = useOverallSystemStreak();
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { quarter, year } = getQuarterFromDate(currentMonth);
  const monthIndex = currentMonth.getMonth() - (quarter - 1) * 3;
  const monthKey = `month${monthIndex + 1}` as 'month1' | 'month2' | 'month3';
  const { planData: trimestralPlan, loading: trimestralLoading } = useTrimestralPlan(quarter, year);

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

  const hasTrimestralPlan = !trimestralLoading && (
    trimestralPlan.books.goal > 0 ||
    trimestralPlan.songs.goal > 0 ||
    (trimestralPlan.monthProjects[monthKey]?.length || 0) > 0 ||
    (trimestralPlan.monthSubjects[monthKey]?.length || 0) > 0 ||
    trimestralPlan.personal_goals.length > 0
  );

  const trimestralItems = hasTrimestralPlan ? [
    trimestralPlan.books.goal > 0 && {
      icon: <Book className="w-3.5 h-3.5" />,
      label: 'Libros',
      count: trimestralPlan.distribution[monthKey]?.books.length || 0,
      goal: trimestralPlan.books.goal,
      color: 'indigo' as const,
      textColor: 'text-indigo-500',
    },
    trimestralPlan.songs.goal > 0 && {
      icon: <Music className="w-3.5 h-3.5" />,
      label: 'Canciones',
      count: trimestralPlan.distribution[monthKey]?.songs.length || 0,
      goal: trimestralPlan.songs.goal,
      color: 'emerald' as const,
      textColor: 'text-emerald-500',
    },
    (trimestralPlan.monthProjects[monthKey]?.length || 0) > 0 && {
      icon: <FolderKanban className="w-3.5 h-3.5" />,
      label: 'Proyectos',
      count: trimestralPlan.monthProjects[monthKey]?.length || 0,
      color: 'amber' as const,
      textColor: 'text-amber-500',
    },
    (trimestralPlan.monthSubjects[monthKey]?.length || 0) > 0 && {
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      label: 'Asignaturas',
      count: trimestralPlan.monthSubjects[monthKey]?.length || 0,
      color: 'blue' as const,
      textColor: 'text-blue-500',
    },
    trimestralPlan.personal_goals.length > 0 && {
      icon: <Target className="w-3.5 h-3.5" />,
      label: 'Metas',
      count: trimestralPlan.personal_goals.length,
      color: 'purple' as const,
      textColor: 'text-purple-500',
    },
  ].filter(Boolean) : [];

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MiniStat icon={<BarChart3 className="w-4 h-4" />} label="Score prom." value={`${stats.avg}%`}
          extra={stats.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-500" /> : stats.trend === 'down' ? <TrendingDown className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />} />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="Tareas" value={`${stats.totalCompleted}/${stats.totalTasks}`} />
        <MiniStat icon={<Flame className="w-4 h-4" />} label="Días productivos" value={`${stats.productive}/${stats.totalDays}`} />
        <MiniStat icon={<Clock className="w-4 h-4" />} label="Horas foco" value={`${stats.focusH}h`} />
        <MiniStat icon={<Target className="w-4 h-4" />} label="Mejor día"
          value={stats.best ? `${stats.best.score}%` : '–'}
          extra={stats.best ? <span className="text-[9px] text-muted-foreground">{format(stats.best.date, 'd MMM', { locale: es })}</span> : null} />
        <MiniStat icon={<Flame className="w-4 h-4 text-orange-500" />} label="Racha"
          value={`${overallStreak.current}d`}
          extra={overallStreak.longest > 0 ? <span className="flex items-center gap-0.5 text-[9px] text-yellow-600"><Trophy className="h-2.5 w-2.5" />{overallStreak.longest}</span> : null} />
      </div>

      {/* Plan Trimestral */}
      {trimestralLoading ? (
        <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="p-4 animate-pulse h-16 bg-muted/20 rounded" />
        </Card>
      ) : hasTrimestralPlan ? (
        <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold">Plan Trimestral · Mes {monthIndex + 1}</span>
              </div>
              <Link to="/trimestral-planning" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                Editar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
              {(trimestralItems as any[]).map((item: any) => (
                <div key={item.label} className="flex items-center gap-2 shrink-0">
                  <ProgressRing
                    progress={item.goal && item.goal > 0 ? Math.round((item.count / item.goal) * 100) : item.count > 0 ? 100 : 0}
                    size={40}
                    strokeWidth={3}
                    strokeColor={item.color}
                  >
                    <span className={`text-[9px] font-bold ${item.textColor}`}>
                      {item.goal ? `${item.count}/${item.goal}` : item.count}
                    </span>
                  </ProgressRing>
                  <div>
                    <p className="text-[11px] font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.goal ? `${item.count} de ${item.goal}` : `${item.count} items`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              Sin plan trimestral para este mes
            </div>
            <Link to="/trimestral-planning" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
              Crear plan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      )}

      {/* Calendar section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Calendario</h2>
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

                <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground justify-center">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" /> ≥70%</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" /> 40-69%</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> &lt;40%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Events section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Eventos</h2>
        <NotionCalendar />
      </section>

      {/* Weeks section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Semanas</h2>
        <div className="space-y-3">
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
        </div>
      </section>

      {/* Areas section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Áreas</h2>
        <div className="space-y-3">
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
        </div>
      </section>

      {/* Goals section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Metas</h2>
        <MonthlyGoals currentMonth={currentMonth} />
      </section>

      {/* Time section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Tiempo</h2>
        <MonthlyTimeBreakdown currentMonth={currentMonth} />
      </section>

      {/* Tasks section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Tareas</h2>
        <MonthlyTasks currentMonth={currentMonth} />
      </section>

      {/* Systems section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Sistemas</h2>
        <MonthlySystemsStats monthDate={currentMonth} />
      </section>

      {/* Effort section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Esfuerzo</h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <LifeAreaScoresPanel periodType="month" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white dark:bg-zinc-900 px-3 text-muted-foreground/60">Métricas detalladas</span>
              </div>
            </div>
            <AreaEffortResultsPanel periodType="month" periodStart={monthStart} />
          </CardContent>
        </Card>
      </section>
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
