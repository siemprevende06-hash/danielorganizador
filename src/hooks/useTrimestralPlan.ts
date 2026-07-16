import { useState, useEffect, useCallback } from 'react';
import { startOfQuarter, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface TrimestralPlanData {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  subjects: { subject_id: string; topics: string[] }[];
  events: string[];
  personal_goals: { title: string; target?: string }[];
  distribution: {
    month1: { books: string[]; songs: string[] };
    month2: { books: string[]; songs: string[] };
    month3: { books: string[]; songs: string[] };
  };
}

const defaultTrimestralData: TrimestralPlanData = {
  books: { goal: 0, selected: [] },
  songs: { goal: 0, selected: [] },
  projects: [],
  subjects: [],
  events: [],
  personal_goals: [],
  distribution: {
    month1: { books: [], songs: [] },
    month2: { books: [], songs: [] },
    month3: { books: [], songs: [] },
  },
};

interface Book { id: string; title: string; author: string | null; cover_image_url: string | null; }
interface Song { id: string; title: string; artist: string | null; instrument: string; }
interface Project { id: string; name: string; }
interface Subject { id: string; name: string; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }

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
      const [booksRes, songsRes] = await Promise.all([
        supabase.from('reading_library').select('id, title, author, cover_image_url').order('title'),
        supabase.from('music_repertoire').select('id, title, artist, instrument').order('title'),
      ]);
      if (booksRes.data) setBooks(booksRes.data);
      if (songsRes.data) setSongs(songsRes.data);

      const storedProjects = localStorage.getItem('userProjects');
      if (storedProjects) setProjects(JSON.parse(storedProjects).map((p: any) => ({ id: p.id, name: p.name })));
      const storedSubjects = localStorage.getItem('university_subjects');
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents).filter((e: any) => {
          const d = new Date(e.event_date);
          const qStart = (quarter - 1) * 3;
          const startD = new Date(year, qStart, 1);
          const endD = new Date(year, qStart + 3, 0);
          return d >= startD && d <= endD;
        });
        setEvents(parsed);
      }
    } catch {}
  }, [quarter, year]);

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

  return {
    planData, loading, saving, storageKey, quarter, year,
    books, songs, projects, subjects, events,
    updatePlanData, savePlan, fetchPlan, autoDistribute,
    getMonthNamesForQuarter: () => getMonthNamesForQuarter(quarter),
  };
}
