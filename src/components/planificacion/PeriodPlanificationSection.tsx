import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BookOpen, CalendarDays, FolderKanban, Gamepad2, GraduationCap, Languages,
  LayoutGrid, ListChecks, Music, Pencil, Sparkles, Target, Timer, Trophy, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { usePeriodPlanTasks } from '@/hooks/usePeriodPlanTasks';
import { usePlanLibraryToggles, type SongPlanTypeLite } from '@/hooks/usePlanLibraryToggles';
import {
  ALL_HIERARCHY_AREAS, AREA_LABELS,
  getDayGoalEffective, getDayGoalTotal, getMonthGoalsSummary, getWeekGoalEffective,
} from '@/lib/hierarchy';
import { buildHabitPlanObjectives } from '@/lib/planObjectives';
import { LANGUAGE_IDS, LANGUAGE_LABELS, readLanguageMonthPlans, readLanguageWeekPlans } from '@/lib/languagePlan';
import { readGameMonthPlan, readGameWeekPlan } from '@/lib/game';
import { PlanCard, type PlanItem } from './PlanCard';

export type PlanificationScope = 'day' | 'week' | 'month';

interface PeriodPlanificationSectionProps {
  scope: PlanificationScope;
  anchorDate: Date;
}

export function PeriodPlanificationSection({ scope, anchorDate }: PeriodPlanificationSectionProps) {
  if (scope === 'day') return <DayPlanification anchorDate={anchorDate} />;
  if (scope === 'week') return <WeekPlanification anchorDate={anchorDate} />;
  return <MonthPlanification anchorDate={anchorDate} />;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const minutesLabel = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`;

const dateLabel = (value?: string | null) => {
  if (!value) return undefined;
  // Se toma solo la fecha (yyyy-MM-dd) para evitar saltos de día por zona horaria.
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (isNaN(date.getTime())) return undefined;
  return format(date, 'EEE d MMM', { locale: es });
};

function goalItems(goals: Record<string, number>): PlanItem[] {
  return ALL_HIERARCHY_AREAS
    .map(area => ({ area, min: Math.max(0, Math.round(goals[area] || 0)) }))
    .filter(x => x.min > 0)
    .map(x => ({ id: x.area, title: AREA_LABELS[x.area] || x.area, meta: minutesLabel(x.min) }));
}

const INTENSITY_LABEL: Record<string, string> = { minimo: 'Mín', maximo: 'Máx', extra: 'Extra' };
const INTENSITY_MULT: Record<string, number> = { minimo: 0.5, maximo: 1, extra: 1.5 };
const INTENSITY_BASE_MIN: Record<string, number> = { lectura: 30, ajedrez: 20, game: 20, idiomas: 30, gym: 60, musica: 30 };
const SYSTEM_NAMES: Record<string, string> = { lectura: 'Lectura', ajedrez: 'Ajedrez', game: 'Game', idiomas: 'Idiomas', gym: 'Gym', musica: 'Música' };

function intensityItems(planIntensity?: Record<string, string> | null): PlanItem[] {
  return Object.entries(planIntensity || {})
    .filter(([, value]) => value === 'minimo' || value === 'maximo' || value === 'extra')
    .map(([id, value]) => ({
      id,
      title: SYSTEM_NAMES[id] || id,
      tag: INTENSITY_LABEL[value],
      meta: `~${Math.round((INTENSITY_BASE_MIN[id] || 30) * (INTENSITY_MULT[value] ?? 1))} min`,
    }));
}

function songTag(plan?: SongPlanTypeLite) {
  if (plan === 'mastered') return 'Dominar';
  if (plan === 'recorded') return 'Grabar';
  return 'Aprender';
}

/** Nombres de emprendimientos para el foco semanal por área. */
function useEntrepreneurshipNames(ids: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});
  const key = ids.join(',');

  useEffect(() => {
    let alive = true;
    if (ids.length === 0) {
      setNames({});
      return () => { alive = false; };
    }
    (async () => {
      const { data } = await supabase.from('entrepreneurships').select('id, name').in('id', ids);
      if (!alive) return;
      const rows = (data || []) as { id: string; name: string }[];
      setNames(Object.fromEntries(rows.map(row => [row.id, row.name])));
    })();

    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return names;
}

/* ------------------------------------------------------------------ */
/* Estructura visual                                                   */
/* ------------------------------------------------------------------ */

function PlanShell({
  title, subtitle, editUrl, empty, loading, children,
}: {
  title: string;
  subtitle: string;
  editUrl: string;
  empty: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-full text-xs"
          onClick={() => navigate(editUrl)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Sin objetivos planificados para este periodo.</p>
          <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => navigate(editUrl)}>
            Abrir planificación
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
      )}
    </section>
  );
}

function PlanGroupHeading({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 pt-1 md:col-span-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{children}</h3>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function taskItems(
  tasks: { id: string; title: string; completed: boolean; due_date: string | null; area_id: string | null }[],
  onToggle: (id: string) => void,
  showDate: boolean,
): PlanItem[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: [
      showDate ? dateLabel(task.due_date) : undefined,
      task.area_id ? (AREA_LABELS[task.area_id] || task.area_id) : undefined,
    ].filter(Boolean).join(' · ') || undefined,
    done: task.completed,
    onToggle: () => onToggle(task.id),
  }));
}

/* ------------------------------------------------------------------ */
/* MES                                                                 */
/* ------------------------------------------------------------------ */

function MonthPlanification({ anchorDate }: { anchorDate: Date }) {
  const month = startOfMonth(anchorDate);
  const { planData, books, songs, projects, subjects, topics, events, loading } = useMonthlyPlan(month);
  const { tasks, toggleTask, loading: tasksLoading } = usePeriodPlanTasks(month, endOfMonth(month));
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);

  const goals = useMemo(() => getMonthGoalsSummary(month), [month]);

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicsById = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  const goalsList = goalItems(goals);

  const bookList: PlanItem[] = (planData.books?.selected || []).flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
    }];
  });

  const songList: PlanItem[] = (planData.songs?.selected || []).flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planData.songs_plan?.[id];
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
    }];
  });

  const subjectList: PlanItem[] = (planData.subjects || []).flatMap(entry => {
    const subject = subjectsById.get(entry.subject_id);
    if (!subject) return [];
    const topicNames = (entry.topics || [])
      .map(id => topicsById.get(id)?.title)
      .filter(Boolean) as string[];
    return [{
      id: entry.subject_id,
      title: subject.name,
      subtitle: topicNames.length > 0 ? topicNames.join(' · ') : undefined,
      meta: topicNames.length > 0 ? `${topicNames.length} temas` : undefined,
    }];
  });

  const projectList: PlanItem[] = (planData.projects || []).flatMap(id => {
    const project = projectsById.get(id);
    return project ? [{ id, title: project.name }] : [];
  });

  const eloGoal = Number(planData.chess?.elo_goal) || 0;
  const chessList: PlanItem[] = eloGoal > 0
    ? [{ id: 'elo-mes', title: `${eloGoal} ELO`, subtitle: 'Objetivo al cerrar el mes' }]
    : [];

  const languageMonth = useMemo(() => readLanguageMonthPlans(planData.languages), [planData.languages]);
  const languageList: PlanItem[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageMonth[lang];
    const hasContent = plan.milestone || plan.monthMinutes > 0 || plan.level;
    if (!hasContent) return [];
    return [{
      id: lang,
      title: `${LANGUAGE_LABELS[lang]}${plan.level ? ` · ${plan.level}` : ''}`,
      subtitle: plan.milestone || undefined,
      meta: plan.monthMinutes > 0 ? minutesLabel(plan.monthMinutes) : undefined,
    }];
  });

  const gameMonth = useMemo(() => readGameMonthPlan(planData.game), [planData.game]);
  const gameList: PlanItem[] = (() => {
    const parts = [
      gameMonth.milestone,
      gameMonth.xpGoal > 0 ? `${gameMonth.xpGoal} XP` : '',
    ].filter(Boolean);
    return parts.length > 0
      ? [{ id: 'game-mes', title: 'Game', subtitle: gameMonth.milestone || undefined, meta: gameMonth.xpGoal > 0 ? `${gameMonth.xpGoal} XP` : undefined }]
      : [];
  })();

  const personalGoals: PlanItem[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `goal-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
  }));

  const eventList: PlanItem[] = (planData.events || []).flatMap(id => {
    const event = eventsById.get(id);
    if (!event) return [];
    return [{
      id: event.id,
      title: event.title,
      subtitle: event.category || undefined,
      meta: dateLabel(event.event_date),
    }];
  });

  const taskList = taskItems(tasks, toggleTask, true);

  const empty = [
    goalsList, taskList, bookList, songList, subjectList, projectList,
    chessList, languageList, gameList, personalGoals, eventList,
  ].every(list => list.length === 0);

  const monthTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (goals[area] || 0), 0);

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Mes de ${format(month, 'MMMM yyyy', { locale: es })}`}
      editUrl={`/monthly-planning?month=${format(month, 'yyyy-MM')}`}
      empty={empty}
      loading={loading || tasksLoading}
    >
      <PlanCard
        icon={<Timer className="h-3.5 w-3.5" />}
        title="Metas de minutos"
        items={goalsList}
        accent="bg-sky-500/10 text-sky-500"
        hint={monthTotal > 0 ? `Total del mes: ${minutesLabel(monthTotal)}` : undefined}
      />
      <PlanCard icon={<ListChecks className="h-3.5 w-3.5" />} title="Tareas del mes" items={taskList} accent="bg-indigo-500/10 text-indigo-500" />
      <PlanCard icon={<BookOpen className="h-3.5 w-3.5" />} title="Lectura" items={bookList} accent="bg-blue-500/10 text-blue-500" />
      <PlanCard icon={<Music className="h-3.5 w-3.5" />} title="Música" items={songList} accent="bg-violet-500/10 text-violet-500" />
      <PlanCard icon={<GraduationCap className="h-3.5 w-3.5" />} title="Universidad" items={subjectList} accent="bg-indigo-500/10 text-indigo-500" />
      <PlanCard icon={<FolderKanban className="h-3.5 w-3.5" />} title="Proyectos" items={projectList} accent="bg-amber-500/10 text-amber-500" />
      <PlanCard icon={<Trophy className="h-3.5 w-3.5" />} title="Ajedrez" items={chessList} accent="bg-emerald-500/10 text-emerald-500" />
      <PlanCard icon={<Languages className="h-3.5 w-3.5" />} title="Idiomas" items={languageList} accent="bg-cyan-500/10 text-cyan-500" />
      <PlanCard icon={<Gamepad2 className="h-3.5 w-3.5" />} title="Game" items={gameList} accent="bg-rose-500/10 text-rose-500" />
      <PlanCard icon={<Target className="h-3.5 w-3.5" />} title="Metas personales" items={personalGoals} accent="bg-purple-500/10 text-purple-500" />
      <PlanCard icon={<CalendarDays className="h-3.5 w-3.5" />} title="Eventos" items={eventList} accent="bg-slate-500/10 text-slate-500" />
    </PlanShell>
  );
}

/* ------------------------------------------------------------------ */
/* SEMANA                                                              */
/* ------------------------------------------------------------------ */

function WeekPlanification({ anchorDate }: { anchorDate: Date }) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');

  const { planData, patchPlan, loading } = useWeeklyPlan(weekStart);
  const month = startOfMonth(weekStart);
  const { planData: monthPlan, books, songs, projects, subjects } = useMonthlyPlan(month);
  const { tasks, toggleTask, loading: tasksLoading } = usePeriodPlanTasks(weekStart, weekEnd);
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);
  const entrepreneurshipIds = planData.areaFocus?.emprendimiento || [];
  const entrepreneurshipNames = useEntrepreneurshipNames(entrepreneurshipIds);

  const weekDist = monthPlan.week_distribution?.[weekKey];

  const weekGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => { out[area] = getWeekGoalEffective(weekStart, area); });
    return out;
  }, [weekStart]);

  const goalsList = goalItems(weekGoals);

  const objectivesList: PlanItem[] = (planData.objectives || []).map((objective, index) => ({
    id: `objetivo-${index}`,
    title: objective,
  }));

  const personalGoalsList: PlanItem[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `meta-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
  }));

  const outcomeList: PlanItem[] = (planData.outcomes || []).map(outcome => ({
    id: outcome.id,
    title: outcome.title,
    subtitle: outcome.successCriteria || undefined,
    tag: outcome.priority === 'high' ? 'Alta' : outcome.priority === 'medium' ? 'Media' : outcome.priority === 'low' ? 'Baja' : undefined,
    done: outcome.completed,
    onToggle: () => patchPlan(prev => ({
      ...prev,
      outcomes: (prev.outcomes || []).map(o => (o.id === outcome.id ? { ...o, completed: !o.completed } : o)),
    })),
  }));

  const actionList: PlanItem[] = (planData.actions || []).map(action => ({
    id: action.id,
    title: action.title,
    subtitle: [
      action.assignedDay ? dateLabel(action.assignedDay) : undefined,
      action.area || undefined,
    ].filter(Boolean).join(' · ') || undefined,
    meta: action.estimatedMinutes ? minutesLabel(action.estimatedMinutes) : undefined,
    done: action.completed,
    onToggle: () => patchPlan(prev => ({
      ...prev,
      actions: (prev.actions || []).map(a => (a.id === action.id ? { ...a, completed: !a.completed } : a)),
    })),
  }));

  const areaList: PlanItem[] = (() => {
    const subjectsById = new Map(subjects.map(s => [s.id, s.name]));
    const projectsById = new Map(projects.map(p => [p.id, p.name]));
    const areas: { id: string; label: string; focusIds: string[]; resolve: (id: string) => string | undefined }[] = [
      { id: 'universidad', label: 'Universidad', focusIds: planData.areaFocus?.universidad || [], resolve: id => subjectsById.get(id) },
      { id: 'emprendimiento', label: 'Emprendimiento', focusIds: planData.areaFocus?.emprendimiento || [], resolve: id => entrepreneurshipNames[id] },
      { id: 'proyectos', label: 'Proyectos', focusIds: planData.areaFocus?.proyectos || [], resolve: id => projectsById.get(id) },
      { id: 'general', label: 'Tareas generales', focusIds: [], resolve: () => undefined },
    ];

    return areas.flatMap(area => {
      const names = area.focusIds.map(area.resolve).filter(Boolean) as string[];
      const rawResult = planData.areaResults?.[area.id];
      const resultTitle = rawResult
        ? (planData.outcomes || []).find(o => o.id === rawResult)?.title || rawResult
        : '';
      const minutes = weekGoals[area.id] || 0;
      if (names.length === 0 && !resultTitle && minutes <= 0) return [];
      return [{
        id: area.id,
        title: area.label,
        subtitle: [names.join(' · '), resultTitle ? `→ ${resultTitle}` : ''].filter(Boolean).join(' · ') || undefined,
        meta: minutes > 0 ? minutesLabel(minutes) : undefined,
      }];
    });
  })();

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);

  const weekBookIds = useMemo(() => {
    const ids = weekDist?.books?.length ? [...weekDist.books] : [...(monthPlan.books?.selected || [])];
    if (planData.weekBookId && !ids.includes(planData.weekBookId)) ids.unshift(planData.weekBookId);
    return ids;
  }, [weekDist, monthPlan.books, planData.weekBookId]);

  const weekSongIds = useMemo(() => {
    const ids = weekDist?.songs?.length ? [...weekDist.songs] : [...(monthPlan.songs?.selected || [])];
    const extras = [weekDist?.learning_song_id, weekDist?.mastering_song_id, planData.learningSongId, planData.masteringSongId];
    extras.forEach(id => { if (id && !ids.includes(id)) ids.unshift(id); });
    return ids;
  }, [weekDist, monthPlan.songs, planData]);

  const planTypeFor = (id: string): SongPlanTypeLite => {
    if (id === weekDist?.learning_song_id) return 'learned';
    if (id === weekDist?.mastering_song_id) return 'mastered';
    return monthPlan.songs_plan?.[id];
  };

  const bookList: PlanItem[] = weekBookIds.flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
    }];
  });

  const songList: PlanItem[] = weekSongIds.flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planTypeFor(id);
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
    }];
  });

  const eloStart = Number(planData.chessEloStart) || Number(weekDist?.elo_start) || 0;
  const eloTarget = Number(planData.chessEloTarget) || Number(weekDist?.elo_target) || 0;
  const chessList: PlanItem[] = eloTarget > 0
    ? [{
        id: 'elo-sem',
        title: `${eloTarget} ELO`,
        subtitle: eloStart > 0 && eloStart !== eloTarget ? `${eloStart} → ${eloTarget}` : 'Objetivo de la semana',
      }]
    : [];

  const languageWeek = useMemo(() => readLanguageWeekPlans(planData.languages), [planData.languages]);
  const languageList: PlanItem[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(planData.game), [planData.game]);
  const gameList: PlanItem[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: 'Game',
        subtitle: [gameWeek.focusSkill, gameWeek.challenge].filter(Boolean).join(' · ') || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
      }]
    : [];

  const taskList = taskItems(tasks, toggleTask, true);

  const empty = [
    goalsList, objectivesList, personalGoalsList, outcomeList, actionList, areaList, bookList, songList,
    chessList, languageList, gameList, taskList,
  ].every(list => list.length === 0);

  const weekTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (weekGoals[area] || 0), 0);

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Semana del ${format(weekStart, 'd MMM', { locale: es })} al ${format(weekEnd, 'd MMM', { locale: es })}`}
      editUrl={`/weekly-planning?week=${weekKey}`}
      empty={empty}
      loading={loading || tasksLoading}
    >
      <PlanCard
        icon={<Timer className="h-3.5 w-3.5" />}
        title="Metas de minutos"
        items={goalsList}
        accent="bg-sky-500/10 text-sky-500"
        hint={weekTotal > 0 ? `Total de la semana: ${minutesLabel(weekTotal)}` : undefined}
      />
      <PlanCard icon={<Target className="h-3.5 w-3.5" />} title="Objetivos de la semana" items={objectivesList} accent="bg-emerald-500/10 text-emerald-500" />
      <PlanCard icon={<Target className="h-3.5 w-3.5" />} title="Metas personales" items={personalGoalsList} accent="bg-purple-500/10 text-purple-500" />
      <PlanCard icon={<Target className="h-3.5 w-3.5" />} title="Resultados" items={outcomeList} accent="bg-emerald-500/10 text-emerald-500" />
      <PlanCard icon={<Zap className="h-3.5 w-3.5" />} title="Acciones" items={actionList} accent="bg-amber-500/10 text-amber-500" />
      <PlanCard icon={<LayoutGrid className="h-3.5 w-3.5" />} title="Áreas de la semana" items={areaList} accent="bg-primary/10 text-primary" />
      <PlanCard icon={<BookOpen className="h-3.5 w-3.5" />} title="Lectura" items={bookList} accent="bg-blue-500/10 text-blue-500" />
      <PlanCard icon={<Music className="h-3.5 w-3.5" />} title="Música" items={songList} accent="bg-violet-500/10 text-violet-500" />
      <PlanCard icon={<Trophy className="h-3.5 w-3.5" />} title="Ajedrez" items={chessList} accent="bg-emerald-500/10 text-emerald-500" />
      <PlanCard icon={<Languages className="h-3.5 w-3.5" />} title="Idiomas" items={languageList} accent="bg-cyan-500/10 text-cyan-500" />
      <PlanCard icon={<Gamepad2 className="h-3.5 w-3.5" />} title="Game" items={gameList} accent="bg-rose-500/10 text-rose-500" />
      <PlanCard icon={<ListChecks className="h-3.5 w-3.5" />} title="Tareas de la semana" items={taskList} accent="bg-indigo-500/10 text-indigo-500" />
    </PlanShell>
  );
}

/* ------------------------------------------------------------------ */
/* DÍA                                                                 */
/* ------------------------------------------------------------------ */

function DayPlanification({ anchorDate }: { anchorDate: Date }) {
  const {
    blocks, tasks, tasksByBlock, planGoals, planIntensity,
    planRoutineType, planLoaded, tasksLoading,
    toggleTaskDone, toggleBlockComplete, isBlockCompleted,
  } = useDailyPlanData(anchorDate);

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const { planData: weekPlan, loading: weekLoading } = useWeeklyPlan(weekStart);
  const { planData: monthPlan, books, songs, projects, subjects, loading: monthLoading } = useMonthlyPlan(startOfMonth(anchorDate));
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);

  const dayGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => {
      out[area] = Math.max(0, planGoals?.[area] || getDayGoalEffective(anchorDate, area));
    });
    return out;
  }, [anchorDate, planGoals]);

  const goalsList = goalItems(dayGoals);
  const dayTotal = getDayGoalTotal(anchorDate, planGoals);
  const intensityList = intensityItems(planIntensity);

  const blockTitleByTaskId = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(tasksByBlock || {}).forEach(([blockId, blockTasks]) => {
      const title = blocks.find(b => b.id === blockId)?.title;
      if (!title) return;
      blockTasks.forEach(t => map.set(t.id, title));
    });
    return map;
  }, [tasksByBlock, blocks]);

  const blockList: PlanItem[] = blocks.map(block => {
    const blockTasks = tasksByBlock[block.id] || [];
    const done = blockTasks.filter(t => t.completed).length;
    return {
      id: block.id,
      title: block.title,
      subtitle: [block.startTime, block.endTime].filter(Boolean).join(' – ') || undefined,
      meta: blockTasks.length > 0 ? `${done}/${blockTasks.length}` : undefined,
      done: isBlockCompleted(block.id),
      onToggle: () => toggleBlockComplete(block.id, blockTasks.length),
    };
  });

  const dayTasks: PlanItem[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: blockTitleByTaskId.get(task.id) || task.sourceName || undefined,
    done: task.completed,
    onToggle: () => toggleTaskDone(task.id),
  }));

  const inherited = useMemo(
    () => buildHabitPlanObjectives(
      monthPlan,
      { books, songs, projects, subjects },
      {
        weekKey,
        monthEloGoal: Number(monthPlan.chess?.elo_goal) || 0,
        weekElo: { start: Number(weekPlan.chessEloStart) || 0, target: Number(weekPlan.chessEloTarget) || 0 },
      },
    ),
    [monthPlan, books, songs, projects, subjects, weekKey, weekPlan.chessEloStart, weekPlan.chessEloTarget],
  );

  const readingList: PlanItem[] = inherited.lectura.map(item => {
    const done = isBookDone(item.id);
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      tag: done ? 'Leído' : item.isCurrent ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(item.id),
    };
  });

  const musicList: PlanItem[] = inherited.musica.map(item => {
    const plan = monthPlan.songs_plan?.[item.id];
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      tag: songTag(plan),
      done: isSongDone(item.id, plan),
      onToggle: () => toggleSong(item.id, plan),
    };
  });

  const subjectList: PlanItem[] = inherited.universidad.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
  }));

  const projectList: PlanItem[] = inherited.proyectos.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
  }));

  const chessList: PlanItem[] = inherited.ajedrez.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
  }));

  const languageWeek = useMemo(() => readLanguageWeekPlans(weekPlan.languages), [weekPlan.languages]);
  const languageList: PlanItem[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(weekPlan.game), [weekPlan.game]);
  const gameList: PlanItem[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: 'Game',
        subtitle: [gameWeek.focusSkill, gameWeek.challenge].filter(Boolean).join(' · ') || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
      }]
    : [];

  const routineLabel = planRoutineType ? ` · Rutina: ${planRoutineType}` : '';

  const hasDayPlan = goalsList.length + intensityList.length + blockList.length + dayTasks.length > 0;
  const hasPeriodGoals = readingList.length + musicList.length + subjectList.length
    + projectList.length + chessList.length + languageList.length + gameList.length > 0;

  const empty = [
    goalsList, intensityList, blockList, dayTasks, readingList,
    musicList, subjectList, projectList, chessList, languageList, gameList,
  ].every(list => list.length === 0);

  const editUrl = isToday(anchorDate) ? '/plan-manana?mode=hoy' : '/plan-manana';

  return (
    <PlanShell
      title="Planificación"
      subtitle={`${format(anchorDate, "EEEE d 'de' MMMM", { locale: es })}${routineLabel}`}
      editUrl={editUrl}
      empty={empty}
      loading={tasksLoading || weekLoading || monthLoading || !planLoaded}
    >
      {hasDayPlan && <PlanGroupHeading hint="Lo guardado en Planificación de hoy">Plan del día</PlanGroupHeading>}
      <PlanCard
        icon={<Timer className="h-3.5 w-3.5" />}
        title="Metas de minutos del día"
        items={goalsList}
        accent="bg-sky-500/10 text-sky-500"
        hint={dayTotal > 0 ? `Total del día: ${minutesLabel(dayTotal)}` : undefined}
      />
      <PlanCard icon={<Zap className="h-3.5 w-3.5" />} title="Intensidad de sistemas" items={intensityList} accent="bg-amber-500/10 text-amber-500" />
      <PlanCard icon={<LayoutGrid className="h-3.5 w-3.5" />} title="Bloques del día" items={blockList} accent="bg-blue-500/10 text-blue-500" />
      <PlanCard icon={<ListChecks className="h-3.5 w-3.5" />} title="Tareas del día" items={dayTasks} accent="bg-indigo-500/10 text-indigo-500" />
      {hasPeriodGoals && <PlanGroupHeading hint="Heredados de la semana y del mes">Objetivos del periodo</PlanGroupHeading>}
      <PlanCard icon={<BookOpen className="h-3.5 w-3.5" />} title="Lectura" items={readingList} accent="bg-blue-500/10 text-blue-500" />
      <PlanCard icon={<Music className="h-3.5 w-3.5" />} title="Música" items={musicList} accent="bg-violet-500/10 text-violet-500" />
      <PlanCard icon={<GraduationCap className="h-3.5 w-3.5" />} title="Universidad" items={subjectList} accent="bg-indigo-500/10 text-indigo-500" />
      <PlanCard icon={<FolderKanban className="h-3.5 w-3.5" />} title="Proyectos" items={projectList} accent="bg-amber-500/10 text-amber-500" />
      <PlanCard icon={<Trophy className="h-3.5 w-3.5" />} title="Ajedrez" items={chessList} accent="bg-emerald-500/10 text-emerald-500" />
      <PlanCard icon={<Languages className="h-3.5 w-3.5" />} title="Idiomas" items={languageList} accent="bg-cyan-500/10 text-cyan-500" />
      <PlanCard icon={<Gamepad2 className="h-3.5 w-3.5" />} title="Game" items={gameList} accent="bg-rose-500/10 text-rose-500" />
    </PlanShell>
  );
}
