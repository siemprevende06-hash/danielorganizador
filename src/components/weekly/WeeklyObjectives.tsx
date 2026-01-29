import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeeklyObjectives, WeeklyObjective } from '@/hooks/useWeeklyObjectives';
import { Plus, Target, TrendingUp } from 'lucide-react';

const AREAS = [
  { id: 'universidad', label: 'Universidad', icon: '🎓' },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: '💼' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { id: 'proyectos', label: 'Proyectos', icon: '🚀' },
];

export const WeeklyObjectives = () => {
  const { objectives, loading, addObjective, incrementProgress, getOverallProgress, currentWeekStart } = useWeeklyObjectives();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newObjective, setNewObjective] = useState({
    area: '',
    title: '',
    target_value: '',
    unit: '',
  });

  const handleAdd = async () => {
    if (!newObjective.area || !newObjective.title) return;
    
    await addObjective({
      area: newObjective.area,
      title: newObjective.title,
      target_value: newObjective.target_value ? parseFloat(newObjective.target_value) : null,
      current_value: 0,
      unit: newObjective.unit || null,
      completed: false,
      week_start_date: currentWeekStart,
      description: null,
    });
    
    setNewObjective({ area: '', title: '', target_value: '', unit: '' });
    setDialogOpen(false);
  };

  const overallProgress = getOverallProgress();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            🎯 Objetivos de Esta Semana
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {overallProgress}% completado
            </Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Objetivo Semanal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Área</label>
                    <Select 
                      value={newObjective.area} 
                      onValueChange={(v) => setNewObjective(prev => ({ ...prev, area: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona área" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.icon} {area.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Objetivo</label>
                    <Input
                      placeholder="Ej: Completar 5 ejercicios de Física"
                      value={newObjective.title}
                      onChange={(e) => setNewObjective(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Meta (opcional)</label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={newObjective.target_value}
                        onChange={(e) => setNewObjective(prev => ({ ...prev, target_value: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Unidad</label>
                      <Input
                        placeholder="ejercicios, horas, etc."
                        value={newObjective.unit}
                        onChange={(e) => setNewObjective(prev => ({ ...prev, unit: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full">
                    Agregar Objetivo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {AREAS.map(area => {
          const areaObjectives = objectives.filter(o => o.area === area.id);
          if (areaObjectives.length === 0) return null;

          return (
            <div key={area.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{area.icon}</span>
                <span>{area.label}</span>
              </div>
              <div className="space-y-2 pl-6">
                {areaObjectives.map(obj => {
                  const progressPercent = obj.target_value 
                    ? Math.min(Math.round((obj.current_value / obj.target_value) * 100), 100)
                    : obj.completed ? 100 : 0;

                  return (
                    <div key={obj.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={obj.completed ? 'line-through text-muted-foreground' : ''}>
                          {obj.title}
                        </span>
                        {obj.target_value ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              [{obj.current_value}/{obj.target_value}]
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => incrementProgress(obj.id)}
                            >
                              <TrendingUp className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          obj.completed && <Badge variant="default" className="text-xs">✅</Badge>
                        )}
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {objectives.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay objetivos para esta semana.</p>
            <p className="text-xs">¡Agrega tus metas!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
