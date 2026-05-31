import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Target, Flame, TrendingUp } from 'lucide-react';
import type { ReviewObjective } from '@/hooks/usePeriodicReview';

const AREAS = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'musica', label: 'Música' },
  { id: 'lectura', label: 'Lectura' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'salud', label: 'Salud' },
  { id: 'general', label: 'General' },
];

interface ObjectivesListProps {
  type: 'effort' | 'result';
  objectives: ReviewObjective[];
  onAdd: (obj: Omit<ReviewObjective, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ReviewObjective>) => void;
  onRemove: (id: string) => void;
}

export function ObjectivesList({ type, objectives, onAdd, onUpdate, onRemove }: ObjectivesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState('general');
  const [newTarget, setNewTarget] = useState('');

  const isEffort = type === 'effort';
  const icon = isEffort ? <Flame className="h-5 w-5 text-orange-500" /> : <Target className="h-5 w-5 text-primary" />;
  const title = isEffort ? 'Objetivos de Esfuerzo' : 'Objetivos de Resultados';
  const subtitle = isEffort ? 'Consistencia y hábitos' : 'Metas y logros concretos';

  const avgScore = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + o.score, 0) / objectives.length)
    : 0;

  const handleAdd = () => {
    if (!newTitle.trim() || !newTarget.trim()) return;
    onAdd({
      area: newArea,
      title: newTitle,
      target: newTarget,
      actual: '',
      score: 0,
    });
    setNewTitle('');
    setNewArea('general');
    setNewTarget('');
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {objectives.length > 0 && (
              <Badge variant={avgScore >= 70 ? 'default' : avgScore >= 40 ? 'secondary' : 'destructive'}>
                {avgScore}%
              </Badge>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isEffort ? 'Nuevo Objetivo de Esfuerzo' : 'Nuevo Objetivo de Resultados'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Área</label>
                    <Select value={newArea} onValueChange={setNewArea}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AREAS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {isEffort ? 'Ej: Ir al gimnasio 5 días' : 'Ej: Aprobar parcial de Cálculo'}
                    </label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      placeholder={isEffort ? 'Estudiar 3h diarias' : 'Sacar 80+ en examen'} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Meta específica</label>
                    <Input value={newTarget} onChange={e => setNewTarget(e.target.value)}
                      placeholder={isEffort ? '5/7 días' : 'Nota ≥ 80'} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAdd}>Agregar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {objectives.map(obj => (
          <div key={obj.id} className="p-3 rounded-lg border bg-accent/30 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {AREAS.find(a => a.id === obj.area)?.label || obj.area}
                  </Badge>
                  <span className="text-sm font-medium">{obj.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Meta: {obj.target}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                onClick={() => onRemove(obj.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Resultado real</label>
                <Input
                  value={obj.actual}
                  onChange={e => onUpdate(obj.id, { actual: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Ej: 4/7 días"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Cumplimiento: {obj.score}%</label>
                <Slider
                  value={[obj.score]}
                  onValueChange={([v]) => onUpdate(obj.id, { score: v })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>

            <Progress
              value={obj.score}
              className={`h-1 ${
                obj.score >= 80 ? '[&>div]:bg-green-500' :
                obj.score >= 50 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-destructive'
              }`}
            />
          </div>
        ))}

        {objectives.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isEffort
              ? 'Agrega objetivos de esfuerzo: constancia, hábitos, disciplina'
              : 'Agrega objetivos de resultados: notas, logros, métricas concretas'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
