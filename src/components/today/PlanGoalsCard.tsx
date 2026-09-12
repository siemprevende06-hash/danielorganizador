import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Brain } from "lucide-react";
import { AREA_LABELS, ALL_HIERARCHY_AREAS, getDayGoalEffective, getDayGoalTotal } from "@/lib/hierarchy";
import { cn } from "@/lib/utils";

const INTENSITY_LABEL: Record<string, string> = { minimo: "Mín", maximo: "Máx", extra: "Extra" };
const INTENSITY_CLS: Record<string, string> = {
  minimo: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  maximo: "bg-green-500/15 text-green-500 border-green-500/30",
  extra: "bg-amber-500/15 text-amber-500 border-amber-500/30",
};
const INTENSITY_BASE_MIN: Record<string, number> = { lectura: 30, ajedrez: 20, game: 20, idiomas: 30, gym: 60, musica: 30 };
const SYSTEM_NAMES: Record<string, string> = { lectura: "Lectura", ajedrez: "Ajedrez", game: "Game", idiomas: "Idiomas", gym: "Gym", musica: "Música" };
const ESTIMATED_MULTIPLIER: Record<string, number> = { minimo: 0.5, maximo: 1, extra: 1.5 };

interface PlanGoalsCardProps {
  date: Date;
  planGoals?: Record<string, number> | null;
  planIntensity?: Record<string, string> | null;
  plannedTasks?: number;
}

export function PlanGoalsCard({ date, planGoals, planIntensity, plannedTasks }: PlanGoalsCardProps) {
  const goalFor = (a: string) => Math.max(0, planGoals?.[a] || getDayGoalEffective(date, a) || 0);
  const rows = ALL_HIERARCHY_AREAS
    .map(a => ({ area: a, label: AREA_LABELS[a] || a, min: goalFor(a) }))
    .filter(r => r.min > 0);
  const total = getDayGoalTotal(date, planGoals);

  const intensityEntries = Object.entries(planIntensity || {})
    .map(([id, v]) => ({
      id,
      v,
      label: SYSTEM_NAMES[id] || id,
      est: Math.round((INTENSITY_BASE_MIN[id] || 30) * (ESTIMATED_MULTIPLIER[v] ?? 1)),
    }))
    .filter(x => x.v === "minimo" || x.v === "maximo" || x.v === "extra");

  if (rows.length === 0 && intensityEntries.length === 0 && !plannedTasks) return null;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">Metas de minutos del día</h2>
          {plannedTasks != null && (
            <Badge variant="secondary" className="text-[10px] ml-auto">{plannedTasks} tareas planificadas</Badge>
          )}
        </div>
        {rows.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rows.map(r => (
                <div key={r.area} className="rounded-xl bg-muted/30 p-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground truncate">{r.label}</span>
                  <span className="text-xs font-bold tabular-nums">{r.min} min</span>
                </div>
              ))}
              <div className="rounded-xl bg-indigo-500/10 p-2.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Total</span>
                <span className="text-xs font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{total} min</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground">Sin metas de minutos planificadas para este día.</p>
        )}
        {intensityEntries.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <Brain className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-semibold">Intensidad de sistemas</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {intensityEntries.map(x => (
                <div key={x.id} className="rounded-xl bg-muted/30 p-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground truncate">{x.label}</span>
                  <Badge className={cn("text-[9px] border", INTENSITY_CLS[x.v])}>{INTENSITY_LABEL[x.v]} · ~{x.est} min</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}