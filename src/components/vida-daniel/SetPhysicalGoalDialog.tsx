import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Target } from 'lucide-react';
import { toast } from 'sonner';

interface SetPhysicalGoalDialogProps {
  onSave: (goal: {
    start_weight: number;
    target_weight: number;
    gym_days_target: number;
    target_date?: string;
  }) => Promise<void>;
  currentGoal?: {
    start_weight: number;
    target_weight: number;
    gym_days_target: number;
    target_date?: string;
  } | null;
}

export const SetPhysicalGoalDialog = ({ onSave, currentGoal }: SetPhysicalGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [startWeight, setStartWeight] = useState(currentGoal?.start_weight?.toString() || '50');
  const [targetWeight, setTargetWeight] = useState(currentGoal?.target_weight?.toString() || '70');
  const [gymDaysTarget, setGymDaysTarget] = useState(currentGoal?.gym_days_target?.toString() || '16');
  const [targetDate, setTargetDate] = useState(currentGoal?.target_date || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const start = parseFloat(startWeight);
    const target = parseFloat(targetWeight);
    const gymDays = parseInt(gymDaysTarget);

    if (isNaN(start) || isNaN(target) || isNaN(gymDays)) {
      toast.error('Por favor ingresa valores válidos');
      return;
    }

    if (target <= start) {
      toast.error('El peso objetivo debe ser mayor al peso inicial');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        start_weight: start,
        target_weight: target,
        gym_days_target: gymDays,
        target_date: targetDate || undefined
      });
      toast.success('Meta física guardada');
      setOpen(false);
    } catch (error) {
      toast.error('Error al guardar la meta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentGoal ? <Settings className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          {currentGoal ? 'Editar Meta' : 'Configurar Meta'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Configurar Meta Física
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startWeight">Peso Inicial (kg)</Label>
              <Input
                id="startWeight"
                type="number"
                step="0.1"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetWeight">Peso Objetivo (kg)</Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gymDays">Días de Gym por Mes</Label>
            <Input
              id="gymDays"
              type="number"
              value={gymDaysTarget}
              onChange={(e) => setGymDaysTarget(e.target.value)}
              placeholder="16"
            />
            <p className="text-xs text-muted-foreground">
              Objetivo de días de entrenamiento mensuales
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Fecha Meta (opcional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-center">
              Meta: <span className="font-bold text-primary">+{(parseFloat(targetWeight) - parseFloat(startWeight)).toFixed(1)}kg</span> de músculo
            </p>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
