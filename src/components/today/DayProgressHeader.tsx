import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Target, Zap, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  blocksTotal: number;
  blocksCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
  dayScore: number;
  currentBlockName?: string;
  currentBlockProgress?: number;
  loading?: boolean;
}

export function DayProgressHeader({
  blocksTotal,
  blocksCompleted,
  tasksTotal,
  tasksCompleted,
  dayScore,
  currentBlockName,
  currentBlockProgress = 0,
  loading,
}: Props) {
  const totalItems = blocksTotal + tasksTotal;
  const completedItems = blocksCompleted + tasksCompleted;
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const scoreColor = dayScore >= 80 ? 'text-green-500' : dayScore >= 60 ? 'text-yellow-500' : dayScore >= 40 ? 'text-orange-500' : 'text-red-500';
  const scoreEmoji = dayScore >= 80 ? '🔥' : dayScore >= 60 ? '💪' : dayScore >= 40 ? '📈' : '⚡';

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex items-center justify-center h-16">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("text-2xl font-bold", scoreColor)}>
              {dayScore} <span className="text-lg">{scoreEmoji}</span>
            </div>
            <div className="text-sm text-muted-foreground">Score del día</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {blocksCompleted}/{blocksTotal} bloques
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <ListTodo className="h-3 w-3" />
              {tasksCompleted}/{tasksTotal} tareas
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Target className="h-3 w-3" />
              {overallProgress}%
            </Badge>
          </div>
        </div>

        <Progress value={overallProgress} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedItems} de {totalItems} completado</span>
          {currentBlockName && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              Ahora: {currentBlockName}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
