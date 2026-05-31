import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { PillarProgress } from "@/hooks/usePillarProgress";

interface PillarCardProps {
  pillar: PillarProgress;
  compact?: boolean;
}

export function PillarCard({ pillar, compact = false }: PillarCardProps) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    if (percentage > 0) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-muted';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <span className="text-lg">{pillar.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium truncate">{pillar.name}</span>
            <span className={cn("text-xs font-bold", getStatusColor(pillar.percentage))}>
              {pillar.percentage}%
            </span>
          </div>
          <Progress 
            value={pillar.percentage} 
            className="h-1 mt-1"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative p-4 rounded-xl border bg-card transition-all hover:shadow-md",
      pillar.status === 'completed' && "border-green-500/50 bg-green-500/5"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{pillar.icon}</span>
          <span className="font-semibold text-sm">{pillar.name}</span>
        </div>
        <span className={cn("text-2xl font-bold", getStatusColor(pillar.percentage))}>
          {pillar.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div 
          className={cn("h-full transition-all duration-500", getProgressColor(pillar.percentage))}
          style={{ width: `${pillar.percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Tareas</span>
          <span className="font-medium text-foreground">
            {pillar.tasksCompleted}/{pillar.tasksTotal}
          </span>
        </div>
        {pillar.hoursToday > 0 && (
          <div className="flex justify-between">
            <span>Tiempo</span>
            <span className="font-medium text-foreground">
              {pillar.hoursToday.toFixed(1)}h
            </span>
          </div>
        )}
        {pillar.streak > 0 && (
          <div className="flex justify-between">
            <span>Racha</span>
            <span className="font-medium text-foreground">
              🔥 {pillar.streak} días
            </span>
          </div>
        )}
      </div>

      {/* Completed indicator */}
      {pillar.status === 'completed' && (
        <div className="absolute top-2 right-2">
          <span className="text-green-500">✓</span>
        </div>
      )}
    </div>
  );
}
