import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Zap, CalendarDays, TrendingUp, BarChart3, Clock, Droplets, Flame, Dumbbell,
  Sun, Moon, CheckCircle2, Target, Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { useTimeRangeStats } from '@/hooks/useTimeRangeStats';
import type { Timeframe } from '@/contexts/TimeframeContext';

interface Props {
  timeframe: Timeframe;
}

const TF_LABELS: Record<string, string> = {
  today: 'HOY',
  week: 'SEMANA',
  month: 'MES',
  quarter: 'TRIMESTRE',
  year: 'AÑO',
  sprint: 'SPRINT',
};

const TF_ICONS: Record<string, React.ReactNode> = {
  today: <Zap className="h-4 w-4 text-primary" />,
  week: <CalendarDays className="h-4 w-4 text-purple-500" />,
  month: <BarChart3 className="h-4 w-4 text-blue-500" />,
  quarter: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  year: <Activity className="h-4 w-4 text-amber-500" />,
  sprint: <Target className="h-4 w-4 text-rose-500" />,
};

function getScoreColor(pct: number) {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBg(pct: number) {
  if (pct >= 80) return 'bg-green-500/10 border-green-500/30';
  if (pct >= 50) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

export function RealStatsDashboard({ timeframe }: Props) {
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

  const renderToday = () => (
    <Card className={cn("border-2", getScoreBg(day.completionPct))}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HOY</span>
          </div>
          {day.hasData && (
            <Badge variant="outline" className="text-[10px]">
              {day.wakeTime || '--'} · {day.sleepTime || '--'}
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
  );

  const renderWeek = () => (
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
            <span className="text-lg">{week.trend === 'up' ? '📈' : week.trend === 'down' ? '📉' : '➡️'}</span>
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
        {week.totalWorkouts > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
            <Dumbbell className="h-3 w-3 text-orange-500" />
            <span>{week.totalWorkouts} workouts · {week.avgMinutesPerDay} min/día</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMonth = () => (
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
  );

  const renderQuarter = () => (
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
  );

  const renderYear = () => {
    const yearProgress = quarter.avgCompletionPct || 0;
    return (
      <Card className="border-2 border-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AÑO</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">{quarter.activeDays}d</Badge>
          </div>
          <div className="text-center">
            <span className={cn("text-3xl font-bold", getScoreColor(yearProgress))}>
              {yearProgress}%
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Consistencia anual</p>
          </div>
          <Progress value={yearProgress} className="h-2" />
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-sm font-bold">{quarter.avgCompletionPct}%</p>
              <p className="text-[9px] text-muted-foreground">promedio trimestre</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Flame className="h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{currentStreak}</p>
              <p className="text-[9px] text-muted-foreground">racha actual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSprint = () => renderMonth();

  const RENDERERS: Record<string, () => React.ReactNode> = {
    today: renderToday,
    week: renderWeek,
    month: renderMonth,
    quarter: renderQuarter,
    year: renderYear,
    sprint: renderSprint,
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {TF_ICONS[timeframe] || TF_ICONS.today}
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {TF_LABELS[timeframe] || 'HOY'}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span className={cn("text-lg font-bold", getScoreColor(
            timeframe === 'today' ? day.completionPct :
            timeframe === 'week' ? week.avgCompletionPct :
            timeframe === 'month' ? month.avgCompletionPct :
            timeframe === 'quarter' ? quarter.overallConsistency :
            timeframe === 'year' ? quarter.overallConsistency :
            month.avgCompletionPct
          ))}>
            {timeframe === 'today' ? day.completionPct :
             timeframe === 'week' ? week.avgCompletionPct :
             timeframe === 'month' ? month.avgCompletionPct :
             timeframe === 'quarter' ? quarter.overallConsistency :
             timeframe === 'year' ? quarter.overallConsistency :
             month.avgCompletionPct}%
          </span>
        </div>
      </div>
      {(RENDERERS[timeframe] || renderToday)()}
    </div>
  );
}
