import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export interface WeeklyPlanData {
  objectives: string[];
  focus_areas: string[];
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  personal_goals: { title: string; target?: string }[];
}

const defaultWeeklyData: WeeklyPlanData = {
  objectives: [],
  focus_areas: [],
  books: { goal: 0, selected: [] },
  songs: { goal: 0, selected: [] },
  personal_goals: [],
};

const STORAGE_PREFIX = 'weekly_plan_';

function loadFromLocal(key: string): WeeklyPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLocal(key: string, data: WeeklyPlanData) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch {}
}

interface Book { id: string; title: string; author: string | null; }
interface Song { id: string; title: string; artist: string | null; instrument: string; }

export function getWeekId(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, 'yyyy-ww');
}

export function useWeeklyPlan(weekStart: Date) {
  const weekId = getWeekId(weekStart);
  const [planData, setPlanData] = useState<WeeklyPlanData>(defaultWeeklyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    const local = loadFromLocal(weekId);
    setPlanData(local || defaultWeeklyData);
    setLoading(false);
  }, [weekId]);

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

  return {
    planData, loading, saving, weekId,
    books, songs,
    updatePlanData, savePlan, fetchPlan,
  };
}
