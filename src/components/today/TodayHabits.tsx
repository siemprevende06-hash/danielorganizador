import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'activation-routine', name: 'Rutina Activación', completed: false },
  { id: 'gym', name: 'Ir al Gym', completed: false },
  { id: 'reading', name: 'Leer 20 páginas', completed: false },
  { id: 'piano', name: 'Practicar Piano', completed: false },
  { id: 'deactivation-routine', name: 'Rutina Desactivación', completed: false },
  { id: 'journaling', name: 'Journaling', completed: false }
];

export function TodayHabits() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: habitHistory } = await supabase
      .from('habit_history')
      .select('habit_id, completed_dates');

    const updatedHabits = DEFAULT_HABITS.map(habit => {
      const history = habitHistory?.find(h => h.habit_id === habit.id);
      let completed = false;
      
      if (history?.completed_dates) {
        const dates = history.completed_dates as any[];
        completed = dates.some((d: any) => d.date === today && d.status === 'completed');
      }
      
      return { ...habit, completed };
    });

    setHabits(updatedHabits);
    setLoading(false);
  };

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completed;

    // Check if record exists
    const { data: existing } = await supabase
      .from('habit_history')
      .select('id, completed_dates')
      .eq('habit_id', habitId)
      .maybeSingle();

    if (existing) {
      const dates = (existing.completed_dates as any[]) || [];
      const todayIndex = dates.findIndex((d: any) => d.date === today);
      
      if (newCompleted) {
        if (todayIndex === -1) {
          dates.push({ date: today, status: 'completed' });
        } else {
          dates[todayIndex].status = 'completed';
        }
      } else {
        if (todayIndex !== -1) {
          dates.splice(todayIndex, 1);
        }
      }

      await supabase
        .from('habit_history')
        .update({ completed_dates: dates })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('habit_history')
        .insert({
          habit_id: habitId,
          completed_dates: newCompleted ? [{ date: today, status: 'completed' }] : [],
          current_streak: newCompleted ? 1 : 0
        });
    }

    setHabits(prev => 
      prev.map(h => h.id === habitId ? { ...h, completed: newCompleted } : h)
    );

    toast.success(newCompleted ? 'Hábito completado' : 'Hábito desmarcado');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <button
          key={habit.id}
          onClick={() => toggleHabit(habit.id)}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
            ${habit.completed 
              ? 'bg-success/10 border border-success/20' 
              : 'bg-card hover:bg-muted border border-transparent'
            }
          `}
        >
          {habit.completed ? (
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
          <span className={habit.completed ? 'text-success' : 'text-foreground'}>
            {habit.name}
          </span>
        </button>
      ))}

      {/* Summary */}
      <div className="pt-3 mt-3 border-t border-border text-center">
        <span className="text-sm text-muted-foreground">
          {completedCount}/{habits.length} hábitos completados
        </span>
        {completedCount === habits.length && (
          <p className="text-success text-sm mt-1 font-medium">
            ¡Día perfecto! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
