import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { CheckSquare, Target, Flame, Clock, Zap } from "lucide-react";

interface Stats {
  blocksCompleted: number;
  blocksTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
  streak: number;
}

export function TodayStats() {
  const [stats, setStats] = useState<Stats>({
    blocksCompleted: 0,
    blocksTotal: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    habitsCompleted: 0,
    habitsTotal: 6,
    focusMinutes: 0,
    streak: 0
  });
  const { blocks, getCurrentBlock } = useRoutineBlocksDB();

  useEffect(() => {
    loadStats();
  }, [blocks]);

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Calculate completed blocks based on time
    let blocksCompleted = 0;
    blocks.forEach(block => {
      const [endH, endM] = block.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      if (currentMinutes >= endMinutes) {
        blocksCompleted++;
      }
    });

    // Load tasks for today
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, completed')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    const { data: entrepreneurshipTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, completed')
      .eq('due_date', today);

    const allTasks = [...(tasks || []), ...(entrepreneurshipTasks || [])];
    const tasksCompleted = allTasks.filter(t => t.completed).length;

    // Load routine completions for streak
    const { data: completions } = await supabase
      .from('routine_completions')
      .select('completion_date')
      .order('completion_date', { ascending: false })
      .limit(30);

    let streak = 0;
    if (completions) {
      const dates = completions.map(c => c.completion_date);
      const uniqueDates = [...new Set(dates)].sort().reverse();
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedStr = expectedDate.toISOString().split('T')[0];
        
        if (uniqueDates.includes(expectedStr)) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Calculate focus minutes (estimate based on completed blocks)
    const focusMinutes = blocksCompleted * 90; // Approximate 90 min per block

    // Load habits completed today
    const { data: habitHistory } = await supabase
      .from('habit_history')
      .select('completed_dates');

    let habitsCompleted = 0;
    if (habitHistory) {
      habitHistory.forEach(h => {
        const dates = h.completed_dates as any[];
        if (dates?.some((d: any) => d.date === today && d.status === 'completed')) {
          habitsCompleted++;
        }
      });
    }

    setStats({
      blocksCompleted,
      blocksTotal: blocks.length,
      tasksCompleted,
      tasksTotal: allTasks.length,
      habitsCompleted,
      habitsTotal: habitHistory?.length || 6,
      focusMinutes,
      streak
    });
  };

  const statItems = [
    {
      icon: Target,
      label: 'Bloques',
      value: `${stats.blocksCompleted}/${stats.blocksTotal}`,
      percentage: stats.blocksTotal > 0 ? (stats.blocksCompleted / stats.blocksTotal) * 100 : 0
    },
    {
      icon: CheckSquare,
      label: 'Tareas',
      value: `${stats.tasksCompleted}/${stats.tasksTotal}`,
      percentage: stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0
    },
    {
      icon: Zap,
      label: 'Hábitos',
      value: `${stats.habitsCompleted}/${stats.habitsTotal}`,
      percentage: stats.habitsTotal > 0 ? (stats.habitsCompleted / stats.habitsTotal) * 100 : 0
    },
    {
      icon: Clock,
      label: 'Foco',
      value: `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`,
      percentage: null
    },
    {
      icon: Flame,
      label: 'Racha',
      value: `${stats.streak} días`,
      percentage: null,
      highlight: stats.streak >= 3
    }
  ];

  return (
    <div className="space-y-3">
      {statItems.map((item, index) => (
        <div key={index} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${item.highlight ? 'bg-foreground text-background' : 'bg-muted'}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{item.value}</span>
            {item.percentage !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                item.percentage >= 75 ? 'bg-success/20 text-success' :
                item.percentage >= 50 ? 'bg-muted text-muted-foreground' :
                'bg-destructive/20 text-destructive'
              }`}>
                {Math.round(item.percentage)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
