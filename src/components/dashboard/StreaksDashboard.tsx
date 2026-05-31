import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreaksDashboardProps {
  routineBlocks?: Array<{
    weeklyCompletion: boolean[];
    currentStreak?: number;
    maxStreak?: number;
  }>;
}

export function StreaksDashboard({ routineBlocks = [] }: StreaksDashboardProps) {
  // Calculate streaks from routine blocks
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  
  // Calculate weekly completion
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weeklyStatus = weekDays.map((_, idx) => {
    if (routineBlocks.length === 0) return idx <= dayIndex ? Math.random() > 0.3 : null;
    const completedBlocks = routineBlocks.filter(b => b.weeklyCompletion[idx]).length;
    const totalBlocks = routineBlocks.length;
    return completedBlocks >= totalBlocks * 0.7;
  });

  // Calculate current streak
  let currentStreak = 0;
  for (let i = dayIndex; i >= 0; i--) {
    if (weeklyStatus[i]) currentStreak++;
    else break;
  }
  // Add previous weeks' streak (mock - in real app would come from DB)
  currentStreak += Math.floor(Math.random() * 10);
  
  // Best streak (mock data)
  const bestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 10);
  
  // Weekly completion count
  const daysCompletedThisWeek = weeklyStatus.filter(s => s === true).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Rachas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Racha actual</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{bestStreak}</div>
            <div className="text-xs text-muted-foreground">Mejor racha</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{daysCompletedThisWeek}/7</div>
            <div className="text-xs text-muted-foreground">Esta semana</div>
          </div>
        </div>

        {/* Weekly Visual */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Semana actual</div>
          <div className="flex justify-between gap-1">
            {weekDays.map((day, idx) => (
              <div key={day} className="flex-1 text-center">
                <div
                  className={cn(
                    "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                    weeklyStatus[idx] === true && "bg-green-500 text-white",
                    weeklyStatus[idx] === false && idx <= dayIndex && "bg-red-500/20 text-red-500",
                    weeklyStatus[idx] === null && "bg-muted text-muted-foreground"
                  )}
                >
                  {weeklyStatus[idx] === true ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    day
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
