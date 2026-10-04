import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface StudySessionRow {
  id: string;
  title: string;
  day: string | null;
  subjectId: string | null;
  subjectName: string;
  topicTitle: string | null;
  blockTitle: string | null;
  estimatedMinutes: number;
  sessions: number;
  minutesDone: number;
  completed: boolean;
}

export interface MonthTaskCounts {
  done: number;
  pending: number;
  total: number;
}

export interface WeeklyAreaData {
  studySessions: StudySessionRow[];
  subjects: { id: string; name: string }[];
  month: {
    universidad: MonthTaskCounts;
    emprendimiento: MonthTaskCounts;
    proyectos: MonthTaskCounts;
    general: MonthTaskCounts;
  };
  week: {
    universidadMinutes: number;
    emprendimientoMinutes: number;
    proyectosMinutes: number;
    generalMinutes: number;
  };
  reading: {
    book: { id: string; title: string; author: string | null; cover: string | null; pagesTotal: number | null; pagesRead: number } | null;
    books: { id: string; title: string; author: string | null; cover: string | null; pagesTotal: number | null; pagesRead: number }[];
    pages: number;
    minutes: number;
    sessions: number;
    perDay: { d: string; pages: number; minutes: number }[];
  };
  musica: { minutes: number; sessions: number; song: string | null; cover: string | null };
  ajedrez: { minutes: number; games: number; wins: number; elo: number | null };
  idiomas: {
    inglesMinutes: number;
    italianoMinutes: number;
    inglesSessions: number;
    italianoSessions: number;
  };
  game: { citas: number; intimidad: number; eventos: number; minutos: number };
  gym: { logs: number; minutes: number };
  events: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    category: string;
    start_time: string | null;
    end_time: string | null;
  }[];
  loading: boolean;
}

const EMPTY: WeeklyAreaData = {
  studySessions: [],
  subjects: [],
  month: {
    universidad: { done: 0, pending: 0, total: 0 },
    emprendimiento: { done: 0, pending: 0, total: 0 },
    proyectos: { done: 0, pending: 0, total: 0 },
    general: { done: 0, pending: 0, total: 0 },
  },
  week: {
    universidadMinutes: 0,
    emprendimientoMinutes: 0,
    proyectosMinutes: 0,
    generalMinutes: 0,
  },
  reading: {
    book: null,
    books: [],
    pages: 0,
    minutes: 0,
    sessions: 0,
    perDay: [],
  },
  musica: { minutes: 0, sessions: 0, song: null, cover: null },
  ajedrez: { minutes: 0, games: 0, wins: 0, elo: null },
  idiomas: { inglesMinutes: 0, italianoMinutes: 0, inglesSessions: 0, italianoSessions: 0 },
  game: { citas: 0, intimidad: 0, eventos: 0, minutos: 0 },
  gym: { logs: 0, minutes: 0 },
  events: [],
  loading: true,
};

function countTasks(rows: any[]): MonthTaskCounts {
  const done = rows.filter(t => t.completed).length;
  const total = rows.length;
  return { done, pending: total - done, total };
}

const norm = (raw: any) => String(raw ?? '').toLowerCase().trim();

/** Agrega todo lo necesario para las filas por área del plan semanal */
export function useWeeklyPlanData(weekStart: Date, weekEnd: Date) {
  const [data, setData] = useState<WeeklyAreaData>(EMPTY);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const monthStartStr = format(startOfMonth(weekStart), 'yyyy-MM-dd');
  const monthEndStr = format(endOfMonth(weekStart), 'yyyy-MM-dd');

  const load = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [
        tasksRes, entTasksRes, areaStatsRes, readSessionsRes, libraryRes,
        musicSessionsRes, repertoireRes, chessRes, exerciseRes, eventsRes,
        subjectsRes, topicsRes, focusRes, blocksRes,
      ] = await Promise.all([
        supabase.from('tasks').select('*').gte('due_date', `${monthStartStr}T00:00:00`).lte('due_date', `${monthEndStr}T23:59:59`),
        supabase.from('entrepreneurship_tasks').select('*').gte('due_date', `${monthStartStr}T00:00:00`).lte('due_date', `${monthEndStr}T23:59:59`),
        supabase.from('daily_area_stats').select('*').gte('stat_date', weekStartStr).lte('stat_date', weekEndStr),
        supabase.from('reading_sessions').select('*').gte('session_date', weekStartStr).lte('session_date', weekEndStr),
        supabase.from('reading_library').select('id, title, author, cover_image_url, status, pages_total, pages_read').order('updated_at', { ascending: false }),
        supabase.from('music_practice_sessions').select('*').gte('practice_date', weekStartStr).lte('practice_date', weekEndStr),
        supabase.from('music_repertoire').select('id, title, artist, cover_image_url, status, practice_minutes'),
        supabase.from('chess_sessions').select('*').gte('session_date', weekStartStr).lte('session_date', weekEndStr),
        supabase.from('exercise_logs').select('*').gte('log_date', weekStartStr).lte('log_date', weekEndStr),
        supabase.from('calendar_events').select('*').gte('event_date', weekStartStr).lte('event_date', weekEndStr).order('start_time', { ascending: true }),
        supabase.from('university_subjects').select('id, name'),
        supabase.from('subject_topics').select('id, subject_id, title'),
        supabase.from('focus_sessions').select('*').gte('start_time', `${weekStartStr}T00:00:00`).lte('start_time', `${weekEndStr}T23:59:59`),
        supabase.from('routine_blocks').select('block_id, title'),
      ]);

      const tasks = tasksRes.data ?? [];
      const entTasks = entTasksRes.data ?? [];
      const areaStats = areaStatsRes.data ?? [];
      const subjects = (subjectsRes.data ?? []) as { id: string; name: string }[];
      const topics = topicsRes.data ?? [];
      const focus = focusRes.data ?? [];
      const blockTitles = new Map<string, string>((blocksRes.data ?? []).map((b: any) => [b.block_id, b.title]));

      // --- Sesiones de estudio creadas desde Universidad (task_type = study) ---
      const sessionByTask = new Map<string, { count: number; minutes: number }>();
      focus.forEach((f: any) => {
        const mins = Number(f.duration_minutes) || 0;
        if (!mins) return;
        const ids = new Set<string>();
        if (f.task_id) ids.add(f.task_id);
        if (Array.isArray(f.task_ids)) (f.task_ids as string[]).forEach(i => ids.add(i));
        ids.forEach(id => {
          const cur = sessionByTask.get(id) || { count: 0, minutes: 0 };
          cur.count += 1;
          cur.minutes += mins;
          sessionByTask.set(id, cur);
        });
      });

      const subjectName = new Map(subjects.map(s => [s.id, s.name]));
      const topicById = new Map(topics.map((t: any) => [t.id, t]));

      const studySessions: StudySessionRow[] = tasks
        .filter((t: any) => t.source === 'university' && t.task_type === 'study')
        .map((t: any) => {
          const sess = sessionByTask.get(t.id) || { count: 0, minutes: 0 };
          const topic = t.topic_id ? topicById.get(t.topic_id) : null;
          return {
            id: t.id,
            title: t.title,
            day: t.due_date ? String(t.due_date).slice(0, 10) : null,
            subjectId: t.source_id ?? null,
            subjectName: (t.source_id && subjectName.get(t.source_id)) || topic?.subject_name || 'Universidad',
            topicTitle: topic?.title ?? null,
            blockTitle: t.block_id ? blockTitles.get(t.block_id) ?? null : null,
            estimatedMinutes: Number(t.estimated_minutes) || 0,
            sessions: sess.count,
            minutesDone: sess.minutes,
            completed: !!t.completed,
          };
        })
        .sort((a, b) => (a.day ?? '9999').localeCompare(b.day ?? '9999') || a.title.localeCompare(b.title));

      // --- Tareas del mes por área ---
      const inMonth = (d: any) => {
        if (!d) return false;
        const s = String(d).slice(0, 10);
        return s >= monthStartStr && s <= monthEndStr;
      };
      const monthUni = tasks.filter((t: any) => t.source === 'university');
      const monthEnt = entTasks;
      const monthProy = tasks.filter((t: any) => norm(t.area_id || t.source) === 'proyectos' || norm(t.source) === 'project');
      const monthGeneral = tasks.filter((t: any) => {
        const a = norm(t.area_id || t.source);
        return !['university', 'universidad', 'entrepreneurship', 'emprendimiento', 'proyectos', 'project'].includes(a);
      });

      // --- Minutos de la semana por área (daily_area_stats) ---
      const minutesByArea = (ids: string[]) =>
        areaStats
          .filter((s: any) => ids.includes(s.area_id))
          .reduce((acc, s: any) => acc + (Number(s.time_spent_minutes) || 0), 0);

      // --- Lectura ---
      const readSessions = readSessionsRes.data ?? [];
      const books = (libraryRes.data ?? []) as any[];
      const readingBook =
        books.find(b => b.status === 'reading') ??
        readSessions.map(s => s.book_id && books.find(b => b.id === s.book_id)).find(Boolean) ??
        books[0] ??
        null;
      const perDayMap: Record<string, { pages: number; minutes: number }> = {};
      let readingPages = 0;
      let readingMinutes = 0;
      readSessions.forEach((s: any) => {
        const d = s.session_date;
        const entry = (perDayMap[d] = perDayMap[d] || { pages: 0, minutes: 0 });
        entry.pages += Number(s.pages_read) || 0;
        entry.minutes += Number(s.minutes) || 0;
        readingPages += Number(s.pages_read) || 0;
        readingMinutes += Number(s.minutes) || 0;
      });
      // páginas registradas manualmente en stats diario
      areaStats.filter((s: any) => s.area_id === 'lectura').forEach((s: any) => {
        const entry = (perDayMap[s.stat_date] = perDayMap[s.stat_date] || { pages: 0, minutes: 0 });
        entry.pages += Number(s.pages_done) || 0;
        entry.minutes += Number(s.time_spent_minutes) || 0;
        readingPages += Number(s.pages_done) || 0;
        readingMinutes += Number(s.time_spent_minutes) || 0;
      });

      // --- Música ---
      const musicSessions = musicSessionsRes.data ?? [];
      const repertoire = (repertoireRes.data ?? []) as any[];
      const musicMinutes = musicSessions.reduce((a, s: any) => a + (Number(s.duration_minutes) || Number(s.minutes) || 0), 0);
      const musicSong = musicSessions.find((s: any) => s.song_id)
        ? repertoire.find(r => r.id === musicSessions.find((s: any) => s.song_id).song_id)
        : repertoire.find(r => r.status === 'learning' || r.status === 'practicing') ?? repertoire[0] ?? null;

      // --- Ajedrez ---
      const chess = (chessRes.data ?? []) as any[];
      const chessMinutes = chess.reduce((a, s) => a + (Number(s.duration_minutes) || 0), 0);
      const chessGames = chess.reduce((a, s) => a + (Number(s.games_played) || (s.result ? 1 : 0)), 0);
      const chessWins = chess.reduce((a, s) => a + (Number(s.games_won) || 0), 0);
      const eloRows = chess.filter(s => s.current_elo != null);
      const elo = eloRows.length ? Number(eloRows[eloRows.length - 1].current_elo) : null;

      // --- Idiomas (inglés / italiano) ---
      const langMinutes = (keys: string[]) =>
        areaStats
          .filter((s: any) => keys.includes(s.area_id))
          .reduce((a, s) => a + (Number(s.time_spent_minutes) || 0), 0);
      const langSessions = (keys: string[]) =>
        tasks.filter((t: any) => {
          const blob = norm(`${t.title} ${t.area_id ?? ''} ${t.source ?? ''} ${t.description ?? ''}`);
          return keys.some(k => blob.includes(k));
        }).length;

      // --- Game / seducción ---
      const socialEvents = eventsRes.data ?? [];
      const gameAreaMinutes = minutesByArea(['game']);
      const citas = tasks.filter((t: any) => norm(`${t.title} ${t.description ?? ''}`).includes('cita')).length;

      // --- Gym ---
      const exercises = exerciseRes.data ?? [];

      setData({
        studySessions,
        subjects,
        month: {
          universidad: countTasks(monthUni),
          emprendimiento: countTasks(monthEnt),
          proyectos: countTasks(monthProy),
          general: countTasks(monthGeneral),
        },
        week: {
          universidadMinutes: minutesByArea(['universidad', 'university']),
          emprendimientoMinutes: minutesByArea(['emprendimiento', 'entrepreneurship']),
          proyectosMinutes: minutesByArea(['proyectos', 'project']),
          generalMinutes: minutesByArea(['general']),
        },
        reading: {
          book: readingBook
            ? {
                id: readingBook.id,
                title: readingBook.title,
                author: readingBook.author ?? null,
                cover: readingBook.cover_image_url ?? null,
                pagesTotal: readingBook.pages_total ?? null,
                pagesRead: readingBook.pages_read ?? 0,
              }
            : null,
          books: books.map(b => ({
            id: b.id,
            title: b.title,
            author: b.author ?? null,
            cover: b.cover_image_url ?? null,
            pagesTotal: b.pages_total ?? null,
            pagesRead: b.pages_read ?? 0,
          })),
          pages: readingPages,
          minutes: readingMinutes,
          sessions: readSessions.length,
          perDay: Object.entries(perDayMap)
            .map(([d, v]) => ({ d, pages: v.pages, minutes: v.minutes }))
            .sort((a, b) => a.d.localeCompare(b.d)),
        },
        musica: {
          minutes: musicMinutes,
          sessions: musicSessions.length,
          song: musicSong?.title ?? null,
          cover: musicSong?.cover_image_url ?? null,
        },
        ajedrez: { minutes: chessMinutes, games: chessGames, wins: chessWins, elo },
        idiomas: {
          inglesMinutes: langMinutes(['ingles', 'english']),
          italianoMinutes: langMinutes(['italiano', 'italian']),
          inglesSessions: langSessions(['ingles', 'english']),
          italianoSessions: langSessions(['italiano', 'italian']),
        },
        game: {
          citas,
          intimidad: areaStats.filter((s: any) => s.area_id === 'game' && Number(s.exercises_done) > 0).length,
          eventos: socialEvents.filter(e => norm(e.category).includes('social')).length,
          minutos: gameAreaMinutes,
        },
        gym: {
          logs: exercises.length,
          minutes: exercises.reduce((a, s: any) => a + (Number(s.duration_minutes) || 0), 0),
        },
        events: (socialEvents as any[]).map(e => ({
          id: e.id,
          title: e.title,
          description: e.description ?? null,
          event_date: e.event_date,
          category: e.category ?? 'default',
          start_time: e.start_time ?? null,
          end_time: e.end_time ?? null,
        })),
        loading: false,
      });
    } catch (e) {
      console.error('[useWeeklyPlanData]', e);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [weekStartStr, weekEndStr, monthStartStr, monthEndStr]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, refresh: load, nextDay: addDays };
}