import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfQuarter, format } from 'date-fns';

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

  const fetchPlan = useCallback(async () => {
    setLoading(true);

    const local = loadFromLocal(storageKey);
    if (local) {
      setPlanData(local);
      setLoading(false);
    }

    try {
      const { data, error } = await supabase
        .from('trimestral_plans')
        .select('plan_data')
        .eq('quarter', quarter)
        .eq('year', year)
        .maybeSingle();

      if (!error && data) {
        const remote = { ...defaultTrimestralData, ...(data.plan_data as any) };
        setPlanData(remote);
        saveToLocal(storageKey, remote);
      } else if (!local) {
        setPlanData(defaultTrimestralData);
      }
    } catch {
      if (!local) setPlanData(defaultTrimestralData);
    } finally {
      setLoading(false);
    }
  }, [storageKey, quarter, year]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(storageKey, planData);

    try {
      const { data: existing } = await supabase
        .from('trimestral_plans')
        .select('id')
        .eq('quarter', quarter)
        .eq('year', year)
        .maybeSingle();

      if (existing) {
        await supabase.from('trimestral_plans').update({ plan_data: planData }).eq('id', existing.id);
      } else {
        await supabase.from('trimestral_plans').insert({ quarter, year, plan_data: planData });
      }
    } catch {}

    setSaving(false);
  }, [storageKey, planData, quarter, year]);

  const fetchBooks = async () => {
    const { data } = await supabase.from('reading_library').select('id, title, author').order('title');
    if (data) setBooks(data as Book[]);
  };

  const fetchSongs = async () => {
    const { data } = await supabase.from('music_repertoire').select('id, title, artist, instrument').order('title');
    if (data) setSongs(data as Song[]);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('university_subjects').select('id, name').order('name');
    if (data) setSubjects(data as Subject[]);
  };

  const fetchEvents = async () => {
    const qStart = (quarter - 1) * 3;
    const startD = new Date(year, qStart, 1);
    const endD = new Date(year, qStart + 3, 0);
    const s = format(startD, 'yyyy-MM-dd');
    const e = format(endD, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, event_date, category')
      .gte('event_date', s).lte('event_date', e)
      .order('event_date');
    if (data) setEvents(data as CalendarEvent[]);
  };

  const loadProjects = () => {
    try {
      const raw = localStorage.getItem('userProjects');
      if (raw) setProjects(JSON.parse(raw).map((p: any) => ({ id: p.id, name: p.name })));
    } catch {}
  };

  useEffect(() => {
    fetchPlan();
    fetchBooks();
    fetchSongs();
    fetchSubjects();
    fetchEvents();
    loadProjects();
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
