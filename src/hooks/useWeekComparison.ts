import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

interface WeekData {
  tasksCompleted: number;
  focusMinutes: number;
  blocksCompleted: number;
  habitsCompleted: number;
}

export function useWeekComparison(anchorDate?: Date) {
  const [thisWeek, setThisWeek] = useState<WeekData>({ tasksCompleted: 0, focusMinutes: 0, blocksCompleted: 0, habitsCompleted: 0 });
  const [lastWeek, setLastWeek] = useState<WeekData>({ tasksCompleted: 0, focusMinutes: 0, blocksCompleted: 0, habitsCompleted: 0 });
  const [loading, setLoading] = useState(true);

  const base = anchorDate ? startOfWeek(anchorDate, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisStart = format(base, 'yyyy-MM-dd');
  const lastStart = format(startOfWeek(subWeeks(base, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const lastEnd = thisStart;

      // This week tasks
      const { count: twTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('completed', true).gte('updated_at', thisStart);
      // Last week tasks
      const { count: lwTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('completed', true).gte('updated_at', lastStart).lt('updated_at', lastEnd);

      // This week focus
      const { data: twFocus } = await supabase.from('focus_sessions').select('duration_minutes')
        .eq('completed', true).gte('start_time', thisStart);
      const { data: lwFocus } = await supabase.from('focus_sessions').select('duration_minutes')
        .eq('completed', true).gte('start_time', lastStart).lt('start_time', lastEnd);

      // Block completions
      const { count: twBlocks } = await supabase.from('block_completions').select('*', { count: 'exact', head: true })
        .eq('completed', true).gte('completion_date', thisStart);
      const { count: lwBlocks } = await supabase.from('block_completions').select('*', { count: 'exact', head: true })
        .eq('completed', true).gte('completion_date', lastStart).lt('completion_date', lastEnd);

      setThisWeek({
        tasksCompleted: twTasks || 0,
        focusMinutes: twFocus?.reduce((s, f) => s + (f.duration_minutes || 0), 0) || 0,
        blocksCompleted: twBlocks || 0,
        habitsCompleted: 0,
      });
      setLastWeek({
        tasksCompleted: lwTasks || 0,
        focusMinutes: lwFocus?.reduce((s, f) => s + (f.duration_minutes || 0), 0) || 0,
        blocksCompleted: lwBlocks || 0,
        habitsCompleted: 0,
      });
      setLoading(false);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisStart, lastStart]);

  return { thisWeek, lastWeek, loading };
}
