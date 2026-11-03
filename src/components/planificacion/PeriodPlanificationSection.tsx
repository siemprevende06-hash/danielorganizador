import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { coverKey, useAreaCovers } from '@/hooks/useAreaCovers';
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
import { cn } from '@/lib/utils';
import { PlanAreaCard, type PlanAreaCardData, type PlanObjectiveRow } from './PlanAreaCard';

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

/** Suma las metas de minutos de varias áreas de la jerarquía. */
function minutesFrom(goals: Record<string, number>, ids: string[]): number {
  return ids.reduce((sum, id) => sum + Math.max(0, Math.round(Number(goals[id]) || 0)), 0);
}

const PRIORITY_TAG: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

const INTENSITY_LABEL: Record<string, string> = { minimo: 'Mín', maximo: 'Máx', extra: 'Extra' };
const INTENSITY_MULT: Record<string, number> = { minimo: 0.5, maximo: 1, extra: 1.5 };
const INTENSITY_BASE_MIN: Record<string, number> = { lectura: 30, ajedrez: 20, game: 20, idiomas: 30, gym: 60, musica: 30 };
const SYSTEM_NAMES: Record<string, string> = { lectura: 'Lectura', ajedrez: 'Ajedrez', game: 'Game', idiomas: 'Idiomas', gym: 'Gym', musica: 'Música' };

function intensityRows(planIntensity?: Record<string, string> | null): PlanObjectiveRow[] {
  return Object.entries(planIntensity || {})
    .filter(([, value]) => value === 'minimo' || value === 'maximo' || value === 'extra')
    .map(([id, value]) => ({
      id,
      title: SYSTEM_NAMES[id] || id,
      tag: INTENSITY_LABEL[value],
      meta: `~${Math.round((INTENSITY_BASE_MIN[id] || 30) * (INTENSITY_MULT[value] ?? 1))} min`,
      emoji: '⚡',
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
/* Tarjetas por área (mismo lenguaje visual que Sistemas)               */
/* ------------------------------------------------------------------ */

interface PlanGroup {
  key: string;
  title: string;
  note?: string;
  dot: string;
  cards: PlanAreaCardData[];
}

const GROUP_KEYS = {
  desarrollo: { key: 'desarrollo', title: 'Desarrollo Personal', note: 'Lectura · Música · Idiomas · Ajedrez · Game · Gym', dot: 'bg-emerald-500' },
  profesional: { key: 'profesional', title: 'Profesional / Académico', note: 'Universidad · Emprendimiento · Proyectos', dot: 'bg-sky-500' },
} as const;

function periodGroup(title: string, note: string, cards: PlanAreaCardData[]): PlanGroup {
  return { key: 'periodo', title, note, dot: 'bg-indigo-500', cards };
}

/** Tarjeta de un área de la jerarquía: portada propia con respaldo del área padre. */
function areaCard(
  covers: Record<string, string>,
  args: {
    id: string;
    parentId: string;
    title: string;
    emoji: string;
    minutes?: number;
    minutesUnit: string;
    note?: string;
    items: PlanObjectiveRow[];
  },
): PlanAreaCardData {
  return {
    id: args.id,
    title: args.title,
    note: args.note,
    emoji: args.emoji,
    cover: covers[coverKey('sub', args.id)]
      ?? covers[coverKey('area', args.id)]
      ?? covers[coverKey('area', args.parentId)]
      ?? null,
    minutes: args.minutes,
    minutesUnit: args.minutesUnit,
    items: args.items,
  };
}

/** Tarjeta para bloques del plan que no son un área de vida (tareas, eventos…). */
function plainCard(args: {
  id: string;
  title: string;
  emoji: string;
  note?: string;
  items: PlanObjectiveRow[];
}): PlanAreaCardData {
  return {
    id: args.id,
    title: args.title,
    note: args.note,
    emoji: args.emoji,
    cover: null,
    items: args.items,
  };
}

const isCardVisible = (card: PlanAreaCardData) =>
  card.items.length > 0 || (card.minutes ?? 0) > 0;

function taskRows(
  tasks: { id: string; title: string; completed: boolean; due_date: string | null; area_id: string | null }[],
  onToggle: (id: string) => void,
  showDate: boolean,
): PlanObjectiveRow[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: [
      showDate ? dateLabel(task.due_date) : undefined,
      task.area_id ? (AREA_LABELS[task.area_id] || task.area_id) : undefined,
    ].filter(Boolean).join(' · ') || undefined,
    emoji: '✅',
    done: task.completed,
    onToggle: () => onToggle(task.id),
  }));
}

/* ------------------------------------------------------------------ */
/* Estructura visual                                                   */
/* ------------------------------------------------------------------ */

function PlanShell({
  title, subtitle, editUrl, empty, loading, totalMinutes, children,
}: {
  title: string;
  subtitle: string;
  editUrl: string;
  empty: boolean;
  loading?: boolean;
  totalMinutes?: number;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(totalMinutes ?? 0) > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 sm:flex">
              <Timer className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold tabular-nums text-primary">{minutesLabel(totalMinutes ?? 0)}</span>
              <span className="text-[10px] text-muted-foreground">planificados</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-full text-xs"
            onClick={() => navigate(editUrl)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
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
        children
      )}
    </section>
  );
}

function PlanGroups({ groups }: { groups: PlanGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map(group => {
        const cards = group.cards.filter(isCardVisible);
        if (cards.length === 0) return null;
        return (
          <section key={group.key} className="space-y-2.5">
            <div className="flex items-center gap-2 px-0.5">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', group.dot)} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{group.title}</h3>
              {group.note && (
                <span className="hidden text-[10px] text-muted-foreground sm:inline">{group.note}</span>
              )}
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
              {cards.map(card => (
                <PlanAreaCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MES                                                                 */
/* ------------------------------------------------------------------ */

function MonthPlanification({ anchorDate }: { anchorDate: Date }) {
  const month = startOfMonth(anchorDate);
  const { planData, books, songs, projects, subjects, topics, events, loading } = useMonthlyPlan(month);
  const { tasks, toggleTask, loading: tasksLoading } = usePeriodPlanTasks(month, endOfMonth(month));
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);
  const { covers } = useAreaCovers();

  const goals = useMemo(() => getMonthGoalsSummary(month), [month]);
  const minutesOf = (ids: string[]) => minutesFrom(goals, ids);
  const unit = 'min mes';

  const booksById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const topicsById = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics]);
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  const bookRows: PlanObjectiveRow[] = (planData.books?.selected || []).flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
    }];
  });

  const songRows: PlanObjectiveRow[] = (planData.songs?.selected || []).flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planData.songs_plan?.[id];
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      cover: song.cover_image_url,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
    }];
  });

  const subjectRows: PlanObjectiveRow[] = (planData.subjects || []).flatMap(entry => {
    const subject = subjectsById.get(entry.subject_id);
    if (!subject) return [];
    const topicNames = (entry.topics || [])
      .map(id => topicsById.get(id)?.title)
      .filter(Boolean) as string[];
    return [{
      id: entry.subject_id,
      title: subject.name,
      subtitle: topicNames.slice(0, 3).join(' · ') || undefined,
      meta: topicNames.length > 0 ? `${topicNames.length} temas` : undefined,
      emoji: '🎓',
    }];
  });

  const projectRows: PlanObjectiveRow[] = (planData.projects || []).flatMap(id => {
    const project = projectsById.get(id);
    return project ? [{ id, title: project.name, emoji: '📦' }] : [];
  });

  const eloGoal = Number(planData.chess?.elo_goal) || 0;
  const chessRows: PlanObjectiveRow[] = eloGoal > 0
    ? [{ id: 'elo-mes', title: `${eloGoal} ELO`, subtitle: 'Objetivo al cerrar el mes', emoji: '♟️' }]
    : [];

  const languageMonth = useMemo(() => readLanguageMonthPlans(planData.languages), [planData.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageMonth[lang];
    const hasContent = plan.milestone || plan.monthMinutes > 0 || plan.level;
    if (!hasContent) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.level, plan.milestone].filter(Boolean).join(' · ') || undefined,
      meta: plan.monthMinutes > 0 ? minutesLabel(plan.monthMinutes) : undefined,
      emoji: '🌍',
    }];
  });

  const gameMonth = useMemo(() => readGameMonthPlan(planData.game), [planData.game]);
  const gameRows: PlanObjectiveRow[] = (gameMonth.milestone || gameMonth.xpGoal > 0)
    ? [{
        id: 'game-mes',
        title: gameMonth.milestone || 'XP del mes',
        meta: gameMonth.xpGoal > 0 ? `${gameMonth.xpGoal} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const personalGoalRows: PlanObjectiveRow[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `goal-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
    emoji: '🎯',
  }));

  const eventRows: PlanObjectiveRow[] = (planData.events || []).flatMap(id => {
    const event = eventsById.get(id);
    if (!event) return [];
    return [{
      id: event.id,
      title: event.title,
      subtitle: event.category || undefined,
      meta: dateLabel(event.event_date),
      emoji: '📅',
    }];
  });

  const taskList = taskRows(tasks, toggleTask, true);

  const desarrollo: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'lectura', parentId: 'desarrollo', title: 'Lectura', emoji: '📖',
      minutes: minutesOf(['lectura']), minutesUnit: unit, items: bookRows,
    }),
    areaCard(covers, {
      id: 'musica', parentId: 'desarrollo', title: 'Música', emoji: '🎹',
      minutes: minutesOf(['musica']), minutesUnit: unit, items: songRows,
    }),
    areaCard(covers, {
      id: 'idiomas', parentId: 'desarrollo', title: 'Idiomas', emoji: '🌍', note: 'inglés + italiano',
      minutes: minutesOf(['ingles', 'italiano']), minutesUnit: unit, items: languageRows,
    }),
    areaCard(covers, {
      id: 'ajedrez', parentId: 'desarrollo', title: 'Ajedrez', emoji: '♟️',
      minutes: minutesOf(['ajedrez']), minutesUnit: unit, items: chessRows,
    }),
    areaCard(covers, {
      id: 'game', parentId: 'desarrollo', title: 'Game', emoji: '🎮',
      minutes: minutesOf(['game']), minutesUnit: unit, items: gameRows,
    }),
    areaCard(covers, {
      id: 'gym', parentId: 'salud', title: 'Gym', emoji: '🏋️',
      minutes: minutesOf(['gym']), minutesUnit: unit, items: [],
    }),
  ];

  const profesional: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'universidad', parentId: 'profesional', title: 'Universidad', emoji: '🎓',
      minutes: minutesOf(['universidad']), minutesUnit: unit, items: subjectRows,
    }),
    areaCard(covers, {
      id: 'emprendimiento', parentId: 'profesional', title: 'Emprendimiento', emoji: '🚀',
      minutes: minutesOf(['emprendimiento']), minutesUnit: unit, items: [],
    }),
    areaCard(covers, {
      id: 'proyectos', parentId: 'profesional', title: 'Proyectos', emoji: '📦',
      minutes: minutesOf(['proyectos']), minutesUnit: unit, items: projectRows,
    }),
  ];

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'tareas', title: 'Tareas del mes', emoji: '✅', items: taskList }),
    plainCard({ id: 'metas', title: 'Metas personales', emoji: '🎯', items: personalGoalRows }),
    plainCard({ id: 'eventos', title: 'Eventos', emoji: '📅', items: eventRows }),
  ];

  const groups: PlanGroup[] = [
    { ...GROUP_KEYS.desarrollo, cards: desarrollo },
    { ...GROUP_KEYS.profesional, cards: profesional },
    periodGroup('Plan del periodo', 'Tareas · metas personales · eventos', periodo),
  ];

  const empty = !groups.some(group => group.cards.some(isCardVisible));
  const monthTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (goals[area] || 0), 0);

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Mes de ${format(month, 'MMMM yyyy', { locale: es })}`}
      editUrl={`/monthly-planning?month=${format(month, 'yyyy-MM')}`}
      empty={empty}
      loading={loading || tasksLoading}
      totalMinutes={monthTotal}
    >
      <PlanGroups groups={groups} />
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
  const { covers } = useAreaCovers();
  const entrepreneurshipIds = planData.areaFocus?.emprendimiento || [];
  const entrepreneurshipNames = useEntrepreneurshipNames(entrepreneurshipIds);

  const weekDist = monthPlan.week_distribution?.[weekKey];

  const weekGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => { out[area] = getWeekGoalEffective(weekStart, area); });
    return out;
  }, [weekStart]);

  const minutesOf = (ids: string[]) => minutesFrom(weekGoals, ids);
  const unit = 'min sem.';

  const outcomesById = useMemo(
    () => new Map((planData.outcomes || []).map(o => [o.id, o.title])),
    [planData.outcomes],
  );

  const objectiveRows: PlanObjectiveRow[] = (planData.objectives || []).map((objective, index) => ({
    id: `objetivo-${index}`,
    title: objective,
    emoji: '🎯',
  }));

  const personalGoalRows: PlanObjectiveRow[] = (planData.personal_goals || []).map((goal, index) => ({
    id: `meta-${index}`,
    title: goal.title,
    meta: goal.target || undefined,
    emoji: '🎯',
  }));

  const outcomeRows: PlanObjectiveRow[] = (planData.outcomes || []).map(outcome => ({
    id: outcome.id,
    title: outcome.title,
    subtitle: outcome.successCriteria || undefined,
    tag: outcome.priority ? PRIORITY_TAG[outcome.priority] : undefined,
    emoji: '🏁',
    done: outcome.completed,
    onToggle: () => patchPlan(prev => ({
      ...prev,
      outcomes: (prev.outcomes || []).map(o => (o.id === outcome.id ? { ...o, completed: !o.completed } : o)),
    })),
  }));

  const actionRows: PlanObjectiveRow[] = (planData.actions || []).map(action => ({
    id: action.id,
    title: action.title,
    subtitle: [
      action.assignedDay ? dateLabel(action.assignedDay) : undefined,
      action.area || undefined,
    ].filter(Boolean).join(' · ') || undefined,
    meta: action.estimatedMinutes ? minutesLabel(action.estimatedMinutes) : undefined,
    emoji: '⚡',
    done: action.completed,
    onToggle: () => patchPlan(prev => ({
      ...prev,
      actions: (prev.actions || []).map(a => (a.id === action.id ? { ...a, completed: !a.completed } : a)),
    })),
  }));

  /** Focos semanales + resultado al que apunta un área de construcción. */
  const focusRows = (
    areaId: string,
    ids: string[],
    resolve: (id: string) => string | undefined,
    emoji: string,
  ): PlanObjectiveRow[] => {
    const rows: PlanObjectiveRow[] = ids.flatMap(id => {
      const title = resolve(id);
      return title ? [{ id: `${areaId}-focus-${id}`, title, emoji }] : [];
    });
    const rawResult = planData.areaResults?.[areaId];
    if (rawResult) {
      rows.unshift({
        id: `${areaId}-result`,
        title: outcomesById.get(rawResult) ?? rawResult,
        subtitle: 'Resultado de la semana',
        emoji: '🏁',
      });
    }
    return rows;
  };

  const subjectsById = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

  const universityRows = focusRows(
    'universidad',
    planData.areaFocus?.universidad || [],
    id => subjectsById.get(id),
    '🎓',
  );
  const entrepreneurshipNamesRows = focusRows(
    'emprendimiento',
    entrepreneurshipIds,
    id => entrepreneurshipNames[id],
    '🚀',
  );
  const projectRows = focusRows(
    'proyectos',
    planData.areaFocus?.proyectos || [],
    id => projectsById.get(id),
    '📦',
  );

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

  const bookRows: PlanObjectiveRow[] = weekBookIds.flatMap(id => {
    const book = booksById.get(id);
    if (!book) return [];
    const done = isBookDone(id);
    return [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: done ? 'Leído' : book.status === 'reading' ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(id),
    }];
  });

  const songRows: PlanObjectiveRow[] = weekSongIds.flatMap(id => {
    const song = songsById.get(id);
    if (!song) return [];
    const plan = planTypeFor(id);
    return [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      cover: song.cover_image_url,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(id, plan),
      onToggle: () => toggleSong(id, plan),
    }];
  });

  const eloStart = Number(planData.chessEloStart) || Number(weekDist?.elo_start) || 0;
  const eloTarget = Number(planData.chessEloTarget) || Number(weekDist?.elo_target) || 0;
  const chessRows: PlanObjectiveRow[] = eloTarget > 0
    ? [{
        id: 'elo-sem',
        title: `${eloTarget} ELO`,
        subtitle: eloStart > 0 && eloStart !== eloTarget ? `${eloStart} → ${eloTarget}` : 'Objetivo de la semana',
        emoji: '♟️',
      }]
    : [];

  const languageWeek = useMemo(() => readLanguageWeekPlans(planData.languages), [planData.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
      emoji: '🌍',
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(planData.game), [planData.game]);
  const gameRows: PlanObjectiveRow[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: gameWeek.focusSkill || 'Game',
        subtitle: gameWeek.challenge || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const taskList = taskRows(tasks, toggleTask, true);

  const desarrollo: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'lectura', parentId: 'desarrollo', title: 'Lectura', emoji: '📖',
      minutes: minutesOf(['lectura']), minutesUnit: unit, items: bookRows,
    }),
    areaCard(covers, {
      id: 'musica', parentId: 'desarrollo', title: 'Música', emoji: '🎹',
      minutes: minutesOf(['musica']), minutesUnit: unit, items: songRows,
    }),
    areaCard(covers, {
      id: 'idiomas', parentId: 'desarrollo', title: 'Idiomas', emoji: '🌍', note: 'inglés + italiano',
      minutes: minutesOf(['ingles', 'italiano']), minutesUnit: unit, items: languageRows,
    }),
    areaCard(covers, {
      id: 'ajedrez', parentId: 'desarrollo', title: 'Ajedrez', emoji: '♟️',
      minutes: minutesOf(['ajedrez']), minutesUnit: unit, items: chessRows,
    }),
    areaCard(covers, {
      id: 'game', parentId: 'desarrollo', title: 'Game', emoji: '🎮',
      minutes: minutesOf(['game']), minutesUnit: unit, items: gameRows,
    }),
    areaCard(covers, {
      id: 'gym', parentId: 'salud', title: 'Gym', emoji: '🏋️',
      minutes: minutesOf(['gym']), minutesUnit: unit, items: [],
    }),
  ];

  const profesional: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'universidad', parentId: 'profesional', title: 'Universidad', emoji: '🎓',
      minutes: minutesOf(['universidad']), minutesUnit: unit, items: universityRows,
    }),
    areaCard(covers, {
      id: 'emprendimiento', parentId: 'profesional', title: 'Emprendimiento', emoji: '🚀',
      minutes: minutesOf(['emprendimiento']), minutesUnit: unit, items: entrepreneurshipNamesRows,
    }),
    areaCard(covers, {
      id: 'proyectos', parentId: 'profesional', title: 'Proyectos', emoji: '📦',
      minutes: minutesOf(['proyectos']), minutesUnit: unit, items: projectRows,
    }),
  ];

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'objetivos', title: 'Objetivos', emoji: '🎯', items: objectiveRows }),
    plainCard({ id: 'resultados', title: 'Resultados', emoji: '🏁', items: outcomeRows }),
    plainCard({ id: 'acciones', title: 'Acciones', emoji: '⚡', items: actionRows }),
    plainCard({ id: 'metas', title: 'Metas personales', emoji: '🎯', items: personalGoalRows }),
    plainCard({ id: 'tareas', title: 'Tareas de la semana', emoji: '✅', items: taskList }),
  ];

  const groups: PlanGroup[] = [
    { ...GROUP_KEYS.desarrollo, cards: desarrollo },
    { ...GROUP_KEYS.profesional, cards: profesional },
    periodGroup('Plan del periodo', 'Objetivos · resultados · acciones · metas · tareas', periodo),
  ];

  const empty = !groups.some(group => group.cards.some(isCardVisible));
  const weekTotal = ALL_HIERARCHY_AREAS.reduce((sum, area) => sum + (weekGoals[area] || 0), 0);

  return (
    <PlanShell
      title="Planificación"
      subtitle={`Semana del ${format(weekStart, 'd MMM', { locale: es })} al ${format(weekEnd, 'd MMM', { locale: es })}`}
      editUrl={`/weekly-planning?week=${weekKey}`}
      empty={empty}
      loading={loading || tasksLoading}
      totalMinutes={weekTotal}
    >
      <PlanGroups groups={groups} />
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
  const { covers } = useAreaCovers();

  const dayGoals = useMemo(() => {
    const out: Record<string, number> = {};
    ALL_HIERARCHY_AREAS.forEach(area => {
      out[area] = Math.max(0, planGoals?.[area] || getDayGoalEffective(anchorDate, area));
    });
    return out;
  }, [anchorDate, planGoals]);

  const minutesOf = (id: string) => Math.max(0, Math.round(Number(dayGoals[id]) || 0));
  const unit = 'min día';
  const dayTotal = getDayGoalTotal(anchorDate, planGoals);
  const intensity = intensityRows(planIntensity);

  const blockTitleByTaskId = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(tasksByBlock || {}).forEach(([blockId, blockTasks]) => {
      const title = blocks.find(b => b.id === blockId)?.title;
      if (!title) return;
      blockTasks.forEach(t => map.set(t.id, title));
    });
    return map;
  }, [tasksByBlock, blocks]);

  const blockRows: PlanObjectiveRow[] = blocks.map(block => {
    const blockTasks = tasksByBlock[block.id] || [];
    const done = blockTasks.filter(t => t.completed).length;
    return {
      id: block.id,
      title: block.title,
      subtitle: [block.startTime, block.endTime].filter(Boolean).join(' – ') || undefined,
      meta: blockTasks.length > 0 ? `${done}/${blockTasks.length} tareas` : undefined,
      emoji: '🕒',
      done: isBlockCompleted(block.id),
      onToggle: () => toggleBlockComplete(block.id, blockTasks.length),
    };
  });

  const dayTaskRows: PlanObjectiveRow[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtitle: blockTitleByTaskId.get(task.id) || task.sourceName || undefined,
    emoji: '✅',
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

  const readingRows: PlanObjectiveRow[] = inherited.lectura.map(item => {
    const done = isBookDone(item.id);
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      cover: item.cover,
      emoji: '📖',
      tag: done ? 'Leído' : item.isCurrent ? 'Leyendo' : undefined,
      done,
      onToggle: () => toggleBook(item.id),
    };
  });

  const musicRows: PlanObjectiveRow[] = inherited.musica.map(item => {
    const plan = monthPlan.songs_plan?.[item.id];
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      cover: item.cover,
      emoji: '🎹',
      tag: songTag(plan),
      done: isSongDone(item.id, plan),
      onToggle: () => toggleSong(item.id, plan),
    };
  });

  const subjectRows: PlanObjectiveRow[] = inherited.universidad.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
    emoji: '🎓',
  }));

  const projectRows: PlanObjectiveRow[] = inherited.proyectos.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
    emoji: '📦',
  }));

  const chessRows: PlanObjectiveRow[] = inherited.ajedrez.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    tag: item.tag,
    emoji: '♟️',
  }));

  const languageWeek = useMemo(() => readLanguageWeekPlans(weekPlan.languages), [weekPlan.languages]);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: lang,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
      emoji: '🌍',
    }];
  });

  const gameWeek = useMemo(() => readGameWeekPlan(weekPlan.game), [weekPlan.game]);
  const gameRows: PlanObjectiveRow[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: gameWeek.focusSkill || 'Game',
        subtitle: gameWeek.challenge || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const desarrollo: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'lectura', parentId: 'desarrollo', title: 'Lectura', emoji: '📖',
      minutes: minutesOf('lectura'), minutesUnit: unit, items: readingRows,
    }),
    areaCard(covers, {
      id: 'musica', parentId: 'desarrollo', title: 'Música', emoji: '🎹',
      minutes: minutesOf('musica'), minutesUnit: unit, items: musicRows,
    }),
    areaCard(covers, {
      id: 'idiomas', parentId: 'desarrollo', title: 'Idiomas', emoji: '🌍', note: 'inglés + italiano',
      minutes: minutesOf('ingles') + minutesOf('italiano'), minutesUnit: unit, items: languageRows,
    }),
    areaCard(covers, {
      id: 'ajedrez', parentId: 'desarrollo', title: 'Ajedrez', emoji: '♟️',
      minutes: minutesOf('ajedrez'), minutesUnit: unit, items: chessRows,
    }),
    areaCard(covers, {
      id: 'game', parentId: 'desarrollo', title: 'Game', emoji: '🎮',
      minutes: minutesOf('game'), minutesUnit: unit, items: gameRows,
    }),
    areaCard(covers, {
      id: 'gym', parentId: 'salud', title: 'Gym', emoji: '🏋️',
      minutes: minutesOf('gym'), minutesUnit: unit, items: [],
    }),
  ];

  const profesional: PlanAreaCardData[] = [
    areaCard(covers, {
      id: 'universidad', parentId: 'profesional', title: 'Universidad', emoji: '🎓',
      minutes: minutesOf('universidad'), minutesUnit: unit, items: subjectRows,
    }),
    areaCard(covers, {
      id: 'emprendimiento', parentId: 'profesional', title: 'Emprendimiento', emoji: '🚀',
      minutes: minutesOf('emprendimiento'), minutesUnit: unit, items: [],
    }),
    areaCard(covers, {
      id: 'proyectos', parentId: 'profesional', title: 'Proyectos', emoji: '📦',
      minutes: minutesOf('proyectos'), minutesUnit: unit, items: projectRows,
    }),
  ];

  const periodo: PlanAreaCardData[] = [
    plainCard({ id: 'bloques', title: 'Bloques del día', emoji: '🕒', items: blockRows }),
    plainCard({ id: 'tareas', title: 'Tareas del día', emoji: '✅', items: dayTaskRows }),
    plainCard({ id: 'intensidad', title: 'Intensidad de sistemas', emoji: '⚡', items: intensity }),
  ];

  const groups: PlanGroup[] = [
    { ...GROUP_KEYS.desarrollo, cards: desarrollo },
    { ...GROUP_KEYS.profesional, cards: profesional },
    periodGroup('Plan del día', 'Bloques · tareas · intensidad', periodo),
  ];

  const empty = !groups.some(group => group.cards.some(isCardVisible));

  const routineLabel = planRoutineType ? ` · Rutina: ${planRoutineType}` : '';
  const editUrl = isToday(anchorDate) ? '/plan-manana?mode=hoy' : '/plan-manana';

  return (
    <PlanShell
      title="Planificación"
      subtitle={`${format(anchorDate, "EEEE d 'de' MMMM", { locale: es })}${routineLabel}`}
      editUrl={editUrl}
      empty={empty}
      loading={tasksLoading || weekLoading || monthLoading || !planLoaded}
      totalMinutes={dayTotal}
    >
      <PlanGroups groups={groups} />
    </PlanShell>
  );
}
