import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Dumbbell, Play, Box } from "lucide-react";
import { WorkoutRoutine, WorkoutExercise, TrainingType } from "@/hooks/useWorkoutTracking";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface Props {
  routine: WorkoutRoutine;
  exercises: WorkoutExercise[];
  getExercisesByDay: (day: string) => WorkoutExercise[];
  onStartWorkout: (dayKey: string, dayName: string) => void;
  trainingType: TrainingType;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo"
};

export const WorkoutPlanner = ({ routine, exercises, getExercisesByDay, onStartWorkout, trainingType }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const activeDays = DAY_KEYS.filter(d => routine.workout_days[d]);
  const selectedExercises = selected ? getExercisesByDay(selected) : [];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Planificar entrenamiento</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Selecciona un día de la semana para ver su rutina y comenzar el entrenamiento en ese día.
      </p>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {DAY_KEYS.map(d => {
          const count = getExercisesByDay(d).length;
          const isActive = routine.workout_days[d];
          const isSelected = selected === d;
          return (
            <button
              key={d}
              onClick={() => setSelected(isSelected ? null : d)}
              title={`${DAY_LABELS[d]} - ${count} ejercicios`}
              className={`flex flex-col items-center rounded-lg py-2 text-[11px] transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : isActive
                    ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
                    : "bg-muted/40 border-border opacity-60 hover:opacity-100"
              }`}
            >
              <span className="font-semibold">{DAY_LABELS[d].slice(0, 2)}</span>
              <span className="text-[9px] opacity-80">{count > 0 ? count : "—"}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold capitalize">{DAY_LABELS[selected]}</span>
            <Badge variant="secondary" className="text-[10px]">{selectedExercises.length} ejercicios</Badge>
          </div>
          {selectedExercises.length === 0 ? (
            <p className="text-xs text-muted-foreground">Este día no tiene ejercicios programados.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedExercises.map(ex => (
                <div key={ex.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
                  {trainingType === 'gimnasio'
                    ? <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                    : <Box className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-medium flex-1">{ex.name}</span>
                  <span className="text-xs text-muted-foreground">{ex.target_sets}×{ex.target_reps}</span>
                  {ex.muscle_group && <Badge variant="outline" className="text-[9px]">{ex.muscle_group}</Badge>}
                </div>
              ))}
            </div>
          )}
          {selectedExercises.length > 0 && (
            <Button
              size="sm"
              className="w-full gap-1"
              onClick={() => onStartWorkout(selected, DAY_LABELS[selected])}
            >
              <Play className="h-4 w-4" /> Comenzar entrenamiento de {DAY_LABELS[selected]}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
