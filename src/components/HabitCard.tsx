import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Flame, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitHistory } from "@/lib/definitions";
import { formatISO } from "date-fns";
import { WeekdayCircle } from "./habits/WeekdayCircle";
import { getWeekDates, getTodayCompletion, getTodayDuration } from "@/lib/habitUtils";

interface HabitCardProps {
  habit: Habit;
  habitHistory: HabitHistory;
  onUpdateStatus: (habitId: string, status: "completed" | "failed") => void;
  onClick: () => void;
}

export const HabitCard = ({
  habit,
  habitHistory,
  onUpdateStatus,
  onClick,
}: HabitCardProps) => {
  const todayStr = formatISO(new Date(), { representation: "date" });
  const history = habitHistory[habit.id] || {
    completedDates: [],
    currentStreak: 0,
    longestStreak: 0,
  };

  const todayEntry = getTodayCompletion(history, todayStr);
  const todayStatus = todayEntry?.status;
  const todayDuration = getTodayDuration(history, todayStr);
  const Icon = habit.icon;

  const weekDates = getWeekDates();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-primary to-primary/50 rounded-t-lg" />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h3 className="font-semibold text-lg">{habit.title}</h3>
        </div>

        {/* Streaks and Duration */}
        <div className="flex items-center gap-4 text-sm mt-2">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{history.currentStreak}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{history.longestStreak}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{todayDuration} min</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week View */}
        <div className="flex justify-between gap-1">
          {weekDates.map((date) => {
            const dateStr = formatISO(date, { representation: "date" });
            const entry = history.completedDates.find((e) => e.date === dateStr);
            const status = entry?.status === 'skipped' ? undefined : entry?.status;
            return <WeekdayCircle key={dateStr} date={date} status={status} />;
          })}
        </div>

        {/* Action Buttons */}
        <div
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant={todayStatus === "completed" ? "default" : "outline"}
            className={cn(
              "flex-1",
              todayStatus === "completed" && "bg-green-500 hover:bg-green-600"
            )}
            onClick={() => onUpdateStatus(habit.id, "completed")}
          >
            <Check className="h-4 w-4 mr-1" />
            Completado
          </Button>
          <Button
            variant={todayStatus === "failed" ? "default" : "outline"}
            className={cn(
              "flex-1",
              todayStatus === "failed" && "bg-destructive hover:bg-destructive/90"
            )}
            onClick={() => onUpdateStatus(habit.id, "failed")}
          >
            <X className="h-4 w-4 mr-1" />
            Fallado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
