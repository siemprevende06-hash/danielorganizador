import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  area_id?: string;
  task_type?: string;
  routine_block_id?: string;
  source: 'tasks' | 'entrepreneurship';
}

interface HabitForToday {
  id: string;
  title: string;
  completed: boolean;
}

const AREA_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  universidad: { icon: '🎓', label: 'Universidad', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  emprendimiento: { icon: '💼', label: 'Emprendimiento', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  proyectos: { icon: '🚀', label: 'Proyectos', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' },
  gym: { icon: '💪', label: 'Gym', color: 'bg-green-500/20 text-green-700 dark:text-green-300' },
  idiomas: { icon: '🌍', label: 'Idiomas', color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' },
  lectura: { icon: '📖', label: 'Lectura', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  musica: { icon: '🎹', label: 'Música', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-300' },
  general: { icon: '📋', label: 'General', color: 'bg-muted text-muted-foreground' },
  development: { icon: '💻', label: 'Desarrollo', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
  marketing: { icon: '📢', label: 'Marketing', color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300' },
  operations: { icon: '⚙️', label: 'Operaciones', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
};

const DAILY_HABITS = [
  { id: 'gym', title: 'Gym 1 hora', area: 'gym' },
  { id: 'lectura', title: 'Lectura 30 min', area: 'lectura' },
  { id: 'musica', title: 'Piano o Guitarra', area: 'musica' },
  { id: 'meditacion', title: 'Meditación', area: 'general' },
  { id: 'journaling', title: 'Journaling', area: 'general' },
];

export function DailyActionPlan() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<HabitForToday[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadTasks();
    loadHabits();
  }, [todayStr]);

  const loadTasks = async () => {
    setLoading(true);

    const [tasksRes, entrepreneurshipRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .gte('due_date', `${todayStr}T00:00:00`)
        .lte('due_date', `${todayStr}T23:59:59`)
        .order('priority', { ascending: false }),
      supabase
        .from('entrepreneurship_tasks')
        .select('*')
        .eq('due_date', todayStr),
    ]);

    const allTasks: Task[] = [
      ...(tasksRes.data || []).map(t => ({ ...t, source: 'tasks' as const })),
      ...(entrepreneurshipRes.data || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: 'medium',
        task_type: t.task_type,
        routine_block_id: t.routine_block_id,
        source: 'entrepreneurship' as const,
      })),
    ];

    setTasks(allTasks);
    setLoading(false);
  };

  const loadHabits = async () => {
    const { data: habitHistory } = await supabase
      .from('habit_history')
      .select('habit_id, completed_dates');

    const habitsWithStatus = DAILY_HABITS.map(habit => {
      const history = habitHistory?.find(h => h.habit_id === habit.id);
      const completedDates = (history?.completed_dates as any[]) || [];
      const todayEntry = completedDates.find((d: any) => d.date === todayStr && d.status === 'completed');
      
      return {
        id: habit.id,
        title: habit.title,
        completed: !!todayEntry,
      };
    });

    setHabits(habitsWithStatus);
  };

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;

    if (task.source === 'tasks') {
      await supabase
        .from('tasks')
        .update({ completed: newCompleted, status: newCompleted ? 'completada' : 'pendiente' })
        .eq('id', task.id);
    } else {
      await supabase
        .from('entrepreneurship_tasks')
        .update({ completed: newCompleted })
        .eq('id', task.id);
    }

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
  };

  const toggleHabit = async (habit: HabitForToday) => {
    const newCompleted = !habit.completed;

    // Get current habit history
    const { data: existing } = await supabase
      .from('habit_history')
      .select('*')
      .eq('habit_id', habit.id)
      .single();

    if (existing) {
      const completedDates = (existing.completed_dates as any[]) || [];
      const filtered = completedDates.filter((d: any) => d.date !== todayStr);
      
      if (newCompleted) {
        filtered.push({ date: todayStr, status: 'completed' });
      }

      await supabase
        .from('habit_history')
        .update({ completed_dates: filtered })
        .eq('habit_id', habit.id);
    } else if (newCompleted) {
      await supabase
        .from('habit_history')
        .insert({
          habit_id: habit.id,
          completed_dates: [{ date: todayStr, status: 'completed' }],
        });
    }

    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completed: newCompleted } : h));
  };

  const getAreaConfig = (task: Task) => {
    const areaId = (task.area_id || task.task_type || 'general').toLowerCase();
    return AREA_CONFIG[areaId] || AREA_CONFIG.general;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const highPriority = tasks.filter(t => t.priority?.toLowerCase() === 'high' && !t.completed);
  const mediumPriority = tasks.filter(t => t.priority?.toLowerCase() !== 'high' && !t.completed);
  const completed = tasks.filter(t => t.completed);
  const incompleteHabits = habits.filter(h => !h.completed);
  const completedHabits = habits.filter(h => h.completed);

  const totalItems = tasks.length + habits.length;
  const completedItems = completed.length + completedHabits.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            📋 Mi Plan de Hoy
          </CardTitle>
          <Badge variant={completedItems === totalItems && totalItems > 0 ? "default" : "secondary"}>
            {completedItems}/{totalItems} completadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              ALTA PRIORIDAD
            </div>
            {highPriority.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTask(task)}
                areaConfig={getAreaConfig(task)}
              />
            ))}
          </div>
        )}

        {/* Medium/Low Priority */}
        {mediumPriority.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              TAREAS DEL DÍA
            </div>
            {mediumPriority.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTask(task)}
                areaConfig={getAreaConfig(task)}
              />
            ))}
          </div>
        )}

        {/* Habits */}
        {(incompleteHabits.length > 0 || completedHabits.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <Circle className="w-4 h-4" />
              HÁBITOS DEL DÍA
            </div>
            {incompleteHabits.map(habit => (
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                onToggle={() => toggleHabit(habit)}
              />
            ))}
            {completedHabits.map(habit => (
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                onToggle={() => toggleHabit(habit)}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <div className="space-y-2 opacity-60">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              COMPLETADAS ({completed.length})
            </div>
            {completed.slice(0, 3).map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTask(task)}
                areaConfig={getAreaConfig(task)}
              />
            ))}
            {completed.length > 3 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{completed.length - 3} más completadas
              </p>
            )}
          </div>
        )}

        {totalItems === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No hay tareas programadas para hoy</p>
            <p className="text-sm">Agrega tareas en el Planificador</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskItem({ 
  task, 
  onToggle, 
  areaConfig 
}: { 
  task: Task; 
  onToggle: () => void;
  areaConfig: { icon: string; label: string; color: string };
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-all",
      "hover:bg-muted/50",
      task.completed && "opacity-50"
    )}>
      <Checkbox 
        checked={task.completed}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", areaConfig.color)}>
        {areaConfig.icon} {areaConfig.label}
      </Badge>
    </div>
  );
}

function HabitItem({ 
  habit, 
  onToggle 
}: { 
  habit: HabitForToday; 
  onToggle: () => void;
}) {
  const habitConfig = DAILY_HABITS.find(h => h.id === habit.id);
  const areaConfig = AREA_CONFIG[habitConfig?.area || 'general'] || AREA_CONFIG.general;

  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-all",
      "hover:bg-muted/50",
      habit.completed && "opacity-50"
    )}>
      <Checkbox 
        checked={habit.completed}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          habit.completed && "line-through text-muted-foreground"
        )}>
          {habit.title}
        </p>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", areaConfig.color)}>
        {areaConfig.icon}
      </Badge>
    </div>
  );
}
