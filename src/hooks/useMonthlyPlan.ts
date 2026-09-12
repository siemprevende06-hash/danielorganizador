import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { pushSyncKey, pullPlansIntoLocal } from '@/lib/planSync';
import { syncMonthlyFromQuarter } from '@/lib/hierarchy';

export interface WeekBookSongDistribution {
  books: string[];
  songs: string[];
  book_pages?: number;
  book_minutes?: number;
  music_minutes?: number;
  music_focus?: string;
}

export interface MonthlyPlanData {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  subjects: { subject_id: string; topics: string[] }[];
  events: string[];
  personal_goals: { title: string; target?: string }[];
  inherited_from?: { quarter: number; year: number };
  distribution?: Record<string, { books: string[]; songs: string[] }>;
  week_distribution?: Record<string, WeekBookSongDistribution>;

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
  week_distribution: {},
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
  pushSyncKey(STORAGE_PREFIX + monthStr);
}

function getTrimestralData(month: Date): TrimestralSummary | null {
  const q = Math.ceil((month.getMonth() + 1) / 3);
  const y = month.getFullYear();
  const monthIndex = month.getMonth() - (q - 1) * 3;
  const quarterLabel = `Q${q} ${y}`;
  try {
    const raw = localStorage.getItem(`trimestral_plan_Q${q}_${y}`);
    if (raw) {
      const tData = JSON.parse(raw);
      return {
        books: { goal: tData.books?.goal || 0, selected: tData.books?.selected?.length || 0 },
        songs: { goal: tData.songs?.goal || 0, selected: tData.songs?.selected?.length || 0 },
        projects: tData.projects?.length || 0,
        subjects: tData.subjects?.length || 0,
        personal_goals: tData.personal_goals?.length || 0,
        monthIndex,
        quarterLabel,
      };
    }
  } catch {}
  return null;
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
    await pullPlansIntoLocal();
    const local = loadFromLocal(monthStr);
    const synced = syncMonthlyFromQuarter(month);
    if (synced) {
      const merged = { ...defaultPlanData, ...synced } as MonthlyPlanData;
      setPlanData(merged);
      if (!local) saveToLocal(monthStr, merged);
    } else {
      setPlanData(local || defaultPlanData);
    }
    setLoading(false);
  }, [monthStr, month]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(monthStr, planData);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
  }, [monthStr, planData]);

  const loadLocalData = useCallback(async () => {
    try {
      const mStart = format(startOfMonth(month), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(month), 'yyyy-MM-dd');
      const [booksRes, songsRes, eventsRes] = await Promise.all([
        supabase.from('reading_library').select('id, title, author, status').order('title'),
        supabase.from('music_repertoire').select('id, title, artist, instrument, status').order('title'),
        supabase.from('calendar_events').select('*')
          .gte('event_date', mStart)
          .lte('event_date', mEnd)
          .order('event_date'),
      ]);
      if (booksRes.error) throw booksRes.error;
      if (songsRes.error) throw songsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (booksRes.data) setBooks(booksRes.data);
      if (songsRes.data) setSongs(songsRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);

      try {
        const { data: projRows } = await supabase
          .from('projects')
          .select('id, title')
          .order('created_at', { ascending: true });
        if (projRows && projRows.length > 0) {
          setProjects(projRows.map((p: { id: string; title: string }) => ({ id: p.id, name: p.title, tasks: [] })));
        }
      } catch (e) { console.error('Error loading projects:', e); }

      try {
        const { data: subjRows } = await supabase
          .from('university_subjects')
          .select('id, name')
          .order('name');
        if (subjRows && subjRows.length > 0) {
          setSubjects(subjRows.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name, color: null })));
        }
      } catch (e) { console.error('Error loading subjects:', e); }

      try {
        const { data: topicRows } = await supabase
          .from('subject_topics')
          .select('id, subject_id, title')
          .order('title');
        if (topicRows && topicRows.length > 0) {
          setTopics(topicRows);
        }
      } catch (e) { console.error('Error loading topics:', e); }
    } catch (e) {
      console.error('Error loading monthly data:', e);
      const storedBooks = localStorage.getItem('reading_library');
      if (storedBooks) setBooks(JSON.parse(storedBooks));
      const storedSongs = localStorage.getItem('music_repertoire');
      if (storedSongs) setSongs(JSON.parse(storedSongs));
      try {
        const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
        if (data?.setting_value && Array.isArray(data.setting_value)) {
          setProjects(data.setting_value as unknown as Project[]);
        } else {
          const stored = localStorage.getItem('userProjects');
          if (stored) setProjects(JSON.parse(stored));
        }
      } catch { const stored = localStorage.getItem('userProjects'); if (stored) setProjects(JSON.parse(stored)); }
      const storedSubjects = localStorage.getItem('university_subjects');
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
      const storedTopics = localStorage.getItem('subject_topics');
      if (storedTopics) setTopics(JSON.parse(storedTopics));
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) setEvents(JSON.parse(storedEvents));
    }
  }, [month]);

  useEffect(() => {
    fetchPlan();
    loadLocalData();
    setTrimestralData(getTrimestralData(month));
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
