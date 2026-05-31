import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame, TrendingUp } from 'lucide-react';
import type { ConsistencySnapshot } from '@/hooks/usePeriodicReview';

interface ConsistencyOverviewProps {
  consistency: ConsistencySnapshot[];
}

export function ConsistencyOverview({ consistency }: ConsistencyOverviewProps) {
  const overallAvg = consistency.length > 0
    ? Math.round(consistency.reduce((s, c) => s + c.percentage, 0) / consistency.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-5 w-5 text-orange-500" />
          Constancia del Período
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={overallAvg} className="h-2 flex-1" />
          <span className="text-sm font-bold">{overallAvg}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {consistency.map(c => (
          <div key={c.area} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{c.label}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {c.totalMinutes !== undefined && c.totalMinutes > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {Math.round(c.totalMinutes / 60)}h {c.totalMinutes % 60}m
                  </span>
                )}
                <span className="font-medium text-foreground">
                  {c.daysActive}/{c.totalDays}d
                </span>
              </div>
            </div>
            <Progress
              value={c.percentage}
              className={`h-1.5 ${
                c.percentage >= 80 ? '[&>div]:bg-green-500' :
                c.percentage >= 50 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-destructive'
              }`}
            />
          </div>
        ))}

        {consistency.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin datos de constancia para este período
          </p>
        )}
      </CardContent>
    </Card>
  );
}
