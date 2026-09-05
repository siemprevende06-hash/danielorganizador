import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getQuarterFromDate, loadTrimestralPlanFromLocal } from '@/hooks/useTrimestralPlan';
import { readActiveSelections } from '@/hooks/useActiveSelections';

export const AREA_ORDER = ['universidad', 'emprendimiento', 'proyectos', 'lectura', 'musica', 'ajedrez', 'game', 'idiomas', 'gym', 'general'] as const;
export type AreaKey = (typeof AREA_ORDER)[number];

const AREA_DISPLAY: Record<string, string> = {
  universidad: 'universidad',
  university: 'universidad',
  emprendimiento: 'emprendimiento',
  entrepreneurship: 'emprendimiento',
  entrepreneur: 'emprendimiento',
  proyectos: 'proyectos',
  project: 'proyectos',
  lectura: 'lectura',
  musica: 'musica',
  music: 'musica',
  ajedrez: 'ajedrez',
  game: 'game',
  idiomas: 'idiomas',
  italiano: 'idiomas',
  ingles: 'idiomas',
  gym: 'gym',
  fitness: 'gym',
};

export function normalizeArea(area?: string | null): AreaKey {
  if (!area) return 'general';
  const mapped = AREA_DISPLAY[area.toLowerCase()];
  return (mapped as AreaKey) || 'general';
}

export interface AreaResult {
  total: number;
  done: number;
  minutes: number;
  goalMinutes: number;
  tasks: any[];
}

export interface PlanBook {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  pagesRead: number;
  pagesTotal: number;
  status: string | null;
  done: boolean;
}

export interface PlanSong {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
  practiceMinutes: number;
  status: string | null;
}

export interface PlanTaskItem {
  id: string;
  title: string;
  completed: boolean;
  task_type?: string;
  dueShort?: string | null;
}

export interface UniversitySubjectResult {
  id: string;
  name: string;
  topics: { id: string; title: string }[];
  tasks: PlanTaskItem[];
  deliveries: PlanTaskItem[];
  exams: { id: string; title: string; date: string | null; done: boolean }[];
  partials: { id: string; title: string; date: string | null; done: boolean }[];
}

export interface BusinessResult {
  id: string;
  name: string;
  goals: { id: string; title: string; completed: boolean }[];
  tasks: PlanTaskItem[];
  tasksDone: number;
  tasksTotal: number;
}

export interface ProjectResult {
  id: string;
  name: string;
  tasks: PlanTaskItem[];
  done: number;
  total: number;
}

export interface ResultadoPeriodo {
  loading: boolean;
  error: string | null;
  tasks: any[];
  byArea: Record<AreaKey, AreaResult>;
  books: PlanBook[];
  songs: PlanSong[];
  university: { subjects: UniversitySubjectResult[]; otherTasks: any[] };
  entrepreneurships: { businesses: BusinessResult[]; otherTasks: any[] };
  projects: { list: ProjectResult[]; otherTasks: any[] };
  globalDone: number;
  globalTotal: number;
  systems: { done: number; total: number; minutes: number };
  workoutMin: number;
  focusMin: number;
  reviews: { count: number; avgRating: number };
  lectura: { pages: number; pagesGoal: number; minutes: number; sessions: number; perDay: { d: string; pag: number }[] };
  musica: { minutes: number; sessions: number; songs: number; perDay: { d: string; min: number }[] };
  ajedrez: { minutes: number; games: number; wins: number; elo: number | null; history: { d: string; elo: number }[] };
  gym: { logs: number; sets: number; maxWeight: number | null; perDay: { d: string; kg: number }[] };
  game: { citas: number; intimidad: number; eventos: number };
  ingreso: { count: number; amount: number };
  perDay: { date: string; score: number; label: string }[];
  score: number;
}

export function emptyAreaResult(): Record<AreaKey, AreaResult> {
  const byArea = {} as Record<AreaKey, AreaResult>;
  AREA_ORDER.forEach(k => {
    byArea[k] = { total: 0, done: 0, minutes: 0, goalMinutes: 0, tasks: [] };
  });
  return byArea;
}

export const EMPTY_RESULTADO: ResultadoPeriodo = {
  loading: false,
  error: null,
  tasks: [],
  byArea: emptyAreaResult(),
  books: [],
  songs: [],
  university: { subjects: [], otherTasks: [] },
  entrepreneurships: { businesses: [], otherTasks: [] },
  projects: { list: [], otherTasks: [] },
  globalDone: 0,
  globalTotal: 0,
  systems: { done: 0, total: 0, minutes: 0 },
  workoutMin: 0,
  focusMin: 0,
  reviews: { count: 0, avgRating: 0 },
  lectura: { pages: 0, pagesGoal: 0, minutes: 0, sessions: 0, perDay: [] },
  musica: { minutes: 0, sessions: 0, songs: 0, perDay: [] },
  ajedrez: { minutes: 0, games: 0, wins: 0, elo: null, history: [] },
  gym: { logs: 0, sets: 0, maxWeight: null, perDay: [] },
  game: { citas: 0, intimidad: 0, eventos: 0 },
  ingreso: { count: 0, amount: 0 },
  perDay: [],
  score: 0,
};

const dayLabel = (d: string) => format(new Date(`${d}T12:00:00`), 'EEE d', { locale: es });

export function useResultadosPeriodo(start: Date, end: Date) {
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  return useQuery<ResultadoPeriodo>({
    queryKey: ['resultados', startStr, endStr],
    queryFn: async () => {
      const [
        tasksRes, entTasksRes, areaStatsRes, systemsRes, reviewsRes,
        readRes, musicRes, chessRes, logsRes, focusRes,
        citasRes, intimidadRes, eventosRes, ingresoRes,
        libraryRes, repertoireRes, projectsRes, subjectsRes, entregasRes,
        examsRes, partialsRes, topicRes, goalsRes, entPendingRes, subjPendingRes,
      ] = await Promise.all([
        supabase.from('tasks').select('*').gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
        supabase.from('entrepreneurship_tasks').select('*').gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
        supabase.from('daily_area_stats').select('*').gte('stat_date', startStr).lte('stat_date', endStr),
        supabase.from('daily_systems_tracking').select('*').gte('tracking_date', startStr).lte('tracking_date', endStr),
        supabase.from('daily_reviews').select('*').gte('review_date', startStr).lte('review_date', endStr),
        supabase.from('reading_sessions').select('*').gte('session_date', startStr).lte('session_date', endStr),
        supabase.from('music_practice_sessions').select('*').gte('practice_date', startStr).lte('practice_date', endStr),
        supabase.from('chess_sessions').select('*').gte('session_date', startStr).lte('session_date', endStr),
        supabase.from('exercise_logs').select('*').gte('log_date', startStr).lte('log_date', endStr),
        supabase.from('focus_sessions').select('*').gte('start_time', `${startStr}T00:00:00`).lte('start_time', `${endStr}T23:59:59`),
        supabase.from('citas').select('*').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('intimidad_tracking').select('*').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('eventos_sociales').select('*').gte('fecha', startStr).lte('fecha', endStr),
        supabase.from('entrepreneurship_income').select('*').gte('income_date', startStr).lte('income_date', endStr),
        supabase.from('reading_library').select('id, title, author, cover_image_url, status, pages_total, pages_read'),
        supabase.from('music_repertoire').select('id, title, artist, instrument, status, practice_minutes'),
        supabase.from('projects').select('*'),
        supabase.from('university_subjects').select('id, name'),
        supabase.from('entrepreneurships').select('id, name'),
        supabase.from('exams').select('*'),
        supabase.from('partial_exams').select('*'),
        supabase.from('subject_topics').select('id, subject_id, title'),
        supabase.from('entrepreneurship_goals').select('*'),
        supabase.from('entrepreneurship_tasks').select('*').eq('completed', false),
        supabase.from('tasks').select('*').eq('source', 'university').eq('completed', false),
      ]);

      const areaStats = areaStatsRes.data || [];
      const systems = systemsRes.data || [];
      const reviews = reviewsRes.data || [];
      const readings = readRes.data || [];
      const music = musicRes.data || [];
      const chess = chessRes.data || [];
      const logs = logsRes.data || [];
      const focus = focusRes.data || [];
      const citas = citasRes.data || [];
      const intimidad = intimidadRes.data || [];
      const eventos = eventosRes.data || [];
      const ingreso = ingresoRes.data || [];
      const library = libraryRes.data || [];
      const repertoire = repertoireRes.data || [];

      const projMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p.title]));
      const subjMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));
      const entMap = new Map((entregasRes.data || []).map((e: any) => [e.id, e.name]));
      const entTaskIds = new Set<string>([
        ...(entTasksRes.data || []).map((t: any) => t.id),
        ...(entPendingRes.data || []).map((t: any) => t.id),
      ]);

      const [activeSubjects, activeBusinesses, activeProjects] = await Promise.all([
        readActiveSelections('activeSubjects'),
        readActiveSelections('activeEntrepreneurships'),
        readActiveSelections('activeProjects'),
      ]);

      // Solo cuentan las tareas con fecha dentro del período (hoy/semana/mes/trimestre)
      const inPeriod = (t: any) => {
        if (!t?.due_date) return false;
        const d = String(t.due_date).slice(0, 10);
        return d >= startStr && d <= endStr;
      };

      const entityFor = (t: any): string | null => {
        if (t.source === 'project' || t.area_id === 'proyectos' || t.source === 'proyectos') {
          return projMap.get(t.source_id) || null;
        }
        if (t.source === 'university' || t.area_id === 'universidad' || t.source === 'universidad') {
          return subjMap.get(t.source_id) || null;
        }
        if (t.source === 'entrepreneurship' || t.area_id === 'emprendimiento' || t.source === 'emprendimiento') {
          return entMap.get(t.source_id) || null;
        }
        return null;
      };

      const tasks = [
        ...(tasksRes.data || []).filter((t: any) =>
          !(t.source === 'entrepreneurship' && entTaskIds.has(t.source_id))
        ),
        ...(entTasksRes.data || []).map((t: any) => ({ ...t, source: 'emprendimiento', area_id: 'emprendimiento', source_id: t.entrepreneurship_id, _ent: true })),
      ].map((t: any) => ({
        ...t,
        entityName: entityFor(t),
        dueShort: t.due_date ? format(new Date(t.due_date), 'd MMM') : null,
      }));

      const toPlanItem = (t: any): PlanTaskItem => ({
        id: t.id,
        title: t.title,
        completed: !!t.completed,
        task_type: t.task_type || (t._ent ? 'normal' : undefined),
        dueShort: t.due_date ? format(new Date(t.due_date), 'd MMM') : null,
      });

      // --- Universidad: asignaturas activas ---
      const subjectTaskMap: Record<string, any[]> = {};
      const mergeSubjectTask = (subjId: string, t: any) => {
        if (!activeSubjects.includes(subjId)) return;
        const list = (subjectTaskMap[subjId] = subjectTaskMap[subjId] || []);
        if (!list.some(x => x.id === t.id)) list.push(t);
      };
      (tasksRes.data || []).forEach((t: any) => {
        if (t.source === 'university' && t.source_id) mergeSubjectTask(t.source_id, t);
      });
      (subjPendingRes.data || []).forEach((t: any) => {
        if (t.source === 'university' && t.source_id) mergeSubjectTask(t.source_id, t);
      });
      const examsRows = (examsRes.data || []).filter((e: any) => activeSubjects.includes(e.subject_id));
      const partialsRows = (partialsRes.data || []).filter((p: any) => activeSubjects.includes(p.subject_id));
      const topicRows = (topicRes.data || []).filter((t: any) => activeSubjects.includes(t.subject_id));
      const universitySubjects: UniversitySubjectResult[] = activeSubjects.map(id => {
        const ts = subjectTaskMap[id] || [];
        const subjTasks = ts.map(toPlanItem);
        const items: UniversitySubjectResult = {
          id,
          name: subjMap.get(id) || 'Asignatura',
          topics: topicRows.filter(t => t.subject_id === id).map(t => ({ id: t.id, title: t.title })),
          tasks: subjTasks,
          deliveries: subjTasks.filter(t => t.task_type !== 'study'),
          exams: examsRows.filter(e => e.subject_id === id).map(e => ({
            id: e.id,
            title: e.title,
            date: e.exam_date,
            done: e.status === 'completed' || e.grade != null,
          })),
          partials: partialsRows.filter(p => p.subject_id === id).map(p => ({
            id: p.id,
            title: p.title,
            date: p.exam_date,
            done: p.grade != null || p.status === 'completed',
          })),
        };
        return items;
      });
      const uniOther = tasks.filter((t: any) =>
        normalizeArea(t.area_id || t.source || t.area) === 'universidad' && t.source !== 'university'
      );

      // --- Emprendimiento: negocios activos ---
      const businessTaskMap: Record<string, any[]> = {};
      const mergeBusinessTask = (bizId: string, t: any) => {
        if (!activeBusinesses.includes(bizId)) return;
        const list = (businessTaskMap[bizId] = businessTaskMap[bizId] || []);
        if (!list.some(x => x.id === t.id)) list.push(t);
      };
      (entTasksRes.data || []).forEach((t: any) => mergeBusinessTask(t.entrepreneurship_id, t));
      (entPendingRes.data || []).forEach((t: any) => mergeBusinessTask(t.entrepreneurship_id, t));
      const goalRows = (goalsRes.data || []).filter((g: any) => activeBusinesses.includes(g.entrepreneurship_id));
      const businessList: BusinessResult[] = activeBusinesses.map(id => {
        const ts = businessTaskMap[id] || [];
        return {
          id,
          name: entMap.get(id) || 'Emprendimiento',
          goals: goalRows.filter(g => g.entrepreneurship_id === id).map(g => ({ id: g.id, title: g.title, completed: !!g.completed })),
          tasks: ts.map(toPlanItem),
          tasksDone: ts.filter(t => t.completed).length,
          tasksTotal: ts.length,
        };
      });
      const entOther = tasks.filter((t: any) => !t._ent && normalizeArea(t.area_id || t.source || t.area) === 'emprendimiento');

      // --- Proyectos: proyectos activos ---
      const projectList: ProjectResult[] = (projectsRes.data || []).filter((p: any) => activeProjects.includes(p.id)).map((p: any) => {
        const pts = (p.tasks || []) as { id: string; title: string; completed: boolean; subTasks?: { completed: boolean }[] }[];
        const done = pts.reduce((acc, t) => acc + (t.completed ? 1 : 0) + (t.subTasks || []).filter(s => s.completed).length, 0);
        const total = pts.reduce((acc, t) => acc + 1 + (t.subTasks || []).length, 0);
        return {
          id: p.id,
          name: p.title,
          tasks: pts.map(t => ({ id: t.id, title: t.title, completed: !!t.completed, task_type: 'project' })),
          done,
          total,
        };
      });
      const projOther = tasks.filter((t: any) => normalizeArea(t.area_id || t.source || t.area) === 'proyectos');

      const { quarter: planQ, year: planY } = getQuarterFromDate(start);
      const plan = loadTrimestralPlanFromLocal(`Q${planQ}_${planY}`);
      const monthKey = `month${start.getMonth() - (planQ - 1) * 3 + 1}` as 'month1' | 'month2' | 'month3';
      const planBookIds = new Set<string>();
      const planSongIds = new Set<string>();
      if (plan) {
        if (end.getMonth() === start.getMonth()) {
          const dist = plan.distribution?.[monthKey];
          (dist?.books || plan.books?.selected || []).forEach((id: string) => planBookIds.add(id));
          (dist?.songs || plan.songs?.selected || []).forEach((id: string) => planSongIds.add(id));
        } else {
          (['month1', 'month2', 'month3'] as const).forEach(mk => {
            const dist = plan.distribution?.[mk];
            (dist?.books || []).forEach((id: string) => planBookIds.add(id));
            (dist?.songs || []).forEach((id: string) => planSongIds.add(id));
          });
        }
      }
      const books = [...planBookIds]
        .map(id => library.find((b: any) => b.id === id))
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          cover: b.cover_image_url,
          pagesRead: b.pages_read || 0,
          pagesTotal: b.pages_total || 0,
          status: b.status,
          done: (b.pages_read || 0) >= (b.pages_total || 0) || b.status === 'leído' || b.status === 'terminado',
        })) as PlanBook[];
      const songsPlan = [...planSongIds]
        .map(id => repertoire.find((s: any) => s.id === id))
        .filter(Boolean)
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          instrument: s.instrument,
          practiceMinutes: s.practice_minutes || 0,
          status: s.status,
        })) as PlanSong[];

      const byArea = emptyAreaResult();

      tasks.forEach((t: any) => {
        const a = normalizeArea(t.area_id || t.source || t.area);
        byArea[a].total++;
        if (t.completed) byArea[a].done++;
        byArea[a].tasks.push(t);
      });

      areaStats.forEach((s: any) => {
        const a = normalizeArea(s.area_id);
        byArea[a].minutes += s.time_spent_minutes || 0;
        byArea[a].goalMinutes += s.time_goal_minutes || 0;
      });

      systems.forEach((s: any) => {
        const td = s.time_data || {};
        for (const [k, v] of Object.entries(td)) {
          const a = normalizeArea(k);
          byArea[a].minutes += Number(v) || 0;
        }
      });

      const systemsDone = systems.reduce((acc: number, s: any) => acc + Object.values(s.completions || {}).filter(v => v === true).length, 0);
      const systemsTotal = systems.length > 0 ? Math.max(...systems.map((s: any) => Object.keys(s.completions || {}).length)) : 0;
      const systemsMin = systems.reduce((a: number, s: any) => a + (Object.values(s.time_data || {}) as any[]).reduce((x: number, v: any) => x + (Number(v) || 0), 0), 0);
      const workoutMin = systems.reduce((a: number, s: any) => a + (s.workout_duration || 0), 0);
      const focusMin = focus.reduce((a: number, f: any) => a + (f.duration_minutes || 0), 0);

      let pages = 0;
      let pagesGoal = 0;
      let readMin = 0;
      const readPerDay: Record<string, number> = {};
      readings.forEach((r: any) => {
        pages += r.pages_read || 0;
        readMin += r.minutes || 0;
        const d = r.session_date;
        readPerDay[d] = (readPerDay[d] || 0) + (r.pages_read || 0);
      });
      areaStats.forEach((s: any) => {
        if (normalizeArea(s.area_id) === 'lectura') pagesGoal += s.pages_goal || 0;
      });

      let musicMin = 0;
      const musicPerDay: Record<string, number> = {};
      const songs = new Set<string>();
      music.forEach((m: any) => {
        musicMin += m.duration_minutes || 0;
        const d = m.practice_date;
        musicPerDay[d] = (musicPerDay[d] || 0) + (m.duration_minutes || 0);
        if (m.song_id) songs.add(m.song_id);
      });

      let chessGames = 0;
      let chessWins = 0;
      let chessElo: number | null = null;
      const chessHistory: { d: string; elo: number }[] = [];
      [...chess]
        .sort((a: any, b: any) => String(a.session_date).localeCompare(String(b.session_date)))
        .forEach((c: any) => {
          chessGames += c.games_played || 0;
          chessWins += c.games_won || 0;
          if (c.current_elo) {
            chessElo = c.current_elo;
            chessHistory.push({ d: c.session_date, elo: c.current_elo });
          }
        });

      let gymLogs = 0;
      let gymSets = 0;
      let gymMax: number | null = null;
      const gymPerDay: Record<string, number> = {};
      logs.forEach((l: any) => {
        gymLogs++;
        gymSets += l.sets_completed || 0;
        const kg = Number(l.weight_kg) || 0;
        if (kg > 0 && (gymMax === null || kg > gymMax)) gymMax = kg;
        const d = l.log_date;
        gymPerDay[d] = Math.max(gymPerDay[d] || 0, kg);
      });

      const ingAmount = ingreso.reduce((a: number, i: any) => a + (Number(i.amount) || 0), 0);

      const allDates = new Set<string>();
      tasks.forEach((t: any) => t.due_date && allDates.add(format(new Date(t.due_date), 'yyyy-MM-dd')));
      systems.forEach((s: any) => allDates.add(s.tracking_date));
      areaStats.forEach((s: any) => allDates.add(s.stat_date));
      reviews.forEach((r: any) => allDates.add(r.review_date));
      readings.forEach((r: any) => allDates.add(r.session_date));
      music.forEach((m: any) => allDates.add(m.practice_date));
      chess.forEach((c: any) => allDates.add(c.session_date));
      logs.forEach((l: any) => allDates.add(l.log_date));

      const perDay = [...allDates].sort().map(dt => {
        const dayTasks = tasks.filter((t: any) => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === dt);
        const review = reviews.find(r => r.review_date === dt);
        const spentMin = areaStats.filter(s => s.stat_date === dt).reduce((a, s) => a + (s.time_spent_minutes || 0), 0);
        let score = 0;
        if (review?.overall_rating) score = review.overall_rating * 20;
        else if (dayTasks.length > 0) score = Math.round((dayTasks.filter((t: any) => t.completed).length / dayTasks.length) * 100);
        else if (spentMin > 0) score = 50;
        return { date: dt, score, label: dayLabel(dt) };
      });

      const scores = perDay.filter(d => d.score > 0).map(d => d.score);
      const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        loading: false,
        error: null,
        tasks,
        byArea,
        books,
        songs: songsPlan,
        university: { subjects: universitySubjects, otherTasks: uniOther },
        entrepreneurships: { businesses: businessList, otherTasks: entOther },
        projects: { list: projectList, otherTasks: projOther },
        globalDone: tasks.filter((t: any) => t.completed).length,
        globalTotal: tasks.length,
        systems: { done: systemsDone, total: systemsTotal, minutes: systemsMin },
        workoutMin,
        focusMin,
        reviews: {
          count: reviews.length,
          avgRating: reviews.length ? reviews.reduce((a: number, r: any) => a + (r.overall_rating || 0), 0) / reviews.length : 0,
        },
        lectura: {
          pages,
          pagesGoal,
          minutes: readMin + byArea.lectura.minutes,
          sessions: readings.length,
          perDay: Object.entries(readPerDay).sort().map(([d, pag]) => ({ d, pag })),
        },
        musica: {
          minutes: musicMin + byArea.musica.minutes,
          sessions: music.length,
          songs: songs.size,
          perDay: Object.entries(musicPerDay).sort().map(([d, min]) => ({ d, min })),
        },
        ajedrez: { minutes: byArea.ajedrez.minutes, games: chessGames, wins: chessWins, elo: chessElo, history: chessHistory },
        gym: { logs: gymLogs, sets: gymSets, maxWeight: gymMax, perDay: Object.entries(gymPerDay).sort().map(([d, kg]) => ({ d, kg })) },
        game: { citas: citas.length, intimidad: intimidad.length, eventos: eventos.length },
        ingreso: { count: ingreso.length, amount: ingAmount },
        perDay,
        score,
      } as ResultadoPeriodo;
    },
  });
}