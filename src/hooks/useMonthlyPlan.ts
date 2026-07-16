import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyPlanData {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  subjects: { subject_id: string; topics: string[] }[];
  events: string[];
  personal_goals: { title: string; target?: string }[];
  inherited_from?: { quarter: number; year: number };
  distribution?: Record<string, { books: string[]; songs: string[] }>;

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

  const fetchPlan = useCallback(() => {
    setLoading(true);
    const local = loadFromLocal(monthStr);
    setPlanData(local || defaultPlanData);
    setLoading(false);
  }, [monthStr]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(monthStr, planData);
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
  }, [monthStr, planData]);

  const loadLocalData = useCallback(() => {
    try {
      const storedBooks = localStorage.getItem('reading_library');
      if (storedBooks) setBooks(JSON.parse(storedBooks));
      const storedSongs = localStorage.getItem('music_repertoire');
      if (storedSongs) setSongs(JSON.parse(storedSongs));
      const storedProjects = localStorage.getItem('userProjects');
      if (storedProjects) setProjects(JSON.parse(storedProjects));
      const storedSubjects = localStorage.getItem('university_subjects');
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
      const storedTopics = localStorage.getItem('subject_topics');
      if (storedTopics) setTopics(JSON.parse(storedTopics));
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) setEvents(JSON.parse(storedEvents));
    } catch {}
  }, []);

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
