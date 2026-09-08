import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Trophy } from "lucide-react";
import { WorkoutExercise, ExerciseLog } from "@/hooks/useWorkoutTracking";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  exercises: WorkoutExercise[];
  logs: ExerciseLog[];
}

interface ExerciseOverload {
  exercise: WorkoutExercise;
  last: { date: string; weight: number; reps: number[] } | null;
  prev: { date: string; weight: number; reps: number[] } | null;
  weightDelta: number | null;
  repsIncreased: boolean;
  isPr: boolean;
  suggestion: string | null;
  volumeKg: number;
}

const sum = (arr: number[]) => arr.filter(n => typeof n === "number" && !isNaN(n)).reduce((a, b) => a + b, 0);
const maxW = (log: ExerciseLog) => Number(log.weight_kg) || 0;

export const ProgressiveOverloadPanel = ({ exercises, logs }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const data: ExerciseOverload[] = useMemo(() => {
    return exercises.map(ex => {
      const exLogs = logs
        .filter(l => l.exercise_id === ex.id)
        .sort((a, b) => b.log_date.localeCompare(a.log_date) || b.created_at.localeCompare(a.created_at));

      if (exLogs.length === 0) {
        return { exercise: ex, last: null, prev: null, weightDelta: null, repsIncreased: false, isPr: false, suggestion: null, volumeKg: 0 };
      }

      const last = exLogs[0];
      const prev = exLogs[1];
      const lastW = maxW(last);
      const repsTotal = sum(last.reps_per_set);
      const lastObj = { date: last.log_date, weight: lastW, reps: last.reps_per_set };

      let prevObj = null;
      let weightDelta: number | null = null;
      let repsIncreased = false;
      let isPr = !!last.is_pr;

      if (prev) {
        const prevW = maxW(prev);
        prevObj = { date: prev.log_date, weight: prevW, reps: prev.reps_per_set };
        if (lastW > 0) weightDelta = Number((lastW - prevW).toFixed(1));
        repsIncreased = sum(last.reps_per_set) > sum(prev.reps_per_set) && lastW >= prevW;
      }

      // Suggestion logic
      let suggestion: string | null = null;
      if (lastW > 0 && prevObj) {
        if (repsIncreased && lastW >= prevObj.weight) {
          suggestion = `Subiste reps manteniendo el peso. Prueba subir a ${Math.round((lastW + 2.5) * 10) / 10} kg la próxima vez.`;
        } else if (weightDelta !== null && weightDelta > 0 && repsTotal > 0) {
          suggestion = "Mantén o sube el peso para seguir progresando.";
        }
      }

      const volumeKg = last.reps_per_set.reduce((acc, r, i) => acc + r * ((last.weights_per_set && last.weights_per_set[i]) || lastW || 0), 0);

      return {
        exercise: ex,
        last: lastObj,
        prev: prevObj,
        weightDelta,
        repsIncreased,
        isPr,
        suggestion,
        volumeKg
      };
    }).filter(o => o.last !== null);
  }, [exercises, logs]);

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Sobrecarga progresiva</h3>
        </div>
        <p className="text-xs text-muted-foreground">Entrena y registra tus series para ver tu evolución de fuerza aquí.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Sobrecarga progresiva</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Compara tu último entrenamiento con el anterior y detecta avances.</p>

      <div className="space-y-2">
        {data.map(o => {
          const open = expanded === o.exercise.id;
          return (
            <div key={o.exercise.id} className="rounded-lg border p-2.5">
              <button className="flex items-center justify-between w-full text-left" onClick={() => setExpanded(open ? null : o.exercise.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{o.exercise.name}</span>
                  {o.isPr && (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[9px] gap-0.5">
                      <Trophy className="h-2.5 w-2.5" /> PR
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {o.weightDelta !== null && (
                    <span className={cn(
                      "text-xs font-bold flex items-center gap-0.5",
                      o.weightDelta > 0 ? "text-green-600" : o.weightDelta < 0 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {o.weightDelta > 0 ? <ArrowUpRight className="h-3 w-3" /> : o.weightDelta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {o.weightDelta > 0 ? "+" : ""}{o.weightDelta} kg
                    </span>
                  )}
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                {o.last && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">{o.last.weight || 0} kg</span>
                    <span>· {o.last.reps.join(", ")} reps</span>
                    <span>({o.last.date.slice(5)})</span>
                  </div>
                )}
              </div>

              {open && (
                <div className="mt-2 space-y-1.5 bg-muted/40 rounded-lg p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded bg-background/60 p-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Último</p>
                      {o.last ? (
                        <p className="text-xs font-semibold">{o.last.weight || 0} kg · {o.last.reps.join(", ")} reps</p>
                      ) : <p className="text-xs text-muted-foreground">—</p>}
                    </div>
                    <div className="rounded bg-background/60 p-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Anterior</p>
                      {o.prev ? (
                        <p className="text-xs">{o.prev.weight || 0} kg · {o.prev.reps.join(", ")} reps</p>
                      ) : <p className="text-xs text-muted-foreground">—</p>}
                    </div>
                  </div>
                  {o.repsIncreased && (
                    <p className="text-[10px] text-green-600 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> Aumentaste el número de reps
                    </p>
                  )}
                  {o.suggestion && (
                    <p className="text-[10px] text-primary flex items-start gap-1">
                      <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" /> {o.suggestion}
                    </p>
                  )}
                  {!o.suggestion && !o.repsIncreased && (
                    <p className="text-[10px] text-muted-foreground">Sin cambio destacado. Mantén la constancia.</p>
                  )}
                  <div className="flex justify-between text-[9px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Volumen {Math.round(o.volumeKg)} kg</span>
                    <span>1er registro: {o.prev ? o.prev.date : o.last?.date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
