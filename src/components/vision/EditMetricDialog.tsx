import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PointBMetric } from '@/hooks/usePointBMetrics';

const AREAS = [
  'universidad', 'emprendimiento', 'proyectos', 'gym',
  'idiomas', 'musica', 'lectura', 'finanzas', 'apariencia',
];

const AREA_LABELS: Record<string, string> = {
  universidad: '🎓 Universidad',
  emprendimiento: '💼 Emprendimiento',
  proyectos: '🚀 Proyectos',
  gym: '💪 Gym',
  idiomas: '🌍 Idiomas',
  musica: '🎵 Música',
  lectura: '📖 Lectura',
  finanzas: '💰 Finanzas',
  apariencia: '✨ Apariencia',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric?: PointBMetric | null;
  onSave: (data: Omit<PointBMetric, 'id'>) => Promise<void>;
}

export function EditMetricDialog({ open, onOpenChange, metric, onSave }: Props) {
  const [area, setArea] = useState(metric?.area || AREAS[0]);
  const [metricName, setMetricName] = useState(metric?.metric_name || '');
  const [currentValue, setCurrentValue] = useState(metric?.current_value?.toString() || '0');
  const [targetValue, setTargetValue] = useState(metric?.target_value?.toString() || '100');
  const [unit, setUnit] = useState(metric?.unit || 'puntos');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (metric) {
      setArea(metric.area);
      setMetricName(metric.metric_name);
      setCurrentValue(metric.current_value.toString());
      setTargetValue(metric.target_value.toString());
      setUnit(metric.unit);
    }
  }, [metric]);

  const handleSave = async () => {
    if (!metricName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        area,
        metric_name: metricName.trim(),
        current_value: parseFloat(currentValue) || 0,
        target_value: parseFloat(targetValue) || 1,
        unit,
        icon: null,
        sort_order: 0,
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{metric ? 'Editar métrica' : 'Nueva métrica Point B'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Área</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map(a => (
                  <SelectItem key={a} value={a}>{AREA_LABELS[a] || a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombre de la métrica</Label>
            <Input value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="Ej: Peso muerto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor actual</Label>
              <Input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
            </div>
            <div>
              <Label>Valor meta</Label>
              <Input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Unidad</Label>
            <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Ej: kg, $, nivel" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!metricName.trim() || saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
