import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfidenceSteps, LEVEL_NAMES, AREAS, ConfidenceStep } from '@/hooks/useConfidenceSteps';
import { ArrowUp, Plus, Target, Trophy, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfidenceSteps() {
  const navigate = useNavigate();
  const {
    steps,
    loading,
    addStep,
    updateStep,
    toggleComplete,
    deleteStep,
    getStepsByArea,
    getStepsByViewType,
    getCurrentLevel,
    getProgressToNextLevel,
  } = useConfidenceSteps();

  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStep, setNewStep] = useState({
    area: '',
    title: '',
    description: '',
    target_date: '',
    view_type: 'weekly',
  });

  const currentLevel = getCurrentLevel();
  const progressToNext = getProgressToNextLevel();
  const filteredSteps = getStepsByViewType(viewType);

  const handleAddStep = async () => {
    if (!newStep.area || !newStep.title) return;
    
    await addStep({
      area: newStep.area,
      title: newStep.title,
      description: newStep.description || null,
      target_date: newStep.target_date || null,
      view_type: newStep.view_type,
      level: currentLevel,
      target_level: currentLevel + 1,
    });
    
    setNewStep({ area: '', title: '', description: '', target_date: '', view_type: 'weekly' });
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          🪜 Escalones de Confianza
        </h1>
        <p className="text-muted-foreground mt-1">
          "Cada paso te acerca a tu mejor versión"
        </p>
      </header>

      {/* Level Visualization */}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Badge className="mb-2 text-lg px-4 py-1">
              ★ Nivel {currentLevel}: {LEVEL_NAMES[currentLevel]}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Progreso al siguiente nivel: {progressToNext}%
            </p>
            <Progress value={progressToNext} className="h-3 mt-2 max-w-md mx-auto" />
          </div>

          {/* Visual Ladder */}
          <div className="flex justify-center items-end gap-2 h-40 mt-4">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "flex flex-col items-center justify-end transition-all duration-300",
                  level <= currentLevel ? "opacity-100" : "opacity-30"
                )}
                style={{ height: `${level * 20 + 20}%` }}
              >
                <div
                  className={cn(
                    "w-12 md:w-16 rounded-t-lg flex items-center justify-center text-white font-bold text-sm",
                    level === currentLevel && "ring-2 ring-primary ring-offset-2",
                    level < currentLevel ? "bg-green-500" : level === currentLevel ? "bg-primary" : "bg-muted"
                  )}
                  style={{ height: '100%' }}
                >
                  {level === currentLevel ? '← TÚ' : level}
                </div>
                <span className="text-xs mt-1 text-center">
                  {LEVEL_NAMES[level]?.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as typeof viewType)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="daily">Día</TabsTrigger>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mes</TabsTrigger>
          </TabsList>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Escalón
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Escalón de Confianza</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Área</label>
                  <Select 
                    value={newStep.area} 
                    onValueChange={(v) => setNewStep(prev => ({ ...prev, area: v }))}
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
                    placeholder="Ej: Aprobar segundo parcial de Física"
                    value={newStep.title}
                    onChange={(e) => setNewStep(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción (opcional)</label>
                  <Textarea
                    placeholder="Describe los pasos para lograrlo..."
                    value={newStep.description}
                    onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Vista</label>
                    <Select 
                      value={newStep.view_type} 
                      onValueChange={(v) => setNewStep(prev => ({ ...prev, view_type: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha límite</label>
                    <Input
                      type="date"
                      value={newStep.target_date}
                      onChange={(e) => setNewStep(prev => ({ ...prev, target_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handleAddStep} className="w-full">
                  Agregar Escalón
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value={viewType} className="mt-4 space-y-4">
          <h3 className="font-medium">
            📋 Objetivos para subir al Nivel {currentLevel + 1}: {LEVEL_NAMES[currentLevel + 1] || 'Maestro'}
          </h3>

          {AREAS.map(area => {
            const areaSteps = filteredSteps.filter(s => s.area === area.id);
            if (areaSteps.length === 0) return null;

            return (
              <Card key={area.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>{area.icon}</span>
                    <span>{area.label.toUpperCase()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {areaSteps.map(step => (
                    <div key={step.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={step.completed}
                          onCheckedChange={() => toggleComplete(step.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm",
                              step.completed && "line-through text-muted-foreground"
                            )}>
                              {step.title}
                            </span>
                            {step.completed && (
                              <Badge variant="default" className="text-xs">
                                ✅ Completado
                              </Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          )}
                          {step.progress_percentage > 0 && step.progress_percentage < 100 && (
                            <div className="mt-2">
                              <Progress value={step.progress_percentage} className="h-1.5" />
                              <span className="text-xs text-muted-foreground">
                                {step.progress_percentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {step.subtasks && step.subtasks.length > 0 && (
                        <div className="pl-8 space-y-1 border-l-2 border-muted ml-2">
                          {step.subtasks.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 py-1">
                              <Checkbox
                                checked={sub.completed}
                                onCheckedChange={() => toggleComplete(sub.id)}
                                className="h-3.5 w-3.5"
                              />
                              <span className={cn(
                                "text-xs",
                                sub.completed && "line-through text-muted-foreground"
                              )}>
                                {sub.title}
                              </span>
                              {sub.progress_percentage > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  [{sub.progress_percentage}%]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {filteredSteps.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No hay escalones para esta vista.
                </p>
                <p className="text-sm text-muted-foreground">
                  ¡Agrega objetivos para subir de nivel!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
