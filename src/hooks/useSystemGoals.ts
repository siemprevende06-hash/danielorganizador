import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateGoalId,
  loadSystemGoals,
  saveSystemGoals,
  subscribeSystemGoals,
  type SystemGoal,
} from '@/lib/systemGoals';

export interface NewSystemGoalInput {
  systemId: string;
  title: string;
  objective?: string;
  /** yyyy-MM-dd */
  date: string;
}

export interface UseSystemGoalsResult {
  goals: SystemGoal[];
  addGoal: (input: NewSystemGoalInput) => SystemGoal;
  updateGoal: (id: string, patch: Partial<Omit<SystemGoal, 'id'>>) => void;
  removeGoal: (id: string) => void;
  toggleGoal: (id: string) => void;
  refresh: () => void;
}

/**
 * CRUD de metas con fecha. Se sincroniza entre componentes de la misma
 * pestaña (evento propio) y entre pestañas (evento storage).
 */
export function useSystemGoals(): UseSystemGoalsResult {
  const [goals, setGoals] = useState<SystemGoal[]>(() => loadSystemGoals());
  const goalsRef = useRef(goals);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  useEffect(() => subscribeSystemGoals(() => {
    const next = loadSystemGoals();
    goalsRef.current = next;
    setGoals(next);
  }), []);

  const commit = useCallback((updater: (prev: SystemGoal[]) => SystemGoal[]) => {
    const next = updater(goalsRef.current);
    goalsRef.current = next;
    setGoals(next);
    saveSystemGoals(next);
  }, []);

  const addGoal = useCallback((input: NewSystemGoalInput): SystemGoal => {
    const now = new Date().toISOString();
    const goal: SystemGoal = {
      id: generateGoalId(),
      systemId: input.systemId,
      title: input.title.trim(),
      objective: input.objective?.trim() || undefined,
      date: input.date,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    commit(prev => [...prev, goal]);
    return goal;
  }, [commit]);

  const updateGoal = useCallback((
    id: string,
    patch: Partial<Omit<SystemGoal, 'id'>>,
  ) => {
    commit(prev => prev.map(goal => {
      if (goal.id !== id) return goal;
      return {
        ...goal,
        ...patch,
        title: patch.title != null ? patch.title.trim() : goal.title,
        objective: patch.objective != null ? (patch.objective.trim() || undefined) : goal.objective,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [commit]);

  const removeGoal = useCallback((id: string) => {
    commit(prev => prev.filter(goal => goal.id !== id));
  }, [commit]);

  const toggleGoal = useCallback((id: string) => {
    const now = new Date().toISOString();
    commit(prev => prev.map(goal => {
      if (goal.id !== id) return goal;
      const completed = !goal.completed;
      return {
        ...goal,
        completed,
        completedAt: completed ? now : null,
        updatedAt: now,
      };
    }));
  }, [commit]);

  const refresh = useCallback(() => {
    const next = loadSystemGoals();
    goalsRef.current = next;
    setGoals(next);
  }, []);

  return { goals, addGoal, updateGoal, removeGoal, toggleGoal, refresh };
}
