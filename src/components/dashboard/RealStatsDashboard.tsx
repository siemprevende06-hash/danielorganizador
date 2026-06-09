import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, CalendarDays, TrendingUp, BarChart3, Clock, Droplets, Flame, Dumbbell, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useTimeRangeStats } from '@/hooks/useTimeRangeStats';

export function RealStatsDashboard() {
  const stats = useTimeRangeStats();

  if (stats.loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const { day, week, month, quarter, currentStreak } = stats;

  const getTrendIcon = () => {
    if (week.trend === 'up') return '📈';
    if (week.trend === 'down') return '📉';
    return '➡️';
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-green-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return 'bg-green-500/10 border-green-500/30';
    if (pct >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* DAY */}
      <Card className={cn("border-2", getScoreBg(day.completionPct))}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HOY</span>
            </div>
            {day.hasData && (
              <Badge variant="outline" className="text-[10px]">
                {formatDate(day.wakeTime, day.sleepTime)}
              </Badge>
            )}
          </div>

          <div className="text-center">
            <span className={cn("text-3xl font-bold", getScoreColor(day.completionPct))}>
              {day.completionPct}%
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completado</p>
          </div>

          <Progress value={day.completionPct} className="h-2" />

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{day.habitsDone}/{day.totalHabits}</p>
              <p className="text-[9px] text-muted-foreground">hábitos</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Clock className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
              <p className="text-sm font-bold">{day.totalMinutes}m</p>
              <p className="text-[9px] text-muted-foreground">minutos</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Droplets className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{day.waterGlasses}/7</p>
              <p className="text-[9px] text-muted-foreground">agua</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Dumbbell className="h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{day.workoutMinutes}m</p>
              <p className="text-[9px] text-muted-foreground">gym</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WEEK */}
      <Card className="border-2 border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEMANA</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">{week.activeDays}/7 días</Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={cn("text-3xl font-bold", getScoreColor(week.avgCompletionPct))}>
                {week.avgCompletionPct}%
              </span>
              <span className="text-lg">{getTrendIcon()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Promedio · vs {week.previousWeekAvg}% semana anterior
            </p>
          </div>

          <Progress value={week.avgCompletionPct} className="h-2" />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold text-green-500">{week.bestDay}%</p>
              <p className="text-[9px] text-muted-foreground">mejor</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold">{week.totalMinutes}m</p>
              <p className="text-[9px] text-muted-foreground">totales</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold text-red-500">{week.worstDay}%</p>
              <p className="text-[9px] text-muted-foreground">peor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MONTH */}
      <Card className="border-2 border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MES</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">{month.activeDays} días</Badge>
          </div>

          <div className="text-center">
            <span className={cn("text-3xl font-bold", getScoreColor(month.avgCompletionPct))}>
              {month.avgCompletionPct}%
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Promedio mensual</p>
          </div>

          <Progress value={month.avgCompletionPct} className="h-2" />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold text-green-500">{month.bestDay}%</p>
              <p className="text-[9px] text-muted-foreground">mejor día</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold">{month.totalMinutes}m</p>
              <p className="text-[9px] text-muted-foreground">totales</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Flame className="h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{currentStreak}</p>
              <p className="text-[9px] text-muted-foreground">racha</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUARTER */}
      <Card className="border-2 border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TRIMESTRE</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">{quarter.activeDays}d</Badge>
          </div>

          <div className="text-center">
            <span className={cn("text-3xl font-bold", getScoreColor(quarter.overallConsistency))}>
              {quarter.overallConsistency}%
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Consistencia global</p>
          </div>

          <Progress value={quarter.overallConsistency} className="h-2" />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold">{quarter.avgCompletionPct}%</p>
              <p className="text-[9px] text-muted-foreground">promedio</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
              <p className="text-sm font-bold">{quarter.activeDays}/{quarter.totalActiveDays}</p>
              <p className="text-[9px] text-muted-foreground">días activos</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Flame className="h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{currentStreak}</p>
              <p className="text-[9px] text-muted-foreground">racha actual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(wake?: string, sleep?: string) {
  if (!wake && !sleep) return '';
  return `${wake || '--'} · ${sleep || '--'}`;
}
