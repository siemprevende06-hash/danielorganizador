import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutineStreakCardProps {
  currentStreak: number;
  maxStreak: number;
  totalDaysCompleted: number;
  weeklyCompletion: boolean[];
}

export const RoutineStreakCard = ({
  currentStreak,
  maxStreak,
  totalDaysCompleted,
  weeklyCompletion,
}: RoutineStreakCardProps) => {
  const getStreakColor = () => {
    if (currentStreak >= 30) return "text-yellow-500";
    if (currentStreak >= 14) return "text-orange-500";
    if (currentStreak >= 7) return "text-red-500";
    return "text-muted-foreground";
  };

  const getStreakMessage = () => {
    if (currentStreak >= 30) return "¡Racha legendaria! 🔥";
    if (currentStreak >= 14) return "¡Dos semanas de disciplina!";
    if (currentStreak >= 7) return "¡Una semana completa!";
    if (currentStreak >= 3) return "¡Construyendo el hábito!";
    if (currentStreak > 0) return "¡Sigue así!";
    return "¡Comienza tu racha hoy!";
  };

  return (
    <Card className="bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className={cn("h-5 w-5", getStreakColor())} />
          Racha de Rutina
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Streak Display */}
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className={cn("text-5xl font-bold", getStreakColor())}>
              {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground">Días consecutivos</p>
          </div>
          
          <div className="h-16 w-px bg-border" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Máximo: {maxStreak} días</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Total: {totalDaysCompleted} días</span>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center">
          <Badge variant="secondary" className="text-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            {getStreakMessage()}
          </Badge>
        </div>

        {/* Weekly View */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">Esta Semana</p>
          <div className="flex justify-center gap-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
              const today = new Date().getDay();
              const dayIndex = today === 0 ? 6 : today - 1;
              const isToday = index === dayIndex;
              
              return (
                <div
                  key={day}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    weeklyCompletion[index]
                      ? "bg-green-500 text-white"
                      : index < dayIndex
                      ? "bg-red-500/80 text-white"
                      : "bg-muted text-muted-foreground",
                    isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
