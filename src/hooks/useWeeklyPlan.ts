import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface WeeklyAction {
  id: string;
  title: string;
  category: 'book' | 'song' | 'project' | 'subject' | 'personal';
  sourceId?: string;
  completed: boolean;
}

export interface WeeklyPlanData {
  weekStart: string;
  weekNumber: number;
  year: number;
  actions: WeeklyAction[];
  note: string;
}

const STORAGE_PREFIX = 'weekly_plan_';

function loadFromLocal(weekKey: string): WeeklyPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + weekKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToLocal(weekKey: string, data: WeeklyPlanData) {
  try { localStorage.setItem(STORAGE_PREFIX + weekKey, JSON.stringify(data)); } catch {}
}

export function useWeeklyPlan(weekDate: Date) {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const weekKey = format(weekStart, 'yyyy-MM-dd');
  const weekNumber = parseInt(format(weekStart, 'w'), 10);
  const year = weekStart.getFullYear();

  const [planData, setPlanData] = useState<WeeklyPlanData>({
    weekStart: weekKey, weekNumber, year, actions: [], note: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);

    const local = loadFromLocal(weekKey);
    if (local) {
      setPlanData(local);
      setLoading(false);
    }

    try {
      const s = format(weekStart, 'yyyy-MM-dd');
      const e = format(weekEnd, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('weekly_objectives')
        .select('*')
        .gte('week_start_date', s)
        .lte('week_start_date', e)
        .order('created_at');

      if (!error && data && data.length > 0) {
        const actions: WeeklyAction[] = data.map((obj: any) => ({
          id: obj.id,
          title: obj.title,
          category: mapAreaToCategory(obj.area),
          completed: obj.completed || false,
        }));
        const remote: WeeklyPlanData = {
          weekStart: weekKey, weekNumber, year,
          actions, note: '',
        };
        setPlanData(remote);
        saveToLocal(weekKey, remote);
      } else if (!local) {
        setPlanData({ weekStart: weekKey, weekNumber, year, actions: [], note: '' });
      }
    } catch {
      if (!local) setPlanData({ weekStart: weekKey, weekNumber, year, actions: [], note: '' });
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    saveToLocal(weekKey, planData);

    try {
      for (const action of planData.actions) {
        const s = format(weekStart, 'yyyy-MM-dd');
        if (action.id.startsWith('local_')) {
          await supabase.from('weekly_objectives').insert({
            week_start_date: s, area: 'general',
            title: action.title, target_value: 1, current_value: action.completed ? 1 : 0,
            completed: action.completed,
          });
        } else {
          await supabase.from('weekly_objectives').update({
            completed: action.completed,
            current_value: action.completed ? 1 : 0,
          }).eq('id', action.id);
        }
      }
    } catch {}

    setSaving(false);
  }, [weekKey, planData]);

  const addAction = useCallback((action: Omit<WeeklyAction, 'id'>) => {
    const newAction: WeeklyAction = { ...action, id: `local_${Date.now()}` };
    setPlanData(prev => ({ ...prev, actions: [...prev.actions, newAction] }));
    saveToLocal(weekKey, { ...planData, actions: [...planData.actions, newAction] });
  }, [weekKey, planData]);

  const toggleAction = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a),
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setPlanData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id),
    }));
  }, []);

  const updatePlanData = useCallback((updater: (prev: WeeklyPlanData) => WeeklyPlanData) => {
    setPlanData(prev => updater(prev));
  }, []);

  return {
    planData, loading, saving, weekKey, weekNumber, year,
    fetchPlan, savePlan, addAction, toggleAction, removeAction, updatePlanData,
  };
}

function mapAreaToCategory(area: string): WeeklyAction['category'] {
  if (area === 'lectura') return 'book';
  if (area === 'musica' || area === 'piano' || area === 'guitarra') return 'song';
  if (area === 'proyectos') return 'project';
  if (area === 'universidad') return 'subject';
  return 'personal';
}
