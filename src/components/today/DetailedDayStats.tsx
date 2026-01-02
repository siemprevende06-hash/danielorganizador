import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Target, Flame, Clock, TrendingUp, Calendar } from "lucide-react";

interface QuarterlyGoal {
  id: string;
  title: string;
  category: string;
  progress: number;
  targetDate?: string;
  daysRemaining?: number;
}

interface DayStats {
  quarterlyGoals: QuarterlyGoal[];
  gymStreak: number;
  studyHoursToday: number;
  currentWeek: number;
  daysInQuarter: number;
  daysRemainingInQuarter: number;
}

export function DetailedDayStats() {
  const [stats, setStats] = useState<DayStats>({
    quarterlyGoals: [],
    gymStreak: 0,
    studyHoursToday: 0,
    currentWeek: 1,
    daysInQuarter: 84,
    daysRemainingInQuarter: 84,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetailedStats();
  }, []);

  const loadDetailedStats = async () => {
    try {
      // Get current quarter info
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3) + 1;
      const quarterStartMonth = (currentQuarter - 1) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
      const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      
      const daysInQuarter = 84; // 12 weeks
      const daysSinceStart = differenceInDays(now, quarterStart);
      const currentWeek = Math.min(12, Math.ceil((daysSinceStart + 1) / 7));
      const daysRemainingInQuarter = Math.max(0, daysInQuarter - daysSinceStart);

      // Get quarterly goals
      const { data: goals } = await supabase
        .from("twelve_week_goals")
        .select("*")
        .eq("quarter", currentQuarter)
        .eq("year", now.getFullYear())
        .eq("status", "active");

      const quarterlyGoals: QuarterlyGoal[] = (goals || []).map(goal => {
        const targetDate = goal.target_value ? new Date(goal.target_value) : quarterEnd;
        return {
          id: goal.id,
          title: goal.title,
          category: goal.category,
          progress: goal.progress_percentage || 0,
          targetDate: format(targetDate, "d MMM", { locale: es }),
          daysRemaining: differenceInDays(targetDate, now),
        };
      });

      // Calculate gym streak
      let gymStreak = 0;
      const { data: habitHistory } = await supabase
        .from("habit_history")
        .select("completed_dates")
        .eq("habit_id", "gym");

      if (habitHistory && habitHistory[0]?.completed_dates) {
        const dates = (habitHistory[0].completed_dates as any[])
          .map(d => d.date)
          .sort((a, b) => b.localeCompare(a));

        const today = format(now, "yyyy-MM-dd");
        let checkDate = today;
        
        for (const date of dates) {
          if (date === checkDate) {
            gymStreak++;
            // Move to previous day
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = format(prevDate, "yyyy-MM-dd");
          } else {
            break;
          }
        }
      }

      setStats({
        quarterlyGoals,
        gymStreak,
        studyHoursToday: 0, // Could be calculated from habit tracking
        currentWeek,
        daysInQuarter,
        daysRemainingInQuarter,
      });
    } catch (error) {
      console.error("Error loading detailed stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      universidad: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      emprendimiento: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      gym: "bg-green-500/10 text-green-600 border-green-500/20",
      idiomas: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      proyectos: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48 p-4" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quarter Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Progreso del Trimestre
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Semana {stats.currentWeek}/12
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs">
              <span>Días transcurridos</span>
              <span className="font-medium">
                {stats.daysInQuarter - stats.daysRemainingInQuarter}/{stats.daysInQuarter}
              </span>
            </div>
            <Progress 
              value={((stats.daysInQuarter - stats.daysRemainingInQuarter) / stats.daysInQuarter) * 100} 
              className="h-2"
            />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Quedan:</span>
              <span className="font-medium">{stats.daysRemainingInQuarter} días</span>
            </div>
            {stats.gymStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-muted-foreground">Gym:</span>
                <span className="font-medium">{stats.gymStreak} días</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Goals Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Metas Trimestrales
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.quarterlyGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Sin metas activas para este trimestre
            </p>
          ) : (
            stats.quarterlyGoals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${getCategoryColor(goal.category)}`}
                      >
                        {goal.category}
                      </Badge>
                      {goal.daysRemaining !== undefined && goal.daysRemaining <= 7 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          {goal.daysRemaining}d
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{goal.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{goal.progress}%</span>
                  </div>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Meta: {goal.targetDate}</span>
                  {goal.progress < 100 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {goal.daysRemaining !== undefined && goal.daysRemaining > 0
                        ? `${Math.ceil((100 - goal.progress) / goal.daysRemaining)}%/día necesario`
                        : "Fecha límite alcanzada"
                      }
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
