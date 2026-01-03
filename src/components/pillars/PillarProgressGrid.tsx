import { PillarCard } from "./PillarCard";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { PillarProgress } from "@/hooks/usePillarProgress";

interface PillarProgressGridProps {
  pillars: PillarProgress[];
  overallScore: number;
  loading?: boolean;
  compact?: boolean;
}

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

      {/* Grid */}
      <div className={compact 
        ? "grid grid-cols-5 gap-2" 
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
      }>
        {pillars.map(pillar => (
          <PillarCard key={pillar.id} pillar={pillar} compact={compact} />
        ))}
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
