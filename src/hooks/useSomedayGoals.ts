import { useCallback, useEffect, useRef, useState } from 'react';
import {
  categoryForSystem,
  generateDreamId,
  loadSomedayGoals,
  saveSomedayGoals,
  subscribeSomedayGoals,
  type DreamItem,
  type DreamPriority,
} from '@/lib/somedayGoals';

export interface NewDreamInput {
  title: string;
  description?: string;
  category?: string;
  priority?: DreamPriority;
  systemId?: string | null;
}

export interface UseSomedayGoalsResult {
  items: DreamItem[];
  addItem: (input: NewDreamInput) => DreamItem;
  updateItem: (id: string, patch: Partial<Omit<DreamItem, 'id'>>) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  refresh: () => void;
}

/**
 * Store compartido de Algún Día. La misma lista alimenta la página Algún Día
 * y la vista "Algún día" de Metas Sistemas.
 */
export function useSomedayGoals(): UseSomedayGoalsResult {
  const [items, setItems] = useState<DreamItem[]>(() => loadSomedayGoals());
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => subscribeSomedayGoals(() => {
    const next = loadSomedayGoals();
    itemsRef.current = next;
    setItems(next);
  }), []);

  const commit = useCallback((updater: (prev: DreamItem[]) => DreamItem[]) => {
    const next = updater(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    saveSomedayGoals(next);
  }, []);

  const addItem = useCallback((input: NewDreamInput): DreamItem => {
    const now = new Date().toISOString();
    const item: DreamItem = {
      id: generateDreamId(),
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category || categoryForSystem(input.systemId || ''),
      completed: false,
      priority: input.priority || 'medium',
      dateAdded: now,
      systemId: input.systemId || null,
      updatedAt: now,
    };
    commit(prev => [...prev, item]);
    return item;
  }, [commit]);

  const updateItem = useCallback((
    id: string,
    patch: Partial<Omit<DreamItem, 'id'>>,
  ) => {
    commit(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        ...patch,
        title: patch.title != null ? patch.title.trim() : item.title,
        description: patch.description != null ? patch.description : item.description,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [commit]);

  const removeItem = useCallback((id: string) => {
    commit(prev => prev.filter(item => item.id !== id));
  }, [commit]);

  const toggleItem = useCallback((id: string) => {
    commit(prev => prev.map(item => item.id === id
      ? { ...item, completed: !item.completed, updatedAt: new Date().toISOString() }
      : item));
  }, [commit]);

  const refresh = useCallback(() => {
    const next = loadSomedayGoals();
    itemsRef.current = next;
    setItems(next);
  }, []);

  return { items, addItem, updateItem, removeItem, toggleItem, refresh };
}
