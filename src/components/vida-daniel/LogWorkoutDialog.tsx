import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Dumbbell, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutExercise } from '@/hooks/useWorkoutTracking';

interface LogWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: WorkoutExercise[];
  onLog: (
    exerciseId: string,
    weightKg: number,
    setsCompleted: number,
    repsPerSet: number[],
    notes?: string
  ) => Promise<{ error: any }>;
}

export const LogWorkoutDialog = ({ 
  open, 
  onOpenChange, 
  exercises, 
  onLog 
}: LogWorkoutDialogProps) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSet = () => {
    setReps([...reps, '']);
  };

  const handleRemoveSet = (index: number) => {
    if (reps.length > 1) {
      setReps(reps.filter((_, i) => i !== index));
    }
  };

  const handleRepChange = (index: number, value: string) => {
    const newReps = [...reps];
    newReps[index] = value;
    setReps(newReps);
  };

  const handleSave = async () => {
    if (!selectedExercise) {
      toast.error('Selecciona un ejercicio');
      return;
    }

    const weightKg = parseFloat(weight);
    if (isNaN(weightKg) || weightKg <= 0) {
      toast.error('Ingresa un peso válido');
      return;
    }

    const repsPerSet = reps.map(r => parseInt(r) || 0).filter(r => r > 0);
    if (repsPerSet.length === 0) {
      toast.error('Ingresa al menos una serie con repeticiones');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await onLog(
        selectedExercise,
        weightKg,
        repsPerSet.length,
        repsPerSet,
        notes || undefined
      );

      if (error) throw error;

      toast.success('Entrenamiento registrado');
      onOpenChange(false);
      
      // Reset form
      setSelectedExercise('');
      setWeight('');
      setReps(['']);
      setNotes('');
    } catch (error) {
      toast.error('Error al registrar');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedExerciseData = exercises.find(e => e.id === selectedExercise);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Registrar Entrenamiento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Ejercicio</Label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona ejercicio" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(exercise => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name} ({exercise.muscle_group || 'Sin grupo'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedExerciseData && (
              <p className="text-xs text-muted-foreground">
                Objetivo: {selectedExerciseData.target_sets}x{selectedExerciseData.target_reps}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Series (repeticiones por serie)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleAddSet}
                className="h-7 gap-1"
              >
                <Plus className="h-3 w-3" />
                Serie
              </Button>
            </div>
            <div className="space-y-2">
              {reps.map((rep, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-12">
                    Serie {index + 1}:
                  </span>
                  <Input
                    type="number"
                    value={rep}
                    onChange={(e) => handleRepChange(index, e.target.value)}
                    placeholder="Reps"
                    className="flex-1"
                  />
                  {reps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSet(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sensaciones, dificultad, etc."
              rows={2}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Registrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
