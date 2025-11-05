import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { isToday, parseISO, formatISO } from 'date-fns';
import type { Task, HabitHistory } from '@/lib/definitions';
import { Flame } from 'lucide-react';

interface Habit {
  id: string;
  title: string;
}

export default function DailyView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks, (key, value) => (key === 'dueDate' && value ? new Date(value) : value)));
    }
    const storedHabits = localStorage.getItem('userHabits');
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    }
    const storedHistory = localStorage.getItem('habitHistory');
    if (storedHistory) {
      setHabitHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    if (isClient && tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('habitHistory', JSON.stringify(habitHistory));
    }
  }, [habitHistory, isClient]);

  const todayTasks = useMemo(() => tasks.filter(task => task.dueDate && isToday(new Date(task.dueDate))), [tasks]);

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: t.status === 'completada' ? 'pendiente' : 'completada', completed: !t.completed }
          : t
      )
    );
  };

  const toggleHabit = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: 'date' });
    setHabitHistory(prev => {
      const habitData = prev[habitId] || { completedDates: [], currentStreak: 0, longestStreak: 0 };
      const completedDates = [...(habitData.completedDates || [])];
      const todayIndex = completedDates.findIndex(d => d.date === todayStr);

      if (todayIndex > -1) {
        completedDates.splice(todayIndex, 1);
      } else {
        completedDates.push({ date: todayStr, status: 'completed' as const });
      }

      return {
        ...prev,
        [habitId]: {
          ...habitData,
          completedDates,
        }
      };
    });
  };

  const isHabitCompleted = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: 'date' });
    const habitData = habitHistory[habitId];
    if (!habitData) return false;
    return (habitData.completedDates || []).some(d => d.date === todayStr);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Vista Diaria</h1>
        <p className="text-muted-foreground">Tus hábitos y tareas de hoy</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hábitos de Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.map((habit) => {
              const habitData = habitHistory[habit.id] || { completedDates: [], currentStreak: 0, longestStreak: 0 };
              const isCompleted = isHabitCompleted(habit.id);
              
              return (
                <div key={habit.id} className={`flex items-center justify-between p-3 rounded-md border ${isCompleted ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleHabit(habit.id)}
                    />
                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{habit.title}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {habitData.currentStreak}
                  </span>
                </div>
              );
            })}
            {habits.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay hábitos registrados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tareas de Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((task) => (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-md border ${task.status === 'completada' ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                <Checkbox
                  checked={task.status === 'completada'}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className="flex-1">
                  <p className={task.status === 'completada' ? 'line-through text-muted-foreground' : ''}>{task.title}</p>
                  {task.priority && (
                    <span className="text-xs text-muted-foreground capitalize">Prioridad: {task.priority}</span>
                  )}
                </div>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay tareas para hoy</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
