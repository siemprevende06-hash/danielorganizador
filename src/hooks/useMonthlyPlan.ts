import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyPlanData {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  subjects: { subject_id: string; topics: string[] }[];
  events: string[];
  personal_goals: { title: string; target?: string }[];
  inherited_from?: { quarter: number; year: number };
}

export interface TrimestralSummary {
  books: { goal: number; selected: number };
  songs: { goal: number; selected: number };
  projects: number;
  subjects: number;
  personal_goals: number;
  monthIndex: number;
  quarterLabel: string;
}

const defaultPlanData: MonthlyPlanData = {
  books: { goal: 0, selected: [] },
  songs: { goal: 0, selected: [] },
  projects: [],
  subjects: [],
  events: [],
  personal_goals: [],
};

const STORAGE_PREFIX = 'monthly_plan_';

interface Book { id: string; title: string; author: string | null; status: string; }
interface Song { id: string; title: string; artist: string | null; instrument: string; status: string; }
interface Project { id: string; name: string; tasks: any[]; }
interface Subject { id: string; name: string; color: string | null; }
interface Topic { id: string; title: string; subject_id: string | null; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }

function loadFromLocal(monthStr: string): MonthlyPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + monthStr);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLocal(monthStr: string, data: MonthlyPlanData) {
  try {
    localStorage.setItem(STORAGE_PREFIX + monthStr, JSON.stringify(data));
  } catch {}
}

export function useMonthlyPlan(month: Date) {
  const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');
  const [planData, setPlanData] = useState<MonthlyPlanData>(defaultPlanData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [trimestralData, setTrimestralData] = useState<TrimestralSummary | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);

    const local = loadFromLocal(monthStr);
    if (local) {
      setPlanData(local);
      setLoading(false);
    }

    try {
      const { data, error } = await supabase
        .from('monthly_plans')
        .select('plan_data')
        .eq('month', monthStr)
        .maybeSingle();

      if (!error && data) {
        const remote = { ...defaultPlanData, ...(data.plan_data as any) };
        setPlanData(remote);
        saveToLocal(monthStr, remote);
      } else if (!local) {
        setPlanData(defaultPlanData);
      }
    } catch {
      if (!local) setPlanData(defaultPlanData);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  const savePlan = useCallback(async () => {
    setSaving(true);

    saveToLocal(monthStr, planData);

    try {
      const { data: existing } = await supabase
        .from('monthly_plans')
        .select('id')
        .eq('month', monthStr)
        .maybeSingle();

      if (existing) {
        await supabase.from('monthly_plans').update({ plan_data: planData }).eq('id', existing.id);
      } else {
        await supabase.from('monthly_plans').insert({ month: monthStr, plan_data: planData });
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }, [monthStr, planData]);

  const fetchBooks = async () => {
    const { data } = await supabase.from('reading_library').select('id, title, author, status').order('title');
    if (data) setBooks(data as Book[]);
  };

  const fetchSongs = async () => {
    const { data } = await supabase.from('music_repertoire').select('id, title, artist, instrument, status').order('title');
    if (data) setSongs(data as Song[]);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('university_subjects').select('id, name, color').order('name');
    if (data) setSubjects(data as Subject[]);
  };

  const fetchTopics = async () => {
    const { data } = await supabase.from('subject_topics').select('id, title, subject_id').order('title');
    if (data) setTopics(data as Topic[]);
  };

  const fetchEvents = async () => {
    const s = format(startOfMonth(month), 'yyyy-MM-dd');
    const e = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('calendar_events')
      .select('id, title, event_date, category')
      .gte('event_date', s)
      .lte('event_date', e)
      .order('event_date');
    if (data) setEvents(data as CalendarEvent[]);
  };

  const loadProjects = () => {
    try {
      const raw = localStorage.getItem('userProjects');
      if (raw) setProjects(JSON.parse(raw));
    } catch { setProjects([]); }
  };

  const loadTrimestral = () => {
    const q = Math.ceil((month.getMonth() + 1) / 3);
    const y = month.getFullYear();
    const monthIndex = month.getMonth() - (q - 1) * 3;
    const quarterLabel = `Q${q} ${y}`;
    try {
      const raw = localStorage.getItem(`trimestral_plan_Q${q}_${y}`);
      if (raw) {
        const tData = JSON.parse(raw);
        setTrimestralData({
          books: { goal: tData.books?.goal || 0, selected: tData.books?.selected?.length || 0 },
          songs: { goal: tData.songs?.goal || 0, selected: tData.songs?.selected?.length || 0 },
          projects: tData.projects?.length || 0,
          subjects: tData.subjects?.length || 0,
          personal_goals: tData.personal_goals?.length || 0,
          monthIndex,
          quarterLabel,
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchPlan();
    fetchBooks();
    fetchSongs();
    fetchSubjects();
    fetchTopics();
    fetchEvents();
    loadProjects();
    loadTrimestral();
  }, [monthStr]);

  const updatePlanData = useCallback((updater: (prev: MonthlyPlanData) => MonthlyPlanData) => {
    setPlanData(prev => updater(prev));
  }, []);

  return {
    planData, loading, saving, monthStr,
    books, songs, projects, subjects, topics, events,
    trimestralData,
    updatePlanData, savePlan, fetchPlan,
  };
}
