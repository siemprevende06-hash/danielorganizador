import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, ArrowRight, CheckCircle2, Circle, Moon, CalendarDays, CalendarRange, Calendar, Layers, Target, Sparkles, Eye } from 'lucide-react';
import { useRoutineBlocks, parseTime, formatTimeDisplay, ROUTINES, type RoutineBlock } from '@/hooks/useRoutineBlocks';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { getMonthGoalsSummary } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

function nowMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function isInBlock(block: RoutineBlock, mins: number) {
  const start = parseTime(block.startTime);
  const end = parseTime(block.endTime);
  if (end <= start) return mins >= start || mins < end;
  return mins >= start && mins < end;
}

export default function AhoraMismo() {
  const { blocks, isLoaded, routineType } = useRoutineBlocks();
  const { tasksByBlock, tasks } = useDailyPlanData();
  const { objectives, loading: objectivesLoading } = useWeeklyObjectives();
  const { goals, loading: goalsLoading } = useGoalProgress();
  const [now, setNow] = useState(new Date());
  const [showCascade, setShowCascade] = useState('all');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const routine = ROUTINES.find(r => r.type === routineType);
  const mins = nowMinutes(now);

  const ordered = useMemo(
    () => [...blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
    [blocks]
  );

  const currentIndex = useMemo(() => ordered.findIndex(b => isInBlock(b, mins)), [ordered, mins]);
  const current = currentIndex >= 0 ? ordered[currentIndex] : null;
  const next = useMemo(() => {
    if (currentIndex >= 0) return ordered[currentIndex + 1] || ordered[0] || null;
    return ordered.find(b => parseTime(b.startTime) > mins) || ordered[0] || null;
  }, [ordered, currentIndex, mins]);

  const progress = useMemo(() => {
    if (!current) return 0;
    const start = parseTime(current.startTime);
    let end = parseTime(current.endTime);
    if (end <= start) end += 24 * 60;
    let m = mins < start ? mins + 24 * 60 : mins;
    return Math.min(100, Math.max(0, ((m - start) / (end - start)) * 100));
  }, [current, mins]);

  const minutesLeft = useMemo(() => {
    if (!current) return 0;
    const start = parseTime(current.startTime);
    let end = parseTime(current.endTime);
    if (end <= start) end += 24 * 60;
    const m = mins < start ? mins + 24 * 60 : mins;
    return Math.max(0, Math.round(end - m));
  }, [current, mins]);

  const minutesToNext = useMemo(() => {
    if (!next) return 0;
    let start = parseTime(next.startTime);
    if (start <= mins) start += 24 * 60;
    return Math.max(0, start - mins);
  }, [next, mins]);

  // Tareas del bloque actual y siguiente (desde el plan del día)
  const currentBlockTasks = useMemo(() => {
    if (!current) return [];
    return tasksByBlock[current.id] || [];
  }, [current, tasksByBlock]);

  const nextBlockTasks = useMemo(() => {
    if (!next) return [];
    return tasksByBlock[next.id] || [];
  }, [next, tasksByBlock]);

  // Tareas de HOY (todas las del día)
  const todayTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

  // Cascada de metas: semana → mes → trimestre → mes
  const currentDate = now;
  const activeGoals = useMemo(() => goals.filter(g => (g.status === 'active' || !g.status)), [goals]);
  const monthlyGoals = useMemo(() => getMonthGoalsSummary(currentDate), [currentDate]);
  const monthlyGoalTotal = useMemo(
    () => Object.entries(monthlyGoals).reduce((s, [, v]) => s + (v || 0), 0),
    [monthlyGoals]
  );
  const monthlyAreaEntries = useMemo(
    () => Object.entries(monthlyGoals).filter(([, v]) => (v || 0) > 0),
    [monthlyGoals]
  );

  const renderTasks = (block: RoutineBlock, blockTasks: any[]) => {
    const routineTasks = [...(block.tasks || []), ...(block.genericTasks || [])].filter(Boolean);
    const hasRoutine = routineTasks.length > 0;
    const hasPlan = blockTasks.length > 0;
    if (!hasRoutine && !hasPlan) {
      return <p className="text-sm text-muted-foreground">Sin tareas en este bloque.</p>;
    }
    return (
      <ul className="space-y-1.5">
        {routineTasks.map((t, i) => (
          <li key={`rt-${i}`} className="flex items-start gap-2 text-sm">
            <Circle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <span>{t}</span>
          </li>
        ))}
        {blockTasks.map(t => (
          <li key={t.id} className={cn('flex items-start gap-2 text-sm', t.completed && 'line-through text-muted-foreground')}>
            {t.completed
              ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
              : <Circle className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />}
            <span>{t.title}</span>
            {t.sourceName && <span className="text-[10px] text-muted-foreground self-center ml-auto shrink-0">{t.sourceName}</span>}
          </li>
        ))}
      </ul>
    );
  };

  const CASCADE_LEVELS = [
    { id: 'now', label: 'AHORA MISMO', icon: Clock, color: 'border-primary', desc: 'Basado en el bloque de la rutina · Tu única tarea de hoy' },
    { id: 'today', label: 'HOY', icon: CalendarDays, color: 'border-sky-500', desc: 'Las tareas de hoy · empujado por la semana' },
    { id: 'week', label: 'ESTA SEMANA', icon: CalendarRange, color: 'border-violet-500', desc: 'Objetivos semanales · empujado por el mes' },
    { id: 'month', label: 'ESTE MES', icon: Calendar, color: 'border-emerald-500', desc: 'Minutos por área · empujado por el trimestre' },
    { id: 'quarter', label: 'ESTE TRIMESTRE', icon: Layers, color: 'border-amber-500', desc: 'Metas del trimestre · empujado por el año' },
    { id: 'year', label: 'ESTE AÑO', icon: Eye, color: 'border-rose-500', desc: 'Tu plan anual' },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Cabecera */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ahora mismo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rutina {routine?.label || routineType} · {routine?.icon}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* ─── Nivel: AHORA MISMO ─── */}
        <section className={cn('rounded-2xl border-2 p-5', CASCADE_LEVELS[0].color)}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Tu única cosa AHORA MISMO</h2>
          </div>
          {current ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <Badge><Clock className="h-3 w-3" /> Bloque actual</Badge>
                <span className="text-xs text-muted-foreground min-w-[70px] text-right">Quedan {minutesLeft} min</span>
              </div>
              <h3 className="text-2xl font-bold mt-1">{current.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatTimeDisplay(current.startTime)} → {formatTimeDisplay(current.endTime)}
                {current.currentFocus ? ` · ${current.currentFocus}` : ''}
              </p>
              <Progress value={progress} className="h-2 mt-3" />
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> La única cosa que puedo hacer ahora
                </h4>
                {renderTasks(current, currentBlockTasks)}
              </div>
            </>
          ) : (
            <Card className="p-4 text-center border-0">
              <Moon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">No hay bloque activo ahora mismo</p>
              <p className="text-sm text-muted-foreground mt-1">Tiempo libre o fuera de la rutina.</p>
            </Card>
          )}
        </section>

        {/* ─── Siguiente bloque (preview) ─── */}
        {next && (
          <Card className="p-5 bg-muted/30 border-border/40">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="gap-1">
                <ArrowRight className="h-3 w-3" /> Siguiente bloque
              </Badge>
              <span className="text-xs text-muted-foreground">En {minutesToNext} min</span>
            </div>
            <h3 className="text-xl font-semibold">{next.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatTimeDisplay(next.startTime)} → {formatTimeDisplay(next.endTime)}
              {next.currentFocus ? ` · ${next.currentFocus}` : ''}
            </p>
            {nextBlockTasks.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tareas del plan</h4>
                <ul className="space-y-1">
                  {nextBlockTasks.map(t => (
                    <li key={t.id} className="flex items-start gap-2 text-sm">
                      <Circle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <span>{t.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* ─── Cascada de metas hacia arriba ─── */}
        <div className="rounded-2xl border p-4 space-y-3 bg-background">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-base">Escalera de metas</h2>
            </div>
            <button
              onClick={() => setShowCascade(showCascade === 'all' ? 'now' : 'all')}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showCascade === 'all' ? 'Colapsar' : 'Mostrar escalera completa'}
            </button>
          </div>

          {/* HOY */}
          <div className={cn('border-l-4 rounded-r-lg bg-card/40 p-3', CASCADE_LEVELS[1].color, showCascade !== 'all' && showCascade !== 'today' && 'hidden')}>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-500" />
              <span className="font-semibold text-sm">HOY</span>
              <span className="ml-auto text-xs text-muted-foreground">{todayTasks.length} tareas pendientes</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lo que puedo hacer HOY (basado en mi meta semanal)</p>
            {todayTasks.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {todayTasks.slice(0, 8).map(t => (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <Circle className="h-3.5 w-3.5 mt-0.5 text-sky-400 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
                {todayTasks.length > 8 && (
                  <li className="text-xs text-muted-foreground pl-6">+{todayTasks.length - 8} más...</li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No hay tareas pendientes para hoy.</p>
            )}
          </div>

          {/* SEMANA */}
          <div className={cn('border-l-4 rounded-r-lg bg-card/40 p-3', CASCADE_LEVELS[2].color, showCascade !== 'all' && showCascade !== 'week' && 'hidden')}>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-violet-500" />
              <span className="font-semibold text-sm">ESTA SEMANA</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {objectivesLoading ? '...' : `${objectives.filter(o => !o.completed).length} objetivos activos`}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lo que puedo hacer ESTA SEMANA (basado en mi meta mensual)</p>
            {!objectivesLoading && objectives.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {objectives.slice(0, 6).map(o => (
                  <li key={o.id} className="flex items-start gap-2 text-sm">
                    {o.completed
                      ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                      : <Circle className="h-3.5 w-3.5 mt-0.5 text-violet-400 shrink-0" />}
                    <span className={cn(o.completed && 'line-through text-muted-foreground')}>{o.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No hay objetivos definidos esta semana.</p>
            )}
          </div>

          {/* MES */}
          <div className={cn('border-l-4 rounded-r-lg bg-card/40 p-3', CASCADE_LEVELS[3].color, showCascade !== 'all' && showCascade !== 'month' && 'hidden')}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-sm">ESTE MES</span>
              <span className="ml-auto text-xs text-muted-foreground">{monthlyGoalTotal > 0 ? `${monthlyGoalTotal} min` : 'Sin metas'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lo que puedo hacer ESTE MES (basado en mi meta trimestral)</p>
            {monthlyAreaEntries.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {monthlyAreaEntries.slice(0, 6).map(([area, val]) => (
                  <li key={area} className="flex items-center gap-2 text-sm">
                    <Circle className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                    <span className="capitalize">{area}</span>
                    <span className="ml-auto text-xs font-semibold">{val} min</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No hay metas de minutos definidas este mes.</p>
            )}
          </div>

          {/* TRIMESTRE */}
          <div className={cn('border-l-4 rounded-r-lg bg-card/40 p-3', CASCADE_LEVELS[4].color, showCascade !== 'all' && showCascade !== 'quarter' && 'hidden')}>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-sm">ESTE TRIMESTRE</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {goalsLoading ? '...' : `${activeGoals.length} metas activas`}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lo que puedo hacer ESTE TRIMESTRE (basado en mi meta anual)</p>
            {!goalsLoading && activeGoals.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {activeGoals.slice(0, 6).map(g => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    <Target className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                    <span className="truncate">{g.title}</span>
                    <span className="ml-auto text-xs font-semibold shrink-0">{g.progress_percentage || 0}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No hay metas trimestrales activas.</p>
            )}
          </div>

          {/* AÑO */}
          <div className={cn('border-l-4 rounded-r-lg bg-card/40 p-3', CASCADE_LEVELS[5].color, showCascade !== 'all' && showCascade !== 'year' && 'hidden')}>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-rose-500" />
              <span className="font-semibold text-sm">ESTE AÑO</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tu dirección anual que empuja todo hacia abajo.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Defina (o revisa) tu visión anual en la página <strong>Año</strong> de la línea de tiempo. Cada meta de abajo se origina de este horizonte.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Bloques y tareas de la rutina seleccionada en la página Hoy. Cada nivel superior empuja al inferior.
        </p>
      </div>
    </div>
  );
}
