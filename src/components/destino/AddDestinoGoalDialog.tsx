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
import { Plus, ShieldCheck, TrendingUp, Target } from 'lucide-react';
import { lifeAreas } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const GOAL_STAGES = [
  {
    id: 'sosten',
    label: 'Sostén',
    icon: ShieldCheck,
    emoji: '🏗️',
    description: 'Rutinas y hábitos: constancia hasta que se vuelven estilo de vida',
  },
  {
    id: 'mejora',
    label: 'Mejora acumulativa',
    icon: TrendingUp,
    emoji: '📈',
    description: 'Llegar a un punto de comodidad donde ya eres suficientemente bueno',
  },
  {
    id: 'enfoque',
    label: 'Enfoque',
    icon: Target,
    emoji: '🎯',
    description: 'Resultados mínimos y tangibles que quieres conseguir',
  },
] as const;

export type GoalStage = (typeof GOAL_STAGES)[number]['id'];

interface AddDestinoGoalDialogProps {
  defaultAreaId?: string;
  defaultStage?: GoalStage;
  onCreate: (data: {
    title: string;
    dailySystem: string;
    areaId: string | null;
    stage: GoalStage;
    targetDate: string;
    planItems: string[];
  }) => Promise<void>;
}

export function AddDestinoGoalDialog({ defaultAreaId, defaultStage, onCreate }: AddDestinoGoalDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dailySystem, setDailySystem] = useState('');
  const [areaId, setAreaId] = useState(defaultAreaId || '');
  const [stage, setStage] = useState<GoalStage>(defaultStage || 'mejora');
  const [targetDate, setTargetDate] = useState('');
  const [planItems, setPlanItems] = useState('');

  const reset = () => {
    setTitle('');
    setDailySystem('');
    setAreaId(defaultAreaId || '');
    setStage(defaultStage || 'mejora');
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
        stage,
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
          <DialogDescription>Define el destino, la etapa del camino, el sistema diario y el plan desglosado</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Etapa */}
          <div>
            <Label>🛤️ Etapa del camino</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {GOAL_STAGES.map(s => {
                const Icon = s.icon;
                const active = stage === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStage(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {GOAL_STAGES.find(s => s.id === stage)?.description}
            </p>
          </div>

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