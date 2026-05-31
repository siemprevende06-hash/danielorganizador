import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { getQuarter, getWeek } from "date-fns";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface GoalDistanceIndicatorProps {
  goals: TwelveWeekGoal[];
}

export function GoalDistanceIndicator({ goals }: GoalDistanceIndicatorProps) {
  const now = new Date();
  const currentWeek = getWeek(now, { weekStartsOn: 1 });
  const weekInQuarter = ((currentWeek - 1) % 12) + 1;
  const expectedProgress = Math.round((weekInQuarter / 12) * 100);

  // Analyze each goal's status
  const goalAnalysis = goals.map(goal => {
    const progress = goal.progress_percentage || 0;
    const difference = progress - expectedProgress;
    const isAhead = difference > 5;
    const isBehind = difference < -10;
    const isOnTrack = !isAhead && !isBehind;

    return {
      id: goal.id,
      title: goal.title,
      category: goal.category,
      progress,
      expectedProgress,
      difference,
      status: isAhead ? 'ahead' : isBehind ? 'behind' : 'on-track',
    };
  });

  // Summary stats
  const aheadCount = goalAnalysis.filter(g => g.status === 'ahead').length;
  const behindCount = goalAnalysis.filter(g => g.status === 'behind').length;
  const onTrackCount = goalAnalysis.filter(g => g.status === 'on-track').length;

  // Overall status
  const overallProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length)
    : 0;
  const overallDifference = overallProgress - expectedProgress;
  const overallStatus = overallDifference > 5 ? 'ahead' : overallDifference < -10 ? 'behind' : 'on-track';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          ¿Te Acercas o Alejas?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-4",
          overallStatus === 'ahead' && "bg-green-500/10",
          overallStatus === 'behind' && "bg-red-500/10",
          overallStatus === 'on-track' && "bg-yellow-500/10",
        )}>
          <div className={cn(
            "p-3 rounded-full",
            overallStatus === 'ahead' && "bg-green-500/20",
            overallStatus === 'behind' && "bg-red-500/20",
            overallStatus === 'on-track' && "bg-yellow-500/20",
          )}>
            {overallStatus === 'ahead' && <ArrowUp className="h-6 w-6 text-green-500" />}
            {overallStatus === 'behind' && <ArrowDown className="h-6 w-6 text-red-500" />}
            {overallStatus === 'on-track' && <CheckCircle2 className="h-6 w-6 text-yellow-500" />}
          </div>
          <div className="flex-1">
            <div className="font-semibold">
              {overallStatus === 'ahead' && "¡Vas adelantado!"}
              {overallStatus === 'behind' && "Vas atrasado"}
              {overallStatus === 'on-track' && "Vas en camino"}
            </div>
            <div className="text-sm text-muted-foreground">
              Progreso: {overallProgress}% | Esperado: {expectedProgress}%
            </div>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            overallStatus === 'ahead' && "text-green-500",
            overallStatus === 'behind' && "text-red-500",
            overallStatus === 'on-track' && "text-yellow-500",
          )}>
            {overallDifference > 0 ? "+" : ""}{overallDifference}%
          </div>
        </div>

        {/* Goal Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-lg font-bold text-green-500">{aheadCount}</div>
            <div className="text-xs text-muted-foreground">Adelantadas</div>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <div className="text-lg font-bold text-yellow-500">{onTrackCount}</div>
            <div className="text-xs text-muted-foreground">En camino</div>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10">
            <div className="text-lg font-bold text-red-500">{behindCount}</div>
            <div className="text-xs text-muted-foreground">Atrasadas</div>
          </div>
        </div>

        {/* Individual Goals (show top 3 behind) */}
        {goalAnalysis.filter(g => g.status === 'behind').slice(0, 3).map(goal => (
          <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{goal.title}</div>
              <Progress value={goal.progress} className="h-1.5 mt-1" />
            </div>
            <div className="text-xs text-red-500 font-medium">
              {goal.difference}%
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
