import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, Target, CheckCircle2, Circle, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MonthlyAreaGoalDialog } from './MonthlyAreaGoalDialog';
import { useToast } from '@/hooks/use-toast';

interface MonthlyAreaGoal {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string | null;
  month_start: string;
  month_end: string;
  completed: boolean;
  completed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

interface AreaGoalsGroup {
  areaId: string;
  areaName: string;
  areaIcon: string;
  goals: MonthlyAreaGoal[];
  totalProgress: number;
}

const AREA_INFO: Record<string, { name: string; icon: string; color: string }> = {
  universidad: { name: 'Universidad', icon: '🎓', color: 'bg-blue-500' },
  emprendimiento: { name: 'Emprendimiento', icon: '💼', color: 'bg-purple-500' },
  proyectos: { name: 'Proyectos', icon: '🚀', color: 'bg-orange-500' },
  gym: { name: 'Gimnasio', icon: '💪', color: 'bg-green-500' },
  idiomas: { name: 'Idiomas', icon: '🗣️', color: 'bg-cyan-500' },
  lectura: { name: 'Lectura', icon: '📚', color: 'bg-amber-500' },
  musica: { name: 'Música', icon: '🎵', color: 'bg-pink-500' },
  general: { name: 'General', icon: '📋', color: 'bg-slate-500' },
};

interface MonthlyAreaGoalsProps {
  currentMonth: Date;
}

export function MonthlyAreaGoals({ currentMonth }: MonthlyAreaGoalsProps) {
  const [goals, setGoals] = useState<MonthlyAreaGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MonthlyAreaGoal | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const { toast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });

  useEffect(() => {
    loadMonthlyGoals();
  }, [currentMonth]);

  const loadMonthlyGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_area_goals')
        .select('*')
        .gte('month_start', monthStartStr)
        .lte('month_end', monthEndStr)
        .order('area_id')
        .order('priority', { ascending: false })
        .order('created_at');

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading monthly goals:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los objetivos mensuales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = (areaId?: string) => {
    setSelectedAreaId(areaId);
    setEditingGoal(undefined);
    setDialogOpen(true);
  };

  const handleEditGoal = (goal: MonthlyAreaGoal) => {
    setEditingGoal(goal);
    setSelectedAreaId(goal.area_id);
    setDialogOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('¿Estás seguro de eliminar este objetivo?')) return;

    try {
      const { error } = await supabase
        .from('monthly_area_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: 'Objetivo eliminado',
        description: 'El objetivo ha sido eliminado correctamente',
      });

      await loadMonthlyGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el objetivo',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProgress = async (goal: MonthlyAreaGoal, newValue: number) => {
    try {
      const { error } = await supabase
        .from('monthly_area_goals')
        .update({ current_value: newValue })
        .eq('id', goal.id);

      if (error) throw error;

      await loadMonthlyGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el progreso',
        variant: 'destructive',
      });
    }
  };

  // Group goals by area
  const groupedGoals: AreaGoalsGroup[] = Object.entries(
    goals.reduce((acc, goal) => {
      if (!acc[goal.area_id]) {
        acc[goal.area_id] = [];
      }
      acc[goal.area_id].push(goal);
      return acc;
    }, {} as Record<string, MonthlyAreaGoal[]>)
  ).map(([areaId, areaGoals]) => {
    const areaInfo = AREA_INFO[areaId] || AREA_INFO.general;
    const totalProgress =
      areaGoals.length > 0
        ? areaGoals.reduce((sum, g) => sum + (g.current_value / g.target_value) * 100, 0) /
          areaGoals.length
        : 0;

    return {
      areaId,
      areaName: areaInfo.name,
      areaIcon: areaInfo.icon,
      goals: areaGoals,
      totalProgress: Math.min(100, totalProgress),
    };
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 text-red-600';
      case 'medium':
        return 'border-amber-500 text-amber-600';
      case 'low':
        return 'border-blue-500 text-blue-600';
      default:
        return '';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold capitalize flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Objetivos Mensuales por Área - {monthName}
            </CardTitle>
            <Button onClick={() => handleAddGoal()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedGoals.length > 0 ? (
            <>
              {groupedGoals.map((areaGroup) => (
                <div key={areaGroup.areaId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{areaGroup.areaIcon}</span>
                      <span className="font-medium text-base">{areaGroup.areaName}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'ml-2',
                          areaGroup.totalProgress >= 80 && 'border-green-500 text-green-600',
                          areaGroup.totalProgress >= 50 &&
                            areaGroup.totalProgress < 80 &&
                            'border-amber-500 text-amber-600',
                          areaGroup.totalProgress < 50 && 'border-muted text-muted-foreground'
                        )}
                      >
                        {Math.round(areaGroup.totalProgress)}%
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleAddGoal(areaGroup.areaId)}
                      variant="ghost"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3 pl-9">
                    {areaGroup.goals.map((goal) => {
                      const progress = Math.min(100, (goal.current_value / goal.target_value) * 100);
                      return (
                        <div
                          key={goal.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {goal.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{goal.title}</p>
                                  <Badge variant="outline" className={cn('text-xs', getPriorityColor(goal.priority))}>
                                    {getPriorityLabel(goal.priority)}
                                  </Badge>
                                </div>
                                {goal.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {goal.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditGoal(goal)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteGoal(goal.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {goal.current_value} / {goal.target_value} {goal.unit || ''}
                              </span>
                              <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                handleUpdateProgress(goal, Math.max(0, goal.current_value - 1))
                              }
                              disabled={goal.current_value <= 0}
                            >
                              -1
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleUpdateProgress(goal, goal.current_value + 1)}
                            >
                              +1
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={() => handleUpdateProgress(goal, goal.target_value)}
                              disabled={goal.completed}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Completar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso general:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {Math.round(
                        groupedGoals.reduce((sum, g) => sum + g.totalProgress, 0) /
                          groupedGoals.length
                      )}
                      %
                    </span>
                    <Badge variant="secondary">
                      {goals.filter((g) => g.completed).length}/{goals.length} completados
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-2">
                No hay objetivos mensuales definidos
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega objetivos específicos para cada área de tu vida
              </p>
              <Button onClick={() => handleAddGoal()}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Objetivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <MonthlyAreaGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
        selectedAreaId={selectedAreaId}
        monthStart={monthStartStr}
        monthEnd={monthEndStr}
        onSuccess={loadMonthlyGoals}
      />
    </>
  );
}
