import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  source: string;
  area_id?: string;
}

export function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Load regular tasks
    const { data: regularTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, source, area_id')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`)
      .order('priority', { ascending: false });

    // Load entrepreneurship tasks
    const { data: entrepreneurshipTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, title, completed')
      .eq('due_date', today);

    const mapped: Task[] = [
      ...(regularTasks || []).map(t => ({
        ...t,
        source: t.source || 'general'
      })),
      ...(entrepreneurshipTasks || []).map(t => ({
        ...t,
        source: 'entrepreneurship',
        priority: 'medium'
      }))
    ];

    // Sort by priority and completion
    mapped.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0);
    });

    setTasks(mapped);
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    
    const { error } = await supabase
      .from(table)
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (error) {
      toast.error('Error al actualizar tarea');
      return;
    }

    setTasks(prev => 
      prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
    );
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-destructive';
      case 'medium':
        return 'border-l-4 border-l-foreground';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      university: 'Uni',
      entrepreneurship: 'Emp',
      projects: 'Proy',
      general: 'Gen'
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay tareas para hoy</p>
        <p className="text-sm mt-1">¡Día libre o añade tareas!</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-2">
      {/* Pending tasks */}
      {pendingTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => toggleTask(task)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted transition-all text-left ${getPriorityStyle(task.priority)}`}
        >
          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-foreground">{task.title}</span>
          <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
            {getSourceLabel(task.source)}
          </span>
          {task.priority === 'high' && (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </button>
      ))}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="pt-2 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Completadas ({completedTasks.length})
          </p>
          {completedTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-all text-left"
            >
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <span className="flex-1 line-through text-muted-foreground">{task.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
