import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { useGoalPredictions } from "@/hooks/useGoalPredictions";
import { Skeleton } from "@/components/ui/skeleton";

export function GoalPredictions() {
  const { predictions, loading } = useGoalPredictions();

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!predictions.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Predicción de Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictions.slice(0, 5).map(p => (
          <div key={p.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate max-w-[60%]">{p.title}</span>
              <div className="flex items-center gap-1">
                {p.onTrack ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={p.onTrack ? 'text-green-500' : 'text-red-500'}>
                  {p.predictedDaysToComplete ? `${p.predictedDaysToComplete}d` : '∞'}
                </span>
              </div>
            </div>
            <Progress value={p.currentProgress} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{p.currentProgress}% · {p.dailyRate}%/día</span>
              <span>{p.predictedDate ? `Est: ${p.predictedDate}` : 'Sin ritmo'}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
