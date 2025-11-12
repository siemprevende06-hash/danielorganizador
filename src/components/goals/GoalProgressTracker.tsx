import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { useGoalProgress, Goal, GoalBlockConnection } from "@/hooks/useGoalProgress";

export function GoalProgressTracker() {
  const { goals, loading, fetchGoalBlocks, fetchGoalTasks } = useGoalProgress();
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [goalDetails, setGoalDetails] = useState<Map<string, {
    blocks: GoalBlockConnection[];
    totalTasks: number;
    completedTasks: number;
  }>>(new Map());

  useEffect(() => {
    const active = goals.filter(g => g.status === 'active');
    setActiveGoals(active);

    // Fetch details for each goal
    active.forEach(async (goal) => {
      const blocks = await fetchGoalBlocks(goal.id);
      const tasks = await fetchGoalTasks(goal.id);
      const completedTasks = tasks.filter(t => t.completed).length;

      setGoalDetails(prev => new Map(prev).set(goal.id, {
        blocks,
        totalTasks: tasks.length,
        completedTasks,
      }));
    });
  }, [goals]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando metas...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Activas
          </CardTitle>
          <CardDescription>
            No tienes metas activas. Crea una meta para comenzar a trabajar en ella.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          🎯 Metas Activas Hoy
        </CardTitle>
        <CardDescription>
          Progreso de tus metas y bloques conectados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.map((goal) => {
          const details = goalDetails.get(goal.id);
          const totalMinutes = details?.blocks.reduce((sum, b) => {
            const duration = parseInt(b.block_name.match(/\d+/)?.[0] || '0');
            return sum + duration;
          }, 0) || 0;

          return (
            <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    {goal.title}
                    <Badge variant="secondary">
                      {goal.progress_percentage}%
                    </Badge>
                  </h4>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                {goal.target_date && (
                  <Badge variant="outline" className="ml-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(goal.target_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <Progress value={goal.progress_percentage} className="h-2" />

              {details && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Tareas: {details.completedTasks}/{details.totalTasks}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">
                      {totalMinutes} min/día en bloques
                    </span>
                  </div>
                </div>
              )}

              {details && details.blocks.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground mr-1">Bloques:</span>
                  {details.blocks.map((block) => (
                    <Badge key={block.id} variant="outline" className="text-xs">
                      {block.block_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
