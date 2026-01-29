import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  title: string;
  time: string;
  period: 'morning' | 'day' | 'night';
  completed: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  // Morning (5-8 AM)
  { id: 'meditation', title: 'Meditación', time: '5:00', period: 'morning', completed: false },
  { id: 'gym', title: 'Gym', time: '5:30-7:00', period: 'morning', completed: false },
  { id: 'water-morning', title: 'Agua 1L', time: 'antes 8:00', period: 'morning', completed: false },
  
  // Day (8 AM - 6 PM)
  { id: 'walk', title: 'Caminata 10min', time: 'almuerzo', period: 'day', completed: false },
  { id: 'water-day', title: 'Agua 2L', time: 'antes 3:00 PM', period: 'day', completed: false },
  { id: 'sunlight', title: 'Luz solar 15min', time: 'mediodía', period: 'day', completed: false },
  
  // Night (6-9 PM)
  { id: 'stretching', title: 'Estiramientos', time: '8:30 PM', period: 'night', completed: false },
  { id: 'skincare', title: 'Skincare', time: '8:45 PM', period: 'night', completed: false },
  { id: 'journaling', title: 'Journaling', time: '9:00 PM', period: 'night', completed: false },
];

export const EnhancedHabitsSchedule = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('enhanced-habits-schedule');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's from today
      if (parsed.date === new Date().toISOString().split('T')[0]) {
        return parsed.habits;
      }
    }
    return DEFAULT_HABITS;
  });

  useEffect(() => {
    localStorage.setItem('enhanced-habits-schedule', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      habits,
    }));
  }, [habits]);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  const groupedHabits = {
    morning: habits.filter(h => h.period === 'morning'),
    day: habits.filter(h => h.period === 'day'),
    night: habits.filter(h => h.period === 'night'),
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const renderPeriod = (
    title: string, 
    icon: string, 
    habits: Habit[], 
    timeRange: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-xs">({timeRange})</span>
      </div>
      <div className="space-y-1 pl-6">
        {habits.map(habit => (
          <div 
            key={habit.id}
            className={cn(
              "flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors",
              habit.completed && "bg-green-500/10"
            )}
          >
            <Checkbox
              checked={habit.completed}
              onCheckedChange={() => toggleHabit(habit.id)}
              className="h-4 w-4"
            />
            <span className={cn(
              "text-sm flex-1",
              habit.completed && "line-through text-muted-foreground"
            )}>
              {habit.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {habit.time}
            </span>
          </div>
        ))}
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
