import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Flag, CheckCircle2, XCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Sprint } from '@/hooks/useSprints';

interface Props {
  sprint: Sprint;
  onComplete?: () => void;
  onDelete?: () => void;
}

export function SprintHeader({ sprint, onComplete, onDelete }: Props) {
  const isActive = sprint.status === 'active';
  const isCompleted = sprint.status === 'completed';
  const daysLeft = Math.ceil(
    (new Date(sprint.end_date).getTime() - new Date().getTime()) / 86400000
  );
  const totalDays = Math.ceil(
    (new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / 86400000
  );
  const daysElapsed = totalDays - daysLeft;
  const progress = Math.round((daysElapsed / totalDays) * 100);

  const focoObjectives = sprint.objectives.filter(o => o.type === 'foco');
  const mejoraObjectives = sprint.objectives.filter(o => o.type === 'mejora');
  const completedFoco = focoObjectives.filter(o => o.status === 'completed').length;
  const focoProgress = focoObjectives.length > 0 ? Math.round((completedFoco / focoObjectives.length) * 100) : 0;

  return (
    <Card className={cn(
      "overflow-hidden border-2",
      isActive ? "border-primary/30" : isCompleted ? "border-green-500/30" : "border-muted"
    )}>
      <div className={cn(
        "p-4",
        isActive ? "bg-gradient-to-r from-primary/10 to-primary/5" :
        isCompleted ? "bg-gradient-to-r from-green-500/10 to-green-500/5" :
        "bg-muted/30"
      )}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flag className={cn("h-5 w-5", isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground")} />
              <h2 className="text-xl font-bold">{sprint.name}</h2>
              <Badge variant={isActive ? "default" : isCompleted ? "secondary" : "outline"} className="text-[10px]">
                {isActive ? 'Activo' : isCompleted ? 'Completado' : 'Cancelado'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(sprint.start_date), 'd MMM', { locale: es })} — {format(new Date(sprint.end_date), 'd MMM', { locale: es })}
              </span>
              {isActive && (
                <Badge variant="outline" className="text-[10px]">
                  {daysLeft > 0 ? `${daysLeft} días restantes` : 'Último día'}
                </Badge>
              )}
            </div>
          </div>

          {isActive && (
            <div className="flex gap-2">
              {onComplete && (
                <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={onComplete}>
                  <CheckCircle2 className="h-3 w-3" /> Completar
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-destructive" onClick={onDelete}>
                  <XCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Time progress */}
        {isActive && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Día {daysElapsed}/{totalDays}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Mini summary */}
        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <span className="font-semibold">{focoObjectives.length}</span>
            <span className="text-muted-foreground ml-1">objetivos foco</span>
          </div>
          <div>
            <span className="font-semibold">{mejoraObjectives.length}</span>
            <span className="text-muted-foreground ml-1">objetivos mejora</span>
          </div>
          {focoObjectives.length > 0 && (
            <div>
              <span className="font-semibold">{completedFoco}/{focoObjectives.length}</span>
              <span className="text-muted-foreground ml-1">completados</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
