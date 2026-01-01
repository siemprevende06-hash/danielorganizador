import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Trash2, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutRoutine, WorkoutExercise } from '@/hooks/useWorkoutTracking';

interface ConfigureRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoutine: WorkoutRoutine | null;
  currentExercises: WorkoutExercise[];
  onCreateRoutine: (name: string, workoutDays: Record<string, boolean>, description?: string) => Promise<{ data: any; error: any }>;
  onAddExercise: (routineId: string, name: string, dayOfWeek: string, targetSets: number, targetReps: string, muscleGroup?: string) => Promise<{ error: any }>;
  onRemoveExercise: (exerciseId: string) => Promise<{ error: any }>;
}

const DAYS = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' }
];

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 
  'Core', 'Glúteos', 'Cuádriceps', 'Isquiotibiales', 'Full Body'
];

export const ConfigureRoutineDialog = ({
  open,
  onOpenChange,
  currentRoutine,
  currentExercises,
  onCreateRoutine,
  onAddExercise,
  onRemoveExercise
}: ConfigureRoutineDialogProps) => {
  const [routineName, setRoutineName] = useState(currentRoutine?.name || 'Mi Rutina');
  const [workoutDays, setWorkoutDays] = useState<Record<string, boolean>>(
    currentRoutine?.workout_days || {}
  );
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  
  // New exercise form
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDay, setNewExerciseDay] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('8-12');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  useEffect(() => {
    if (currentRoutine) {
      setRoutineName(currentRoutine.name);
      setWorkoutDays(currentRoutine.workout_days);
    }
  }, [currentRoutine]);

  const toggleDay = (day: string) => {
    setWorkoutDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      toast.error('Ingresa un nombre para la rutina');
      return;
    }

    setIsSavingRoutine(true);
    try {
      const { error } = await onCreateRoutine(routineName, workoutDays);
      if (error) throw error;
      toast.success('Rutina guardada');
    } catch (error) {
      toast.error('Error al guardar rutina');
    } finally {
      setIsSavingRoutine(false);
    }
  };

  const handleAddExercise = async () => {
    if (!currentRoutine) {
      toast.error('Primero guarda la rutina');
      return;
    }

    if (!newExerciseName.trim() || !newExerciseDay) {
      toast.error('Completa nombre y día del ejercicio');
      return;
    }

    setIsAddingExercise(true);
    try {
      const { error } = await onAddExercise(
        currentRoutine.id,
        newExerciseName,
        newExerciseDay,
        parseInt(newExerciseSets) || 3,
        newExerciseReps || '8-12',
        newExerciseMuscle || undefined
      );

      if (error) throw error;

      toast.success('Ejercicio agregado');
      setNewExerciseName('');
      setNewExerciseDay('');
      setNewExerciseSets('3');
      setNewExerciseReps('8-12');
      setNewExerciseMuscle('');
    } catch (error) {
      toast.error('Error al agregar ejercicio');
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      const { error } = await onRemoveExercise(exerciseId);
      if (error) throw error;
      toast.success('Ejercicio eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Group exercises by day
  const exercisesByDay: Record<string, WorkoutExercise[]> = {};
  DAYS.forEach(day => {
    exercisesByDay[day.key] = currentExercises.filter(e => e.day_of_week === day.key);
  });

  const activeDays = DAYS.filter(d => workoutDays[d.key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Configurar Rutina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Routine Name */}
          <div className="space-y-2">
            <Label>Nombre de la Rutina</Label>
            <Input
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Ej: Push/Pull/Legs"
            />
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <Label>Días de Entrenamiento</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <Button
                  key={day.key}
                  type="button"
                  variant={workoutDays[day.key] ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDay(day.key)}
                  className="w-10 h-10"
                >
                  {day.short}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSaveRoutine} 
            disabled={isSavingRoutine}
            className="w-full"
          >
            {isSavingRoutine ? 'Guardando...' : currentRoutine ? 'Actualizar Rutina' : 'Crear Rutina'}
          </Button>

          {/* Exercises Section */}
          {currentRoutine && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Agregar Ejercicio
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Nombre del ejercicio"
                    />
                  </div>
                  
                  <Select value={newExerciseDay} onValueChange={setNewExerciseDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDays.map(day => (
                        <SelectItem key={day.key} value={day.key}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={newExerciseMuscle} onValueChange={setNewExerciseMuscle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Músculo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(group => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={newExerciseSets}
                    onChange={(e) => setNewExerciseSets(e.target.value)}
                    placeholder="Series"
                    type="number"
                  />

                  <Input
                    value={newExerciseReps}
                    onChange={(e) => setNewExerciseReps(e.target.value)}
                    placeholder="Reps (ej: 8-12)"
                  />
                </div>

                <Button 
                  onClick={handleAddExercise}
                  disabled={isAddingExercise}
                  className="w-full mt-3 gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Ejercicio
                </Button>
              </div>

              {/* Current Exercises by Day */}
              {activeDays.map(day => {
                const dayExercises = exercisesByDay[day.key];
                if (dayExercises.length === 0) return null;

                return (
                  <div key={day.key} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{day.label}</h4>
                    <div className="space-y-1">
                      {dayExercises.map(exercise => (
                        <div 
                          key={exercise.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.target_sets}x{exercise.target_reps} • {exercise.muscle_group || 'Sin grupo'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
