import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const useRoutineCompletions = (routineType: 'activation' | 'deactivation') => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const loadCompletions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('routine_completions')
          .select('*')
          .eq('routine_type', routineType)
          .eq('completion_date', today)
          .maybeSingle();

        if (error) throw error;

        const localKey = routineType === 'activation' ? 'activationRoutine' : 'deactivationRoutine';

        if (data) {
          setCompletedTasks(new Set(data.completed_tasks as string[] || []));
        } else {
          // Check migration
          const stored = localStorage.getItem(localKey);
          if (stored) {
            const localTasks = JSON.parse(stored) as string[];
            await supabase.from('routine_completions').upsert({
              routine_type: routineType,
              completion_date: today,
              completed_tasks: localTasks,
            }, { onConflict: 'routine_type,completion_date' });
            setCompletedTasks(new Set(localTasks));
            localStorage.removeItem(localKey);
          }
        }
      } catch (error) {
        console.error('Error loading routine completions:', error);
        const localKey = routineType === 'activation' ? 'activationRoutine' : 'deactivationRoutine';
        const stored = localStorage.getItem(localKey);
        if (stored) setCompletedTasks(new Set(JSON.parse(stored)));
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletions();
  }, [routineType, today]);

  const toggleTask = useCallback(async (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);

    try {
      await supabase.from('routine_completions').upsert({
        routine_type: routineType,
        completion_date: today,
        completed_tasks: Array.from(newCompleted),
      }, { onConflict: 'routine_type,completion_date' });
    } catch (error) {
      console.error('Error saving routine completion:', error);
    }
  }, [completedTasks, routineType, today]);

  return { completedTasks, isLoading, toggleTask };
};
