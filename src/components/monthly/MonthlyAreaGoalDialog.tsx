import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MonthlyAreaGoal {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string | null;
  priority: 'low' | 'medium' | 'high';
}

interface MonthlyAreaGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: MonthlyAreaGoal;
  selectedAreaId?: string;
  monthStart: string;
  monthEnd: string;
  onSuccess: () => void;
}

const AREAS = [
  { value: 'universidad', label: 'Universidad', icon: '🎓' },
  { value: 'emprendimiento', label: 'Emprendimiento', icon: '💼' },
  { value: 'proyectos', label: 'Proyectos', icon: '🚀' },
  { value: 'gym', label: 'Gimnasio', icon: '💪' },
  { value: 'idiomas', label: 'Idiomas', icon: '🗣️' },
  { value: 'lectura', label: 'Lectura', icon: '📚' },
  { value: 'musica', label: 'Música', icon: '🎵' },
  { value: 'general', label: 'General', icon: '📋' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export function MonthlyAreaGoalDialog({
  open, onOpenChange, goal, selectedAreaId, monthStart, monthEnd, onSuccess,
}: MonthlyAreaGoalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area_id: selectedAreaId || 'general',
    title: '',
    description: '',
    target_value: '0',
    current_value: '0',
    unit: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (goal) {
      setFormData({
        area_id: goal.area_id,
        title: goal.title,
        description: goal.description || '',
        target_value: goal.target_value.toString(),
        current_value: goal.current_value.toString(),
        unit: goal.unit || '',
        priority: goal.priority,
      });
    } else if (selectedAreaId) {
      setFormData((prev) => ({ ...prev, area_id: selectedAreaId }));
    }
  }, [goal, selectedAreaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        area_id: formData.area_id,
        title: formData.title,
        description: formData.description || null,
        target_value: parseFloat(formData.target_value),
        current_value: parseFloat(formData.current_value),
        unit: formData.unit || null,
        priority: formData.priority,
        month_start: monthStart,
        month_end: monthEnd,
      };

      if (goal) {
        const { error } = await (supabase as any)
          .from('monthly_area_goals')
          .update(dataToSave)
          .eq('id', goal.id);
        if (error) throw error;
        toast({ title: 'Objetivo actualizado' });
      } else {
        const { error } = await (supabase as any)
          .from('monthly_area_goals')
          .insert([dataToSave]);
        if (error) throw error;
        toast({ title: 'Objetivo creado' });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el objetivo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      area_id: selectedAreaId || 'general',
      title: '', description: '', target_value: '0', current_value: '0', unit: '', priority: 'medium',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !goal) resetForm(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Objetivo Mensual' : 'Nuevo Objetivo Mensual'}</DialogTitle>
          <DialogDescription>Define un objetivo específico para alcanzar este mes.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Área</Label>
            <Select value={formData.area_id} onValueChange={(v) => setFormData({ ...formData, area_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona un área" /></SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    <span className="flex items-center gap-2"><span>{a.icon}</span><span>{a.label}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Ej: Completar 20 horas de estudio" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Detalles..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Meta *</Label>
              <Input type="number" min="0" step="0.1" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input placeholder="horas, páginas" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Progreso Actual</Label>
              <Input type="number" min="0" step="0.1" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={formData.priority} onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {goal ? 'Actualizar' : 'Crear'} Objetivo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
