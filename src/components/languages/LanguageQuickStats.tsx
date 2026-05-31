import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function LanguageQuickStats({
  progress,
  todayMinutes,
  dailyGoal,
  weeklyTotal,
  weeklyPercent,
}: {
  progress: { completed: number; total: number; percentage: number };
  todayMinutes: number;
  dailyGoal: number;
  weeklyTotal: number;
  weeklyPercent: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold">
            {progress.completed}/{progress.total}
          </p>
          <p className="text-xs text-muted-foreground">Habilidades hoy</p>
          <Progress value={progress.percentage} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold">
            {todayMinutes}
            <span className="text-xs sm:text-sm font-normal">min</span>
          </p>
          <p className="text-xs text-muted-foreground">Tiempo hoy</p>
          <Progress value={Math.min((todayMinutes / dailyGoal) * 100, 100)} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold">
            {weeklyTotal}
            <span className="text-xs sm:text-sm font-normal">min</span>
          </p>
          <p className="text-xs text-muted-foreground">Esta semana</p>
          <Progress value={weeklyPercent} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}
