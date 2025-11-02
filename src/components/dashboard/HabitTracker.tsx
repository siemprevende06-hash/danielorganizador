import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { habits as allHabits } from "@/lib/data";
import type { HabitHistory, Task } from "@/lib/definitions";
import { formatISO, isToday, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface HabitTrackerProps {
  habitHistory: HabitHistory;
  setHabitHistory: (history: HabitHistory) => void;
  todayTasks: Task[];
}

export default function HabitTracker({ habitHistory, setHabitHistory, todayTasks }: HabitTrackerProps) {
  const { toast } = useToast();
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  const toggleHabit = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    const newHistory = { ...habitHistory };

    if (!newHistory[habitId]) {
      newHistory[habitId] = { completedDates: [], currentStreak: 0, longestStreak: 0 };
    }

    const todayIndex = newHistory[habitId].completedDates.findIndex((d) => d.date === todayStr);

    if (todayIndex > -1) {
      newHistory[habitId].completedDates.splice(todayIndex, 1);
      newHistory[habitId].currentStreak = Math.max(0, newHistory[habitId].currentStreak - 1);
    } else {
      newHistory[habitId].completedDates.push({
        date: todayStr,
        status: "completed",
        duration: timers[habitId] || 0,
      });
      newHistory[habitId].currentStreak += 1;
      newHistory[habitId].longestStreak = Math.max(
        newHistory[habitId].longestStreak,
        newHistory[habitId].currentStreak
      );
      toast({
        title: "¡Hábito completado! 🎉",
        description: `Racha: ${newHistory[habitId].currentStreak} días`,
      });
    }

    setHabitHistory(newHistory);
  };

  const isHabitCompleted = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    return habitHistory[habitId]?.completedDates?.some(
      (d) => d.date === todayStr && d.status === "completed"
    );
  };

  return (
    <div className="space-y-4">
      {allHabits.map((habit) => {
        const completed = isHabitCompleted(habit.id);
        const streak = habitHistory[habit.id]?.currentStreak || 0;

        return (
          <Card key={habit.id} className={cn(completed && "bg-muted/50")}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={completed}
                  onCheckedChange={() => toggleHabit(habit.id)}
                  className="h-6 w-6"
                />
                <div>
                  <div className={cn("font-semibold", completed && "line-through text-muted-foreground")}>
                    {habit.title}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{streak} días</span>
                    </div>
                  )}
                </div>
              </div>
              {completed && <Badge variant="default">Completado</Badge>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
