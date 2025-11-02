import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Shirt, Droplet } from "lucide-react";
import type { HabitHistory } from "@/lib/definitions";
import { formatISO, isToday, parseISO } from "date-fns";

interface AttractionPillarProps {
  habitHistory: HabitHistory;
}

export default function AttractionPillar({ habitHistory }: AttractionPillarProps) {
  const appearanceHabits = [
    { id: "habit-cuidado-personal", name: "Cuidado Personal", icon: Shirt },
    { id: "habit-skincare", name: "Skincare", icon: Droplet },
  ];

  const getHabitProgress = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    const history = habitHistory[habitId];
    if (!history) return 0;

    const todayEntry = history.completedDates?.find(
      (d) => d && d.date === todayStr && d.status === "completed"
    );
    return todayEntry ? 100 : 0;
  };

  const totalProgress =
    appearanceHabits.reduce((sum, habit) => sum + getHabitProgress(habit.id), 0) /
    appearanceHabits.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Pilar de Atracción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            {Math.round(totalProgress)}%
          </div>
          <p className="text-sm text-muted-foreground">Progreso de Apariencia</p>
        </div>

        <div className="space-y-3">
          {appearanceHabits.map((habit) => {
            const Icon = habit.icon;
            const progress = getHabitProgress(habit.id);
            return (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{habit.name}</span>
                  </div>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
