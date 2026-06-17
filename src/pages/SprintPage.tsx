import { useState } from 'react';
import { useSprints, type SprintObjective } from '@/hooks/useSprints';
import { usePointBMetrics } from '@/hooks/usePointBMetrics';
import { useSystemsTracking, type SystemsData } from '@/hooks/useSystemsTracking';
import { SprintHeader } from '@/components/sprint/SprintHeader';
import { FocoObjectiveCard } from '@/components/sprint/FocoObjectiveCard';
import { MejoraObjectiveCard } from '@/components/sprint/MejoraObjectiveCard';
import { CreateSprintDialog } from '@/components/sprint/CreateSprintDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, Crosshair, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AREAS_FOCO = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
];

const AREAS_MEJORA = [
  { id: 'gym', label: 'Gym' },
  { id: 'piano', label: 'Piano' },
  { id: 'guitarra', label: 'Guitarra' },
  { id: 'lectura', label: 'Lectura' },
  { id: 'ajedrez', label: 'Ajedrez' },
  { id: 'idiomas', label: 'Idiomas' },
];

const AREA_LABELS: Record<string, string> = {
  universidad: '🎓', emprendimiento: '💼', proyectos: '🚀',
  gym: '💪', piano: '🎹', guitarra: '🎸', lectura: '📖',
  ajedrez: '♟️', idiomas: '🌍',
};

const AREA_TO_PB: Record<string, { label: string; metric: string }> = {
  gym: { label: 'Salud / Físico', metric: 'Masa muscular' },
  piano: { label: 'Mente / Música', metric: 'Habilidad musical' },
  guitarra: { label: 'Mente / Música', metric: 'Habilidad musical' },
  lectura: { label: 'Mente', metric: 'Libros leídos' },
  idiomas: { label: 'Mente / Idiomas', metric: 'Nivel de idiomas' },
  universidad: { label: 'Carrera', metric: 'Título universitario' },
  emprendimiento: { label: 'Carrera / Emprendimiento', metric: 'Ingresos del negocio' },
  proyectos: { label: 'Carrera', metric: 'Portafolio' },
};

export default function SprintPage() {
  const { sprints, activeSprint, loading, createSprint, addObjective, updateObjective, completeSprint, deleteSprint } = useSprints();
  const { groupedByArea } = usePointBMetrics();
  const { data: systemsData } = useSystemsTracking();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [newObjective, setNewObjective] = useState({
    area: 'universidad',
    type: 'foco' as 'foco' | 'mejora',
    title: '',
    target_value: 30,
    unit: 'horas',
    min_daily: 15,
    max_daily: 30,
  });

  const handleCreateSprint = async (name: string, startDate: string, endDate: string) => {
    await createSprint(name, startDate, endDate);
    toast.success('Sprint creado');
  };

  const handleAddObjective = async () => {
    if (!activeSprint || !newObjective.title.trim()) return;
    await addObjective(activeSprint.id, {
      area: newObjective.area,
      type: newObjective.type,
      title: newObjective.title.trim(),
      description: null,
      target_value: newObjective.target_value,
      current_value: 0,
      unit: newObjective.unit,
      min_daily: newObjective.type === 'mejora' ? newObjective.min_daily : null,
      max_daily: newObjective.type === 'mejora' ? newObjective.max_daily : null,
      status: 'pending',
    });
    setShowAddObjective(false);
    setNewObjective({ area: 'universidad', type: 'foco', title: '', target_value: 30, unit: 'horas', min_daily: 15, max_daily: 30 });
    toast.success('Objetivo añadido');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const focoObjectives = activeSprint?.objectives.filter(o => o.type === 'foco') || [];
  const mejoraObjectives = activeSprint?.objectives.filter(o => o.type === 'mejora') || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Sprint
            </h1>
            <p className="text-sm text-muted-foreground">
              Objetivos con fecha límite para alcanzar tu Point B
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Sprint
          </Button>
        </div>

        {sprints.length > 0 && !activeSprint && (
          <Card className="border-2 border-muted">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-2">No hay sprint activo.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Crear nuevo sprint
              </Button>
            </CardContent>
          </Card>
        )}

        {sprints.length === 0 && (
          <Card className="border-2 border-dashed border-muted-foreground/30">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">Sin sprints aún</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea tu primer sprint con objetivos en cada área
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Crear Sprint
              </Button>
            </CardContent>
          </Card>
        )}

        {activeSprint && (
          <>
            <SprintHeader
              sprint={activeSprint}
              onComplete={() => { completeSprint(activeSprint.id); toast.success('Sprint completado 🎉'); }}
              onDelete={() => { deleteSprint(activeSprint.id); toast.success('Sprint eliminado'); }}
            />

            {/* FOCO OBJECTIVES */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Foco — Objetivos con deadline
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Universidad · Emprendimiento · Proyectos
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => {
                  setNewObjective(prev => ({ ...prev, type: 'foco', area: 'universidad', unit: 'tareas' }));
                  setShowAddObjective(true);
                }}>
                  <Plus className="h-3 w-3" /> Añadir
                </Button>
              </CardHeader>
              <CardContent>
                {focoObjectives.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Sin objetivos de foco en este sprint</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => {
                      setNewObjective(prev => ({ ...prev, type: 'foco', area: 'universidad', unit: 'tareas' }));
                      setShowAddObjective(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Añadir objetivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {focoObjectives.map(obj => (
                      <div key={obj.id} className="relative">
                        <FocoObjectiveCard
                          objective={obj}
                          onUpdate={(updates) => updateObjective(obj.id, updates)}
                        />
                        <PointBLink area={obj.area} groupedByArea={groupedByArea} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MEJORA OBJECTIVES */}
            <Card className="border-purple-500/20">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Mejora — Metas por acumulación
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Gym · Piano · Guitarra · Lectura · Ajedrez · Idiomas
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => {
                  setNewObjective(prev => ({ ...prev, type: 'mejora', area: 'gym', unit: 'horas', min_daily: 15, max_daily: 60 }));
                  setShowAddObjective(true);
                }}>
                  <Plus className="h-3 w-3" /> Añadir
                </Button>
              </CardHeader>
              <CardContent>
                {mejoraObjectives.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Sin objetivos de mejora en este sprint</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => {
                      setNewObjective(prev => ({ ...prev, type: 'mejora', area: 'gym', unit: 'horas', min_daily: 15, max_daily: 60 }));
                      setShowAddObjective(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" /> Añadir objetivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mejoraObjectives.map(obj => (
                      <div key={obj.id} className="relative">
                        <MejoraObjectiveCard
                          key={obj.id}
                          objective={obj}
                          todayMinutes={getTodayMinutes(obj.area, systemsData)}
                        />
                        <PointBLink area={obj.area} groupedByArea={groupedByArea} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Past sprints */}
        {sprints.filter(s => s.status !== 'active').length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Sprints anteriores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sprints.filter(s => s.status !== 'active').map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {s.objectives.filter(o => o.status === 'completed').length}/{s.objectives.length} objetivos
                    </span>
                  </div>
                  <Badge variant={s.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">
                    {s.status === 'completed' ? '✓ Completado' : 'Cancelado'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <CreateSprintDialog open={showCreate} onOpenChange={setShowCreate} onCreate={handleCreateSprint} />

      {/* Add Objective Dialog */}
      <Dialog open={showAddObjective} onOpenChange={setShowAddObjective}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo objetivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button
                  variant={newObjective.type === 'foco' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setNewObjective(prev => ({ ...prev, type: 'foco', unit: 'tareas', min_daily: 0, max_daily: 0 }))}
                >
                  🎯 Foco
                </Button>
                <Button
                  variant={newObjective.type === 'mejora' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setNewObjective(prev => ({ ...prev, type: 'mejora', unit: 'horas', min_daily: 15, max_daily: 30 }))}
                >
                  📈 Mejora
                </Button>
              </div>
            </div>
            <div>
              <Label>Área</Label>
              <Select value={newObjective.area} onValueChange={v => setNewObjective(prev => ({ ...prev, area: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(newObjective.type === 'foco' ? AREAS_FOCO : AREAS_MEJORA).map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {AREA_LABELS[a.id] || ''} {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título del objetivo</Label>
              <Input value={newObjective.title} onChange={e => setNewObjective(prev => ({ ...prev, title: e.target.value }))} placeholder={newObjective.type === 'foco' ? 'Ej: Terminar proyecto X' : 'Ej: 30 horas de piano'} />
            </div>
            <div>
              <Label>Meta: {newObjective.target_value} {newObjective.unit}</Label>
              <Input type="number" value={newObjective.target_value} onChange={e => setNewObjective(prev => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))} />
            </div>
            {newObjective.type === 'mejora' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mínimo diario (min)</Label>
                  <Input type="number" value={newObjective.min_daily} onChange={e => setNewObjective(prev => ({ ...prev, min_daily: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Máximo diario (min)</Label>
                  <Input type="number" value={newObjective.max_daily} onChange={e => setNewObjective(prev => ({ ...prev, max_daily: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddObjective(false)}>Cancelar</Button>
            <Button onClick={handleAddObjective} disabled={!newObjective.title.trim()}>Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PointBLink({ area, groupedByArea }: { area: string; groupedByArea: Record<string, any[]> }) {
  const pbMetrics = Object.values(groupedByArea).flat().filter(m => m.area === area);
  const areaInfo = AREA_TO_PB[area];

  if (pbMetrics.length === 0 && !areaInfo) return null;

  return (
    <div className="mt-1 ml-2 flex items-start gap-1.5 text-[10px] text-muted-foreground/60">
      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>
        Contribuye a <strong>Point B</strong>
        {pbMetrics.length > 0
          ? `: ${pbMetrics.map(m => `${m.metric_name} (${m.current_value}/${m.target_value} ${m.unit})`).join(', ')}`
          : areaInfo
            ? `: ${areaInfo.label} — ${areaInfo.metric}`
            : ''}
      </span>
    </div>
  );
}

function getTodayMinutes(area: string, systemsData: SystemsData): number {
  const timeKey = ({
    gym: 'gym',
    piano: 'musica',
    guitarra: 'musica',
    lectura: 'lectura',
    ajedrez: 'ajedrez',
    idiomas: 'idiomas',
  } as Record<string, string>)[area] || area;

  return systemsData?.timeData?.[timeKey] || 0;
}
