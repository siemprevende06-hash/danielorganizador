import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Exam } from '@/hooks/useExams';

interface UpdateExamProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam | null;
  onSubmit: (examId: string, data: {
    current_study_hours?: number;
    current_exercises?: number;
    status?: string;
    grade?: number;
  }) => Promise<boolean>;
}

export function UpdateExamProgressDialog({ open, onOpenChange, exam, onSubmit }: UpdateExamProgressDialogProps) {
  const [addHours, setAddHours] = useState('');
  const [addExercises, setAddExercises] = useState('');
  const [status, setStatus] = useState('pending');
  const [grade, setGrade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (exam) {
      setStatus(exam.status);
      setGrade(exam.grade?.toString() || '');
      setAddHours('');
      setAddExercises('');
    }
  }, [exam]);

  const handleSubmit = async () => {
    if (!exam) return;

    setIsSubmitting(true);
    try {
      const hoursToAdd = parseFloat(addHours) || 0;
      const exercisesToAdd = parseInt(addExercises) || 0;

      const updateData: {
        current_study_hours?: number;
        current_exercises?: number;
        status?: string;
        grade?: number;
      } = {};

      if (hoursToAdd > 0) {
        updateData.current_study_hours = exam.current_study_hours + hoursToAdd;
      }
      if (exercisesToAdd > 0) {
        updateData.current_exercises = exam.current_exercises + exercisesToAdd;
      }
      if (status !== exam.status) {
        updateData.status = status;
      }
      if (grade && parseFloat(grade) !== exam.grade) {
        updateData.grade = parseFloat(grade);
      }

      if (Object.keys(updateData).length > 0) {
        const success = await onSubmit(exam.id, updateData);
        if (success) {
          onOpenChange(false);
        }
      } else {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Actualizar Progreso</DialogTitle>
          <DialogDescription>{exam.title}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="addHours">+ Horas estudiadas</Label>
              <Input
                id="addHours"
                type="number"
                value={addHours}
                onChange={(e) => setAddHours(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-muted-foreground">
                Actual: {exam.current_study_hours}/{exam.target_study_hours}h
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addExercises">+ Ejercicios</Label>
              <Input
                id="addExercises"
                type="number"
                value={addExercises}
                onChange={(e) => setAddExercises(e.target.value)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Actual: {exam.current_exercises}/{exam.target_exercises}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="passed">Aprobado</SelectItem>
                <SelectItem value="failed">Reprobado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === 'passed' || status === 'failed') && (
            <div className="space-y-2">
              <Label htmlFor="grade">Nota obtenida</Label>
              <Input
                id="grade"
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
