import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, ListChecks, Plus, Trash2, Book, Music, FolderKanban, GraduationCap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { PeriodTaskCreator } from '@/components/tasks/PeriodTaskCreator';
import { cn } from '@/lib/utils';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import {
  setWeekGoal,
  getWeekGoalEffective,
  getWeekGoalSum,
  ALL_HIERARCHY_AREAS,
  AREA_LABELS,
} from '@/lib/hierarchy';

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  book: { icon: <Book className="w-3 h-3" />, color: 'text-indigo-500' },
  song: { icon: <Music className="w-3 h-3" />, color: 'text-emerald-500' },
  project: { icon: <FolderKanban className="w-3 h-3" />, color: 'text-amber-500' },
  subject: { icon: <GraduationCap className="w-3 h-3" />, color: 'text-blue-500' },
  personal: { icon: <Target className="w-3 h-3" />, color: 'text-purple-500' },
};

export default function WeeklyPlanningPage() {
  const [weekDate, setWeekDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { planData, loading, saving, addAction, toggleAction, removeAction, savePlan } = useWeeklyPlan(weekDate);
  const month = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
  const { planData: monthlyPlan, trimestralData } = useMonthlyPlan(month);
  const { toast } = useToast();
  const [newAction, setNewAction] = useState('');

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekDays[0], 'd MMM', { locale: es })} - ${format(weekDays[6], 'd MMM', { locale: es })}`;

  const navigateWeek = (dir: 'prev' | 'next') => {
    setWeekDate(prev => {
      const n = new Date(prev);
      n.setDate(n.getDate() + (dir === 'prev' ? -7 : 7));
      return n;
    });
  };

  const handleSave = async () => {
    await savePlan();
    toast({ title: 'Plan semanal guardado' });
  };

  const handleAdd = () => {
    if (!newAction.trim()) return;
    addAction({ title: newAction.trim(), category: 'personal', completed: false });
    setNewAction('');
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

  const completedCount = planData.actions.filter(a => a.completed).length;
  const totalCount = planData.actions.length;

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

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Plan Semanal</h1>
            <p className="text-sm text-muted-foreground">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          ) : (
<>
              <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold">Acciones de la semana</span>
                      {totalCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {completedCount}/{totalCount}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleImportFromMonth}>
                      Importar del mes
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Nueva acci├│n..."
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      className="h-8 text-xs"
                    />
                    <Button size="icon" variant="ghost" onClick={handleAdd} className="h-8 w-8 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {planData.actions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No hay acciones esta semana. Agrega una o imp├│rtalas del plan mensual.
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {planData.actions.map(action => {
                        const meta = CATEGORY_META[action.category] || CATEGORY_META.personal;
                        return (
                          <div key={action.id} className="flex items-center gap-2.5 group py-1.5">
                            <button
                              onClick={() => toggleAction(action.id)}
                              className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                action.completed
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : 'border-muted-foreground/30 hover:border-indigo-400'
                              )}
                            >
                              {action.completed && <span className="text-[8px]">Ô£ô</span>}
                            </button>
                            <span className={cn('text-xs flex-1', action.completed && 'line-through text-muted-foreground')}>
                              {action.title}
                            </span>
                            <span className={meta.color}>{meta.icon}</span>
                            <button onClick={() => removeAction(action.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="text-center">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {format(day, 'EEE', { locale: es }).charAt(0).toUpperCase() + format(day, 'EEE', { locale: es }).slice(1, 3)}
                    </p>
                    <p className="text-xs font-semibold mt-0.5">{format(day, 'd')}</p>
                    <div className="mt-1 space-y-0.5">
                      {planData.actions.filter(a => a.completed).slice(0, 3).map(a => (
                        <div key={a.id} className="h-1 rounded-full bg-indigo-300/50" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
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

          <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
            <div className="p-3">
              <p className="text-[11px] font-semibold mb-2">Progreso semanal</p>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-500">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold">{completedCount}/{totalCount}</p>
                  <p className="text-[10px] text-muted-foreground">acciones completadas</p>
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
