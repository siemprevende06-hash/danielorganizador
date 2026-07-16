import { useState, useEffect, useCallback } from 'react';
import { startOfQuarter, format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface TrimestralPlanData {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  monthProjects: Record<string, string[]>;
  monthEntrepreneurships: Record<string, string[]>;
  subjects: { subject_id: string; topics: string[] }[];
  monthSubjects: Record<string, string[]>;
  events: string[];
  personal_goals: { title: string; target?: string }[];
  completedTasks: Record<string, string[]>;
  completedEvents: Record<string, string[]>;
  distribution: {
    month1: { books: string[]; songs: string[] };
    month2: { books: string[]; songs: string[] };
    month3: { books: string[]; songs: string[] };
  };
  notes: Record<string, string>;
}

const defaultTrimestralData: TrimestralPlanData = {
  books: { goal: 0, selected: [] },
  songs: { goal: 0, selected: [] },
  projects: [],
  monthProjects: { month1: [], month2: [], month3: [] },
  monthEntrepreneurships: { month1: [], month2: [], month3: [] },
  subjects: [],
  monthSubjects: { month1: [], month2: [], month3: [] },
  events: [],
  personal_goals: [],
  completedTasks: { month1: [], month2: [], month3: [] },
  completedEvents: { month1: [], month2: [], month3: [] },
  distribution: {
    month1: { books: [], songs: [] },
    month2: { books: [], songs: [] },
    month3: { books: [], songs: [] },
  },
  notes: {},
};

interface Book { id: string; title: string; author: string | null; cover_image_url: string | null; }
interface Song { id: string; title: string; artist: string | null; instrument: string; }
interface Project { id: string; name: string; }
interface Subject { id: string; name: string; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }
interface TaskItem { id: string; title: string; source: string; due_date: string; completed: boolean; priority?: string; }
interface MonthlyTimeData { totalMinutes: number; byArea: Record<string, number>; }

const STORAGE_PREFIX = 'trimestral_plan_';

function saveToLocal(key: string, data: TrimestralPlanData) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch {}
}

export function loadTrimestralPlanFromLocal(key: string): TrimestralPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const data = JSON.parse(raw);
      const migrated = migrateDistribution(data);
      if (migrated !== data) saveToLocal(key, migrated);
      return migrated;
    }
  } catch {}
  return null;
}

function migrateDistribution(data: any): TrimestralPlanData {
  if (!data.notes) data.notes = {};
  if (!data.monthProjects) data.monthProjects = { month1: [], month2: [], month3: [] };
  if (!data.monthEntrepreneurships) data.monthEntrepreneurships = { month1: [], month2: [], month3: [] };
  if (!data.monthSubjects) data.monthSubjects = { month1: [], month2: [], month3: [] };
  if (!data.completedTasks) data.completedTasks = { month1: [], month2: [], month3: [] };
  if (!data.completedEvents) data.completedEvents = { month1: [], month2: [], month3: [] };
  if (!data.distribution) return { ...defaultTrimestralData, ...data, distribution: defaultTrimestralData.distribution };
  const m1 = data.distribution.month1;
  if (m1 && typeof m1.books === 'number') {
    const books = data.books?.selected || [];
    const songs = data.songs?.selected || [];
    const bSplit = splitEvenly(books, 3);
    const sSplit = splitEvenly(songs, 3);
    return {
      ...data,
      distribution: {
        month1: { books: bSplit[0], songs: sSplit[0] },
        month2: { books: bSplit[1], songs: sSplit[1] },
        month3: { books: bSplit[2], songs: sSplit[2] },
      },
    };
  }
  return data;
}

function splitEvenly<T>(arr: T[], n: number): T[][] {
  const result: T[][] = Array.from({ length: n }, () => []);
  arr.forEach((item, i) => result[i % n].push(item));
  return result;
}

export function getQuarterFromDate(date: Date) {
  return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthName(quarter: number, monthIndex: number): string {
  const realMonth = (quarter - 1) * 3 + monthIndex;
  return MONTH_NAMES[realMonth] || `Mes ${monthIndex + 1}`;
}

export function getMonthNamesForQuarter(quarter: number): string[] {
  return [0, 1, 2].map(i => getMonthName(quarter, i));
}

export function useTrimestralPlan(quarter: number, year: number) {
  const storageKey = `Q${quarter}_${year}`;
  const [planData, setPlanData] = useState<TrimestralPlanData>(defaultTrimestralData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [quarterTasks, setQuarterTasks] = useState<TaskItem[]>([]);
  const [monthlyTimeData, setMonthlyTimeData] = useState<Record<string, MonthlyTimeData>>({});

  const qStart = (quarter - 1) * 3;

  const getMonthRange = useCallback((monthIdx: number) => {
    const start = new Date(year, qStart + monthIdx, 1);
    const end = new Date(year, qStart + monthIdx + 1, 0);
    return { start, end };
  }, [year, qStart]);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    const local = loadTrimestralPlanFromLocal(storageKey);
    setPlanData(local || defaultTrimestralData);
    setLoading(false);
  }, [storageKey]);

  const savePlan = useCallback(async (data?: TrimestralPlanData) => {
    setSaving(true);
    const toSave = data || planData;
    saveToLocal(storageKey, toSave);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
  }, [storageKey, planData]);

  const loadLocalData = useCallback(async () => {
    try {
      const qStartMonth = (quarter - 1) * 3;
      const quarterStart = new Date(year, qStartMonth, 1);
      const quarterEnd = new Date(year, qStartMonth + 3, 0);

      const [booksRes, songsRes, tasksRes, eventsRes] = await Promise.all([
        supabase.from('reading_library').select('id, title, author, cover_image_url').order('title'),
        supabase.from('music_repertoire').select('id, title, artist, instrument').order('title'),
        supabase.from('tasks').select('id, title, source, due_date, completed, priority')
          .gte('due_date', format(quarterStart, 'yyyy-MM-dd'))
          .lte('due_date', format(quarterEnd, 'yyyy-MM-dd')),
        supabase.from('calendar_events').select('*')
          .gte('event_date', format(quarterStart, 'yyyy-MM-dd'))
          .lte('event_date', format(quarterEnd, 'yyyy-MM-dd'))
          .order('event_date'),
      ]);
      if (booksRes.data) setBooks(booksRes.data);
      if (songsRes.data) setSongs(songsRes.data);
      if (tasksRes.data) setQuarterTasks(tasksRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);

      // Load time data per month from daily_systems_tracking
      const monthTimes: Record<string, MonthlyTimeData> = {};
      for (let mi = 0; mi < 3; mi++) {
        const { start, end } = getMonthRange(mi);
        const s = format(start, 'yyyy-MM-dd');
        const e = format(end, 'yyyy-MM-dd');
        const { data: timeRows } = await supabase
          .from('daily_systems_tracking')
          .select('tracking_date, time_data')
          .gte('tracking_date', s)
          .lte('tracking_date', e);
        const byArea: Record<string, number> = {};
        let total = 0;
        (timeRows || []).forEach((row: any) => {
          const td = row.time_data || {};
          Object.entries(td).forEach(([key, val]) => {
            const v = val as number;
            byArea[key] = (byArea[key] || 0) + v;
            total += v;
          });
        });
        monthTimes[`month${mi + 1}`] = { totalMinutes: total, byArea };
      }
      setMonthlyTimeData(monthTimes);

      const storedProjects = localStorage.getItem('userProjects');
      if (storedProjects) setProjects(JSON.parse(storedProjects).map((p: any) => ({ id: p.id, name: p.name })));
      const storedSubjects = localStorage.getItem('university_subjects');
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
    } catch (e) { console.error('Error loading trimestral data:', e); }
  }, [quarter, year, getMonthRange]);

  useEffect(() => {
    fetchPlan();
    loadLocalData();
  }, [storageKey]);

  const updatePlanData = useCallback((updater: (prev: TrimestralPlanData) => TrimestralPlanData) => {
    setPlanData(prev => updater(prev));
  }, []);

  const autoDistribute = useCallback(() => {
    let result: TrimestralPlanData | null = null;
    updatePlanData(prev => {
      const bookIds = prev.books.selected || [];
      const songIds = prev.songs.selected || [];
      const bSplit = splitEvenly(bookIds, 3);
      const sSplit = splitEvenly(songIds, 3);
      result = {
        ...prev,
        distribution: {
          month1: { books: bSplit[0], songs: sSplit[0] },
          month2: { books: bSplit[1], songs: sSplit[1] },
          month3: { books: bSplit[2], songs: sSplit[2] },
        },
      };
      return result;
    });
    return result;
  }, []);

  const toggleTaskCompletion = useCallback((monthKey: string, taskId: string) => {
    setPlanData(prev => {
      const list = prev.completedTasks[monthKey] || [];
      const updated = list.includes(taskId) ? list.filter(id => id !== taskId) : [...list, taskId];
      return { ...prev, completedTasks: { ...prev.completedTasks, [monthKey]: updated } };
    });
  }, []);

  const toggleEventCompletion = useCallback((monthKey: string, eventId: string) => {
    setPlanData(prev => {
      const list = prev.completedEvents[monthKey] || [];
      const updated = list.includes(eventId) ? list.filter(id => id !== eventId) : [...list, eventId];
      return { ...prev, completedEvents: { ...prev.completedEvents, [monthKey]: updated } };
    });
  }, []);

  return {
    planData, loading, saving, storageKey, quarter, year,
    books, songs, projects, subjects, events, quarterTasks, monthlyTimeData,
    updatePlanData, savePlan, fetchPlan, autoDistribute,
    toggleTaskCompletion, toggleEventCompletion,
    getMonthRange, getMonthNamesForQuarter: () => getMonthNamesForQuarter(quarter),
  };
}
