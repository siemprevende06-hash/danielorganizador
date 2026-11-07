import { useEffect, useMemo, useState } from 'react';
import { endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import {
  getQuarterFromDate,
  loadTrimestralPlanFromLocal,
  useTrimestralPlan,
  type TrimestralPlanData,
} from '@/hooks/useTrimestralPlan';
import { usePlanLibraryToggles, type SongPlanTypeLite } from '@/hooks/usePlanLibraryToggles';
import { pullPlansIntoLocal } from '@/lib/planSync';
import {
  LANGUAGE_IDS,
  LANGUAGE_LABELS,
  readLanguageMonthPlans,
  readLanguageQuarterPlans,
  readLanguageWeekPlans,
} from '@/lib/languagePlan';
import {
  readGameMonthPlan,
  readGameQuarterPlan,
  readGameWeekPlan,
} from '@/lib/game';
import {
  getDayGoalEffective,
  getMonthGoalsSummary,
  getWeekGoalEffective,
} from '@/lib/hierarchy';
import type { PlanObjectiveRow } from '@/components/planificacion/PlanAreaCard';

// ---------------------------------------------------------------------------
// Objetivos que ya existen en los planes (libros, canciones, materias,
// proyectos, ELO, idiomas, Game…). Se exponen por sistema para mezclarlos con
// las metas nuevas dentro de las tarjetas de Metas Sistemas.
// ---------------------------------------------------------------------------

export interface ExistingSystemObjectives {
  itemsById: Record<string, PlanObjectiveRow[]>;
  plannedById: Record<string, number | undefined>;
  loading: boolean;
}

const minutesLabel = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`;

const dateLabel = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return format(date, 'd MMM', { locale: undefined });
};

function songTag(plan?: SongPlanTypeLite) {
  if (plan === 'mastered') return 'Dominar';
  if (plan === 'recorded') return 'Grabar';
  return 'Aprender';
}

function effectiveWeekBookIds(
  weekIds: string[] | undefined,
  weekBookId: string | undefined,
  monthSelected: string[],
  booksById: Map<string, { status?: string | null }>,
): string[] {
  const ids = [...(weekIds || [])];
  if (weekBookId && !ids.includes(weekBookId)) ids.unshift(weekBookId);
  if (ids.length > 0) return ids;
  const current = monthSelected.find(id => booksById.get(id)?.status === 'reading');
  return current ? [current] : monthSelected.slice(0, 1);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sumGoals(
  records: Record<string, Record<string, number>> | undefined,
  ids: string[],
): number {
  if (!records) return 0;
  return Object.values(records).reduce((total, month) => {
    return total + ids.reduce((sum, id) => sum + (Number(month?.[id]) || 0), 0);
  }, 0);
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
/* Día y semana                                                        */
/* ------------------------------------------------------------------ */

export function useDayWeekSystemObjectives(
  scope: 'day' | 'week',
  anchorDate: Date,
): ExistingSystemObjectives {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const monthStart = startOfMonth(weekStart);

  const { planData, patchPlan, loading } = useWeeklyPlan(weekStart);
  const {
    planData: monthPlan,
    books,
    songs,
    projects,
    subjects,
    loading: monthLoading,
  } = useMonthlyPlan(monthStart);
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);

  const entrepreneurshipIds = planData.areaFocus?.emprendimiento || [];
  const entrepreneurshipNames = useEntrepreneurshipNames(entrepreneurshipIds);
  const weekDist = monthPlan.week_distribution?.[weekKey];

  const booksById = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
  const songsById = useMemo(() => new Map(songs.map(song => [song.id, song])), [songs]);
  const subjectsById = useMemo(() => new Map(subjects.map(subject => [subject.id, subject.name])), [subjects]);
  const projectsById = useMemo(() => new Map(projects.map(project => [project.id, project.name])), [projects]);
  const outcomesById = useMemo(
    () => new Map((planData.outcomes || []).map(outcome => [outcome.id, outcome])),
    [planData.outcomes],
  );

  const weekBookIds = useMemo(
    () => effectiveWeekBookIds(weekDist?.books, planData.weekBookId, monthPlan.books?.selected || [], booksById),
    [weekDist, planData.weekBookId, monthPlan.books, booksById],
  );

  const weekSongIds = useMemo(() => {
    const ids = [...(weekDist?.songs || [])];
    const extras = [
      weekDist?.learning_song_id,
      weekDist?.mastering_song_id,
      planData.learningSongId,
      planData.masteringSongId,
    ];
    extras.forEach(id => { if (id && !ids.includes(id)) ids.unshift(id); });
    return ids;
  }, [weekDist, planData]);

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
      createdAt: book.start_date,
      completedAt: book.finish_date,
      createdLabel: 'Inicio',
      completedLabel: 'Fin',
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
      completedAt: plan === 'mastered'
        ? song.mastered_at
        : plan === 'recorded'
          ? song.recorded_at
          : song.learned_at,
      completedLabel: plan === 'mastered' ? 'Dominada' : plan === 'recorded' ? 'Grabada' : 'Aprendida',
    }];
  });

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
      const outcome = outcomesById.get(rawResult);
      rows.unshift({
        id: `${areaId}-result`,
        title: outcome?.title ?? rawResult,
        subtitle: 'Resultado de la semana',
        emoji: '🏁',
        done: outcome?.completed,
        createdAt: outcome?.createdAt,
        completedAt: outcome?.completedAt,
        onToggle: outcome
          ? () => patchPlan(prev => {
              const now = new Date().toISOString();
              return {
                ...prev,
                outcomes: (prev.outcomes || []).map(item => {
                  if (item.id !== rawResult) return item;
                  const completed = !item.completed;
                  return { ...item, completed, completedAt: completed ? now : null };
                }),
              };
            })
          : undefined,
      });
    }
    return rows;
  };

  const universityRows = focusRows(
    'universidad',
    planData.areaFocus?.universidad || [],
    id => subjectsById.get(id),
    '🎓',
  );
  const entrepreneurshipRows = focusRows(
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

  const languageWeek = readLanguageWeekPlans(planData.languages);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageWeek[lang];
    if (!plan.focusSkill && !plan.challenge && !plan.minutesTarget) return [];
    return [{
      id: `${lang}-sem`,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.focusSkill, plan.challenge].filter(Boolean).join(' · ') || undefined,
      meta: plan.minutesTarget > 0 ? minutesLabel(plan.minutesTarget) : undefined,
      emoji: '🌍',
    }];
  });

  const gameWeek = readGameWeekPlan(planData.game);
  const gameRows: PlanObjectiveRow[] = (gameWeek.focusSkill || gameWeek.challenge || gameWeek.xpTarget > 0)
    ? [{
        id: 'game-sem',
        title: gameWeek.focusSkill || 'Game',
        subtitle: gameWeek.challenge || undefined,
        meta: gameWeek.xpTarget > 0 ? `${gameWeek.xpTarget} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const goalFor = (area: string) => scope === 'day'
    ? getDayGoalEffective(anchorDate, area)
    : getWeekGoalEffective(weekStart, area);

  const itemsById: Record<string, PlanObjectiveRow[]> = {
    lectura: bookRows,
    musica: songRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: universityRows,
    emprendimiento: entrepreneurshipRows,
    proyectos: projectRows,
    gym: [],
    finanzas: [],
  };

  const plannedById: Record<string, number | undefined> = {
    lectura: goalFor('lectura'),
    musica: goalFor('musica'),
    idiomas: goalFor('ingles') + goalFor('italiano'),
    ajedrez: goalFor('ajedrez'),
    game: goalFor('game'),
    gym: goalFor('gym'),
    universidad: goalFor('universidad'),
    emprendimiento: goalFor('emprendimiento'),
    proyectos: goalFor('proyectos'),
  };

  return {
    itemsById,
    plannedById,
    loading: loading || monthLoading,
  };
}

/* ------------------------------------------------------------------ */
/* Mes                                                                 */
/* ------------------------------------------------------------------ */

export function useMonthSystemObjectives(anchorDate: Date): ExistingSystemObjectives {
  const month = startOfMonth(anchorDate);
  const {
    planData,
    books,
    songs,
    projects,
    subjects,
    topics,
    loading,
  } = useMonthlyPlan(month);
  const { isBookDone, isSongDone, toggleBook, toggleSong } = usePlanLibraryToggles(books, songs);

  const goals = useMemo(() => getMonthGoalsSummary(month), [month]);
  const minutesOf = (ids: string[]) =>
    ids.reduce((sum, id) => sum + Math.max(0, Math.round(Number(goals[id]) || 0)), 0);

  const booksById = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
  const songsById = useMemo(() => new Map(songs.map(song => [song.id, song])), [songs]);
  const projectsById = useMemo(() => new Map(projects.map(project => [project.id, project])), [projects]);
  const subjectsById = useMemo(() => new Map(subjects.map(subject => [subject.id, subject])), [subjects]);
  const topicsById = useMemo(() => new Map(topics.map(topic => [topic.id, topic])), [topics]);

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
      createdAt: book.start_date,
      completedAt: book.finish_date,
      createdLabel: 'Inicio',
      completedLabel: 'Fin',
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
      completedAt: plan === 'mastered'
        ? song.mastered_at
        : plan === 'recorded'
          ? song.recorded_at
          : song.learned_at,
      completedLabel: plan === 'mastered' ? 'Dominada' : plan === 'recorded' ? 'Grabada' : 'Aprendida',
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

  const languageMonth = readLanguageMonthPlans(planData.languages);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageMonth[lang];
    const hasContent = plan.milestone || plan.monthMinutes > 0 || plan.level;
    if (!hasContent) return [];
    return [{
      id: `${lang}-mes`,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.level, plan.milestone].filter(Boolean).join(' · ') || undefined,
      meta: plan.monthMinutes > 0 ? minutesLabel(plan.monthMinutes) : undefined,
      emoji: '🌍',
    }];
  });

  const gameMonth = readGameMonthPlan(planData.game);
  const gameRows: PlanObjectiveRow[] = (gameMonth.milestone || gameMonth.xpGoal > 0)
    ? [{
        id: 'game-mes',
        title: gameMonth.milestone || 'XP del mes',
        meta: gameMonth.xpGoal > 0 ? `${gameMonth.xpGoal} XP` : undefined,
        emoji: '🎮',
      }]
    : [];

  const itemsById: Record<string, PlanObjectiveRow[]> = {
    lectura: bookRows,
    musica: songRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: subjectRows,
    emprendimiento: [],
    proyectos: projectRows,
    gym: [],
    finanzas: [],
  };

  const plannedById: Record<string, number | undefined> = {
    lectura: minutesOf(['lectura']),
    musica: minutesOf(['musica']),
    idiomas: minutesOf(['ingles', 'italiano']),
    ajedrez: minutesOf(['ajedrez']),
    game: minutesOf(['game']),
    gym: minutesOf(['gym']),
    universidad: minutesOf(['universidad']),
    emprendimiento: minutesOf(['emprendimiento']),
    proyectos: minutesOf(['proyectos']),
  };

  return { itemsById, plannedById, loading };
}

/* ------------------------------------------------------------------ */
/* Trimestre                                                           */
/* ------------------------------------------------------------------ */

function buildQuarterRows(
  planData: TrimestralPlanData,
  books: { id: string; title: string; author: string | null; cover_image_url: string | null }[],
  songs: { id: string; title: string; artist: string | null; instrument: string }[],
  projects: { id: string; name: string }[],
  subjects: { id: string; name: string }[],
  entrepreneurships: { id: string; name: string }[],
  tags?: { books?: string; songs?: string; subjects?: string; projects?: string; entrepreneurships?: string; languages?: string; game?: string; chess?: string },
): Record<string, PlanObjectiveRow[]> {
  const booksById = new Map(books.map(book => [book.id, book]));
  const songsById = new Map(songs.map(song => [song.id, song]));
  const projectsById = new Map(projects.map(project => [project.id, project]));
  const subjectsById = new Map(subjects.map(subject => [subject.id, subject]));
  const entrepreneurshipById = new Map(entrepreneurships.map(item => [item.id, item]));

  const bookIds = unique([
    ...(planData.books?.selected || []),
    ...Object.values(planData.distribution || {}).flatMap(month => month.books || []),
  ]);
  const songIds = unique([
    ...(planData.songs?.selected || []),
    ...Object.values(planData.distribution || {}).flatMap(month => month.songs || []),
  ]);
  const projectIds = unique([
    ...(planData.projects || []),
    ...Object.values(planData.monthProjects || {}).flat(),
  ]);
  const entrepreneurshipIds = unique(Object.values(planData.monthEntrepreneurships || {}).flat());

  const bookRows: PlanObjectiveRow[] = bookIds.flatMap(id => {
    const book = booksById.get(id);
    return book ? [{
      id,
      title: book.title,
      subtitle: book.author || undefined,
      cover: book.cover_image_url,
      emoji: '📖',
      tag: tags?.books,
    }] : [];
  });

  const songRows: PlanObjectiveRow[] = songIds.flatMap(id => {
    const song = songsById.get(id);
    return song ? [{
      id,
      title: song.title,
      subtitle: [song.artist, song.instrument].filter(Boolean).join(' · ') || undefined,
      emoji: '🎹',
      tag: tags?.songs,
    }] : [];
  });

  const subjectRows: PlanObjectiveRow[] = (planData.subjects || []).flatMap(entry => {
    const subject = subjectsById.get(entry.subject_id);
    if (!subject) return [];
    return [{
      id: entry.subject_id,
      title: subject.name,
      subtitle: (entry.topics || []).slice(0, 3).join(' · ') || undefined,
      meta: entry.topics?.length ? `${entry.topics.length} temas` : undefined,
      emoji: '🎓',
      tag: tags?.subjects,
    }];
  });

  const projectRows: PlanObjectiveRow[] = projectIds.flatMap(id => {
    const project = projectsById.get(id);
    return project ? [{ id, title: project.name, emoji: '📦', tag: tags?.projects }] : [];
  });

  const entrepreneurshipRows: PlanObjectiveRow[] = entrepreneurshipIds.flatMap(id => {
    const item = entrepreneurshipById.get(id);
    return item ? [{ id, title: item.name, emoji: '🚀', tag: tags?.entrepreneurships }] : [];
  });

  const languageQuarter = readLanguageQuarterPlans(planData.languages);
  const languageRows: PlanObjectiveRow[] = LANGUAGE_IDS.flatMap(lang => {
    const plan = languageQuarter[lang];
    if (!plan.levelGoal && !plan.milestone) return [];
    return [{
      id: `${lang}-trim`,
      title: LANGUAGE_LABELS[lang],
      subtitle: [plan.levelGoal, plan.milestone].filter(Boolean).join(' · ') || undefined,
      emoji: '🌍',
      tag: tags?.languages,
    }];
  });

  const gameQuarter = readGameQuarterPlan(planData.game);
  const gameRows: PlanObjectiveRow[] = (
    gameQuarter.milestone || gameQuarter.xpGoal > 0 || gameQuarter.levelGoal > 0 || gameQuarter.selectedSkills.length > 0
  )
    ? [{
        id: 'game-trim',
        title: gameQuarter.milestone || 'Game del trimestre',
        subtitle: gameQuarter.selectedSkills.slice(0, 3).join(' · ') || undefined,
        meta: [
          gameQuarter.levelGoal > 0 ? `Nivel ${gameQuarter.levelGoal}` : '',
          gameQuarter.xpGoal > 0 ? `${gameQuarter.xpGoal} XP` : '',
        ].filter(Boolean).join(' · ') || undefined,
        emoji: '🎮',
        tag: tags?.game,
      }]
    : [];

  const chess = Object.values(planData.chessGoals || {}).reduce(
    (acc, month) => ({
      partidas: acc.partidas + (Number(month?.partidas) || 0),
      minutos: acc.minutos + (Number(month?.minutos) || 0),
    }),
    { partidas: 0, minutos: 0 },
  );
  const chessRows: PlanObjectiveRow[] = (chess.partidas > 0 || chess.minutos > 0)
    ? [{
        id: 'chess-trim',
        title: chess.partidas > 0 ? `${chess.partidas} partidas` : 'Ajedrez del trimestre',
        subtitle: 'Objetivo del trimestre',
        meta: chess.minutos > 0 ? minutesLabel(chess.minutos) : undefined,
        emoji: '♟️',
        tag: tags?.chess,
      }]
    : [];

  return {
    lectura: bookRows,
    musica: songRows,
    idiomas: languageRows,
    ajedrez: chessRows,
    game: gameRows,
    universidad: subjectRows,
    emprendimiento: entrepreneurshipRows,
    proyectos: projectRows,
    gym: [],
    finanzas: [],
  };
}

export function useQuarterSystemObjectives(anchorDate: Date): ExistingSystemObjectives {
  const { quarter, year } = getQuarterFromDate(anchorDate);
  const {
    planData,
    books,
    songs,
    projects,
    subjects,
    entrepreneurships,
    loading,
  } = useTrimestralPlan(quarter, year);

  const itemsById = buildQuarterRows(
    planData,
    books,
    songs,
    projects,
    subjects,
    entrepreneurships,
  );

  const plannedById: Record<string, number | undefined> = {
    lectura: sumGoals(planData.timeGoals, ['lectura']),
    musica: sumGoals(planData.timeGoals, ['musica']),
    idiomas: sumGoals(planData.timeGoals, ['ingles', 'italiano']),
    ajedrez: sumGoals(planData.timeGoals, ['ajedrez']),
    game: sumGoals(planData.timeGoals, ['game']),
    gym: sumGoals(planData.timeGoals, ['gym']),
    universidad: sumGoals(planData.areaTimeGoals, ['universidad']),
    emprendimiento: sumGoals(planData.areaTimeGoals, ['emprendimiento']),
    proyectos: sumGoals(planData.areaTimeGoals, ['proyectos']),
  };

  return { itemsById, plannedById, loading };
}

/* ------------------------------------------------------------------ */
/* Año                                                                 */
/* ------------------------------------------------------------------ */

function loadYearPlans(year: number): TrimestralPlanData[] {
  return [1, 2, 3, 4].flatMap(quarter => {
    const plan = loadTrimestralPlanFromLocal(`Q${quarter}_${year}`);
    return plan ? [plan] : [];
  });
}

export function useYearSystemObjectives(anchorDate: Date): ExistingSystemObjectives {
  const year = anchorDate.getFullYear();
  const {
    books,
    songs,
    projects,
    subjects,
    loading: catalogLoading,
  } = useMonthlyPlan(new Date(year, 0, 1));

  const [plans, setPlans] = useState<TrimestralPlanData[]>(() => loadYearPlans(year));
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setPlansLoading(true);
    (async () => {
      await pullPlansIntoLocal();
      if (!alive) return;
      setPlans(loadYearPlans(year));
      setPlansLoading(false);
    })();
    return () => { alive = false; };
  }, [year]);

  const entrepreneurshipIds = unique(plans.flatMap(plan => Object.values(plan.monthEntrepreneurships || {}).flat()));
  const entrepreneurshipNames = useEntrepreneurshipNames(entrepreneurshipIds);
  const entrepreneurships = useMemo(
    () => Object.entries(entrepreneurshipNames).map(([id, name]) => ({ id, name })),
    [entrepreneurshipNames],
  );

  const itemsById = useMemo(() => {
    const merged: Record<string, PlanObjectiveRow[]> = {
      lectura: [],
      musica: [],
      idiomas: [],
      ajedrez: [],
      game: [],
      universidad: [],
      emprendimiento: [],
      proyectos: [],
      gym: [],
      finanzas: [],
    };

    plans.forEach((plan, index) => {
      const rows = buildQuarterRows(plan, books, songs, projects, subjects, entrepreneurships, {
        books: `Q${index + 1}`,
        songs: `Q${index + 1}`,
        subjects: `Q${index + 1}`,
        projects: `Q${index + 1}`,
        entrepreneurships: `Q${index + 1}`,
        languages: `Q${index + 1}`,
        game: `Q${index + 1}`,
        chess: `Q${index + 1}`,
      });

      (Object.keys(rows) as Array<keyof typeof rows>).forEach(key => {
        const existingIds = new Set(merged[key].map(row => row.id));
        rows[key].forEach(row => {
          if (!existingIds.has(row.id)) {
            merged[key].push(row);
            existingIds.add(row.id);
          }
        });
      });
    });

    return merged;
  }, [plans, books, songs, projects, subjects, entrepreneurships]);

  const plannedById = useMemo(() => {
    const total = (bucket: 'timeGoals' | 'areaTimeGoals', ids: string[]) =>
      plans.reduce((sum, plan) => sum + sumGoals(plan[bucket], ids), 0);

    return {
      lectura: total('timeGoals', ['lectura']),
      musica: total('timeGoals', ['musica']),
      idiomas: total('timeGoals', ['ingles', 'italiano']),
      ajedrez: total('timeGoals', ['ajedrez']),
      game: total('timeGoals', ['game']),
      gym: total('timeGoals', ['gym']),
      universidad: total('areaTimeGoals', ['universidad']),
      emprendimiento: total('areaTimeGoals', ['emprendimiento']),
      proyectos: total('areaTimeGoals', ['proyectos']),
    } as Record<string, number | undefined>;
  }, [plans]);

  return {
    itemsById,
    plannedById,
    loading: catalogLoading || plansLoading,
  };
}
