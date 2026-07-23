import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2, Target, Clock, Flame, Brain,
  TrendingUp, Shield, Droplets, Dumbbell, Activity
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { useWeeklyReview } from "@/hooks/useWeeklyReview";

interface Props {
  weekStart: Date;
}

const COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a855f7",
  emerald: "#10b981",
  rose: "#f43f5e",
};

const AREA_COLORS: Record<string, string> = {
  universidad: COLORS.blue,
  emprendimiento: COLORS.purple,
  proyectos: COLORS.amber,
  idiomas: COLORS.emerald,
};

function StatDonut({ pct, value, label }: { pct: number; value: string; label: string }) {
  const color = pct >= 90 ? COLORS.green : pct >= 60 ? COLORS.blue : pct >= 30 ? COLORS.amber : COLORS.red;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <PieChart width={80} height={80}>
          <Pie
            data={[
              { name: "done", value: Math.max(pct, 1) },
              { name: "remaining", value: Math.max(100 - pct, 0) },
            ]}
            cx={40} cy={40} innerRadius={28} outerRadius={36}
            startAngle={90} endAngle={-270}
            dataKey="value" stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold leading-none">{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold leading-tight text-center">{value}</span>
      <span className="text-[9px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  );
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
  const totalTime = Object.values(data.timeData).reduce((a, b) => a + b, 0);
  const timePct = totalTime > 0 ? Math.min(100, Math.round(totalTime / (data.activeDays * 480) * 100)) : 0;
  const blocksPct = data.totalBlocks > 0 ? pct(data.totalBlockCompletions, data.totalBlocks) : 0;
  const activePct = pct(data.activeDays, data.totalDays);

  const statDonuts = [
    { pct: taskPct, value: `${data.totalTasksCompleted}/${data.totalTasks}`, label: "Tareas", min: 60, max: 100 },
    { pct: Math.round(data.avgOverallRating * 10), value: `${data.avgOverallRating}/10`, label: "Rating", min: 60, max: 90 },
    { pct: focusPct, value: `${Math.round(data.totalFocusMinutes / 60 * 10) / 10}h`, label: "Foco", min: 60, max: 100 },
    { pct: workoutPct, value: `${Math.round(data.totalWorkoutMinutes / 60 * 10) / 10}h`, label: "Ejercicio", min: 60, max: 100 },
    { pct: waterPct, value: `${data.waterCompletions}/${data.waterTotal}`, label: "Agua", min: 60, max: 100 },
    { pct: activePct, value: `${data.activeDays}/${data.totalDays}`, label: "Días activos", min: 60, max: 100 },
    { pct: timePct, value: `${Math.round(totalTime / 60 * 10) / 10}h`, label: "Tiempo invertido", min: 50, max: 80 },
    { pct: blocksPct, value: `${data.totalBlockCompletions}`, label: "Bloques", min: 50, max: 100 },
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
          <div className="flex justify-center mt-2">
            <PieChart width={120} height={40}>
              <Pie
                data={[
                  { name: "done", value: Math.max(Math.round(data.avgOverallRating * 10), 1) },
                  { name: "remaining", value: Math.max(100 - Math.round(data.avgOverallRating * 10), 0) },
                ]}
                cx={60} cy={40} innerRadius={30} outerRadius={38}
                startAngle={180} endAngle={0}
                dataKey="value" stroke="none"
              >
                <Cell fill={data.avgOverallRating >= 7 ? COLORS.green : data.avgOverallRating >= 5 ? COLORS.amber : COLORS.red} />
                <Cell fill="hsl(var(--muted)/0.3)" />
              </Pie>
            </PieChart>
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statDonuts.map((stat, i) => (
          <Card key={i} className="p-3">
            <StatDonut pct={stat.pct} value={stat.value} label={stat.label} />
          </Card>
        ))}
      </div>

      {/* Time Breakdown by Area */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Tiempo por área
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {timeAreas.map(area => {
              const spent = data.timeData[area.id] || 0;
              const areaPct = Math.min(100, Math.round((spent / area.goal) * 100));
              return (
                <div key={area.id} className="flex flex-col items-center gap-1.5">
                  <PieChart width={64} height={64}>
                    <Pie
                      data={[
                        { name: "done", value: Math.max(areaPct, 1) },
                        { name: "remaining", value: Math.max(100 - areaPct, 0) },
                      ]}
                      cx={32} cy={32} innerRadius={22} outerRadius={30}
                      startAngle={90} endAngle={-270}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill={AREA_COLORS[area.id] || COLORS.blue} />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                  <span className="text-xs font-medium text-center leading-tight">{area.icon} {area.label}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.round(spent / 60 * 10) / 10}h / {Math.round(area.goal / 60 * 10) / 10}h</span>
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
              <span key={habitId} className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-medium border",
                count >= data.totalDays * 0.7 ? "bg-green-500/15 text-green-600 border-green-500/30" :
                count >= data.totalDays * 0.4 ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
                "bg-muted text-muted-foreground border-transparent"
              )}>
                {habitId.replace(/-/g, ' ')} {count}/{data.totalDays}
              </span>
            ))}
          {Object.keys(data.habitCompletions).length === 0 && (
            <p className="text-xs text-muted-foreground">No hay hábitos registrados esta semana</p>
          )}
        </div>
      </div>
    </div>
  );
}
