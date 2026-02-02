import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Check, Clock, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecondaryGoalProgress } from "@/hooks/usePillarProgress";

interface SecondaryGoalsProgressProps {
  goals: SecondaryGoalProgress[];
  loading?: boolean;
  onToggle?: (goalId: string, completed: boolean) => void;
}

const GOAL_ROUTES: Record<string, string | null> = {
  piano: '/music-dashboard?instrument=piano',
  guitarra: '/music-dashboard?instrument=guitar',
  lectura: '/reading-library',
  ajedrez: null, // Toggle only, no dedicated page
};

export function SecondaryGoalsProgress({ 
  goals, 
  loading,
  onToggle 
}: SecondaryGoalsProgressProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const completedCount = goals.filter(g => g.completed).length;

  const handleClick = (goal: SecondaryGoalProgress, e: React.MouseEvent) => {
    const route = GOAL_ROUTES[goal.id];
    
    // If no route (like ajedrez), toggle completion
    if (!route) {
      e.preventDefault();
      onToggle?.(goal.id, !goal.completed);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          🎯 Metas Secundarias
        </h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{goals.length}
        </span>
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-2 gap-2">
        {goals.map(goal => {
          const route = GOAL_ROUTES[goal.id];
          const hasRoute = !!route;
          
          const content = (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                "hover:shadow-md hover:scale-[1.02] cursor-pointer",
                goal.completed 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-muted/50 border-border hover:border-primary/50"
              )}
              onClick={(e) => handleClick(goal, e)}
            >
              <span className="text-xl">{goal.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{goal.name}</span>
                  {goal.completed && <Check className="w-3 h-3 text-green-500" />}
                </div>
                {goal.duration > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{goal.duration} min</span>
                  </div>
                )}
                {!goal.completed && goal.duration === 0 && (
                  <span className="text-xs text-muted-foreground">Pendiente</span>
                )}
              </div>
              {hasRoute && (
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          );

          if (hasRoute) {
            return (
              <Link key={goal.id} to={route} className="block group">
                {content}
              </Link>
            );
          }

          return (
            <div key={goal.id} className="group">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
