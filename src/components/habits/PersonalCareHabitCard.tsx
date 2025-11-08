import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Habit, HabitHistory } from "@/lib/definitions";
import { formatISO } from "date-fns";
import { WeekdayCircle } from "./WeekdayCircle";
import { getWeekDates, getTodayCompletion } from "@/lib/habitUtils";
import { Flame, Award } from "lucide-react";

interface PersonalCareHabitCardProps {
  habit: Habit;
  habitHistory: HabitHistory;
  onToggleClothes: (habitId: string) => void;
  onToggleHair: (habitId: string) => void;
  onTogglePerfume: (habitId: string) => void;
  onClick: () => void;
}

export const PersonalCareHabitCard = ({
  habit,
  habitHistory,
  onToggleClothes,
  onToggleHair,
  onTogglePerfume,
  onClick,
}: PersonalCareHabitCardProps) => {
  const todayStr = formatISO(new Date(), { representation: "date" });
  const history = habitHistory[habit.id] || {
    completedDates: [],
    currentStreak: 0,
    longestStreak: 0,
  };

  const todayEntry = getTodayCompletion(history, todayStr);
  const clothesDone = todayEntry?.healthMetrics?.cleanClothes || false;
  const hairDone = todayEntry?.healthMetrics?.hairGroomed || false;
  const perfumeDone = todayEntry?.healthMetrics?.perfumeApplied || false;

  const Icon = habit.icon;
  const weekDates = getWeekDates();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-t-lg" />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h3 className="font-semibold text-lg">{habit.title}</h3>
        </div>

        {/* Streaks */}
        <div className="flex items-center gap-4 text-sm mt-2">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{history.currentStreak}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{history.longestStreak}</span>
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

        {/* Checkboxes */}
        <div
          className="space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Checkbox
              checked={clothesDone}
              onCheckedChange={() => onToggleClothes(habit.id)}
            />
            <span className="text-sm">Ropa Limpia</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={hairDone}
              onCheckedChange={() => onToggleHair(habit.id)}
            />
            <span className="text-sm">Pelo Arreglado</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={perfumeDone}
              onCheckedChange={() => onTogglePerfume(habit.id)}
            />
            <span className="text-sm">Perfume Aplicado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
