import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, BookOpen, Music2, Crown, Dumbbell, Globe, CheckCircle2 } from 'lucide-react';
import type { SprintObjective } from '@/hooks/useSprints';

interface Props {
  objective: SprintObjective;
  todayMinutes?: number;
}

const AREA_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  gym: { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  lectura: { icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  musica: { icon: Music2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  piano: { icon: Music2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  guitarra: { icon: Music2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ajedrez: { icon: Crown, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  idiomas: { icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export function MejoraObjectiveCard({ objective, todayMinutes = 0 }: Props) {
  const progress = objective.target_value > 0
    ? Math.min(100, Math.round((objective.current_value / objective.target_value) * 100))
    : 0;
  const isCompleted = objective.status === 'completed';
  const config = AREA_CONFIG[objective.area] || { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10' };
  const Icon = config.icon;

  const dailyStatus = () => {
    if (todayMinutes === 0) return { label: 'Sin hacer', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (objective.max_daily && todayMinutes >= objective.max_daily) return { label: 'Máximo ✓', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (objective.min_daily && todayMinutes >= objective.min_daily) return { label: 'Mínimo ✓', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'En progreso', color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const daily = dailyStatus();
  const dailyBarPct = objective.max_daily
    ? Math.min(100, Math.round((todayMinutes / objective.max_daily) * 100))
    : Math.min(100, todayMinutes > 0 ? 100 : 0);

  return (
    <Card className={cn("p-4 border-2 transition-all", isCompleted && "opacity-60")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", config.bg)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{objective.title}</h4>
            <p className="text-[10px] text-muted-foreground capitalize">{objective.area}</p>
          </div>
        </div>
        <Badge variant={isCompleted ? "default" : "outline"} className="text-[10px]">
          {isCompleted ? '✓ Meta' : `${objective.current_value}/${objective.target_value} ${objective.unit}`}
        </Badge>
      </div>

      {/* Sprint accumulation progress */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Progreso del sprint</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Daily min/max tracking */}
      {objective.min_daily && (
        <div className={cn("p-3 rounded-lg border", daily.bg, "border-dashed")}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Hoy</span>
            <Badge variant="outline" className={cn("text-[10px]", daily.color)}>
              {daily.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tabular-nums">{todayMinutes}</span>
            <span className="text-xs text-muted-foreground">min</span>
            <div className="flex-1 mx-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full transition-all", todayMinutes === 0 ? 'bg-red-400' : todayMinutes >= (objective.max_daily || 999) ? 'bg-green-500' : 'bg-blue-500')}
                  style={{ width: `${dailyBarPct}%` }} />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              mín {objective.min_daily} · máx {objective.max_daily || '∞'}
            </span>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Meta alcanzada: {objective.current_value} {objective.unit}
        </div>
      )}
    </Card>
  );
}
