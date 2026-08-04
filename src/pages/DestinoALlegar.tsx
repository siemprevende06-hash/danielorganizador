import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AddDestinoGoalDialog } from '@/components/destino/AddDestinoGoalDialog';
import { DestinoGoalCard } from '@/components/destino/DestinoGoalCard';
import { lifeAreas } from '@/lib/data';
import { getAllSubAreaIds } from '@/lib/utils';
import { useGoalProgress, type Goal, type GoalTask } from '@/hooks/useGoalProgress';
import { cn } from '@/lib/utils';
import { MapPin, ChevronDown, ChevronRight, Flag } from 'lucide-react';

const AREA_ACCENT: Record<string, string> = {
  universidad: 'border-l-blue-500',
  emprendimiento: 'border-l-purple-500',
  proyectos: 'border-l-amber-500',
  gym: 'border-l-red-500',
  idiomas: 'border-l-emerald-500',
  ajedrez: 'border-l-zinc-400',
  lectura: 'border-l-cyan-500',
  piano: 'border-l-pink-500',
  guitarra: 'border-l-orange-500',
  apariencia: 'border-l-violet-500',
  finanzas: 'border-l-green-500',
  mental: 'border-l-indigo-500',
};

export default function DestinoALlegar() {
  const {
    goals,
    loading,
    fetchGoals,
    fetchGoalTasks,
    createGoal,
    updateDailySystem,
    addGoalTask,
    toggleGoalTask,
    deleteGoal,
    deleteGoalTask,
  } = useGoalProgress();

  const [goalTasks, setGoalTasks] = useState<Map<string, GoalTask[]>>(new Map());
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
      });
    }
  }, [goals, fetchGoalTasks]);

  const refreshTasks = async (goalId: string) => {
    const tasks = await fetchGoalTasks(goalId);
    setGoalTasks(prev => new Map(prev).set(goalId, tasks));
  };

  const grouped = useMemo(() => {
    return lifeAreas.map(area => {
      const areaIds = new Set(getAllSubAreaIds(area));
      return {
        area,
        goals: goals.filter(g => g.area_id && areaIds.has(g.area_id)),
      };
    });
  }, [goals]);

  const orphanGoals = useMemo(() => {
    const knownIds = new Set(grouped.flatMap(g => g.goals.map(x => x.id)));
    return goals.filter(g => !knownIds.has(g.id));
  }, [goals, grouped]);

  const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
  const completedGoals = goals.filter(g => g.status === 'completed');
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / activeGoals.length)
    : 0;

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const handleCreate = async (data: { title: string; dailySystem: string; areaId: string | null; targetDate: string; planItems: string[] }) => {
    const goalId = await createGoal({
      title: data.title,
      daily_system: data.dailySystem,
      area_id: data.areaId,
      target_date: data.targetDate || null,
    });
    for (const item of data.planItems) {
      await addGoalTask(goalId, item);
    }
    await refreshTasks(goalId);
  };

  const handleToggleTask = async (task: GoalTask) => {
    await toggleGoalTask(task);
    await refreshTasks(task.goal_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />Destino a Llegar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas tus metas, el sistema que te lleva y el plan desglosado para alcanzarlas
            </p>
          </div>
          <AddDestinoGoalDialog onCreate={handleCreate} />
        </header>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground">Metas activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avance promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{completedGoals.length}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </CardContent>
          </Card>
        </div>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Aún no hay metas de destino</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crea tu primera meta: piensa en un destino (ej: aprender 10 canciones de piano),
                define el sistema diario que te lleva allí (ej: 30 min de práctica) y el plan desglosado
                (las canciones, los pasos, las tareas).
              </p>
              <div className="pt-2"><AddDestinoGoalDialog onCreate={handleCreate} /></div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ area, goals: areaGoals }, index) => {
              const Icon = area.icon;
              const expanded = expandedAreas.has(area.id);
              const areaAvg = areaGoals.length
                ? Math.round(areaGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / areaGoals.length)
                : 0;

              return (
                <Collapsible
                  key={area.id}
                  open={expanded}
                  onOpenChange={() => toggleArea(area.id)}
                >
                  <Card className={cn('overflow-hidden border-l-4', AREA_ACCENT[area.id] || 'border-l-primary/40')}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors">
                        {expanded ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{area.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {areaGoals.length > 0
                              ? `${areaGoals.length} ${areaGoals.length === 1 ? 'meta' : 'metas'} · ${areaAvg}% promedio`
                              : 'Sin metas aún'}
                          </p>
                        </div>
                        {areaGoals.length > 0 && (
                          <>
                            <Progress value={areaAvg} className="w-20 h-2 hidden sm:block" />
                            <Badge variant="secondary" className="shrink-0">{areaAvg}%</Badge>
                          </>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="border-t pt-4 pb-4 space-y-3">
                        {areaGoals.length === 0 ? (
                          <div className="flex items-center justify-between gap-3 py-2">
                            <p className="text-sm text-muted-foreground">Define una meta para esta área</p>
                            <AddDestinoGoalDialog defaultAreaId={area.id} onCreate={handleCreate} />
                          </div>
                        ) : (
                          <>
                            {areaGoals.map((goal, gi) => (
                              <DestinoGoalCard
                                key={goal.id}
                                goal={goal}
                                tasks={goalTasks.get(goal.id) || []}
                                colorIndex={index + gi}
                                onToggleTask={handleToggleTask}
                                onAddTask={async (title) => {
                                  await addGoalTask(goal.id, title);
                                  await refreshTasks(goal.id);
                                }}
                                onDeleteTask={async (task) => {
                                  await deleteGoalTask(task);
                                  await refreshTasks(goal.id);
                                }}
                                onUpdateSystem={async (system) => {
                                  await updateDailySystem(goal.id, system);
                                }}
                                onDeleteGoal={async () => {
                                  await deleteGoal(goal.id);
                                }}
                              />
                            ))}
                            <AddDestinoGoalDialog defaultAreaId={area.id} onCreate={handleCreate} />
                          </>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {orphanGoals.length > 0 && (
              <Collapsible open={expandedAreas.has('__orphan')} onOpenChange={() => toggleArea('__orphan')}>
                <Card className="overflow-hidden border-l-4 border-l-muted-foreground/30">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors">
                      {expandedAreas.has('__orphan') ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                      <Flag className="h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">Sin área</p>
                        <p className="text-xs text-muted-foreground">{orphanGoals.length} metas</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t pt-4 pb-4 space-y-3">
                      {orphanGoals.map((goal, gi) => (
                        <DestinoGoalCard
                          key={goal.id}
                          goal={goal}
                          tasks={goalTasks.get(goal.id) || []}
                          colorIndex={gi}
                          onToggleTask={handleToggleTask}
                          onAddTask={async (title) => {
                            await addGoalTask(goal.id, title);
                            await refreshTasks(goal.id);
                          }}
                          onDeleteTask={async (task) => {
                            await deleteGoalTask(task);
                            await refreshTasks(goal.id);
                          }}
                          onUpdateSystem={async (system) => {
                            await updateDailySystem(goal.id, system);
                          }}
                          onDeleteGoal={async () => {
                            await deleteGoal(goal.id);
                          }}
                        />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
