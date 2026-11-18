import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlarmClock, BookOpen, Calendar, CalendarClock, ChevronRight, Clock,
  GraduationCap, Loader2, Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { applyDayBlockOverrides } from '@/lib/dayBlockOverrides';
import {
  useUniversitySchedule,
  type AcademicClass,
  type ScheduleSubjectLike,
} from '@/hooks/useUniversitySchedule';
import {
  blockFocusSlots,
  describeBlockFocus,
  isFragmentableBlock,
  isFreeBlock,
  studyModeLabel,
  type StudyMode,
} from '@/lib/speedPlan';

interface PlannedStudy {
  key: string;
  range: string | null;
  subjectName: string;
  detail: string | null;
  mode: StudyMode;
}

const STUDY_MODE_STYLES: Record<StudyMode, string> = {
  teoria: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  ejercicios: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  clase: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
};

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function overlapMinutes(
  blockStart: string,
  blockEnd: string,
  classStart: string,
  classEnd: string,
): number {
  const start = toMinutes(blockStart);
  let end = toMinutes(blockEnd);
  if (end <= start) end += 24 * 60;
  return Math.max(0, Math.min(end, toMinutes(classEnd)) - Math.max(start, toMinutes(classStart)));
}

function isUniversitySource(source: string): boolean {
  return source === 'university' || source === 'universidad';
}

interface RoutineBlockScheduleProps {
  onTaskUnassigned?: () => void;
  studySessionsByTask?: Record<string, { count: number; minutes: number }>;
  /** Asignaturas de Universidad para emparejar las clases del horario académico. */
  subjects?: ScheduleSubjectLike[];
}

export function RoutineBlockSchedule({
  studySessionsByTask,
  subjects,
}: RoutineBlockScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const targetDate = useMemo(
    () => (selectedDate === 'today' ? new Date() : new Date(Date.now() + 86400000)),
    [selectedDate],
  );

  const { blocks: routineBlocks, isLoaded: routineLoaded } = useRoutineBlocks();
  const {
    tasksByBlock,
    unassignedTasks,
    planAssignments,
    planSkipGym,
    planSpeedPlan,
    planLoaded,
    tasksLoading,
    refreshPlan,
    refreshTasks,
  } = useDailyPlanData(targetDate);
  const { classesForDate } = useUniversitySchedule(subjects);

  const blocks = useMemo(
    () => applyDayBlockOverrides(routineBlocks, { skipGym: planSkipGym }),
    [routineBlocks, planSkipGym],
  );
  const scheduleClasses = useMemo(
    () => classesForDate(targetDate),
    [classesForDate, targetDate],
  );

  useEffect(() => {
    const handleRefresh = () => {
      void refreshPlan();
      void refreshTasks();
    };
    window.addEventListener('taskAssignmentChanged', handleRefresh);
    return () => window.removeEventListener('taskAssignmentChanged', handleRefresh);
  }, [refreshPlan, refreshTasks]);

  /** Cada clase del horario se muestra en el bloque donde cabe mejor. */
  const classesByBlock = useMemo(() => {
    const result: Record<string, AcademicClass[]> = {};
    for (const cls of scheduleClasses) {
      let bestBlockId: string | null = null;
      let bestOverlap = 0;
      for (const block of blocks) {
        const overlap = overlapMinutes(block.startTime, block.endTime, cls.start, cls.end);
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestBlockId = block.id;
        }
      }
      if (bestBlockId) {
        if (!result[bestBlockId]) result[bestBlockId] = [];
        result[bestBlockId].push(cls);
      }
    }
    return result;
  }, [blocks, scheduleClasses]);

  /** Asignatura y modo planificados en cada bloque (teoría, ejercicios o clase). */
  const studiesByBlock = useMemo(() => {
    const result: Record<string, PlannedStudy[]> = {};
    for (const block of blocks) {
      const entry = planSpeedPlan?.blocks[block.id];
      const studies: PlannedStudy[] = [];
      for (const slot of blockFocusSlots(block, entry)) {
        const summary = describeBlockFocus(slot.focus);
        if (!summary || summary.kind !== 'universidad') continue;
        studies.push({
          key: `${block.id}-${slot.fragmentId ?? 'whole'}`,
          range: slot.fragmentId ? `${slot.start}–${slot.end}` : null,
          subjectName: summary.primary,
          detail: summary.secondary,
          mode: summary.mode ?? 'teoria',
        });
      }
      if (studies.length > 0) result[block.id] = studies;
    }
    return result;
  }, [blocks, planSpeedPlan]);

  const visibleBlocks = useMemo(
    () => blocks.filter(block => {
      const studies = studiesByBlock[block.id] ?? [];
      const classes = classesByBlock[block.id] ?? [];
      const universityTasks = (tasksByBlock[block.id] ?? []).filter(task => isUniversitySource(task.source));
      return isFragmentableBlock(block) || studies.length > 0 || classes.length > 0 || universityTasks.length > 0;
    }),
    [blocks, classesByBlock, studiesByBlock, tasksByBlock],
  );

  const unassignedUniversityTasks = useMemo(
    () => unassignedTasks.filter(task => isUniversitySource(task.source)),
    [unassignedTasks],
  );

  const loading = !routineLoaded || !planLoaded || tasksLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Estudio y clases en mi rutina
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Teoría, ejercicios y clases planificadas dentro de tus bloques.
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant={selectedDate === 'today' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDate('today')}
            >
              Hoy
            </Button>
            <Button
              variant={selectedDate === 'tomorrow' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDate('tomorrow')}
            >
              Mañana
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground capitalize">
            {format(targetDate, "EEEE d 'de' MMMM", { locale: es })}
            {planAssignments && (
              <span className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                · plan guardado
              </span>
            )}
          </p>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs">
            <Link to="/plan-manana">
              Planificar
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Cargando bloques...</p>
          </div>
        ) : visibleBlocks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay bloques de estudio en esta rutina.
          </p>
        ) : (
          <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-1.5">
              {visibleBlocks.map(block => {
                const studies = studiesByBlock[block.id] ?? [];
                const plannedClassKeys = new Set(
                  studies
                    .filter(study => study.mode === 'clase' && study.detail)
                    .map(study => `${study.subjectName}|${study.detail}`),
                );
                const blockClasses = (classesByBlock[block.id] ?? []).filter(
                  cls => !plannedClassKeys.has(`${cls.subjectName}|${cls.start}–${cls.end}`),
                );
                const universityTasks = (tasksByBlock[block.id] ?? []).filter(task => isUniversitySource(task.source));
                const isFree = isFreeBlock(block);
                const hasContent = studies.length > 0 || blockClasses.length > 0 || universityTasks.length > 0;

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-2.5 transition-colors',
                      isFree
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : hasContent
                          ? 'border-blue-500/30 bg-blue-500/5'
                          : 'border-border',
                    )}
                  >
                    <div className="w-14 shrink-0 pt-0.5 text-center">
                      <p className="text-xs font-bold leading-tight">{block.startTime}</p>
                      <p className="text-[10px] leading-tight text-muted-foreground">{block.endTime}</p>
                    </div>

                    <div className={cn(
                      'w-0.5 shrink-0 self-stretch rounded-full',
                      isFree ? 'bg-emerald-500' : hasContent ? 'bg-blue-500' : 'bg-border',
                    )} />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">{block.title}</span>
                        {isFree && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          >
                            <Unlock className="mr-0.5 h-2.5 w-2.5" />
                            Libre
                          </Badge>
                        )}
                      </div>

                      {studies.map(study => (
                        <div
                          key={study.key}
                          className="flex flex-wrap items-center gap-1.5 rounded-md bg-background/70 px-2 py-1"
                        >
                          <GraduationCap className="h-3 w-3 shrink-0 text-sky-500" />
                          <span className="truncate text-xs font-medium">{study.subjectName}</span>
                          <Badge
                            variant="outline"
                            className={cn('px-1 py-0 text-[9px] font-semibold', STUDY_MODE_STYLES[study.mode])}
                          >
                            {studyModeLabel(study.mode)}
                          </Badge>
                          {study.range && (
                            <span className="font-mono text-[10px] text-muted-foreground">{study.range}</span>
                          )}
                          {study.detail && (
                            <span className="truncate text-[10px] text-muted-foreground">· {study.detail}</span>
                          )}
                        </div>
                      ))}

                      {blockClasses.map(cls => (
                        <div
                          key={cls.id}
                          className="flex flex-wrap items-center gap-1.5 rounded-md bg-background/70 px-2 py-1"
                        >
                          <CalendarClock className="h-3 w-3 shrink-0 text-indigo-500" />
                          <span className="truncate text-xs font-medium">{cls.subjectName || 'Clase'}</span>
                          <Badge
                            variant="outline"
                            className={cn('px-1 py-0 text-[9px] font-semibold', STUDY_MODE_STYLES.clase)}
                          >
                            Clase
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {cls.start}–{cls.end}
                          </span>
                        </div>
                      ))}

                      {universityTasks.length > 0 && (
                        <div className="space-y-1">
                          {universityTasks.map(task => {
                            const sessions = studySessionsByTask?.[task.id];
                            return (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 rounded border border-blue-500/20 bg-background/80 py-1 pl-2 pr-2"
                              >
                                <BookOpen className="h-3 w-3 shrink-0 text-blue-600" />
                                <span className="flex-1 truncate text-xs">{task.title}</span>
                                {sessions && sessions.count > 0 && (
                                  <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-blue-600">
                                    <AlarmClock className="h-3 w-3" />
                                    {sessions.count} · {sessions.minutes}m
                                  </span>
                                )}
                                <Badge variant="outline" className="px-1 py-0 text-[10px]">
                                  Tarea
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!hasContent && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {isFree
                            ? 'Horario libre: asigna estudio, trabajo o tareas desde Planificación.'
                            : 'Sin planificar: puedes estudiar teoría o hacer ejercicios en este bloque.'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {!loading && unassignedUniversityTasks.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
              Tareas universitarias sin bloque ({unassignedUniversityTasks.length})
            </p>
            <div className="space-y-1">
              {unassignedUniversityTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span className="flex-1 truncate">{task.title}</span>
                  {task.sourceName && (
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">{task.sourceName}</Badge>
                  )}
                </div>
              ))}
              {unassignedUniversityTasks.length > 5 && (
                <p className="text-xs italic text-muted-foreground">
                  +{unassignedUniversityTasks.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
