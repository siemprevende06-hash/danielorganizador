import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ListChecks, RefreshCw, AlertTriangle } from 'lucide-react';
import { WeeklyTimeBreakdown } from '@/components/weekly/WeeklyTimeBreakdown';
import { WeeklyAgenda } from '@/components/weekly/WeeklyAgenda';
import { WeeklySystemsStats } from '@/components/systems/WeeklySystemsStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { MonthlyPlanSummary } from '@/components/monthly-planning/MonthlyPlanSummary';
import { getQuarterFromDate } from '@/lib/hierarchy';
import PeriodSections from '@/components/hierarchy/PeriodSections';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { FocusProcessPanel } from '@/components/focus/FocusProcessPanel';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle, type PeriodViewMode } from '@/components/control/EsfuerzoResultadosToggle';
import { PlanSemanal } from '@/components/plan/PlanSemanal';
import { WeeklyObjectives } from '@/components/weekly/WeeklyObjectives';
import { ResultadosSemana } from '@/components/resultados/ResultadosSemana';
import { PeriodAreaTasks } from '@/components/tasks/PeriodAreaTasks';
import { AutocriticaSection } from '@/components/autocritica/AutocriticaSection';
import { WeekComparisonCard } from '@/components/dashboard/WeekComparisonCard';

const VALID_MODES: PeriodViewMode[] = ['plan', 'esfuerzo', 'sistemas', 'resultados', 'autocritica'];
const WEEK_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function WeeklyView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const weekParam = searchParams.get('week');
  const parsedWeek = weekParam && WEEK_PARAM_REGEX.test(weekParam) ? new Date(`${weekParam}T12:00:00`) : null;
  const initialWeek = parsedWeek && !isNaN(parsedWeek.getTime()) ? parsedWeek : new Date();
  const initialMode = VALID_MODES.includes(searchParams.get('mode') as PeriodViewMode)
    ? (searchParams.get('mode') as PeriodViewMode)
    : 'esfuerzo';

  const [currentWeek, setCurrentWeek] = useState<Date>(initialWeek);
  const [viewMode, setViewMode] = useState<PeriodViewMode>(initialMode);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekStartKey = format(weekStart, 'yyyy-MM-dd');
  const weekEndKey = format(weekEnd, 'yyyy-MM-dd');
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStartKey, weekEndKey]
  );

  const syncParams = (targetWeek: Date, mode?: PeriodViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('week', format(startOfWeek(targetWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    if (mode) params.set('mode', mode);
    setSearchParams(params, { replace: true });
  };

  const goWeek = (dir: 1 | -1) => {
    const target = addWeeks(weekStart, dir);
    setCurrentWeek(target);
    syncParams(target);
  };

  const goToday = () => {
    setCurrentWeek(new Date());
    syncParams(new Date());
  };

  const changeMode = (mode: PeriodViewMode) => {
    setViewMode(mode);
    syncParams(currentWeek, mode);
  };

  const { data: weekData, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['weeklyData', weekStartKey],
    enabled: viewMode !== 'autocritica',
    queryFn: async () => {
      const startStr = weekStartKey;
      const endStr = weekEndKey;
      const [tasksRes, reviewsRes, activityRes, focusRes, systemsRes, areaStatsRes] = await Promise.all([
        supabase.from('tasks').select('*').gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
        supabase.from('daily_reviews').select('*').gte('review_date', startStr).lte('review_date', endStr),
        supabase.from('activity_tracking').select('*').gte('activity_date', startStr).lte('activity_date', endStr),
        supabase.from('focus_sessions').select('*').gte('start_time', `${startStr}T00:00:00`).lte('start_time', `${endStr}T23:59:59`),
        supabase.from('daily_systems_tracking').select('tracking_date, completions, time_data, workout_duration').gte('tracking_date', startStr).lte('tracking_date', endStr),
        supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', startStr).lte('stat_date', endStr),
      ]);
      return {
        tasks: tasksRes.data || [],
        reviews: reviewsRes.data || [],
        activities: activityRes.data || [],
        focusSessions: focusRes.data || [],
        systems: systemsRes.data || [],
        areaStats: areaStatsRes.data || [],
      };
    }
  });

  const SOSTEN_IDS = [
    'meditacion', 'lectura_inspiradora', 'oracion', 'diario_agradecimiento',
    'ejercicio_mañana', 'caminata', 'hidratacion_agua',
    'bajar_pantallas', 'orden_habitacion', 'lectura_biblia',
    'suplementos', 'plan_dia', 'revision_dia',
  ];

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

    // Daily systems data
    const sysRow = weekData?.systems.find((s: any) => s.tracking_date === dateStr);
    const completions = sysRow?.completions || {};
    const timeData = sysRow?.time_data || {};
    const sosteenDone = SOSTEN_IDS.filter(id => completions[id] === true).length;
    const sosteenPct = SOSTEN_IDS.length > 0 ? Math.round((sosteenDone / SOSTEN_IDS.length) * 100) : 0;
    const totalMin = Object.values(timeData as Record<string, number>).reduce((s: number, v) => s + (Number(v) || 0), 0);

    const taskPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const reviewScore = review?.overall_rating ? review.overall_rating * 20 : 0;
    const effortScore = Math.min(100, Math.round(totalMin / 1.2));
    const score = reviewScore > 0 ? reviewScore : Math.max(taskPct, sosteenPct, effortScore);

    const isFuture = isBefore(new Date(), day) && !isToday(day);
    return { tasks: dayTasks, completed, total, score, focusMin, activities, review, isFuture };
  };

  const monthForPlan = weekStart;
  const { quarter, year } = getQuarterFromDate(weekStart);

  const usesWeekData = viewMode === 'plan' || viewMode === 'esfuerzo';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex justify-center">
          <EsfuerzoResultadosToggle value={viewMode} onChange={changeMode} withAutocritica />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Semana</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d 'de' MMMM", { locale: es })}
            </p>
            {isFetching && !isLoading && (
              <p className="text-[10px] text-muted-foreground/70 animate-pulse mt-0.5">Sincronizando…</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={() => navigate('/weekly-planning')}>
              <ListChecks className="w-4 h-4 mr-1" /> Planificación
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => goWeek(-1)} aria-label="Semana anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full" onClick={goToday}>Hoy</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => goWeek(1)} aria-label="Semana siguiente">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isError && usesWeekData && (
          <Card className="border-destructive/40 bg-destructive/5 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive flex-1">
                No se pudieron cargar los datos de la semana. Revisa tu conexión.
              </p>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && usesWeekData ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : viewMode === 'plan' ? (
          <>
            <PlanSemanal weekDays={weekDays} tasks={weekData?.tasks || []} queryKeyPrefix="weeklyData" />
            <WeeklyObjectives weekStartDate={weekStart} />
          </>
        ) : viewMode === 'esfuerzo' ? (
          <>
            {/* Panel de control de la semana */}
            <PeriodControlSection scope="week" start={weekStart} end={weekEnd} rows={weekData?.systems} areaRows={weekData?.areaStats} />

            {/* Resumen section — al tope de la página */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Resumen</h2>
              {/* Day cards — redesigned */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-7 md:gap-2 md:overflow-visible">
                {weekDays.map(day => {
                  const d = getDayData(day);
                  const active = isToday(day);
                  const scoreColor = d.isFuture ? 'border-muted/30' : d.score >= 70 ? 'border-green-500/40 bg-green-500/5' : d.score >= 40 ? 'border-amber-500/40 bg-amber-500/5' : d.score > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-muted/20';
                  return (
                    <Card key={day.toISOString()} className={cn("border bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm rounded-2xl transition-all min-w-[88px] shrink-0 md:min-w-0 md:shrink", scoreColor, active && "ring-2 ring-primary ring-offset-2")}>
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
              <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
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

              <WeekComparisonCard anchorDate={weekStart} />
            </section>

            {/* Agenda de la semana */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Agenda</h2>
              <WeeklyAgenda weekStart={weekStart} weekEnd={weekEnd} />
            </section>

            {/* Secciones de la Semana (mismo diseño que 3 Meses) */}
            <PeriodSections scope="week" year={year} quarter={quarter} weekStart={weekStart} hideStats />

            {/* Plan Mensual */}
            <MonthlyPlanSummary currentMonth={monthForPlan} />

            {/* Time section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Tiempo</h2>
              <WeeklyTimeBreakdown weekStart={weekStart} weekEnd={weekEnd} weekDays={weekDays} systemsData={weekData?.systems} areaStatsData={weekData?.areaStats} />
            </section>

            {/* Systems section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Sistemas</h2>
              <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4">
                <WeeklySystemsStats weekStart={weekStart} />
              </div>
            </section>

            {/* Mejora section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Mejora</h2>
              <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <MejoraProcessPanel anchorDate={weekStart} />
                </CardContent>
              </Card>
            </section>

            {/* Tareas por área */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Tareas</h2>
              <PeriodAreaTasks start={weekStart} end={weekEnd} periodLabel="Esta semana" defaultDate={new Date()} />
            </section>

            {/* Enfoque section */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Enfoque</h2>
              <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <FocusProcessPanel anchorDate={weekStart} />
                </CardContent>
              </Card>
            </section>
          </>
        ) : viewMode === 'sistemas' ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Sistemas</h2>
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4">
              <WeeklySystemsStats weekStart={weekStart} />
            </div>
          </section>
        ) : viewMode === 'autocritica' ? (
          <AutocriticaSection />
        ) : (
          <ResultadosSemana weekStart={weekStart} />
        )}
      </div>
    </div>
  );
}