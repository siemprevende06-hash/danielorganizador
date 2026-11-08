import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Flame,
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  buildStudyPlan,
  COMMON_ERRORS,
  countDayProgress,
  countWeekProgress,
  createErrorEntry,
  defaultStudyPlanState,
  getStudyCycleInfo,
  getStudyProfile,
  loadStudyPlanState,
  saveStudyPlanState,
  STUDY_ERROR_CATEGORIES,
  STUDY_PACE_OPTIONS,
  studyTaskKey,
  type StudyErrorCategory,
  type StudyErrorEntry,
  type StudyLanguage,
  type StudyPace,
  type StudyPlanState,
} from '@/lib/languageStudyPlan';
import { LANGUAGE_SKILLS, toneBgClass, toneTextClass } from './skills';

interface Props {
  language: StudyLanguage;
  level: string;
}

export function StudyPlanPanel({ language, level }: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<StudyPlanState>(() => loadStudyPlanState(language));
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [wrong, setWrong] = useState('');
  const [correct, setCorrect] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<StudyErrorCategory>('gramatica');
  const [errorFilter, setErrorFilter] = useState<'pending' | 'all'>('pending');
  const [commonOpen, setCommonOpen] = useState(false);

  useEffect(() => {
    setState(loadStudyPlanState(language));
    setSelectedWeek(null);
  }, [language]);

  const cycle = useMemo(() => getStudyCycleInfo(state.startDate), [state.startDate]);
  const plan = useMemo(() => buildStudyPlan(language, level, state.pace), [language, level, state.pace]);
  const profile = useMemo(() => getStudyProfile(level), [level]);

  const currentWeek = cycle.weekIndex + 1;
  const displayWeek = selectedWeek ?? currentWeek;
  const week = plan[displayWeek - 1] ?? plan[0];
  const weekProgress = useMemo(
    () => countWeekProgress(week, state.completed, cycle.cycleStart),
    [week, state.completed, cycle.cycleStart]
  );
  const overall = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const item of plan) {
      const progress = countWeekProgress(item, state.completed, cycle.cycleStart);
      done += progress.done;
      total += progress.total;
    }
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [plan, state.completed, cycle.cycleStart]);

  const pendingErrors = state.errors.filter(entry => !entry.reviewed).length;
  const masteredErrors = state.errors.length - pendingErrors;
  const sortedErrors = useMemo(
    () =>
      [...state.errors].sort(
        (a, b) =>
          Number(a.reviewed) - Number(b.reviewed) ||
          b.createdAt.localeCompare(a.createdAt)
      ),
    [state.errors]
  );
  const visibleErrors = errorFilter === 'pending' ? sortedErrors.filter(entry => !entry.reviewed) : sortedErrors;
  const suggestions = COMMON_ERRORS[language];
  const suggestionKeys = new Set(state.errors.map(entry => entry.wrong.toLowerCase()));

  const commit = (next: StudyPlanState) => {
    setState(next);
    saveStudyPlanState(language, next);
  };

  const changePace = (pace: StudyPace) => {
    if (pace === state.pace) return;
    commit({ ...state, pace });
  };

  const toggleTask = (weekNumber: number, dayId: string, taskId: string) => {
    const key = studyTaskKey(cycle.cycleStart, weekNumber, dayId, taskId);
    const completed = { ...state.completed };
    if (completed[key]) delete completed[key];
    else completed[key] = true;

    const next = { ...state, completed };
    commit(next);

    if (!completed[key]) return;
    const nextWeek = plan[weekNumber - 1];
    if (nextWeek) {
      const progress = countWeekProgress(nextWeek, next.completed, cycle.cycleStart);
      if (progress.done === progress.total && progress.total > 0) {
        toast({
          title: `Semana ${weekNumber} completada 🏆`,
          description: 'Buen trabajo. Revisa el hito y pasa a la siguiente semana.',
        });
      }
    }
  };

  const addError = (
    input: { wrong: string; correct: string; note: string; category: StudyErrorCategory },
    resetForm = false
  ) => {
    const wrongText = input.wrong.trim();
    const correctText = input.correct.trim();
    if (!wrongText || !correctText) {
      toast({
        title: 'Faltan datos',
        description: 'Escribe lo que dijiste mal y la forma correcta.',
        variant: 'destructive',
      });
      return;
    }
    if (state.errors.some(entry => entry.wrong.toLowerCase() === wrongText.toLowerCase())) {
      toast({
        title: 'Ya está en tu cuaderno',
        description: 'Ese error ya está guardado. Repásalo en lugar de duplicarlo.',
      });
      return;
    }
    const entry = createErrorEntry({ ...input, wrong: wrongText, correct: correctText });
    commit({ ...state, errors: [entry, ...state.errors] });
    toast({ title: 'Error guardado', description: 'Repásalo hasta que salga automático.' });
    if (resetForm) {
      setWrong('');
      setCorrect('');
      setNote('');
      setCategory('gramatica');
    }
  };

  const toggleReviewed = (id: string) => {
    const errors = state.errors.map(entry =>
      entry.id === id ? { ...entry, reviewed: !entry.reviewed } : entry
    );
    commit({ ...state, errors });
  };

  const removeError = (id: string) => {
    const errors = state.errors.filter(entry => entry.id !== id);
    commit({ ...state, errors });
    toast({ title: 'Error eliminado', description: 'Puedes volver a añadirlo cuando quieras.' });
  };

  const resetProgress = () => {
    if (!window.confirm('¿Reiniciar el progreso del plan? Tu cuaderno de errores se conservará.')) return;
    commit({
      ...state,
      startDate: defaultStudyPlanState().startDate,
      completed: {},
    });
    setSelectedWeek(null);
    toast({ title: 'Plan reiniciado', description: 'Empiezas un ciclo nuevo de 4 semanas.' });
  };

  const startDateLabel = format(new Date(`${state.startDate}T12:00:00`), "d 'de' MMMM", { locale: es });
  const todayId = displayWeek === currentWeek ? week.days[cycle.dayIndex]?.id : null;

  return (
    <div className="space-y-4">
      {/* Resumen del plan */}
      <Card className="overflow-hidden">
        <div className="relative border-b bg-gradient-to-br from-primary/10 via-background to-success/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold sm:text-xl">Plan de 4 semanas</h2>
                  <Badge variant="secondary" className="text-[11px]">
                    {profile.label}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {level}
                  </Badge>
                </div>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground sm:text-sm">{profile.tip}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={resetProgress}
              title="Reiniciar el progreso del plan"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Ritmo diario:</span>
            {STUDY_PACE_OPTIONS.map(option => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={state.pace === option.value ? 'default' : 'outline'}
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => changePace(option.value)}
              >
                {option.label}
                <span className="ml-1.5 opacity-70">{option.hint}</span>
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Progreso del ciclo</span>
              <span className="tabular-nums text-muted-foreground">
                {overall.done}/{overall.total} tareas · {overall.percent}%
              </span>
            </div>
            <Progress value={overall.percent} className="mt-1.5 h-2.5" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Ciclo iniciado el {startDateLabel} · Semana {currentWeek} de 4
            </p>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {plan.map(item => {
              const progress = countWeekProgress(item, state.completed, cycle.cycleStart);
              const isActive = displayWeek === item.week;
              const isCurrent = currentWeek === item.week;
              return (
                <button
                  key={item.week}
                  type="button"
                  onClick={() => setSelectedWeek(item.week)}
                  className={cn(
                    'rounded-xl border p-2.5 text-left transition-all',
                    isActive
                      ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Semana {item.week}
                    </span>
                    {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold">{item.title}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Progress value={progress.percent} className="h-1 flex-1" />
                    <span className="text-[10px] tabular-nums text-muted-foreground">{progress.done}/{progress.total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Semana seleccionada */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base sm:text-lg">
                  Semana {week.week} · {week.title}
                </CardTitle>
                {displayWeek === currentWeek ? (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Actual</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => setSelectedWeek(null)}
                  >
                    Volver a la semana actual
                  </Button>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-focus" />
                {week.focus}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">{weekProgress.percent}%</p>
              <p className="text-[10px] text-muted-foreground">{weekProgress.done}/{weekProgress.total} tareas</p>
            </div>
          </div>
          <Progress value={weekProgress.percent} className="mt-2 h-1.5" />
        </CardHeader>

        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
            <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Hito de la semana
              </p>
              <p className="text-xs text-muted-foreground">{week.milestone}</p>
            </div>
          </div>

          <div className="space-y-2">
            {week.days.map((day, dayIndex) => {
              const dayProgress = countDayProgress(week, day, state.completed, cycle.cycleStart);
              const isToday = day.id === todayId;
              return (
                <Collapsible
                  key={`${language}-${cycle.cycleStart}-${week.week}-${day.id}`}
                  defaultOpen={isToday || (displayWeek !== currentWeek && dayIndex === 0)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40',
                        isToday ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background',
                        dayProgress.done === dayProgress.total && 'border-success/30 bg-success/5'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold',
                          dayProgress.done === dayProgress.total
                            ? 'bg-success/15 text-success'
                            : isToday
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <span>{day.label.slice(0, 3)}</span>
                        {isToday && <span className="text-[8px] font-semibold uppercase">Hoy</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{day.theme}</p>
                          {dayProgress.done === dayProgress.total && dayProgress.total > 0 && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {dayProgress.done}/{dayProgress.total} tareas
                          {dayProgress.minutesDone > 0 && ` · ${dayProgress.minutesDone} min hechos`}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="ml-2 space-y-2 border-l-2 border-border/60 pl-3 sm:ml-4">
                      {day.tasks.map(task => {
                        const complete = !!state.completed[
                          studyTaskKey(cycle.cycleStart, week.week, day.id, task.id)
                        ];
                        const skill = LANGUAGE_SKILLS.find(item => item.id === task.skill);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleTask(week.week, day.id, task.id)}
                            className={cn(
                              'flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                              complete
                                ? 'border-success/25 bg-success/5'
                                : 'border-border/50 bg-muted/10 hover:border-border hover:bg-muted/30'
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                                complete ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/30'
                              )}
                            >
                              {complete ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-2.5 w-2.5 opacity-0" />}
                            </span>
                            {skill && (
                              <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneBgClass(skill.tone))}>
                                <skill.Icon className={cn('h-4 w-4', toneTextClass(skill.tone))} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className={cn('text-sm font-semibold', complete && 'text-muted-foreground line-through')}>
                                  {task.title}
                                </span>
                                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-medium">
                                  <Clock3 className="h-2.5 w-2.5" />
                                  {task.minutes} min
                                </Badge>
                                {skill && (
                                  <span className={cn('text-[10px] font-medium', toneTextClass(skill.tone))}>{skill.label}</span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                                {task.detail}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cuaderno de errores */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <BookOpenCheck className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Cuaderno de errores</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Anota lo que dijiste mal y la corrección. Repásalos hasta que salgan solos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[11px]">
                <AlertCircle className="h-3 w-3 text-rose-500" />
                {pendingErrors} pendientes
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {masteredErrors} dominados
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground" htmlFor="error-wrong">
                  Lo que dije / escribí
                </label>
                <Input
                  id="error-wrong"
                  value={wrong}
                  onChange={event => setWrong(event.target.value)}
                  placeholder={language === 'english' ? 'I have 20 years' : 'Io sono 20 anni'}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground" htmlFor="error-correct">
                  Forma correcta
                </label>
                <Input
                  id="error-correct"
                  value={correct}
                  onChange={event => setCorrect(event.target.value)}
                  placeholder={language === 'english' ? 'I am 20 years old' : 'Ho 20 anni'}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
              <Textarea
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder="Regla o explicación (opcional)"
                className="min-h-9 resize-none text-sm"
                rows={1}
              />
              <Select value={category} onValueChange={value => setCategory(value as StudyErrorCategory)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_ERROR_CATEGORIES.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                className="h-9"
                onClick={() => addError({ wrong, correct, note, category }, true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Guardar error
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setErrorFilter('pending')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  errorFilter === 'pending' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Pendientes ({pendingErrors})
              </button>
              <button
                type="button"
                onClick={() => setErrorFilter('all')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  errorFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Todos ({state.errors.length})
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">Repasa 5 min antes de cada práctica</span>
          </div>

          {visibleErrors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-5 text-center">
              <Lightbulb className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium">
                {errorFilter === 'pending' ? 'No tienes errores pendientes' : 'Tu cuaderno está vacío'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {errorFilter === 'pending'
                  ? '¡Bien! Los errores dominados siguen guardados en la pestaña Todos.'
                  : 'Añade tu primer error o empieza con uno de los errores frecuentes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleErrors.map(entry => (
                <ErrorRow
                  key={entry.id}
                  entry={entry}
                  onToggle={() => toggleReviewed(entry.id)}
                  onDelete={() => removeError(entry.id)}
                />
              ))}
            </div>
          )}

          <Collapsible open={commonOpen} onOpenChange={setCommonOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-left text-xs font-medium hover:bg-muted/30"
              >
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  Errores frecuentes de hispanohablantes ({suggestions.length})
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', commonOpen && 'rotate-180')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-1.5">
                {suggestions.map(item => {
                  const saved = suggestionKeys.has(item.wrong.toLowerCase());
                  return (
                    <div
                      key={item.wrong}
                      className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/10 p-2"
                    >
                      <div className="min-w-0 flex-1 text-xs">
                        <p>
                          <span className="text-destructive line-through decoration-destructive/40">{item.wrong}</span>
                          <ArrowRight className="mx-1.5 inline h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-success">{item.correct}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.note}</p>
                      </div>
                      <Button
                        type="button"
                        variant={saved ? 'ghost' : 'outline'}
                        size="sm"
                        className="h-7 shrink-0 px-2 text-[11px]"
                        disabled={saved}
                        onClick={() =>
                          addError(
                            {
                              wrong: item.wrong,
                              correct: item.correct,
                              note: item.note,
                              category: item.category,
                            },
                            false
                          )
                        }
                      >
                        {saved ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-success" />
                            Guardado
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3 w-3" />
                            Añadir
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Cómo sacar más partido al plan</p>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              <li>· Marca una tarea solo cuando la hayas hecho de verdad, no cuando la hayas leído.</li>
              <li>· Si un día no llegas, no compenses al día siguiente: retoma donde lo dejaste.</li>
              <li>· Los minutos de práctica se registran en la pestaña Práctica y en tu progreso diario.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorRow({
  entry,
  onToggle,
  onDelete,
}: {
  entry: StudyErrorEntry;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const category = STUDY_ERROR_CATEGORIES.find(item => item.id === entry.category);

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border p-3 transition-all',
        entry.reviewed ? 'border-success/20 bg-success/5 opacity-75' : 'border-border/60 bg-background'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          entry.reviewed
            ? 'border-success bg-success text-success-foreground'
            : 'border-muted-foreground/30 hover:border-success'
        )}
        aria-label={entry.reviewed ? 'Marcar como pendiente' : 'Marcar como dominado'}
      >
        {entry.reviewed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Circle className="h-2.5 w-2.5 opacity-0" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', category.tone)}>
              {category.label}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(entry.createdAt), 'd MMM', { locale: es })}
          </span>
        </div>
        <p className="mt-1 text-sm leading-snug">
          <span className="text-destructive line-through decoration-destructive/40">{entry.wrong}</span>
          <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-success">{entry.correct}</span>
        </p>
        {entry.note && <p className="mt-0.5 text-[11px] text-muted-foreground">{entry.note}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-[11px]"
          onClick={onToggle}
        >
          {entry.reviewed ? 'Repasar' : 'Dominado'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Eliminar error"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
