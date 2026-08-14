import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Dumbbell, Trophy } from "lucide-react";
import { useStrengthGoals, MAIN_LIFTS } from "@/hooks/useStrengthGoals";
import { WorkoutExercise, ExerciseHistoryPoint } from "@/hooks/useWorkoutTracking";
import { ExerciseProgressChart } from "./ExerciseProgressChart";

interface Props {
  exercises: WorkoutExercise[];
  getHistory: (exerciseId: string) => ExerciseHistoryPoint[];
}

const LIFT_KEYWORDS: Record<string, string[]> = {
  press_banca: ["banca", "press"],
  biceps: ["biceps", "curl"],
  triceps: ["triceps", "frances", "extension"],
  hombro: ["hombro", "militar", "press"],
  dominadas: ["dominad", "pull", "jalon", "remo"],
};

const matchExercise = (keywords: string[], exercises: WorkoutExercise[]) => {
  return exercises.find(ex => {
    const name = ex.name.toLowerCase();
    return keywords.some(k => name.includes(k));
  });
};

export const StrengthPanel = ({ exercises, getHistory }: Props) => {
  const { goals, loading } = useStrengthGoals();
  const [expanded, setExpanded] = useState<string | null>(null);

  const best = (points: ExerciseHistoryPoint[]) => points.reduce((m, p) => Math.max(m, p.e1rm), 0);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Fuerza</h3>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {MAIN_LIFTS.map(lift => {
            const ex = matchExercise(LIFT_KEYWORDS[lift.key], exercises);
            const goal = goals.find(g => g.exercise_key === lift.key);
            const points = ex ? getHistory(ex.id) : [];
            const bestE1rm = best(points);
            const wpct = goal && goal.target_weight_kg > 0 ? Math.min(100, Math.round((goal.current_weight_kg / goal.target_weight_kg) * 100)) : 0;
            const open = expanded === lift.key;
            return (
              <div key={lift.key} className="p-2.5 rounded-lg border">
                <button className="flex items-center justify-between w-full text-left" onClick={() => setExpanded(open ? null : lift.key)}>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{lift.name}</span>
                    {ex && <span className="text-[10px] text-muted-foreground">({ex.name})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {points.length > 0 && <span className="text-xs font-bold text-primary">1RM {bestE1rm} kg</span>}
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {goal && goal.target_weight_kg > 0 && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{goal.current_weight_kg} kg</span>
                      <span>→ {goal.target_weight_kg} kg</span>
                    </div>
                    <Progress value={wpct} className="h-1.5" />
                  </div>
                )}
                {open && points.length > 0 && (
                  <div className="mt-2">
                    <ExerciseProgressChart points={points} showReps={false} />
                    {points.length === 1 && <p className="text-[10px] text-muted-foreground">Completa mas sesiones para ver la curva de 1RM</p>}
                  </div>
                )}
                {points.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic mt-1">Sin registros. Entrena y registra este lift.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};