import { useState } from 'react';
import { usePointBMetrics } from '@/hooks/usePointBMetrics';
import { PointBMetricCard } from '@/components/vision/PointBMetricCard';
import { EditMetricDialog } from '@/components/vision/EditMetricDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Compass, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VisionPage() {
  const { metrics, groupedByArea, loading, addMetric, updateMetric, deleteMetric } = usePointBMetrics();
  const [showEdit, setShowEdit] = useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);

  const overallProgress = metrics.length > 0
    ? Math.round(metrics.reduce((a, m) => a + (m.target_value > 0 ? (m.current_value / m.target_value) * 100 : 0), 0) / metrics.length)
    : 0;

  const completedMetrics = metrics.filter(m => m.current_value >= m.target_value).length;

  const handleSaveMetric = async (data: any) => {
    if (editingMetric) {
      await updateMetric(editingMetric.id, data);
      toast.success('Métrica actualizada');
    } else {
      await addMetric(data);
      toast.success('Métrica añadida');
    }
  };

  const handleDeleteMetric = async (id: string) => {
    await deleteMetric(id);
    toast.success('Métrica eliminada');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              Mi Point B
            </h1>
            <p className="text-sm text-muted-foreground">
              Métricas concretas que definen mi visión de futuro
            </p>
          </div>
          <Button onClick={() => { setEditingMetric(null); setShowEdit(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Añadir métrica
          </Button>
        </div>

        {/* Overall Progress */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">Progreso global hacia mi Point B</p>
              <p className="text-5xl font-bold text-primary">{overallProgress}%</p>
              <Badge variant="secondary" className="mt-2">
                {completedMetrics}/{metrics.length} métricas alcanzadas
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {overallProgress >= 80 ? '🎉 Muy cerca de tu visión' :
               overallProgress >= 50 ? '💪 Buen progreso, sigue así' :
               overallProgress >= 25 ? '📈 Avanzando paso a paso' :
               '🌱 Empieza desde donde estás'}
            </p>
          </CardContent>
        </Card>

        {/* Metrics by Area */}
        {Object.keys(groupedByArea).length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="p-12 text-center">
              <Compass className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">Define tu Point B</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Añade métricas concretas para cada área de tu vida. 
                ¿Qué números definirían que llegaste a donde querías?
              </p>
              <Button onClick={() => { setEditingMetric(null); setShowEdit(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Añadir primera métrica
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByArea).map(([area, areaMetrics]) => (
            <Card key={area}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="capitalize">{area}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {areaMetrics.filter(m => m.current_value >= m.target_value).length}/{areaMetrics.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {areaMetrics.map(metric => (
                  <div key={metric.id} className="relative group">
                    <PointBMetricCard
                      metric={metric}
                      onEdit={() => { setEditingMetric(metric); setShowEdit(true); }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDeleteMetric(metric.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}

        {/* Empty state for some areas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Áreas sin métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Aún no has definido métricas para todas las áreas. Cada área puede tener múltiples métricas.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setEditingMetric(null); setShowEdit(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Añadir métrica
            </Button>
          </CardContent>
        </Card>
      </div>

      <EditMetricDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        metric={editingMetric}
        onSave={handleSaveMetric}
      />
    </div>
  );
}
