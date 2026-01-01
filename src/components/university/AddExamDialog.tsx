import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const examSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200, "El título es muy largo"),
  exam_date: z.string().min(1, "La fecha es requerida"),
  preparation_days: z.number().min(1).max(365),
  target_study_hours: z.number().min(0).max(1000),
  target_exercises: z.number().min(0).max(10000),
  topics: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional()
});

interface AddExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  onSubmit: (data: {
    subject_id: string;
    title: string;
    exam_date: string;
    preparation_days: number;
    target_study_hours: number;
    target_exercises: number;
    topics?: string;
    notes?: string;
  }) => Promise<boolean>;
}

export function AddExamDialog({ open, onOpenChange, subjectId, subjectName, onSubmit }: AddExamDialogProps) {
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [preparationDays, setPreparationDays] = useState('14');
  const [targetStudyHours, setTargetStudyHours] = useState('20');
  const [targetExercises, setTargetExercises] = useState('50');
  const [topics, setTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      const validated = examSchema.parse({
        title,
        exam_date: examDate,
        preparation_days: parseInt(preparationDays) || 14,
        target_study_hours: parseFloat(targetStudyHours) || 20,
        target_exercises: parseInt(targetExercises) || 50,
        topics: topics || undefined,
        notes: notes || undefined
      });

      setIsSubmitting(true);
      const success = await onSubmit({
        subject_id: subjectId,
        title: validated.title,
        exam_date: validated.exam_date,
        preparation_days: validated.preparation_days,
        target_study_hours: validated.target_study_hours,
        target_exercises: validated.target_exercises,
        topics: validated.topics,
        notes: validated.notes
      });

      if (success) {
        resetForm();
        onOpenChange(false);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setExamDate('');
    setPreparationDays('14');
    setTargetStudyHours('20');
    setTargetExercises('50');
    setTopics('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Examen</DialogTitle>
          <DialogDescription>Crea un examen para {subjectName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Examen</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Primer Parcial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Fecha del Examen</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prepDays">Días de prep.</Label>
              <Input
                id="prepDays"
                type="number"
                value={preparationDays}
                onChange={(e) => setPreparationDays(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studyHours">Horas estudio</Label>
              <Input
                id="studyHours"
                type="number"
                value={targetStudyHours}
                onChange={(e) => setTargetStudyHours(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercises">Ejercicios</Label>
              <Input
                id="exercises"
                type="number"
                value={targetExercises}
                onChange={(e) => setTargetExercises(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Temas a estudiar</Label>
            <Textarea
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Lista los temas del examen..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas personales..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Examen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
