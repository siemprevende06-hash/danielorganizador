import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, getISOWeek } from 'date-fns';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';

export type Priority = 'high' | 'medium' | 'low';

export interface WeeklyOutcome {
  id: string;
  title: string;
  successCriteria?: string;
  completed: boolean;
  priority?: Priority;
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
}

export interface WeeklyPlanData {
  objectives: string[];
  focus_areas: string[];
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  personal_goals: { title: string; target?: string }[];
  actions: WeeklyAction[];
  weekNumber: number;
  outcomes?: WeeklyOutcome[];
  dailyCapacityMinutes?: Record<string, number>; // por día yyyy-MM-dd
  notes?: string;
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

  const addAction = useCallback((action: Omit<WeeklyAction, 'id'>) => {
    setPlanData(prev => ({ ...prev, actions: [...(prev.actions ?? []), { ...action, id: genId() }] }));
  }, []);

  const toggleAction = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      actions: (prev.actions ?? []).map(a => a.id === id ? { ...a, completed: !a.completed } : a),
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
    setPlanData(prev => ({
      ...prev,
      outcomes: [...(prev.outcomes ?? []), { ...outcome, id: genId() }],
    }));
  }, []);

  const toggleOutcome = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      outcomes: (prev.outcomes ?? []).map(o => (o.id === id ? { ...o, completed: !o.completed } : o)),
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

  return {
    planData, loading, saving, weekId,
    books, songs,
    updatePlanData, savePlan, fetchPlan,
    addAction, toggleAction, removeAction, updateAction,
    addOutcome, toggleOutcome, removeOutcome, updateOutcome,
    setDailyCapacity, removeDailyCapacity,
  };
}
