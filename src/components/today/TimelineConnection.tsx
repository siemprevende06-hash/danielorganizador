import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTimelineProgress } from '@/hooks/useTimelineProgress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

export function TimelineConnection() {
  const { today, week, month, quarter, projections, loading } = useTimelineProgress();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="flex gap-4">
              <div className="h-24 bg-muted rounded flex-1"></div>
              <div className="h-24 bg-muted rounded flex-1"></div>
              <div className="h-24 bg-muted rounded flex-1"></div>
              <div className="h-24 bg-muted rounded flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const todayPending = today.tasksTotal - today.tasksCompleted;
  const weeklyImprovement = projections.weeklyCompletionIfTodayDone - projections.currentWeeklyPercent;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          🔗 Cómo Hoy Construye Mi Futuro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline visualization */}
        <div className="grid grid-cols-4 gap-2 relative">
          {/* Connection line */}
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-primary/50 to-muted hidden sm:block" />
          
          {/* Today */}
          <TimelineNode
            label="HOY"
            primary={`${today.tasksCompleted}/${today.tasksTotal}`}
            sublabel="tareas"
            progress={today.score}
            isActive
            status={today.score >= 70 ? 'success' : today.score >= 40 ? 'warning' : 'pending'}
          />

          {/* This Week */}
          <TimelineNode
            label="SEMANA"
            primary={`${week.tasksCompleted}/${week.tasksTotal}`}
            sublabel={`${week.daysRemaining}d restantes`}
            progress={week.averagePercent}
            status={week.onTrack ? 'success' : 'warning'}
          />

          {/* This Month */}
          <TimelineNode
            label="MES"
            primary={`${month.tasksCompleted}/${month.tasksTotal}`}
            sublabel={`${month.daysProductiveCount} días prod.`}
            progress={(month.tasksCompleted / Math.max(1, month.tasksTotal)) * 100}
            trend={month.trend}
            status={month.averageScore >= 3.5 ? 'success' : month.averageScore >= 2.5 ? 'warning' : 'pending'}
          />

          {/* Quarter */}
          <TimelineNode
            label="TRIMESTRE"
            primary={`S${quarter.weekNumber}/12`}
            sublabel={`${quarter.goalsProgress.length} metas`}
            progress={quarter.goalsProgress.length > 0 
              ? quarter.goalsProgress.reduce((sum, g) => sum + g.progressPercent, 0) / quarter.goalsProgress.length 
              : 0}
            status={quarter.onTrack ? 'success' : 'warning'}
          />
        </div>

        {/* Projections insight */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          todayPending > 0 
            ? "bg-amber-500/10 border border-amber-500/20" 
            : "bg-green-500/10 border border-green-500/20"
        )}>
          <Lightbulb className={cn(
            "w-5 h-5 mt-0.5 shrink-0",
            todayPending > 0 ? "text-amber-500" : "text-green-500"
          )} />
          <div className="space-y-1 text-sm">
            {todayPending > 0 ? (
              <>
                <p className="font-medium">
                  Si completas tus {todayPending} tarea{todayPending > 1 ? 's' : ''} pendiente{todayPending > 1 ? 's' : ''}:
                </p>
                <p className="text-muted-foreground">
                  Tu semana subirá de {projections.currentWeeklyPercent}% a {projections.weeklyCompletionIfTodayDone}% 
                  <span className="text-green-600 font-medium"> (+{Math.round(weeklyImprovement)}%)</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-green-700 dark:text-green-300">
                  ¡Excelente! Has completado todas las tareas de hoy 🎉
                </p>
                <p className="text-muted-foreground">
                  Progreso semanal actual: {projections.currentWeeklyPercent}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick goals preview */}
        {quarter.goalsProgress.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Metas trimestrales
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quarter.goalsProgress.slice(0, 4).map((goal) => (
                <div 
                  key={goal.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-mono font-bold text-xs">
                    {goal.progressPercent}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{goal.title}</p>
                    <p className="text-muted-foreground capitalize">{goal.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineNode({
  label,
  primary,
  sublabel,
  progress,
  isActive,
  status,
  trend,
}: {
  label: string;
  primary: string;
  sublabel: string;
  progress: number;
  isActive?: boolean;
  status: 'success' | 'warning' | 'pending';
  trend?: 'up' | 'down' | 'stable';
}) {
  const statusColors = {
    success: 'border-green-500 bg-green-500/10',
    warning: 'border-amber-500 bg-amber-500/10',
    pending: 'border-muted bg-muted/50',
  };

  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    pending: 'bg-muted-foreground',
  };

  return (
    <div className="relative z-10 text-center">
      {/* Dot indicator */}
      <div className={cn(
        "w-4 h-4 rounded-full mx-auto mb-2 ring-4 ring-background",
        dotColors[status],
        isActive && "ring-primary ring-2"
      )} />
      
      {/* Card */}
      <div className={cn(
        "p-2 rounded-lg border transition-all",
        statusColors[status],
        isActive && "ring-2 ring-primary/50"
      )}>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-bold font-mono">{primary}</p>
        <p className="text-[10px] text-muted-foreground">{sublabel}</p>
        
        {/* Mini progress bar */}
        <div className="mt-1.5 h-1 bg-background rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              status === 'success' ? 'bg-green-500' :
              status === 'warning' ? 'bg-amber-500' : 'bg-muted-foreground'
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="mt-1 flex justify-center">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
            {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
          </div>
        )}
      </div>
    </div>
  );
}
