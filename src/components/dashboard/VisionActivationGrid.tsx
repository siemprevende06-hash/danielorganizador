import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Zap, TrendingUp } from "lucide-react";
import type { HabitHistory } from "@/lib/definitions";

interface VisionActivationGridProps {
  habitHistory: HabitHistory;
}

export default function VisionActivationGrid({ habitHistory }: VisionActivationGridProps) {
  const visionAreas = [
    {
      title: "Salud y Energía",
      icon: Zap,
      habits: ["habit-entrenamiento", "habit-sueño"],
      color: "text-success",
    },
    {
      title: "Maestría Profesional",
      icon: Target,
      habits: ["habit-universidad", "habit-proyectos-personales"],
      color: "text-primary",
    },
    {
      title: "Disciplina Mental",
      icon: TrendingUp,
      habits: ["habit-no-fap", "habit-planificacion"],
      color: "text-warning",
    },
  ];

  const getAreaProgress = (habitIds: string[]) => {
    const completed = habitIds.filter((id) => {
      const history = habitHistory[id];
      return history && history.currentStreak > 0;
    }).length;
    return (completed / habitIds.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activación de Visión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visionAreas.map((area) => {
            const progress = getAreaProgress(area.habits);
            const Icon = area.icon;
            return (
              <div key={area.title} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${area.color}`} />
                  <Badge variant={progress >= 50 ? "default" : "secondary"}>
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm">{area.title}</h4>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
