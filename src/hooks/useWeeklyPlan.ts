import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, getISOWeek } from 'date-fns';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';
import { readLanguageWeekPlans, type LanguageWeekPlans } from '@/lib/languagePlan';
import { readGameWeekPlan, type GameWeekPlan } from '@/lib/game';

export type Priority = 'high' | 'medium' | 'low';

export interface WeeklyOutcome {
  id: string;
  title: string;
  successCriteria?: string;
  completed: boolean;
  priority?: Priority;
  /** ISO de cuando se planificó el resultado (constancia). */
  createdAt?: string;
  /** ISO de cuando se alcanzó; null mientras siga pendiente. */
  completedAt?: string | null;
}

export interface WeeklyAction {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  estimatedMinutes?: number;
  actualMinutes?: number;
  assignedDay?: string; // 'yyyy-MM-dd'
  priority?: Priority;
  area?: string;
  minutes?: number;
  targetResult?: string;
  /** ISO de cuando se planificó la acción (constancia). */
  createdAt?: string;
  /** ISO de cuando se completó; null mientras siga pendiente. */
  completedAt?: string | null;
}

export interface WeeklyPlanData {
  objectives: string[];
  focus_areas: string[];
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  personal_goals: {
    title: string;
    target?: string;
    /** ISO de cuando se creó la meta. */
    createdAt?: string;
    /** ISO de cuando se cumplió; null mientras siga pendiente. */
    completedAt?: string | null;
  }[];
  actions: WeeklyAction[];
  weekNumber: number;
  outcomes?: WeeklyOutcome[];
  dailyCapacityMinutes?: Record<string, number>; // por d��a yyyy-MM-dd
  notes?: string;
  /** Resultado al que se dirige el esfuerzo de cada area (id de outcome o texto libre) */
  areaResults?: Record<string, string>;
  /** Libro de la semana (id de reading_library) */
  weekBookId?: string;
  /** Canción de la semana que se está aprendiendo (campo legado). */
  learningSongId?: string;
  /** Canción de la semana que se quiere dominar (campo legado). */
  masteringSongId?: string;
  /** Paginas que se espera leer esta semana */
  lecturaPagesGoal?: number;
  /** ELO que tenías al planificar la semana (punto de partida del tramo). */
  chessEloStart?: number;
  /** ELO que quieres alcanzar al cerrar esta semana. */
  chessEloTarget?: number;
  /** Enfoque de la semana por área: ids seleccionados (asignaturas de universidad, emprendimientos, proyectos...) */
  areaFocus?: Record<string, string[]>;
  /** Habilidad foco, reto y minutos por idioma. */
  languages?: LanguageWeekPlans;
  /** Habilidad foco, reto y metas de Game. */
  game?: GameWeekPlan;
}

const makeDefault = (weekNumber: number): WeeklyPlanData => ({
  objectives: [],
  focus_areas: [],
  books: { goal: 0, selected: [] },
  songs: { goal: 0, selected: [] },
  personal_goals: [],
  actions: [],
  weekNumber,
  outcomes: [],
  dailyCapacityMinutes: {},
  notes: '',
  areaResults: {},
  weekBookId: '',
  lecturaPagesGoal: 0,
  chessEloStart: 0,
  chessEloTarget: 0,
  areaFocus: {},
  languages: readLanguageWeekPlans(undefined),
  game: readGameWeekPlan(undefined),
});

const STORAGE_PREFIX = 'weekly_plan_';

function loadFromLocal(key: string): Partial<WeeklyPlanData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLocal(key: string, data: WeeklyPlanData) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch {}
  pushSyncKey(STORAGE_PREFIX + key);
}

interface Book { id: string; title: string; author: string | null; }
interface Song { id: string; title: string; artist: string | null; instrument: string; }

export function getWeekId(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, 'yyyy-ww');
}

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Marca de tiempo ISO para el registro de creación/realización. */
const nowIso = () => new Date().toISOString();

export function useWeeklyPlan(weekStart: Date) {
  const weekId = getWeekId(weekStart);
  const weekNumber = getISOWeek(weekStart);
  const [planData, setPlanData] = useState<WeeklyPlanData>(makeDefault(weekNumber));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    await pullPlansIntoLocal();
    const local = loadFromLocal(weekId);
    const base = makeDefault(weekNumber);
    setPlanData(
      local
        ? {
            ...base,
            ...local,
            actions: Array.isArray(local.actions) ? local.actions : [],
            outcomes: Array.isArray(local.outcomes) ? local.outcomes : [],
            dailyCapacityMinutes: local.dailyCapacityMinutes ?? {},
            notes: local.notes ?? '',
            weekNumber,
            areaResults: local.areaResults ?? {},
            weekBookId: local.weekBookId ?? '',
            lecturaPagesGoal: local.lecturaPagesGoal ?? 0,
            chessEloStart: local.chessEloStart ?? 0,
            chessEloTarget: local.chessEloTarget ?? 0,
            areaFocus: local.areaFocus ?? {},
            languages: readLanguageWeekPlans(local.languages),
            game: readGameWeekPlan(local.game),
          }
        : base
    );
    setLoading(false);
  }, [weekId, weekNumber]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(weekId, planData);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
  }, [weekId, planData]);

  const loadLocalData = useCallback(() => {
    try {
      const storedBooks = localStorage.getItem('reading_library');
      if (storedBooks) setBooks(JSON.parse(storedBooks));
      const storedSongs = localStorage.getItem('music_repertoire');
      if (storedSongs) setSongs(JSON.parse(storedSongs));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlan();
    loadLocalData();
  }, [weekId]);

  const updatePlanData = useCallback((updater: (prev: WeeklyPlanData) => WeeklyPlanData) => {
    setPlanData(prev => updater(prev));
  }, []);

  /**
   * Cambia el plan y lo guarda al instante (localStorage + sync), sin pasar por
   * el botón "Guardar". Se usa desde la pestaña Planificación de Hoy/Semana.
   */
  const planRef = useRef(planData);
  useEffect(() => { planRef.current = planData; }, [planData]);

  const patchPlan = useCallback((updater: (prev: WeeklyPlanData) => WeeklyPlanData) => {
    const next = updater(planRef.current);
    planRef.current = next;
    setPlanData(next);
    saveToLocal(weekId, next);
  }, [weekId]);

  const addAction = useCallback((action: Omit<WeeklyAction, 'id'>) => {
    const now = nowIso();
    setPlanData(prev => ({
      ...prev,
      actions: [
        ...(prev.actions ?? []),
        {
          ...action,
          id: genId(),
          createdAt: action.createdAt ?? now,
          completedAt: action.completedAt ?? (action.completed ? now : null),
        },
      ],
    }));
  }, []);

  const toggleAction = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      actions: (prev.actions ?? []).map(a => {
        if (a.id !== id) return a;
        const completed = !a.completed;
        return { ...a, completed, completedAt: completed ? nowIso() : null };
      }),
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setPlanData(prev => ({ ...prev, actions: (prev.actions ?? []).filter(a => a.id !== id) }));
  }, []);

  const updateAction = useCallback((id: string, updater: (a: WeeklyAction) => WeeklyAction) => {
    setPlanData(prev => ({
      ...prev,
      actions: (prev.actions ?? []).map(a => (a.id === id ? updater(a) : a)),
    }));
  }, []);

  const addOutcome = useCallback((outcome: Omit<WeeklyOutcome, 'id'>) => {
    const now = nowIso();
    setPlanData(prev => ({
      ...prev,
      outcomes: [
        ...(prev.outcomes ?? []),
        {
          ...outcome,
          id: genId(),
          createdAt: outcome.createdAt ?? now,
          completedAt: outcome.completedAt ?? (outcome.completed ? now : null),
        },
      ],
    }));
  }, []);

  const toggleOutcome = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      outcomes: (prev.outcomes ?? []).map(o => {
        if (o.id !== id) return o;
        const completed = !o.completed;
        return { ...o, completed, completedAt: completed ? nowIso() : null };
      }),
    }));
  }, []);

  const removeOutcome = useCallback((id: string) => {
    setPlanData(prev => ({ ...prev, outcomes: (prev.outcomes ?? []).filter(o => o.id !== id) }));
  }, []);

  const updateOutcome = useCallback((id: string, updater: (o: WeeklyOutcome) => WeeklyOutcome) => {
    setPlanData(prev => ({
      ...prev,
      outcomes: (prev.outcomes ?? []).map(o => (o.id === id ? updater(o) : o)),
    }));
  }, []);

  const setDailyCapacity = useCallback((dayStr: string, minutes: number) => {
    setPlanData(prev => ({
      ...prev,
      dailyCapacityMinutes: { ...(prev.dailyCapacityMinutes ?? {}), [dayStr]: Math.max(0, minutes) },
    }));
  }, []);

  const removeDailyCapacity = useCallback((dayStr: string) => {
    setPlanData(prev => {
      const dc = { ...(prev.dailyCapacityMinutes ?? {}) };
      delete dc[dayStr];
      return { ...prev, dailyCapacityMinutes: dc };
    });
  }, []);

  const setAreaResult = useCallback((area: string, value: string) => {
    setPlanData(prev => ({ ...prev, areaResults: { ...(prev.areaResults ?? {}), [area]: value } }));
  }, []);

  const setWeekBook = useCallback((bookId: string) => {
    setPlanData(prev => ({ ...prev, weekBookId: bookId }));
  }, []);

  const setLecturaPagesGoal = useCallback((pages: number) => {
    setPlanData(prev => ({ ...prev, lecturaPagesGoal: Math.max(0, pages) }));
  }, []);

  const setAreaFocus = useCallback((area: string, ids: string[]) => {
    setPlanData(prev => ({ ...prev, areaFocus: { ...(prev.areaFocus ?? {}), [area]: ids } }));
  }, []);

  return {
    planData, loading, saving, weekId,
    books, songs,
    updatePlanData, savePlan, fetchPlan,
    patchPlan,
    addAction, toggleAction, removeAction, updateAction,
    addOutcome, toggleOutcome, removeOutcome, updateOutcome,
    setDailyCapacity, removeDailyCapacity,
    setAreaResult, setWeekBook, setLecturaPagesGoal, setAreaFocus,
  };
}
