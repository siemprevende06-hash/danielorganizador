import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, Settings } from 'lucide-react';
import { WorkoutRoutine, WorkoutExercise } from '@/hooks/useWorkoutTracking';

interface WorkoutRoutineCardProps {
  routine: WorkoutRoutine | null;
  exercises: WorkoutExercise[];
  todayWorkout: {
    dayName: string;
    isWorkoutDay: boolean;
    exercises: WorkoutExercise[];
  };
  onConfigureClick: () => void;
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'L',
  tuesday: 'M',
  wednesday: 'X',
  thursday: 'J',
  friday: 'V',
  saturday: 'S',
  sunday: 'D'
};

export const WorkoutRoutineCard = ({ 
  routine, 
  exercises, 
  todayWorkout,
  onConfigureClick 
}: WorkoutRoutineCardProps) => {
  if (!routine) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium text-muted-foreground">Sin rutina configurada</p>
            <p className="text-sm text-muted-foreground/70">Configura tu rutina semanal de entrenamiento</p>
          </div>
          <Button onClick={onConfigureClick} className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar Rutina
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group exercises by day
  const exercisesByDay: Record<string, WorkoutExercise[]> = {};
  DAYS_ORDER.forEach(day => {
    exercisesByDay[day] = exercises.filter(e => e.day_of_week === day);
  });

  // Get unique muscle groups per day for labels
  const getDayLabel = (day: string) => {
    const dayExercises = exercisesByDay[day];
    if (dayExercises.length === 0) return null;
    
    const groups = [...new Set(dayExercises.map(e => e.muscle_group).filter(Boolean))];
    return groups.length > 0 ? groups[0] : 'Entrenamiento';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {routine.name}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onConfigureClick}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Days of week visual */}
        <div className="flex justify-between gap-1">
          {DAYS_ORDER.map(day => {
            const isWorkoutDay = routine.workout_days[day];
            const label = getDayLabel(day);
            
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{DAY_LABELS[day]}</span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isWorkoutDay 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isWorkoutDay ? '🏋️' : '⚪'}
                </div>
                {label && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[40px]">
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Today's workout */}
        {todayWorkout.isWorkoutDay && (
          <div className="bg-primary/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Hoy ({todayWorkout.dayName})</span>
            </div>
            {todayWorkout.exercises.length > 0 ? (
              <ul className="space-y-1">
                {todayWorkout.exercises.map(exercise => (
                  <li key={exercise.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {exercise.name} - {exercise.target_sets}x{exercise.target_reps}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay ejercicios configurados para hoy</p>
            )}
          </div>
        )}

        {!todayWorkout.isWorkoutDay && (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              🛋️ Hoy ({todayWorkout.dayName}) es día de descanso
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
