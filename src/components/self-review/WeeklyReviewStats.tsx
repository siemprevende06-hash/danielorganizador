import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2, Target, Clock, Flame, Brain,
  TrendingUp, Shield, Droplets, Dumbbell, Activity
} from "lucide-react";
import { useWeeklyReview } from "@/hooks/useWeeklyReview";

interface Props {
  weekStart: Date;
}

export function WeeklyReviewStats({ weekStart }: Props) {
  const { data, loading } = useWeeklyReview(weekStart);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-12 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-24 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No hay datos para esta semana</p>
      </Card>
    );
  }

  const pct = (done: number, total: number) => total > 0 ? Math.round((done / total) * 100) : 0;
  const taskPct = pct(data.totalTasksCompleted, data.totalTasks);
  const habitsPct = pct(data.totalHabitsCompleted, data.totalHabits);
  const waterPct = pct(data.waterCompletions, data.waterTotal);
  const focusGoal = data.activeDays * 120;
  const focusPct = pct(data.totalFocusMinutes, focusGoal);
  const workoutGoal = data.activeDays * 45;
  const workoutPct = pct(data.totalWorkoutMinutes, workoutGoal);

  const semaphore = (value: number, min: number, max: number) => {
    if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Excelente" };
    if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Bien" };
    if (value > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Bajo" };
    return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin datos" };
  };

  const totalTime = Object.values(data.timeData).reduce((a, b) => a + b, 0);

  const statCards = [
    { icon: CheckCircle2, label: "Tareas", value: `${data.totalTasksCompleted}/${data.totalTasks}`, pct: taskPct, min: data.totalTasks * 0.6, max: data.totalTasks },
    { icon: Brain, label: "Puntaje promedio", value: `${data.avgOverallRating}/10`, pct: data.avgOverallRating * 10, min: 6, max: 9 },
    { icon: Clock, label: "Foco total", value: `${data.totalFocusMinutes}m`, pct: focusPct, min: focusGoal * 0.6, max: focusGoal },
    { icon: Dumbbell, label: "Ejercicio total", value: `${data.totalWorkoutMinutes}m`, pct: workoutPct, min: workoutGoal * 0.6, max: workoutGoal },
    { icon: Droplets, label: "Agua", value: `${data.waterCompletions}/${data.waterTotal}`, pct: waterPct, min: data.waterTotal * 0.6, max: data.waterTotal },
    { icon: Activity, label: "Días activos", value: `${data.activeDays}/${data.totalDays}`, pct: pct(data.activeDays, data.totalDays), min: data.totalDays * 0.6, max: data.totalDays },
    { icon: TrendingUp, label: "Tiempo invertido", value: `${totalTime}m`, pct: totalTime > 0 ? Math.min(100, Math.round(totalTime / (data.activeDays * 480) * 100)) : 0, min: 50, max: 80 },
    { icon: Flame, label: "Bloques completados", value: `${data.totalBlockCompletions}`, pct: data.totalBlocks > 0 ? pct(data.totalBlockCompletions, data.totalBlocks) : 0, min: data.totalBlocks * 0.5, max: data.totalBlocks },
  ];

  const timeAreas = [
    { id: "universidad", label: "Universidad", icon: "🎓", goal: data.activeDays * 120 },
    { id: "emprendimiento", label: "Emprendimiento", icon: "💼", goal: data.activeDays * 60 },
    { id: "proyectos", label: "Proyectos", icon: "🚀", goal: data.activeDays * 60 },
    { id: "idiomas", label: "Idiomas", icon: "🌍", goal: data.activeDays * 60 },
  ];

  return (
    <div className="space-y-6">
      {/* Weekly Score Banner */}
      <Card className={cn(
        "border-2 overflow-hidden",
        data.avgOverallRating >= 7 ? "border-green-500/30 bg-green-500/5" :
        data.avgOverallRating >= 5 ? "border-amber-500/30 bg-amber-500/5" :
        "border-red-500/30 bg-red-500/5"
      )}>
        <CardContent className="p-4 text-center">
          <div className="text-4xl font-bold mb-1">{data.avgOverallRating}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rating promedio de la semana</p>
          <Progress
            value={data.avgOverallRating * 10}
            className="h-2 mt-2 max-w-xs mx-auto"
          />
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{data.activeDays} días activos</span>
            <span>·</span>
            <span>{data.totalTasksCompleted} tareas</span>
            <span>·</span>
            <span>{Math.round(data.totalFocusMinutes / 60 * 10) / 10}h foco</span>
          </div>
        </CardContent>
      </Card>

      {/* Day by Day Breakdown */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          Desglose diario
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {data.dayDetails.map(day => {
            const score = day.overallRating * 10;
            const date = new Date(day.date + "T12:00:00");
            return (
              <Card key={day.date} className={cn(
                "p-1.5 text-center ring-1 transition-all",
                score >= 70 ? "ring-green-500/30" :
                score >= 40 ? "ring-amber-500/30" :
                day.overallRating > 0 ? "ring-red-500/30" : "ring-muted/20"
              )}>
                <p className="text-[9px] font-medium text-muted-foreground">
                  {format(date, "EEE", { locale: es }).slice(0, 2)}
                </p>
                <p className="text-[10px] font-bold">
                  {format(date, "d", { locale: es })}
                </p>
                {day.overallRating > 0 ? (
                  <div className={cn(
                    "text-xs font-bold mt-0.5",
                    score >= 70 ? "text-green-600" :
                    score >= 40 ? "text-amber-600" : "text-red-500"
                  )}>
                    {day.overallRating}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground/40 mt-0.5">—</div>
                )}
                {day.habitsCompleted > 0 && (
                  <div className="text-[8px] text-muted-foreground">{day.habitsCompleted}h</div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statCards.map((stat, i) => {
          const sem = semaphore((stat.value as unknown as number) || stat.pct, stat.min, stat.max);
          return (
            <Card key={i} className={cn("p-3 ring-2 transition-all", sem.ring, sem.bg)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold">{stat.label}</span>
                </div>
                <span className={cn("text-[10px] font-semibold", sem.text)}>{sem.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <Progress value={stat.pct} className="h-1.5" />
            </Card>
          );
        })}
      </div>

      {/* Time Breakdown by Area */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Tiempo por área
          </h3>
          <div className="space-y-3">
            {timeAreas.map(area => {
              const spent = data.timeData[area.id] || 0;
              const areaPct = Math.min(100, Math.round((spent / area.goal) * 100));
              return (
                <div key={area.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{area.icon} {area.label}</span>
                    <span className="text-muted-foreground">{Math.round(spent / 60 * 10) / 10}h / {Math.round(area.goal / 60 * 10) / 10}h</span>
                  </div>
                  <Progress value={areaPct} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Most Consistent Habits */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          Hábitos más consistentes
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(data.habitCompletions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([habitId, count]) => (
              <Badge key={habitId} variant="secondary" className="text-[10px]">
                {habitId.replace(/-/g, ' ')} {count}/{data.totalDays}
              </Badge>
            ))}
          {Object.keys(data.habitCompletions).length === 0 && (
            <p className="text-xs text-muted-foreground">No hay hábitos registrados esta semana</p>
          )}
        </div>
      </div>
    </div>
  );
}
