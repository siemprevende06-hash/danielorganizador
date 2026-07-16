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
    month1: { books: number; songs: number };
    month2: { books: number; songs: number };
    month3: { books: number; songs: number };
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
    month1: { books: 0, songs: 0 },
    month2: { books: 0, songs: 0 },
    month3: { books: 0, songs: 0 },
  },
};

interface Book { id: string; title: string; author: string | null; }
interface Song { id: string; title: string; artist: string | null; instrument: string; }
interface Project { id: string; name: string; }
interface Subject { id: string; name: string; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }

const STORAGE_PREFIX = 'trimestral_plan_';

function loadFromLocal(key: string): TrimestralPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLocal(key: string, data: TrimestralPlanData) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch {}
}

export function getQuarterFromDate(date: Date) {
  return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
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
    const local = loadFromLocal(storageKey);
    setPlanData(local || defaultTrimestralData);
    setLoading(false);
  }, [storageKey]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(storageKey, planData);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
  }, [storageKey, planData]);

  const loadLocalData = useCallback(async () => {
    try {
      const [booksRes, songsRes] = await Promise.all([
        supabase.from('reading_library').select('id, title, author').order('title'),
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
    updatePlanData(prev => {
      const totalBooks = prev.books.goal;
      const totalSongs = prev.songs.goal;
      const b1 = Math.round(totalBooks / 3);
      const b2 = Math.round(totalBooks / 3);
      const b3 = totalBooks - b1 - b2;
      const s1 = Math.round(totalSongs / 3);
      const s2 = Math.round(totalSongs / 3);
      const s3 = totalSongs - s1 - s2;
      return {
        ...prev,
        distribution: {
          month1: { books: b1, songs: s1 },
          month2: { books: b2, songs: s2 },
          month3: { books: b3, songs: s3 },
        },
      };
    });
  }, []);

  return {
    planData, loading, saving, storageKey, quarter, year,
    books, songs, projects, subjects, events,
    updatePlanData, savePlan, fetchPlan, autoDistribute,
  };
}
