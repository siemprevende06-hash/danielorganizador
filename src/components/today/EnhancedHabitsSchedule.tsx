import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getCubaDate } from '@/lib/cubaTime';

interface Habit {
  id: string;
  title: string;
  time: string;
  period: 'morning' | 'day' | 'night';
}

const HABITS: Habit[] = [
  { id: 'meditation', title: 'Meditación', time: '5:00', period: 'morning' },
  { id: 'gym', title: 'Gym', time: '5:30-7:00', period: 'morning' },
  { id: 'water-morning', title: 'Agua 1L', time: 'antes 8:00', period: 'morning' },
  { id: 'walk', title: 'Caminata 10min', time: 'almuerzo', period: 'day' },
  { id: 'water-day', title: 'Agua 2L', time: 'antes 3:00 PM', period: 'day' },
  { id: 'sunlight', title: 'Luz solar 15min', time: 'mediodía', period: 'day' },
  { id: 'stretching', title: 'Estiramientos', time: '8:30 PM', period: 'night' },
  { id: 'skincare', title: 'Skincare', time: '8:45 PM', period: 'night' },
  { id: 'journaling', title: 'Journaling', time: '9:00 PM', period: 'night' },
];

// Key mirrors both the display state and the streak trigger key
const streakKey = (id: string) => `streak:enh_${id}`;

export const EnhancedHabitsSchedule = () => {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [rowId, setRowId] = useState<string | null>(null);
  const today = getCubaDate();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('daily_systems_tracking')
      .select('id, completions')
      .eq('tracking_date', today)
      .maybeSingle();
    const comp = (data?.completions as Record<string, any>) || {};
    const state: Record<string, boolean> = {};
    HABITS.forEach(h => {
      const v = comp[streakKey(h.id)];
      state[h.id] = v === true || v === 'true' || v === 'min' || v === 'max';
    });
    setCompleted(state);
    setRowId(data?.id ?? null);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const toggleHabit = async (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);

    // Read latest row to merge (avoid stale)
    const { data: row } = await supabase
      .from('daily_systems_tracking')
      .select('id, completions')
      .eq('tracking_date', today)
      .maybeSingle();

    const merged = { ...((row?.completions as Record<string, any>) || {}) };
    HABITS.forEach(h => {
      const key = streakKey(h.id);
      if (next[h.id]) merged[key] = 'min';
      else delete merged[key];
    });

    if (row?.id) {
      await supabase
        .from('daily_systems_tracking')
        .update({ completions: merged })
        .eq('id', row.id);
      setRowId(row.id);
    } else {
      const { data: inserted } = await supabase
        .from('daily_systems_tracking')
        .upsert(
          { tracking_date: today, completions: merged },
          { onConflict: 'tracking_date' }
        )
        .select('id')
        .single();
      setRowId(inserted?.id ?? null);
    }
  };

  const groupedHabits = {
    morning: HABITS.filter(h => h.period === 'morning'),
    day: HABITS.filter(h => h.period === 'day'),
    night: HABITS.filter(h => h.period === 'night'),
  };

  const completedCount = HABITS.filter(h => completed[h.id]).length;
  const totalCount = HABITS.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const renderPeriod = (title: string, icon: string, list: Habit[], timeRange: string) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-xs">({timeRange})</span>
      </div>
      <div className="space-y-1 pl-6">
        {list.map(habit => {
          const isDone = !!completed[habit.id];
          return (
            <div
              key={habit.id}
              className={cn(
                "flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors",
                isDone && "bg-green-500/10"
              )}
            >
              <Checkbox
                checked={isDone}
                onCheckedChange={() => toggleHabit(habit.id)}
                className="h-4 w-4"
              />
              <span className={cn("text-sm flex-1", isDone && "line-through text-muted-foreground")}>
                {habit.title}
              </span>
              <span className="text-xs text-muted-foreground">{habit.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            📋 Hábitos del Día
          </CardTitle>
          <Badge variant={percentage >= 80 ? "default" : "secondary"}>
            {completedCount}/{totalCount} ({percentage}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPeriod('MAÑANA', '☀️', groupedHabits.morning, '5-8 AM')}
        {renderPeriod('DÍA', '🌤️', groupedHabits.day, '8 AM - 6 PM')}
        {renderPeriod('NOCHE', '🌙', groupedHabits.night, '6-9 PM')}
      </CardContent>
    </Card>
  );
};
