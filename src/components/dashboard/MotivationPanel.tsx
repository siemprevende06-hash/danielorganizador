import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Target, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitHistory } from "@/lib/definitions";

interface MotivationPanelProps {
  habitHistory: HabitHistory;
  productivityData: any;
}

export default function MotivationPanel({ habitHistory, productivityData }: MotivationPanelProps) {
  const stats = useMemo(() => {
    const totalStreaks = Object.values(habitHistory).reduce(
      (sum, habit) => sum + (habit.currentStreak || 0),
      0
    );
    const longestStreak = Math.max(
      ...Object.values(habitHistory).map((h) => h.longestStreak || 0),
      0
    );
    const score = productivityData?.average?.score || 0;

    return { totalStreaks, longestStreak, score };
  }, [habitHistory, productivityData]);

  const motivationalMessage = useMemo(() => {
    if (stats.score >= 80) {
      return {
        title: "¡Imparable! 🔥",
        message: "Estás en tu mejor momento. Sigue así, campeón.",
        color: "text-emerald-500",
      };
    }
    if (stats.score >= 60) {
      return {
        title: "¡Buen ritmo! 💪",
        message: "Vas por el camino correcto. No bajes la guardia.",
        color: "text-green-500",
      };
    }
    if (stats.score >= 40) {
      return {
        title: "Empujando fuerte ⚡",
        message: "Hay margen de mejora. Cada esfuerzo cuenta.",
        color: "text-yellow-500",
      };
    }
    return {
      title: "Un paso a la vez 🎯",
      message: "Mañana es una nueva oportunidad. No te rindas.",
      color: "text-orange-500",
    };
  }, [stats.score]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Panel de Motivación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
          <h3 className={cn("text-2xl font-bold", motivationalMessage.color)}>
            {motivationalMessage.title}
          </h3>
          <p className="text-muted-foreground italic">{motivationalMessage.message}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.totalStreaks}</div>
            <div className="text-xs text-muted-foreground">Rachas Totales</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.longestStreak}</div>
            <div className="text-xs text-muted-foreground">Racha Más Larga</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{Math.round(stats.score)}%</div>
            <div className="text-xs text-muted-foreground">Score Hoy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
