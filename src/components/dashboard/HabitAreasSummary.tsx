import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, Briefcase } from "lucide-react";
import { habits as allHabits, lifeAreas, centralAreas } from "@/lib/data";
import type { HabitHistory } from "@/lib/definitions";
import { formatISO } from "date-fns";

interface HabitAreasSummaryProps {
  habitHistory: HabitHistory;
}

export default function HabitAreasSummary({ habitHistory }: HabitAreasSummaryProps) {
  const areaStats = useMemo(() => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    const areas = [...lifeAreas, ...centralAreas];

    return areas.map((area) => {
      const areaHabits = allHabits.filter((h) => h.areaId === area.id);
      const completed = areaHabits.filter((h) =>
        habitHistory[h.id]?.completedDates?.some((d) => d.date === todayStr && d.status === "completed")
      ).length;
      const progress = areaHabits.length > 0 ? (completed / areaHabits.length) * 100 : 0;

      return {
        area,
        completed,
        total: areaHabits.length,
        progress,
      };
    }).filter((stat) => stat.total > 0);
  }, [habitHistory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen por Áreas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {areaStats.map((stat) => {
            const Icon = stat.area.icon;
            return (
              <div key={stat.area.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{stat.area.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stat.completed}/{stat.total}
                  </span>
                </div>
                <Progress value={stat.progress} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
