import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PeriodPlanTask {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  area_id: string | null;
  source: string | null;
  task_type: string | null;
}

/**
 * Tareas con vencimiento dentro del periodo (día, semana o mes) para la
 * pestaña Planificación. La marca de completado se guarda al instante.
 */
export function usePeriodPlanTasks(start: Date, end: Date) {
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tasks, setTasks] = useState<PeriodPlanTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, completed, due_date, area_id, source, task_type')
        .gte('due_date', `${startKey}T00:00:00`)
        .lte('due_date', `${endKey}T23:59:59`)
        .order('due_date', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('Error loading period tasks:', error);
        setTasks([]);
      } else {
        setTasks((data || []).map((t) => ({
          id: t.id,
          title: t.title || 'Tarea',
          completed: Boolean(t.completed),
          due_date: t.due_date ?? null,
          area_id: t.area_id ?? null,
          source: t.source ?? null,
          task_type: t.task_type ?? null,
        })));
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [startKey, endKey]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next = !task.completed;

    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: next } : t)));

    const { error } = await supabase.from('tasks').update({ completed: next }).eq('id', id);
    if (error) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !next } : t)));
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['weeklyData'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['resultados'] });
    }
  }, [tasks, toast, queryClient]);

  return { tasks, loading, toggleTask };
}
