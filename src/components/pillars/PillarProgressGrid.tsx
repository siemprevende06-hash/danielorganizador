import { Link } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import type { PillarProgress } from "@/hooks/usePillarProgress";

interface PillarProgressGridProps {
  pillars: PillarProgress[];
  overallScore: number;
  loading?: boolean;
  compact?: boolean;
}

const PILLAR_ROUTES: Record<string, string> = {
  universidad: '/university',
  emprendimiento: '/entrepreneurship',
  proyectos: '/projects',
  gym: '/vida-daniel',
  idiomas: '/languages-dashboard',
};

export function PillarProgressGrid({ 
  pillars, 
  overallScore, 
  loading,
  compact = false 
}: PillarProgressGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className={compact ? "grid grid-cols-5 gap-2" : "grid grid-cols-2 md:grid-cols-5 gap-3"}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className={compact ? "h-12" : "h-32"} />
          ))}
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-muted';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          ⭐ Progreso en mis 5 Pilares
        </h3>
        <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}%
        </span>
      </div>

      {/* Grid - Clickable Cards */}
      <div className={compact 
        ? "grid grid-cols-5 gap-2" 
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
      }>
        {pillars.map(pillar => {
          const route = PILLAR_ROUTES[pillar.id] || '/';
          
          return (
            <Link 
              key={pillar.id} 
              to={route}
              className="block group"
            >
              <div className={cn(
                "relative p-3 rounded-xl border bg-card transition-all",
                "hover:shadow-lg hover:border-primary/40 hover:scale-[1.02]",
                "cursor-pointer",
                pillar.status === 'completed' && "border-green-500/50 bg-green-500/5"
              )}>
                {compact ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pillar.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{pillar.name}</span>
                        <span className={cn("text-xs font-bold", getScoreColor(pillar.percentage))}>
                          {pillar.percentage}%
                        </span>
                      </div>
                      <Progress value={pillar.percentage} className="h-1 mt-1" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center mb-2">
                      <span className="text-2xl block mb-1">{pillar.icon}</span>
                      <span className="font-semibold text-xs">{pillar.name}</span>
                    </div>

                    {/* Percentage */}
                    <div className={cn("text-2xl font-bold text-center mb-2", getScoreColor(pillar.percentage))}>
                      {pillar.percentage}%
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div 
                        className={cn("h-full transition-all duration-500", getProgressColor(pillar.percentage))}
                        style={{ width: `${pillar.percentage}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="text-center text-xs text-muted-foreground">
                      <span>{pillar.tasksCompleted}/{pillar.tasksTotal} ✓</span>
                      {pillar.streak > 0 && (
                        <span className="ml-2">🔥 {pillar.streak}</span>
                      )}
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all pointer-events-none" />
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Puntuación Total</span>
          <span className="font-medium">{overallScore}%</span>
        </div>
        <Progress value={overallScore} className="h-2" />
      </div>
    </div>
  );
}
