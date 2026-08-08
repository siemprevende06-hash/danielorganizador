import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek, getWeek, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyGoals } from '@/components/monthly/MonthlyGoals';
import { MonthlyTimeBreakdown } from '@/components/monthly/MonthlyTimeBreakdown';
import { MonthlyTasks } from '@/components/monthly/MonthlyTasks';
import { MonthlySystemsStats } from '@/components/systems/MonthlySystemsStats';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { AreaEffortResultsPanel } from '@/components/areas/AreaEffortResultsPanel';
import { MonthlyReviewStats } from '@/components/self-review/MonthlyReviewStats';
import { getQuarterFromDate } from '@/lib/hierarchy';
import PeriodSections from '@/components/hierarchy/PeriodSections';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { FocusProcessPanel } from '@/components/focus/FocusProcessPanel';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';

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

const SOSTEN_IDS = [
  'rutina-activacion', 'alistamiento-desayuno', 'horario-regular', 'rutina-desactivacion',
  'skincare-manana', 'skincare-noche', 'banarme-vestirme',
  'pre-entreno', 'desayuno', 'merienda-1', 'almuerzo', 'merienda-2', 'comida', 'antes-dormir', 'suplementos',
]

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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { quarter, year } = getQuarterFromDate(currentMonth);
  const monthIndex = currentMonth.getMonth() - (quarter - 1) * 3;

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    const s = format(monthStart, 'yyyy-MM-dd');
    const e = format(monthEnd, 'yyyy-MM-dd');

    const [tasksRes, eTasksRes, reviewsRes, focusRes, systemsRes, areaStatsRes] = await Promise.all([
      supabase.from('tasks').select('*').gte('due_date', `${s}T00:00:00`).lte('due_date', `${e}T23:59:59`),
      supabase.from('entrepreneurship_tasks').select('*').gte('due_date', s).lte('due_date', e),
      supabase.from('daily_reviews').select('*').gte('review_date', s).lte('review_date', e),
      supabase.from('focus_sessions').select('*').gte('start_time', `${s}T00:00:00`).lte('start_time', `${e}T23:59:59`),
      supabase.from('daily_systems_tracking').select('tracking_date, completions, time_data').gte('tracking_date', s).lte('tracking_date', e),
      supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', s).lte('stat_date', e),
    ]);

    const allTasks = [...(tasksRes.data || []), ...(eTasksRes.data || [])];
    const reviews = reviewsRes.data || [];
    const focus = focusRes.data || [];
    const systems = systemsRes.data || [];
    const areaStats = areaStatsRes.data || [];
    const today = new Date();
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    setRawTasks(tasksRes.data || []);
    setFocusSessions(focus);

    // Aggregate area time per day
    const areaTimeByDay: Record<string, number> = {};
    areaStats.forEach((a: any) => {
      const key = a.stat_date;
      areaTimeByDay[key] = (areaTimeByDay[key] || 0) + (a.time_spent_minutes || 0);
    });

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
      const sysRow = systems.find((s: any) => s.tracking_date === dayStr);
      const completions = sysRow?.completions || {};
      const timeData = sysRow?.time_data || {};
      const sosteenDone = SOSTEN_IDS.filter(id => completions[id] === true).length;
      const sosteenPct = SOSTEN_IDS.length > 0 ? Math.round((sosteenDone / SOSTEN_IDS.length) * 100) : 0;
      const totalMin = Object.values(timeData as Record<string, number>).reduce((s: number, v) => s + (Number(v) || 0), 0);
      const taskPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const reviewScore = review?.overall_rating ? review.overall_rating * 20 : 0;
      const effortScore = Math.min(100, Math.round(totalMin / 1.2));
      const score = reviewScore > 0 ? reviewScore : Math.max(taskPct, sosteenPct, effortScore);
      return {
        date: day,
        tasksCompleted: completed,
        tasksTotal: total,
        score: isBefore(today, day) && !isSameDay(today, day) ? 0 : score,
        isToday: isSameDay(day, today),
        isFuture: isAfter(day, today) && !isSameDay(today, day),
        focusMin: fMin,
        reviewRating: review?.overall_rating ?? null,
      };
    });

    setDaysData(data);
    setLoading(false);
  };

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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mes {monthIndex + 1} de Q{quarter} · {year}
            </p>
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
        </div>

        <PeriodControlSection scope="month" start={monthStart} end={monthEnd} />

        <MonthlyReviewStats monthDate={currentMonth} />

        {/* Secciones del Mes (mismo diseño que 3 Meses) */}
        <PeriodSections scope="month" year={year} quarter={quarter} monthIndex={monthIndex} />

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

        {/* Weeks section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Semanas del mes</h2>
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

        {/* Events section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Eventos</h2>
          <NotionCalendar />
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

        {/* Metas section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Metas del Plan Mensual</h2>
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

        {/* Mejora section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Mejora</h2>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <MejoraProcessPanel anchorDate={monthStart} />
            </CardContent>
          </Card>
        </section>

        {/* Enfoque section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Enfoque</h2>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <FocusProcessPanel anchorDate={monthStart} />
            </CardContent>
          </Card>
        </section>

        {/* Effort section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Esfuerzo</h2>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <AreaEffortResultsPanel periodType="month" periodStart={monthStart} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}