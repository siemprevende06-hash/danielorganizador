import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, Droplets, Clock, CheckCircle2, Dumbbell, Moon, Flame, Trophy } from "lucide-react";

interface Props {
  completions: Record<string, boolean>;
  waterData: Record<string, boolean>;
  timeData: Record<string, number>;
  totalHabits: number;
  blockCompletions: Record<string, boolean>;
  workoutDuration: number;
  wakeTime: string;
  sleepTime: string;
  currentStreak?: number;
  longestStreak?: number;
}

export function SystemsStatsPanel({
  completions, waterData, timeData, totalHabits,
  blockCompletions, workoutDuration, wakeTime, sleepTime,
  currentStreak, longestStreak,
}: Props) {
  const completedCount = Object.values(completions).filter(Boolean).length;
  const waterCount = Object.values(waterData).filter(Boolean).length;
  const totalMinutes = Object.values(timeData).reduce((a, b) => a + b, 0);
  const overallPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const blocksCompleted = Object.values(blockCompletions).filter(Boolean).length;
  const totalBlocks = 16;
  const blocksPercent = Math.round((blocksCompleted / totalBlocks) * 100);

  const getStabilityLevel = (pct: number) => {
    if (pct >= 90) return { label: "Excelente", color: "text-green-500", emoji: "🟢" };
    if (pct >= 70) return { label: "Estable", color: "text-blue-500", emoji: "🔵" };
    if (pct >= 50) return { label: "Regular", color: "text-amber-500", emoji: "🟡" };
    return { label: "Inestable", color: "text-red-500", emoji: "🔴" };
  };

  const combinedPercent = Math.round((overallPercent + blocksPercent) / 2);
  const stability = getStabilityLevel(combinedPercent);

  const getSleepHours = () => {
    if (!wakeTime || !sleepTime) return null;
    const [wh, wm] = wakeTime.split(":").map(Number);
    const [sh, sm] = sleepTime.split(":").map(Number);
    let wake = wh * 60 + wm;
    let sleep = sh * 60 + sm;
    if (wake > sleep) {
      return ((24 * 60 - sleep) + wake) / 60;
    }
    return (wake - sleep + 24 * 60) / 60;
  };

  const showStreak = currentStreak !== undefined && longestStreak !== undefined;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="p-3 text-center">
        <p className="text-2xl mb-0.5">{stability.emoji}</p>
        <p className={cn("text-base font-bold", stability.color)}>{stability.label}</p>
        <p className="text-[10px] text-muted-foreground">Estabilidad</p>
        <Progress value={combinedPercent} className="h-1.5 mt-1" />
      </Card>

      <Card className="p-3 text-center">
        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-0.5" />
        <p className="text-xl font-bold">{completedCount}/{totalHabits}</p>
        <p className="text-[10px] text-muted-foreground">Hábitos</p>
        <Progress value={overallPercent} className="h-1.5 mt-1" />
      </Card>

      <Card className="p-3 text-center">
        <Clock className="h-5 w-5 text-primary mx-auto mb-0.5" />
        <p className="text-xl font-bold">{totalMinutes + workoutDuration}</p>
        <p className="text-[10px] text-muted-foreground">Min totales</p>
      </Card>

      <Card className="p-3 text-center">
        <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-0.5" />
        <p className="text-xl font-bold">{waterCount * 300}ml</p>
        <p className="text-[10px] text-muted-foreground">{waterCount}/7 vasos</p>
      </Card>

      <Card className="p-3 text-center">
        <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-0.5" />
        <p className="text-xl font-bold">{blocksCompleted}/{totalBlocks}</p>
        <p className="text-[10px] text-muted-foreground">Bloques</p>
        <Progress value={blocksPercent} className="h-1.5 mt-1" />
      </Card>

      <Card className="p-3 text-center">
        <Dumbbell className="h-5 w-5 text-orange-500 mx-auto mb-0.5" />
        <p className="text-xl font-bold">{workoutDuration || 0}m</p>
        <p className="text-[10px] text-muted-foreground">Entreno</p>
      </Card>

      <Card className="p-3 text-center">
        <Moon className="h-5 w-5 text-indigo-500 mx-auto mb-0.5" />
        <p className="text-xl font-bold">{wakeTime || "--:--"}</p>
        <p className="text-[10px] text-muted-foreground">Desperté</p>
      </Card>

      <Card className="p-3 text-center col-span-1">
        <p className="text-2xl font-bold text-primary">{combinedPercent}%</p>
        <p className="text-[10px] text-muted-foreground">Puntuación Total</p>
      </Card>

      {showStreak && (
        <Card className="p-3 text-center col-span-1">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-0.5" />
          <p className="text-xl font-bold">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">Racha actual</p>
        </Card>
      )}

      {showStreak && (
        <Card className="p-3 text-center col-span-1">
          <Trophy className="h-5 w-5 text-yellow-600 mx-auto mb-0.5" />
          <p className="text-xl font-bold">{longestStreak}</p>
          <p className="text-[10px] text-muted-foreground">Mejor racha</p>
        </Card>
      )}
    </div>
  );
}
