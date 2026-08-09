import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(1000).optional(),
  due_date: z.string().optional(),
  task_type: z.enum(['delivery', 'study']),
  estimated_minutes: z.number().min(5).max(600).optional()
});

interface AddSubjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: { id: string; name: string }[];
  onSubmit: (data: {
    subject_id: string;
    title: string;
    description?: string;
    due_date?: string;
    task_type: 'delivery' | 'study';
    estimated_minutes?: number;
  }) => Promise<boolean>;
}

export function AddSubjectTaskDialog({ open, onOpenChange, subjects, onSubmit }: AddSubjectTaskDialogProps) {
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskType, setTaskType] = useState<'delivery' | 'study'>('delivery');
  const [minutes, setMinutes] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      if (!subjectId) {
        toast({ variant: "destructive", title: "Error", description: "Selecciona una asignatura" });
        return;
      }

      const validated = taskSchema.parse({
        title,
        description: description || undefined,
        due_date: dueDate || undefined,
        task_type: taskType,
        estimated_minutes: taskType === 'study' ? parseInt(minutes) || 30 : undefined
      });

      setIsSubmitting(true);
      const success = await onSubmit({
        subject_id: subjectId,
        title: validated.title,
        description: validated.description,
        due_date: validated.due_date,
        task_type: validated.task_type,
        estimated_minutes: validated.estimated_minutes
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
    setSubjectId('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setTaskType('delivery');
    setMinutes('30');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Tarea</DialogTitle>
          <DialogDescription>Asigna una tarea a una asignatura</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjectSelect">Asignatura</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subjectSelect">
                <SelectValue placeholder="Seleccionar asignatura..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskType">Tipo de Tarea</Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as 'delivery' | 'study')}>
              <SelectTrigger id="taskType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">📄 Tarea a Entregar</SelectItem>
                <SelectItem value="study">📚 Tiempo de Estudio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskTitle">Título</Label>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={taskType === 'delivery' ? "Ej: Resolver ejercicios Cap. 5" : "Ej: Estudiar derivadas"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDescription">Descripción (opcional)</Label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="taskDate">Fecha</Label>
              <Input id="taskDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            {taskType === 'study' && (
              <div className="space-y-2">
                <Label htmlFor="taskMinutes">Duración (min)</Label>
                <Input id="taskMinutes" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} min="5" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Agregar Tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}