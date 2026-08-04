import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { lifeAreas } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AddDestinoGoalDialogProps {
  defaultAreaId?: string;
  onCreate: (data: {
    title: string;
    dailySystem: string;
    areaId: string | null;
    targetDate: string;
    planItems: string[];
  }) => Promise<void>;
}

export function AddDestinoGoalDialog({ defaultAreaId, onCreate }: AddDestinoGoalDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dailySystem, setDailySystem] = useState('');
  const [areaId, setAreaId] = useState(defaultAreaId || '');
  const [targetDate, setTargetDate] = useState('');
  const [planItems, setPlanItems] = useState('');

  const reset = () => {
    setTitle('');
    setDailySystem('');
    setAreaId(defaultAreaId || '');
    setTargetDate('');
    setPlanItems('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'Falta el título', description: 'Escribe qué meta quieres alcanzar', variant: 'destructive' });
      return;
    }
    try {
      await onCreate({
        title: title.trim(),
        dailySystem: dailySystem.trim(),
        areaId: areaId || null,
        targetDate,
        planItems: planItems.split('\n').map(l => l.trim()).filter(Boolean),
      });
      toast({ title: 'Meta creada 🎯' });
      setOpen(false);
      reset();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Añadir Meta</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva meta de destino</DialogTitle>
          <DialogDescription>Define el destino, el sistema diario que te lleva allí y el plan desglosado</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>🎯 La meta</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Aprender 10 canciones de piano"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">🔄 Sistema diario</Label>
            <Input
              value={dailySystem}
              onChange={(e) => setDailySystem(e.target.value)}
              placeholder="Ej: 30 minutos de práctica diaria"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área de vida</Label>
              <Select value={areaId || undefined} onValueChange={setAreaId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un área" /></SelectTrigger>
                <SelectContent>
                  {lifeAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha objetivo</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>✅ Plan desglosado</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-1">Un item por línea (ej: las canciones que quieres aprender)</p>
            <Textarea
              value={planItems}
              onChange={(e) => setPlanItems(e.target.value)}
              placeholder={'Clair de Lune\nFür Elise\nRiver Flows in You'}
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">Crear meta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
