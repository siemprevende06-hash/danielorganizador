import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface GoalContribution {
  id: string;
  title: string;
  category: string;
  progress: number;
  todayTasks: number;
  completedTodayTasks: number;
}

export function GoalContributions() {
  const [goals, setGoals] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoalContributions();
  }, []);

  const loadGoalContributions = async () => {
    const today = new Date().toISOString().split('T')[0];
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);

    // Load active goals
    const { data: goalsData } = await supabase
      .from('twelve_week_goals')
      .select('id, title, category, progress_percentage')
      .eq('quarter', quarter)
      .eq('year', 2026)
      .eq('status', 'active')
      .order('progress_percentage', { ascending: false })
      .limit(4);

    if (!goalsData) {
      setLoading(false);
      return;
    }

    // For each goal, count today's related tasks
    const goalsWithTasks: GoalContribution[] = [];

    for (const goal of goalsData) {
      // Count tasks by category/area that match this goal
      const areaMapping: Record<string, string> = {
        'Universidad': 'university',
        'Emprendimiento': 'entrepreneurship',
        'Proyectos': 'projects',
        'Gym': 'gym',
        'Piano': 'piano',
        'Guitarra': 'guitar',
        'Lectura': 'reading'
      };

      const areaId = areaMapping[goal.category] || goal.category.toLowerCase();

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('area_id', areaId)
        .gte('due_date', `${today}T00:00:00`)
        .lte('due_date', `${today}T23:59:59`);

      const todayTasks = tasks?.length || 0;
      const completedTodayTasks = tasks?.filter(t => t.completed).length || 0;

      if (todayTasks > 0 || goal.progress_percentage > 0) {
        goalsWithTasks.push({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          progress: goal.progress_percentage || 0,
          todayTasks,
          completedTodayTasks
        });
      }
    }

    setGoals(goalsWithTasks);
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded" />;
  }

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Contribución a Metas
          </span>
        </div>
        <Link to="/12-week-year" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <p className="text-xs text-muted-foreground">{goal.category}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {goal.todayTasks > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded">
                    {goal.completedTodayTasks}/{goal.todayTasks} hoy
                  </span>
                )}
                <span className="text-sm font-mono font-medium">{goal.progress}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={goal.progress} className="h-1.5 flex-1" />
              {goal.progress > 50 && (
                <TrendingUp className="w-3 h-3 text-success" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Cada tarea completada te acerca a tus metas trimestrales
        </p>
      </div>
    </div>
  );
}
