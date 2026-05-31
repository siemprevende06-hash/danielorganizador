import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTimelineProgress } from '@/hooks/useTimelineProgress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Clock, Target } from 'lucide-react';

const AREA_COLORS: Record<string, string> = {
  universidad: 'bg-blue-500',
  emprendimiento: 'bg-purple-500',
  proyectos: 'bg-orange-500',
  gym: 'bg-green-500',
  idiomas: 'bg-cyan-500',
  lectura: 'bg-amber-500',
  musica: 'bg-pink-500',
  general: 'bg-slate-500',
};

export function AreaStatsToday() {
  const { today, week, loading } = useTimelineProgress();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { areaBreakdown, hoursWorked, score } = today;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            📊 Mi Progreso Hoy por Área
          </CardTitle>
          <Badge 
            variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "outline"}
            className={cn(
              score >= 70 && "bg-green-500 hover:bg-green-600",
              score < 40 && "border-destructive text-destructive"
            )}
          >
            Score: {score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {areaBreakdown.length > 0 ? (
          <>
            {areaBreakdown.map((area) => (
              <AreaProgressRow 
                key={area.areaId} 
                area={area}
                weeklyObjectives={week.objectivesProgress}
              />
            ))}

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Tiempo productivo hoy
                </div>
                <span className="font-mono font-medium">{hoursWorked}h</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Tareas completadas
                </div>
                <span className="font-mono font-medium">
                  {today.tasksCompleted}/{today.tasksTotal}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No hay tareas para mostrar estadísticas</p>
            <p className="text-sm">Agrega tareas para ver tu progreso por área</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AreaProgressRow({ 
  area,
  weeklyObjectives 
}: { 
  area: {
    area: string;
    areaId: string;
    icon: string;
    tasksCompleted: number;
    tasksTotal: number;
    hoursWorked: number;
    todayPercent: number;
    weeklyObjective?: {
      title: string;
      currentValue: number;
      targetValue: number;
      percent: number;
    };
  };
  weeklyObjectives: Array<{
    id: string;
    area: string;
    title: string;
    currentValue: number;
    targetValue: number;
    percent: number;
  }>;
}) {
  const barColor = AREA_COLORS[area.areaId] || AREA_COLORS.general;
  
  // Find matching weekly objective
  const weeklyObj = area.weeklyObjective || 
    weeklyObjectives.find(o => o.area.toLowerCase() === area.areaId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{area.icon}</span>
          <span className="font-medium text-sm">{area.area}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {area.tasksCompleted}/{area.tasksTotal} tareas
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "font-mono",
              area.todayPercent >= 80 && "border-green-500 text-green-600 bg-green-500/10",
              area.todayPercent >= 40 && area.todayPercent < 80 && "border-amber-500 text-amber-600 bg-amber-500/10",
              area.todayPercent < 40 && "border-muted text-muted-foreground"
            )}
          >
            {Math.round(area.todayPercent)}%
          </Badge>
        </div>
      </div>
      
      <div className="relative">
        <Progress 
          value={area.todayPercent} 
          className="h-2"
        />
        <div 
          className={cn("absolute top-0 left-0 h-2 rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(100, area.todayPercent)}%` }}
        />
      </div>

      {weeklyObj && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-7">
          <span>Obj. semanal: {weeklyObj.title}</span>
          <span className="font-mono">
            [{weeklyObj.currentValue}/{weeklyObj.targetValue} = {Math.round(weeklyObj.percent)}%]
          </span>
          {weeklyObj.percent >= 100 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-500/20 text-green-600">
              ✓ Logrado
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
