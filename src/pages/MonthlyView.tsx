import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, HabitHistory } from '@/lib/definitions';

interface Habit {
  id: string;
  title: string;
}

export default function MonthlyView() {
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

  const monthDays = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
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
        <h1 className="text-3xl font-headline font-bold">Vista Mensual</h1>
        <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale: es })}</p>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center text-sm font-semibold p-2">{day}</div>
        ))}
        {monthDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const completedTasks = dayTasks.filter(t => t.status === 'completada').length;
          const completedHabits = habits.filter(h => getHabitCompletionForDay(h.id, day)).length;
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toISOString()} className={`min-h-[100px] ${isToday ? 'border-primary' : ''}`}>
              <CardHeader className="p-2">
                <CardTitle className="text-xs text-center">{format(day, 'd')}</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1">
                <div className="text-xs text-center">
                  <p className="text-muted-foreground">{completedHabits}/{habits.length}</p>
                </div>
                <div className="text-xs text-center">
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
