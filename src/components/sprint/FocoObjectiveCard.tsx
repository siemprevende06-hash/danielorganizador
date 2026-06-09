import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2 } from 'lucide-react';
import type { SprintObjective } from '@/hooks/useSprints';

interface Props {
  objective: SprintObjective;
  onUpdate?: (updates: Partial<SprintObjective>) => void;
}

const AREA_COLORS: Record<string, string> = {
  universidad: 'border-blue-500/30 bg-blue-500/5',
  emprendimiento: 'border-purple-500/30 bg-purple-500/5',
  proyectos: 'border-cyan-500/30 bg-cyan-500/5',
};

const AREA_ICONS: Record<string, string> = {
  universidad: '🎓',
  emprendimiento: '💼',
  proyectos: '🚀',
};

export function FocoObjectiveCard({ objective, onUpdate }: Props) {
  const progress = objective.target_value > 0
    ? Math.min(100, Math.round((objective.current_value / objective.target_value) * 100))
    : 0;
  const isCompleted = objective.status === 'completed';
  const areaColor = AREA_COLORS[objective.area] || 'border-muted bg-muted/10';

  return (
    <Card className={cn("p-4 border-2 transition-all", areaColor, isCompleted && "opacity-60")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{AREA_ICONS[objective.area] || '🎯'}</span>
          <div>
            <h4 className="font-semibold text-sm">{objective.title}</h4>
            <p className="text-[10px] text-muted-foreground capitalize">{objective.area}</p>
          </div>
        </div>
        <Badge variant={isCompleted ? "default" : "outline"} className="text-[10px]">
          {isCompleted ? 'Completado ✓' : `${objective.current_value}/${objective.target_value} ${objective.unit}`}
        </Badge>
      </div>

      <Progress value={progress} className="h-2.5" />

      <div className="flex items-center justify-between mt-2">
        <span className={cn("text-xs font-medium", progress >= 100 ? "text-green-600" : "text-muted-foreground")}>
          {progress}% completo
        </span>
        {!isCompleted && onUpdate && (
          <div className="flex gap-1">
            {[25, 50, 75, 100].map(pct => {
              const val = Math.round((objective.target_value * pct) / 100);
              return (
                <Button
                  key={pct}
                  size="sm"
                  variant="ghost"
                  className={cn("h-6 px-1.5 text-[10px]", objective.current_value >= val && "text-primary font-bold")}
                  onClick={() => onUpdate({ current_value: val, status: pct >= 100 ? 'completed' : 'in_progress' })}
                >
                  {pct}%
                </Button>
              );
            })}
          </div>
        )}
        {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
      </div>

      {objective.description && (
        <p className="mt-2 text-xs text-muted-foreground">{objective.description}</p>
      )}
    </Card>
  );
}
