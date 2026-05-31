import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { PillarProgress } from "@/hooks/usePillarProgress";

interface PillarRating {
  pillarId: string;
  rating: number;
  notes: string;
}

interface DailyPillarSummaryProps {
  pillars: PillarProgress[];
  ratings: PillarRating[];
  onRatingChange: (pillarId: string, rating: number) => void;
  onNotesChange: (pillarId: string, notes: string) => void;
}

export function DailyPillarSummary({ 
  pillars, 
  ratings,
  onRatingChange,
  onNotesChange
}: DailyPillarSummaryProps) {
  const getRating = (pillarId: string) => {
    return ratings.find(r => r.pillarId === pillarId)?.rating || 0;
  };

  const getNotes = (pillarId: string) => {
    return ratings.find(r => r.pillarId === pillarId)?.notes || '';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    if (percentage > 0) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        📊 Evaluación por Pilares
      </h3>

      <div className="space-y-4">
        {pillars.map(pillar => {
          const rating = getRating(pillar.id);
          const notes = getNotes(pillar.id);
          
          return (
            <div 
              key={pillar.id} 
              className="p-4 rounded-lg border bg-card space-y-3"
            >
              {/* Pillar header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{pillar.icon}</span>
                  <span className="font-semibold">{pillar.name}</span>
                </div>
                <span className={cn("font-bold", getProgressColor(pillar.percentage))}>
                  {pillar.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso Objetivo</span>
                  <span>{pillar.tasksCompleted}/{pillar.tasksTotal} tareas</span>
                </div>
                <Progress value={pillar.percentage} className="h-2" />
              </div>

              {/* Star rating */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Mi Calificación</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => onRatingChange(pillar.id, star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={cn(
                          "w-5 h-5 transition-colors",
                          star <= rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        )} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({rating}/5)
                  </span>
                </div>
              </div>

              {/* Notes */}
              <Textarea
                placeholder={`Notas sobre ${pillar.name}...`}
                value={notes}
                onChange={(e) => onNotesChange(pillar.id, e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
