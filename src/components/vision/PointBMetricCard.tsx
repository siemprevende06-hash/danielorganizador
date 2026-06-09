import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import type { PointBMetric } from '@/hooks/usePointBMetrics';

interface Props {
  metric: PointBMetric;
  onEdit?: () => void;
}

export function PointBMetricCard({ metric, onEdit }: Props) {
  const progress = metric.target_value > 0
    ? Math.min(100, Math.round((metric.current_value / metric.target_value) * 100))
    : 0;

  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-green-500';
    if (pct >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-4 border-2 border-primary/10 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{metric.icon || '🎯'}</span>
          <div>
            <h4 className="font-semibold text-sm capitalize">{metric.area}</h4>
            <p className="text-xs text-muted-foreground">{metric.metric_name}</p>
          </div>
        </div>
        {onEdit && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex items-baseline justify-center gap-2 my-3">
        <span className={cn("text-3xl font-bold", getColor(progress))}>
          {metric.current_value}
        </span>
        <span className="text-lg text-muted-foreground">/ {metric.target_value}</span>
        <span className="text-xs text-muted-foreground">{metric.unit}</span>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-700 rounded-full", getBarColor(progress))}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className={cn("text-right text-xs mt-1 font-medium", getColor(progress))}>
        {progress}% — {progress >= 100 ? 'Meta alcanzada 🎉' : progress >= 80 ? 'Cerca de la meta' : progress >= 40 ? 'Avanzando' : 'Empezando'}
      </p>
    </Card>
  );
}
