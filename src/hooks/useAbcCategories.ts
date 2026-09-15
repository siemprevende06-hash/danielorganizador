import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { TaskItem } from '@/hooks/useDailyPlanData';

export type AbcCategory = 'a' | 'b' | 'c' | 'd';

export const abcStorageKey = (date: Date) => `abc_${format(date, 'yyyy-MM-dd')}`;

export const ABC_ORDER: AbcCategory[] = ['a', 'b', 'c', 'd'];

const sourceOf = (t: TaskItem): string => {
  const raw = ((t.area_id || t.source || 'general') as string).toLowerCase();
  return raw === 'proyectos' ? 'project' : raw;
};

const taskScore = (t: TaskItem): number => {
  let s = 0;
  if (t.priority === 'high') s += 4;
  else if (t.priority === 'medium') s += 3;
  else if (t.priority === 'low') s += 2;
  else s += 1;
  const src = sourceOf(t);
  if (src === 'entrepreneurship') s += 2;
  else if (src === 'university') s += 1;
  else if (src === 'project') s += 0.5;
  return s;
};

const bucketIndex = (pos: number, size: number): number =>
  size <= 1 ? 0 : Math.min(3, Math.floor((pos * 4) / size));

const catOf = (idx: number): AbcCategory => (idx === 3 ? 'a' : idx === 2 ? 'b' : idx === 1 ? 'c' : 'd');

const readStored = (key: string): Record<string, AbcCategory> | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, AbcCategory>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export function useAbcCategories(tasks: TaskItem[], date: Date) {
  const [map, setMap] = useState<Record<string, AbcCategory>>(() => readStored(abcStorageKey(date)) || {});

  useEffect(() => {
    setMap(readStored(abcStorageKey(date)) || {});
  }, [date]);

  useEffect(() => {
    setMap(prev => {
      const pending = tasks.filter(t => !t.completed);
      if (pending.length === 0) return prev;
      const sorted = [...pending].sort((x, y) => taskScore(x) - taskScore(y));
      const n = sorted.length;
      const next = { ...prev };
      let changed = false;
      sorted.forEach((t, i) => {
        if (next[t.id]) return;
        next[t.id] = catOf(bucketIndex(i, n));
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [tasks]);

  const move = useCallback((taskId: string, cat: AbcCategory) => {
    setMap(prev => {
      const next = { ...prev, [taskId]: cat };
      try {
        localStorage.setItem(abcStorageKey(date), JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, [date]);

  const rotate = useCallback((taskId: string, dir: 1 | -1) => {
    setMap(prev => {
      const cur = prev[taskId];
      if (!cur) return prev;
      const idx = ABC_ORDER.indexOf(cur);
      const nextCat = ABC_ORDER[(idx + dir + ABC_ORDER.length) % ABC_ORDER.length];
      const next = { ...prev, [taskId]: nextCat };
      try {
        localStorage.setItem(abcStorageKey(date), JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, [date]);

  return { map, move, rotate };
}