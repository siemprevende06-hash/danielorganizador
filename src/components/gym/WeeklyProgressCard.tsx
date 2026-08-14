import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp } from "lucide-react";
import { ExerciseLog, SessionWithLogs } from "@/hooks/useWorkoutTracking";

interface Props {
  sessions: SessionWithLogs[];
  logs: ExerciseLog[];
  exercises: { id: string; name: string }[];
}

const inWindow = (dateStr: string, from: Date, to: Date) => {
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
  return d >= from && d < to;
};

export const WeeklyProgressCard = ({ sessions, logs, exercises }: Props) => {
  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const twoWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);

  const thisWeekLogs = logs.filter(l => inWindow(l.log_date, weekAgo, now));
  const lastWeekLogs = logs.filter(l => inWindow(l.log_date, twoWeeksAgo, weekAgo));

  const nameById = new Map(exercises.map(e => [e.id, e.name]));
  const prNames = Array.from(new Set(
    thisWeekLogs.filter(l => l.is_pr).map(l => nameById.get(l.exercise_id) || "Ejercicio")
  ));

  const volumeOf = (list: SessionWithLogs[]) => list.reduce((sum, s) => {
    for (const log of s.exercise_logs || []) {
      const reps = Array.isArray(log.reps_per_set) ? log.reps_per_set.filter((r): r is number => typeof r === 'number' && !isNaN(r)) : [];
      const weights = Array.isArray(log.weights_per_set) && log.weights_per_set.length === reps.length
        ? log.weights_per_set
        : reps.map(() => Number(log.weight_kg) || 0);
      sum += reps.reduce((a, r, i) => a + r * (weights[i] || 0), 0);
    }
    return sum;
  }, 0);

  const volumeThisWeek = volumeOf(sessions.filter(s => inWindow(s.started_at, weekAgo, now)));
  const volumeLastWeek = volumeOf(sessions.filter(s => inWindow(s.started_at, twoWeeksAgo, weekAgo)));

  const improved = new Set<string>();
  const maxWeight = (list: ExerciseLog[]) => list.reduce((m, l) => Math.max(m, Number(l.weight_kg) || 0), 0);
  for (const ex of exercises) {
    const nowW = maxWeight(thisWeekLogs.filter(l => l.exercise_id === ex.id));
    const prevW = maxWeight(lastWeekLogs.filter(l => l.exercise_id === ex.id));
    if (nowW > 0 && nowW > prevW) improved.add(ex.name);
  }

  const volumeDelta = volumeLastWeek > 0 ? Math.round(((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100) : null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold">Resumen de la semana</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-lg font-bold text-primary">{thisWeekLogs.length}</p>
          <p className="text-[10px] text-muted-foreground">entrenos</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-lg font-bold text-primary">{Math.round(volumeThisWeek)}</p>
          <p className="text-[10px] text-muted-foreground">kg volumen</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-lg font-bold text-primary">{improved.size}</p>
          <p className="text-[10px] text-muted-foreground">mejorados</p>
        </div>
      </div>
      {volumeDelta !== null && (
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {volumeDelta >= 0 ? "+" : ""}{volumeDelta}% de volumen vs semana anterior
        </p>
      )}
      {prNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {prNames.map(n => (
            <Badge key={n} className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">{n} PR</Badge>
          ))}
        </div>
      )}
    </Card>
  );
};
