import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, HabitHistory } from '@/lib/definitions';

interface Habit {
  id: string;
  title: string;
}

export default function WeeklyView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});

  useEffect(() => {
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

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, []);

  const getHabitCompletionForDay = (habitId: string, day: Date) => {
    const habitData = habitHistory[habitId];
    if (!habitData) return false;
    return (habitData.completedDates || []).some(d => {
      const entryDate = new Date(d.date);
      return isSameDay(entryDate, day);
    });
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => task.dueDate && isSameDay(new Date(task.dueDate), day));
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Vista Semanal</h1>
        <p className="text-muted-foreground">Resumen de tu semana</p>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const completedTasks = dayTasks.filter(t => t.status === 'completada').length;
          const completedHabits = habits.filter(h => getHabitCompletionForDay(h.id, day)).length;

          return (
            <Card key={day.toISOString()} className="min-h-[200px]">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">
                  {format(day, 'EEE', { locale: es })}
                  <br />
                  <span className="text-xs text-muted-foreground">{format(day, 'd MMM')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <div className="text-xs">
                  <p className="font-semibold">Hábitos</p>
                  <p className="text-muted-foreground">{completedHabits}/{habits.length}</p>
                </div>
                <div className="text-xs">
                  <p className="font-semibold">Tareas</p>
                  <p className="text-muted-foreground">{completedTasks}/{dayTasks.length}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
