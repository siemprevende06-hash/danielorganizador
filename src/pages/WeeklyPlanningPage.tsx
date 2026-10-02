import { useState, type ReactNode } from 'react';
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Save, ListChecks, Plus, Trash2, Book, Music, FolderKanban, GraduationCap, Target,
  Check, CheckCircle2, CalendarDays, Clock, Gauge, Flame, CalendarRange, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyPlan, type Priority } from '@/hooks/useWeeklyPlan';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { PeriodTaskCreator } from '@/components/tasks/PeriodTaskCreator';
import { cn } from '@/lib/utils';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import { WeeklyBookSongDistribution, type WeekDistribution } from '@/components/planning/WeeklyBookSongDistribution';
import {
  setWeekGoal,
  getWeekGoalEffective,
  getWeekGoalSum,
  ALL_HIERARCHY_AREAS,
  AREA_LABELS,
} from '@/lib/hierarchy';

const CATEGORY_META: Record<string, { icon: ReactNode; color: string; chip: string }> = {
  book: { icon: <Book className="w-3 h-3" />, color: 'text-indigo-500', chip: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  song: { icon: <Music className="w-3 h-3" />, color: 'text-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  project: { icon: <FolderKanban className="w-3 h-3" />, color: 'text-amber-500', chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  subject: { icon: <GraduationCap className="w-3 h-3" />, color: 'text-blue-500', chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  personal: { icon: <Target className="w-3 h-3" />, color: 'text-purple-500', chip: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
};

const CATEGORY_OPTIONS = [
  { value: 'personal', label: 'Personal' },
  { value: 'book', label: 'Lectura' },
  { value: 'song', label: 'Música' },
  { value: 'project', label: 'Proyecto' },
  { value: 'subject', label: 'Universidad' },
];

const PRIORITY_META: Record<Priority, { label: string; chip: string; bar: string; dot: string }> = {
  high: { label: 'Alta', chip: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', bar: 'border-l-red-500', dot: 'bg-red-500' },
  medium: { label: 'Media', chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', bar: 'border-l-amber-400', dot: 'bg-amber-500' },
  low: { label: 'Baja', chip: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', bar: 'border-l-slate-300', dot: 'bg-slate-400' },
};

const PRIORITY_OPTIONS: Priority[] = ['high', 'medium', 'low'];

function formatMinutes(min: number): string {
  if (min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function loadTone(pct: number): { bar: string; text: string; label: string } {
  if (pct >= 100) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Sobrecargado' };
  if (pct >= 80) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Al limite' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Equilibrado' };
}

export default function WeeklyPlanningPage() {
  const [weekDate, setWeekDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const {
    planData,
    loading,
    saving,
    addAction,
    toggleAction,
    removeAction,
    updateAction,
    addOutcome,
    toggleOutcome,
    removeOutcome,
    updateOutcome,
    setDailyCapacity,
    updatePlanData,
    savePlan,
  } = useWeeklyPlan(weekDate);
  const month = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
  const {
    planData: monthlyPlan,
    trimestralData,
    loading: monthLoading,
    updatePlanData: updateMonthPlan,
    savePlan: saveMonthPlan,
    books: monthBooks,
    songs: monthSongs,
  } = useMonthlyPlan(month);
  const { toast } = useToast();

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekDays[0], 'd MMM', { locale: es })} - ${format(weekDays[6], 'd MMM', { locale: es })}`;

  const monthWeeks = (() => {
    const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const last = endOfMonth(month);
    const weeks: { key: string; label: string }[] = [];
    let cursor = new Date(first);
    while (cursor <= last) {
      const end = addDays(cursor, 6);
      weeks.push({
        key: format(cursor, 'yyyy-MM-dd'),
        label: `${format(cursor, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
      });
      cursor = addDays(cursor, 7);
    }
    return weeks;
  })();

  const setWeekDistribution = (dist: WeekDistribution) => {
    updateMonthPlan(p => ({ ...p, week_distribution: dist }));
  };

  const navigateWeek = (dir: 'prev' | 'next') => {
    setWeekDate(prev => {
      const n = new Date(prev);
      n.setDate(n.getDate() + (dir === 'prev' ? -7 : 7));
      return n;
    });
  };

  const handleSave = async () => {
    await Promise.all([savePlan(), saveMonthPlan()]);
    toast({ title: 'Plan guardado' });
  };

  const handleImportFromMonth = () => {
    if (monthlyPlan.books.selected.length > 0) {
      addAction({ title: 'Leer libro seleccionado', category: 'book', completed: false });
    }
    if (monthlyPlan.songs.selected.length > 0) {
      addAction({ title: 'Practicar canci├│n seleccionada', category: 'song', completed: false });
    }
    monthlyPlan.personal_goals.forEach(g => {
      addAction({ title: g.title, category: 'personal', completed: false });
    });
    toast({ title: 'Metas importadas del plan mensual' });
  };

  const outcomes = planData.outcomes ?? [];
  const actions = planData.actions ?? [];
  const dailyCapacity = planData.dailyCapacityMinutes ?? {};
  const completedOutcomes = outcomes.filter(o => o.completed).length;
  const totalOutcomes = outcomes.length;
  const completedCount = actions.filter(a => a.completed).length;
  const totalCount = actions.length;
  const totalProgress = totalOutcomes + totalCount;
  const completedProgress = completedOutcomes + completedCount;
  const progressPct = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0;

  const dayKeys = weekDays.map(d => format(d, 'yyyy-MM-dd'));

  const loadByDay: Record<string, number> = (() => {
    const map: Record<string, number> = {};
    dayKeys.forEach(k => { map[k] = 0; });
    actions.forEach(a => {
      const key = a.assignedDay;
      if (key && key in map) map[key] += Math.max(0, a.estimatedMinutes ?? 0);
    });
    return map;
  })();

  const unscheduledMinutes = actions.filter(a => !a.assignedDay).reduce((acc, a) => acc + Math.max(0, a.estimatedMinutes ?? 0), 0);

  const plannedMinutes = actions.reduce((acc, a) => acc + Math.max(0, a.estimatedMinutes ?? 0), 0);

  const actualMinutes = actions.filter(a => a.completed).reduce((acc, a) => acc + Math.max(0, a.actualMinutes ?? 0), 0);

  const totalCapacity = dayKeys.reduce((acc, k) => acc + Math.max(0, dailyCapacity[k] ?? 0), 0);

  const weekLoadPct = totalCapacity > 0 ? Math.round((plannedMinutes / totalCapacity) * 100) : 0;
  const weekTone = totalCapacity > 0 ? loadTone(weekLoadPct) : null;

  const byCategory = (() => {
    const map: Record<string, number> = {};
    actions.forEach(a => {
      if ((a.estimatedMinutes ?? 0) <= 0) return;
      map[a.category] = (map[a.category] ?? 0) + (a.estimatedMinutes ?? 0);
    });
    return map;
  })();

  const openOutcomes = outcomes.filter(o => !o.completed);
  const openActions = actions.filter(a => !a.completed);

  const [newAction, setNewAction] = useState('');
  const [newActionCategory, setNewActionCategory] = useState('personal');
  const [newActionMinutes, setNewActionMinutes] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [openNotes, setOpenNotes] = useState(false);

  const [goalsVersion, setGoalsVersion] = useState(0);

  const applyWeekGoal = (area: string, value: string) => {
    const mins = Math.max(0, parseInt(value) || 0);
    setWeekGoal(weekStart, area, mins);
    setGoalsVersion(v => v + 1);
  };

  const weekGoalSum = getWeekGoalSum(weekStart);

  const weekEnd = addDays(weekStart, 6);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const defaultDueThisWeek = todayStr >= weekStartStr && todayStr <= weekEndStr ? new Date() : weekStart;

  const handleAddAction = () => {
    const title = newAction.trim();
    if (!title) return;
    const estimated = Math.max(0, parseInt(newActionMinutes) || 0);
    addAction({
      title,
      category: newActionCategory,
      completed: false,
      ...(estimated > 0 ? { estimatedMinutes: estimated } : {}),
    });
    setNewAction('');
    setNewActionMinutes('');
  };

  const handleAddOutcome = () => {
    const title = newOutcome.trim();
    if (!title) return;
    addOutcome({ title, completed: false, priority: 'medium' });
    setNewOutcome('');
  };

  const cyclePriority = (current?: Priority): Priority => {
    const idx = current ? PRIORITY_OPTIONS.indexOf(current) : -1;
    return PRIORITY_OPTIONS[(idx + 1) % PRIORITY_OPTIONS.length];
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
<header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Plan Semanal</h1>
            <p className="text-sm text-muted-foreground">{weekLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-full border bg-background/60 px-2 py-0.5 shadow-sm">
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {completedOutcomes}/{totalOutcomes} resultados
            </Badge>
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {completedCount}/{totalCount} acciones
            </Badge>
            <Badge className="h-4 bg-indigo-500/90 px-1.5 text-[9px] text-white hover:bg-indigo-500/90">
              {progressPct}% general
            </Badge>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              Semana {planData.weekNumber}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </header>

      <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 via-background to-emerald-500/10 shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> Progreso general
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none">{progressPct}%</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{completedProgress} de {totalProgress} items</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Target className="w-3 h-3 text-emerald-500" /> Resultados
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none">{completedOutcomes}<span className="text-sm text-muted-foreground">/{totalOutcomes}</span></p>
              <p className="text-[10px] text-muted-foreground">
                {openOutcomes.length > 0 ? `${openOutcomes.length} por alcanzar` : totalOutcomes > 0 ? 'Todo alcanzado' : 'Sin definir'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="w-3 h-3 text-amber-500" /> Esfuerzo planificado
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none">{formatMinutes(plannedMinutes)}</p>
              <p className="text-[10px] text-muted-foreground">
                {totalCapacity > 0 ? `de ${formatMinutes(totalCapacity)} de capacidad` : 'sin capacidad definida'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Gauge className="w-3 h-3 text-rose-500" /> Carga semanal
              </div>
              <p className={cn('text-2xl font-bold tabular-nums leading-none', weekTone?.text ?? 'text-muted-foreground')}>
                {totalCapacity > 0 ? `${weekLoadPct}%` : '--'}
              </p>
              <p className={cn('text-[10px]', weekTone?.text ?? 'text-muted-foreground')}>
                {weekTone ? weekTone.label : 'Define capacidad diaria'}
              </p>
            </div>
          </div>

          {unscheduledMinutes > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <Flame className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Tienes {formatMinutes(unscheduledMinutes)} de esfuerzo sin asignar a ningún día. Asígnalos en el calendario para equilibrar la semana.
              </p>
            </div>
          )}
        </div>
      </Card>

      {monthLoading ? (
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse mb-4" />
      ) : (
        <div className="mb-4">
          <WeeklyBookSongDistribution
            weeks={monthWeeks}
            activeWeekKey={format(weekStart, 'yyyy-MM-dd')}
            monthLabel={format(month, 'MMMM yyyy', { locale: es })}
            books={monthBooks}
            songs={monthSongs}
            selectedBookIds={monthlyPlan.books.selected || []}
            selectedSongIds={monthlyPlan.songs.selected || []}
            distribution={monthlyPlan.week_distribution || {}}
            onChange={setWeekDistribution}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          ) : (
<>
              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-sm">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">Resultados de la semana</p>
                        <p className="text-[10px] text-muted-foreground">Qué quieres lograr, no qué vas a hacer</p>
                      </div>
                    </div>
                    {totalOutcomes > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{completedOutcomes}/{totalOutcomes}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Resultado clave de la semana..."
                      value={newOutcome}
                      onChange={e => setNewOutcome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddOutcome()}
                      className="h-8 text-xs"
                    />
                    <Button size="icon" variant="ghost" onClick={handleAddOutcome} className="h-8 w-8 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {totalOutcomes === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Define primero qué quieres conseguir esta semana. Luego planifica las acciones.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {outcomes.map(o => {
                        const prio = o.priority ? PRIORITY_META[o.priority] : null;
                        return (
                          <div
                            key={o.id}
                            className={cn(
                              'group rounded-lg border border-l-2 bg-background/60 p-2.5 transition-all hover:shadow-sm',
                              prio?.bar ?? 'border-l-slate-200 dark:border-l-slate-700',
                              o.completed && 'opacity-60'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => toggleOutcome(o.id)}
                                className={cn(
                                  'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                  o.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-muted-foreground/30 hover:border-emerald-400'
                                )}
                                title={o.completed ? 'Marcar pendiente' : 'Marcar alcanzado'}
                              >
                                {o.completed && <Check className="w-3 h-3" />}
                              </button>
                              <div className="flex-1 min-w-0 space-y-1">
                                <input
                                  value={o.title}
                                  onChange={e => updateOutcome(o.id, prev => ({ ...prev, title: e.target.value }))}
                                  className={cn(
                                    'w-full bg-transparent text-xs font-medium outline-none focus:text-emerald-600 dark:focus:text-emerald-400',
                                    o.completed && 'line-through text-muted-foreground'
                                  )}
                                />
                                <input
                                  value={o.successCriteria ?? ''}
                                  onChange={e => updateOutcome(o.id, prev => ({ ...prev, successCriteria: e.target.value }))}
                                  placeholder="Cómo sabrás que lo lograste (opcional)"
                                  className="w-full bg-transparent text-[10px] text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => updateOutcome(o.id, prev => ({ ...prev, priority: cyclePriority(prev.priority) }))}
                                  className={cn(
                                    'h-5 px-1.5 rounded text-[9px] font-semibold border transition-colors',
                                    prio?.chip ?? 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30'
                                  )}
                                  title="Cambiar prioridad"
                                >
                                  {prio?.label ?? 'Prioridad'}
                                </button>
                                <button
                                  onClick={() => removeOutcome(o.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="border-0 bg-background shadow-sm">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                        <ListChecks className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">Acciones de la semana</p>
                        <p className="text-[10px] text-muted-foreground">El esfuerzo concreto para alcanzar los resultados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{completedCount}/{totalCount}</Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleImportFromMonth}>
                        Importar del mes
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Nueva acción..."
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAction()}
                      className="h-8 text-xs flex-1 min-w-[160px]"
                    />
                    <select
                      value={newActionCategory}
                      onChange={e => setNewActionCategory(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-[10px] outline-none focus:ring-1 focus:ring-ring"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <div className="relative w-20">
                      <Clock className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        type="number"
                        min={0}
                        step={5}
                        placeholder="min"
                        value={newActionMinutes}
                        onChange={e => setNewActionMinutes(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddAction()}
                        className="h-8 pl-6 text-xs tabular-nums"
                      />
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleAddAction} className="h-8 w-8 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {totalCount === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No hay acciones esta semana. Agrega una o impórtalas del plan mensual.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {actions.map(action => {
                        const meta = CATEGORY_META[action.category] || CATEGORY_META.personal;
                        const prio = action.priority ? PRIORITY_META[action.priority] : null;
                        const dayIdx = action.assignedDay ? dayKeys.indexOf(action.assignedDay) : -1;
                        return (
                          <div
                            key={action.id}
                            className={cn(
                              'group flex flex-wrap items-center gap-2 rounded-lg border border-l-2 bg-background/60 py-2 pl-2.5 pr-2 transition-all hover:shadow-sm',
                              prio?.bar ?? 'border-l-slate-200 dark:border-l-slate-700',
                              action.completed && 'opacity-55'
                            )}
                          >
                            <button
                              onClick={() => toggleAction(action.id)}
                              className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                action.completed
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : 'border-muted-foreground/30 hover:border-indigo-400'
                              )}
                            >
                              {action.completed && <Check className="w-3 h-3" />}
                            </button>

                            <span className={cn('text-xs flex-1 min-w-[120px]', action.completed && 'line-through text-muted-foreground')}>
                              {action.title}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium', meta.chip)}>
                                {meta.icon}
                                <span className="capitalize">{action.category}</span>
                              </span>

                              <button
                                onClick={() => updateAction(action.id, prev => ({ ...prev, priority: cyclePriority(prev.priority) }))}
                                className={cn(
                                  'rounded border px-1.5 py-0.5 text-[9px] font-semibold transition-colors',
                                  prio?.chip ?? 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30'
                                )}
                                title="Cambiar prioridad"
                              >
                                {prio?.label ?? 'prio'}
                              </button>

                              {action.completed && (
                                <div className="relative w-14" title="Minutos reales invertidos">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={5}
                                    value={action.actualMinutes ?? ''}
                                    onChange={e => updateAction(action.id, prev => ({
                                      ...prev,
                                      actualMinutes: Math.max(0, parseInt(e.target.value) || 0) || undefined,
                                    }))}
                                    placeholder="real"
                                    className="h-6 px-1 text-center text-[9px] tabular-nums border-emerald-500/40"
                                  />
                                </div>
                              )}

                              <div className="relative w-16">
                                <Input
                                  type="number"
                                  min={0}
                                  step={5}
                                  value={action.estimatedMinutes ?? ''}
                                  onChange={e => updateAction(action.id, prev => ({
                                    ...prev,
                                    estimatedMinutes: Math.max(0, parseInt(e.target.value) || 0) || undefined,
                                  }))}
                                  placeholder="0m"
                                  className="h-6 text-[10px] tabular-nums px-1.5 text-center"
                                />
                              </div>

                              <select
                                value={action.assignedDay ?? ''}
                                onChange={e => updateAction(action.id, prev => ({
                                  ...prev,
                                  assignedDay: e.target.value || undefined,
                                }))}
                                className={cn(
                                  'h-6 rounded border bg-background px-1 text-[9px] outline-none focus:ring-1 focus:ring-ring',
                                  dayIdx >= 0 ? 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'border-input text-muted-foreground'
                                )}
                                title="Dia asignado"
                              >
                                <option value="">sin día</option>
                                {weekDays.map((d, i) => (
                                  <option key={i} value={dayKeys[i]}>
                                    {format(d, 'EEE d', { locale: es })}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => removeAction(action.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-3">
          <Card className="border-0 bg-background shadow-sm">
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-500" /> Calendario de esfuerzo
                </p>
                {weekTone && (
                  <Badge variant="outline" className={cn('text-[9px]', weekTone.text)}>
                    {weekTone.label}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                  const key = dayKeys[i];
                  const load = loadByDay[key] ?? 0;
                  const cap = Math.max(0, dailyCapacity[key] ?? 0);
                  const pct = cap > 0 ? Math.round((load / cap) * 100) : (load > 0 ? 100 : 0);
                  const tone = cap > 0 || load > 0 ? loadTone(pct) : null;
                  const dayActions = actions.filter(a => a.assignedDay === key);
                  const doneToday = dayActions.filter(a => a.completed).length;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-lg border p-1.5 text-center transition-colors',
                        isToday(day) ? 'border-indigo-400 bg-indigo-500/5' : 'bg-background/60'
                      )}
                      title={`${format(day, 'EEEE d MMM', { locale: es })}: ${formatMinutes(load)}${cap > 0 ? ` de ${formatMinutes(cap)}` : ''}`}
                    >
                      <p className="text-[9px] font-medium uppercase text-muted-foreground">
                        {format(day, 'EEEEE', { locale: es })}
                      </p>
                      <p className={cn('text-xs font-bold tabular-nums', isToday(day) && 'text-indigo-600 dark:text-indigo-400')}>
                        {format(day, 'd')}
                      </p>
                      <p className={cn('text-[9px] tabular-nums font-medium mt-0.5', tone?.text ?? 'text-muted-foreground')}>
                        {load > 0 ? formatMinutes(load) : '--'}
                      </p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', tone?.bar ?? 'bg-transparent')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[8px] text-muted-foreground/70 mt-0.5 tabular-nums">
                        {dayActions.length > 0 ? `${doneToday}/${dayActions.length}` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1 border-t">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Capacidad por día</p>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day, i) => (
                    <div key={dayKeys[i]} className="space-y-0.5">
                      <Input
                        type="number"
                        min={0}
                        step={15}
                        value={dailyCapacity[dayKeys[i]] ?? ''}
                        onChange={e => setDailyCapacity(dayKeys[i], Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="h-6 px-0.5 text-center text-[10px] tabular-nums"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-muted-foreground">Total capacidad</span>
                  <span className="font-semibold tabular-nums">{formatMinutes(totalCapacity)}</span>
                </div>
                {totalCapacity > 0 && (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Esfuerzo planificado</span>
                      <span className={cn('font-semibold tabular-nums', weekTone?.text)}>{formatMinutes(plannedMinutes)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', weekTone?.bar)}
                        style={{ width: `${Math.min(weekLoadPct, 100)}%` }}
                      />
                    </div>
                    <p className={cn('text-[9px]', weekTone?.text)}>
                      {weekLoadPct}% de tu capacidad usada
                      {actualMinutes > 0 && ` · ${formatMinutes(actualMinutes)} registrados`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {Object.keys(byCategory).length > 0 && (
            <Card className="border-0 bg-background shadow-sm">
              <div className="p-3 space-y-2">
                <p className="text-[11px] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Esfuerzo por categoría
                </p>
                <div className="space-y-1.5">
                  {Object.entries(byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, mins]) => {
                      const meta = CATEGORY_META[cat] || CATEGORY_META.personal;
                      const pct = plannedMinutes > 0 ? Math.round((mins / plannedMinutes) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              {meta.icon}
                              <span className="capitalize">{cat}</span>
                            </span>
                            <span className="font-semibold tabular-nums">{formatMinutes(mins)}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full transition-all duration-500', meta.color.replace('text-', 'bg-'))} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          )}

          <Card className="border-0 bg-gradient-to-br from-rose-500/5 via-background to-background shadow-sm">
            <div className="p-3 space-y-2">
              <button
                onClick={() => setOpenNotes(v => !v)}
                className="w-full flex items-center justify-between text-[11px] font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5 text-muted-foreground" /> Notas de la semana
                </span>
                <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', openNotes && 'rotate-90')} />
              </button>
              {openNotes ? (
                <Textarea
                  value={planData.notes ?? ''}
                  onChange={e => updatePlanData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reflexiones, obstáculos, contexto de la semana..."
                  className="text-xs min-h-[80px] resize-y"
                />
              ) : (
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {(planData.notes ?? '').trim() || 'Sin notas. Pulsa para añadir contexto de la semana.'}
                </p>
              )}
            </div>
          </Card>

          {trimestralData && (
            <Card className="border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20">
              <div className="p-3">
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
                  Plan {trimestralData.quarterLabel}
                </p>
                <div className="space-y-1">
                  {trimestralData.books.goal > 0 && (
                    <p className="text-[10px] text-muted-foreground">📚 {trimestralData.books.selected}/{trimestralData.books.goal} libros</p>
                  )}
                  {trimestralData.songs.goal > 0 && (
                    <p className="text-[10px] text-muted-foreground">🎵 {trimestralData.songs.selected}/{trimestralData.songs.goal} canciones</p>
                  )}
                  {trimestralData.projects > 0 && (
                    <p className="text-[10px] text-muted-foreground">📁 {trimestralData.projects} proyectos</p>
                  )}
                  {trimestralData.personal_goals > 0 && (
                    <p className="text-[10px] text-muted-foreground">🎯 {trimestralData.personal_goals} metas</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="p-3">
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Metas de minutos de la semana
              </p>
              <div className="space-y-1.5">
                {ALL_HIERARCHY_AREAS.map(area => (
                  <div key={area} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">{AREA_LABELS[area]}</span>
                    <MinutesGoalInput
                      value={getWeekGoalEffective(weekStart, area)}
                      onApply={v => applyWeekGoal(area, v)}
                      className="h-6 w-20 text-[10px]"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                Total semana: {weekGoalSum} min
              </p>
            </div>
          </Card>

          <Card className="border-0 bg-background shadow-sm">
            <div className="p-3 space-y-2.5">
              <p className="text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Progreso de la semana
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#weeklyGrad)" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: `${progressPct}, 100` }} />
                    <defs>
                      <linearGradient id="weeklyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-500">{progressPct}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Resultados</span>
                      <span className="font-semibold tabular-nums">{completedOutcomes}/{totalOutcomes}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${totalOutcomes > 0 ? (completedOutcomes / totalOutcomes) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Acciones</span>
                      <span className="font-semibold tabular-nums">{completedCount}/{totalCount}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {openActions.length > 0 && (
                    <p className="text-[9px] text-muted-foreground">
                      {openActions.length} acción{openActions.length === 1 ? '' : 'es'} pendiente{openActions.length === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <PeriodTaskCreator
            periodStart={weekStart}
            periodEnd={weekEnd}
            defaultDueDate={defaultDueThisWeek}
            title="Tareas de la semana"
            description="Crea tareas por área con vencimiento en esta semana."
          />
        </div>
      </div>
    </div>
  );
}
