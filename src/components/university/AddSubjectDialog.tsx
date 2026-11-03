import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo'),
  code: z.string().max(50).optional(),
  professor: z.string().max(100).optional(),
  schedule: z.string().max(200).optional()
});

export interface NewSubjectData {
  name: string;
  code?: string;
  professor?: string;
  schedule?: string;
}

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  semester: number;
  onSubmit: (data: NewSubjectData) => Promise<boolean>;
}

export function AddSubjectDialog({ open, onOpenChange, year, semester, onSubmit }: AddSubjectDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setCode('');
      setProfessor('');
      setSchedule('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (isSubmitting) return;

    try {
      const validated = subjectSchema.parse({
        name,
        code: code.trim() || undefined,
        professor: professor.trim() || undefined,
        schedule: schedule.trim() || undefined
      });

      setIsSubmitting(true);
      const success = await onSubmit(validated);
      if (success) {
        setName('');
        setCode('');
        setProfessor('');
        setSchedule('');
        onOpenChange(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ variant: 'destructive', title: 'Error', description: error.errors[0].message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Nueva Asignatura
          </DialogTitle>
          <DialogDescription>
            Se añadirá al {semester}° semestre del {year}° año.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject-name">Nombre *</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cálculo I"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject-code">Código</Label>
              <Input
                id="subject-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAT-101"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject-professor">Profesor</Label>
              <Input
                id="subject-professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Nombre"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject-schedule">Horario</Label>
            <Textarea
              id="subject-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Lunes y Miércoles 8:00-10:00"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Asignatura
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
