import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AREAS: { id: string; label: string; source: string }[] = [
  { id: 'universidad', label: 'Universidad', source: 'university' },
  { id: 'emprendimiento', label: 'Emprendimiento', source: 'entrepreneurship' },
  { id: 'proyectos', label: 'Proyectos', source: 'projects' },
  { id: 'idiomas', label: 'Idiomas', source: 'general' },
  { id: 'gym', label: 'Gym', source: 'general' },
  { id: 'lectura', label: 'Lectura', source: 'general' },
  { id: 'musica', label: 'Música', source: 'general' },
  { id: 'ajedrez', label: 'Ajedrez', source: 'general' },
  { id: 'finanzas', label: 'Finanzas', source: 'general' },
  { id: 'general', label: 'Tareas generales', source: 'general' },
];

const PRIORITIES = [
  { id: 'high', label: 'Alta' },
  { id: 'medium', label: 'Media' },
  { id: 'low', label: 'Baja' },
];

export interface CreateTaskPeriodButtonProps {
  /** Inclusive start of the selected timeline */
  start: Date;
  /** Inclusive end of the selected timeline */
  end: Date;
  /** "Hoy", "esta semana", "este mes", "este trimestre" */
  periodLabel: string;
  /** Date pre-filled in the form (defaults to start) */
  defaultDate?: Date;
  className?: string;
}

const clamp = (d: Date, start: Date, end: Date) => (d < start ? start : d > end ? end : d);

export function CreateTaskPeriodButton({
  start, end, periodLabel, defaultDate, className,
}: CreateTaskPeriodButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState('general');
  const [priority, setPriority] = useState('medium');
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');
  const [dueDate, setDueDate] = useState(format(clamp(defaultDate || start, start, end), 'yyyy-MM-dd'));

  useEffect(() => {
    setDueDate(format(clamp(defaultDate || start, start, end), 'yyyy-MM-dd'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startStr, endStr]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Escribe un título para la tarea');
      return;
    }
    setSaving(true);
    try {
      const area = AREAS.find(a => a.id === areaId);
      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        area_id: areaId,
        source: area?.source || 'general',
        priority,
        due_date: `${dueDate}T12:00:00`,
        completed: false,
        status: 'pendiente',
        user_id: null,
      });
      if (error) throw error;

      ['periodAreaTasks', 'resultadosPeriodo', 'weeklyTasks', 'monthlyTasks', 'weeklyData', 'dailyPlanData', 'tasks']
        .forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

      toast.success('Tarea creada');
      setTitle('');
      setOpen(false);
    } catch (e: any) {
      console.error('Error creating task', e);
      toast.error(e.message || 'Error al crear la tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={className}>
          <Plus className="h-4 w-4 mr-1.5" />
          Crear tarea por área
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea · {periodLabel}</DialogTitle>
          <DialogDescription>
            La tarea se asigna a un área y queda dentro de la línea de tiempo seleccionada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ctp-title">Título</Label>
            <Input
              id="ctp-title"
              placeholder="Ej: Estudiar Álgebra 1h"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !saving && handleCreate()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Área</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREAS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ctp-date">Fecha</Label>
            <Input
              id="ctp-date"
              type="date"
              value={dueDate}
              min={startStr}
              max={endStr}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
