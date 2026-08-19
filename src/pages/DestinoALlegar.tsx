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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from 'recharts';
import { AddDestinoGoalDialog, GOAL_STAGES, type GoalStage } from '@/components/destino/AddDestinoGoalDialog';
import { DestinoGoalCard } from '@/components/destino/DestinoGoalCard';
import { lifeAreas } from '@/lib/data';
import { getAllSubAreaIds } from '@/lib/utils';
import { useGoalProgress, type Goal, type GoalTask } from '@/hooks/useGoalProgress';
import { useNecesidades } from '@/hooks/useNecesidades';
import { supabase } from '@/integrations/supabase/client';
import { getCubaDate } from '@/lib/cubaTime';
import { cn } from '@/lib/utils';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Flag,
  Trophy,
  Flame,
  Zap,
  Sparkles,
  Route,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const STAGE_META: Record<GoalStage, {
  label: string;
  emoji: string;
  desc: string;
  color: string;
  softBg: string;
  border: string;
}> = {
  sosten: {
    label: 'Sostén',
    emoji: '🏗️',
    desc: 'Rutinas y hábitos: constancia diaria hasta que se vuelve tu estilo de vida',
    color: '#10b981',
    softBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  mejora: {
    label: 'Mejora acumulativa',
    emoji: '📈',
    desc: 'Crecer hasta el punto de comodidad donde ya eres suficientemente bueno y mejorar es natural, sin presión',
    color: '#3b82f6',
    softBg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  enfoque: {
    label: 'Enfoque',
    emoji: '🎯',
    desc: 'Los resultados mínimos y tangibles que quieres conseguir sí o sí',
    color: '#8b5cf6',
    softBg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
};

const NEED_EMOJIS: Record<string, string> = {
  moto: '🏍️',
  dinero: '💰',
  novia: '❤️',
  amigos: '🎉',
  intimidad: '🔞',
  boxeo: '🥊',
  exito: '🧭',
};

export default function DestinoALlegar() {
  const { goals, loading, fetchGoals, fetchGoalTasks, createGoal, updateDailySystem, updateGoalStatus, addGoalTask, toggleGoalTask, deleteGoal, deleteGoalTask } = useGoalProgress();
  const { necesidades, loading: needsLoading, actualizarProgreso, getProgresoGeneral } = useNecesidades();

  const [goalTasks, setGoalTasks] = useState<Map<string, GoalTask[]>>(new Map());
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set(['sosten']));
  const [effortToday, setEffortToday] = useState<{ completions: number; minutes: number } | null>(null);

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
      });
    }
  }, [goals, fetchGoalTasks]);

  useEffect(() => {
    const loadEffort = async () => {
      try {
        const { data } = await supabase
          .from('daily_systems_tracking')
          .select('completions, time_data')
          .eq('tracking_date', getCubaDate())
          .maybeSingle();
        if (data) {
          const completions = Object.entries(data.completions || {}).filter(([k, v]) => !k.startsWith('streak:') && v).length;
          const minutes = Object.values(data.time_data || {}).reduce((a: number, v: any) => a + (Number(v) || 0), 0);
          setEffortToday({ completions, minutes });
        }
      } catch (e) {
        console.error('Error cargando esfuerzo de hoy:', e);
      }
    };
    loadEffort();
  }, []);

  const refreshTasks = async (goalId: string) => {
    const tasks = await fetchGoalTasks(goalId);
    setGoalTasks(prev => new Map(prev).set(goalId, tasks));
  };

  const byStage = useMemo(() => {
    const map: Record<GoalStage, Goal[]> = { sosten: [], mejora: [], enfoque: [] };
    for (const g of goals) {
      const stage = (g.stage as GoalStage) || 'enfoque';
      map[stage].push(g);
    }
    (Object.keys(map) as GoalStage[]).forEach(s => {
      map[s].sort((a, b) => (a.progress_percentage || 0) - (b.progress_percentage || 0));
    });
    return map;
  }, [goals]);

  const stageStats = useMemo(() => {
    const out: Record<GoalStage, { active: number; completed: number; avg: number; left: number }> = {
      sosten: { active: 0, completed: 0, avg: 0, left: 0 },
      mejora: { active: 0, completed: 0, avg: 0, left: 0 },
      enfoque: { active: 0, completed: 0, avg: 0, left: 0 },
    };
    (Object.keys(byStage) as GoalStage[]).forEach(s => {
      const list = byStage[s];
      const active = list.filter(g => (g.status === 'active' || !g.status));
      const completed = list.filter(g => g.status === 'completed');
      const avg = active.length ? Math.round(active.reduce((a, g) => a + (g.progress_percentage || 0), 0) / active.length) : 0;
      out[s] = { active: active.length, completed: completed.length, avg, left: 100 - avg };
    });
    return out;
  }, [byStage]);

  const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
  const completedGoals = goals.filter(g => g.status === 'completed');
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / activeGoals.length)
    : 0;
  const needsAvg = getProgresoGeneral();

  const areaChartData = useMemo(() => {
    return lifeAreas.map(area => {
      const areaIds = new Set(getAllSubAreaIds(area));
      const areaGoals = goals.filter(g => g.area_id && areaIds.has(g.area_id) && (g.status === 'active' || !g.status));
      const avg = areaGoals.length
        ? Math.round(areaGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / areaGoals.length)
        : 0;
      return { name: area.name, value: avg, count: areaGoals.length };
    }).filter(d => d.count > 0);
  }, [goals]);

  const stageChartData = (Object.keys(STAGE_META) as GoalStage[]).map(s => ({
    name: STAGE_META[s].label,
    value: stageStats[s].active > 0 ? stageStats[s].avg : 0,
    color: STAGE_META[s].color,
  }));

  const totalGoals = goals.length;
  const pieReal = (Object.keys(STAGE_META) as GoalStage[]).map(s => ({
    name: STAGE_META[s].label,
    value: byStage[s].length,
    color: STAGE_META[s].color,
  })).filter(d => d.value > 0);

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const handleCreate = async (data: { title: string; dailySystem: string; areaId: string | null; stage: GoalStage; targetDate: string; planItems: string[] }) => {
    const goalId = await createGoal({
      title: data.title,
      daily_system: data.dailySystem,
      area_id: data.areaId,
      stage: data.stage,
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

  if (loading || needsLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const goalCardProps = (goal: Goal, colorIndex: number) => ({
    goal,
    tasks: goalTasks.get(goal.id) || [],
    colorIndex,
    onToggleTask: handleToggleTask,
    onAddTask: async (title: string) => {
      await addGoalTask(goal.id, title);
      await refreshTasks(goal.id);
    },
    onDeleteTask: async (task: GoalTask) => {
      await deleteGoalTask(task);
      await refreshTasks(goal.id);
    },
    onUpdateSystem: async (system: string) => {
      await updateDailySystem(goal.id, system);
    },
    onUpdateStatus: async (status: Goal['status']) => {
      await updateGoalStatus(goal.id, status);
    },
    onDeleteGoal: async () => {
      await deleteGoal(goal.id);
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />Destino a Llegar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              La ruta completa: tu esfuerzo de hoy te acerca a tus deseos cumplidos
            </p>
          </div>
          <AddDestinoGoalDialog onCreate={handleCreate} />
        </header>

        {/* ── Stats generales ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <p className="text-xs text-muted-foreground">Llegadas 🏁</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-500">{needsAvg}%</p>
              <p className="text-xs text-muted-foreground">Deseos cumplidos</p>
            </CardContent>
          </Card>
        </div>

        {/* ── La Ruta ── */}
        <Card className="overflow-hidden border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Route className="h-5 w-5 text-primary" />
              <h2 className="font-bold">La Ruta hacia tu Destino</h2>
              <Badge variant="secondary" className="ml-auto hidden sm:inline-flex">
                {avgProgress > 0 ? 'En camino' : 'Empieza hoy'}
              </Badge>
            </div>

            {/* Pasos de la ruta */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3">
              {(Object.keys(STAGE_META) as GoalStage[]).map((s, i) => {
                const meta = STAGE_META[s];
                const st = stageStats[s];
                return (
                  <div key={s} className="relative">
                    <div className={cn('rounded-xl border p-3 h-full', meta.border, meta.softBg)}>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{meta.emoji}</span>
                        {st.completed > 0 && <Badge className="bg-success/15 text-success border-success/20">{st.completed} ✅</Badge>}
                      </div>
                      <p className="font-semibold text-sm mt-1.5">{meta.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{meta.desc}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={st.avg} className="h-2 flex-1" />
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{st.avg}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {st.active > 0
                          ? <>Te falta <span className="font-semibold text-foreground">{st.left}%</span> · {st.active} {st.active === 1 ? 'meta activa' : 'metas activas'}</>
                          : st.completed > 0
                            ? '✅ Etapa superada'
                            : 'Define tus metas de esta etapa'}
                      </p>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 z-10" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Esfuerzo de hoy */}
            {effortToday && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-sm">
                  <span className="font-bold">{effortToday.completions}</span> sistemas completados hoy
                  {effortToday.minutes > 0 && <> · <span className="font-bold">{Math.round(effortToday.minutes)} min</span> de enfoque</>}
                </p>
                <p className="text-xs text-muted-foreground ml-auto">
                  Cada bloque que respetas hoy es kilómetro recorrido en tu ruta
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Gráficas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Avance por etapa */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Avance por etapa del camino</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.split(' ')[0]} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, 'Avance']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {stageChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribución de metas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Distribución de tus metas</h3>
              </div>
              {totalGoals === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">Aún no hay metas</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieReal} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {pieReal.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                {pieReal.map(d => (
                  <span key={d.name} className="text-xs flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: <b>{d.value}</b>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Etapas con sus metas ── */}
        {(Object.keys(STAGE_META) as GoalStage[]).map((s, si) => {
          const meta = STAGE_META[s];
          const st = stageStats[s];
          const stageGoals = byStage[s];
          const expanded = expandedAreas.has(s);
          return (
            <Collapsible key={s} open={expanded} onOpenChange={() => toggleArea(s)}>
              <Card
                className="overflow-hidden"
                style={{ borderLeft: `4px solid ${meta.color}` }}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors">
                    {expanded ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <span className="text-2xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.desc}
                      </p>
                    </div>
                    {st.active + st.completed > 0 && (
                      <>
                        <Progress value={st.avg} className="w-24 h-2 hidden sm:block" />
                        <Badge variant="secondary" className="shrink-0">{st.avg}%</Badge>
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t pt-4 pb-4 space-y-3">
                    {stageGoals.length === 0 ? (
                      <div className="flex items-center justify-between gap-3 py-2 px-1">
                        <p className="text-sm text-muted-foreground">Define una meta para esta etapa del camino</p>
                        <AddDestinoGoalDialog defaultStage={s} onCreate={handleCreate} />
                      </div>
                    ) : (
                      <>
                        {stageGoals.map((goal, gi) => (
                          <DestinoGoalCard key={goal.id} {...goalCardProps(goal, si * 2 + gi)} />
                        ))}
                        <AddDestinoGoalDialog defaultStage={s} onCreate={handleCreate} />
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* ── Necesidades (deseos a cumplir) ── */}
        <Card className="overflow-hidden border-l-4 border-l-orange-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold">Deseos que quieres cumplir</h2>
              <Badge variant="secondary" className="ml-auto">{needsAvg}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Las necesidades que mueven tu esfuerzo: cuando cada una llega al 100%, sabes que llegaste
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {necesidades.map(n => (
                <div key={n.necesidad_id} className="rounded-xl border p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{NEED_EMOJIS[n.necesidad_id] || n.icono}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{n.titulo}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{n.descripcion}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        n.progreso >= 80 && 'bg-success/15 text-success border-success/25',
                        n.progreso >= 40 && n.progreso < 80 && 'bg-amber-500/15 text-amber-600 border-amber-500/25',
                        n.progreso < 40 && 'bg-destructive/10 text-destructive border-destructive/20'
                      )}
                    >
                      {n.progreso >= 80 ? 'Cumplido' : n.progreso >= 40 ? 'En camino' : 'Por empezar'}
                    </Badge>
                  </div>
                  <Progress value={n.progreso} className="h-2" />
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-bold">{n.progreso}%</span>
                    <div className="flex gap-1">
                      {[25, 50, 75, 100].map(marker => (
                        <button
                          key={marker}
                          onClick={() => actualizarProgreso(n.necesidad_id, n.progreso >= marker ? 0 : marker)}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
                            n.progreso >= marker
                              ? 'bg-orange-500/20 text-orange-600 border-orange-500/30'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                          )}
                        >
                          {n.progreso >= marker ? marker : marker}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Llegadas: sabes que llegaste ── */}
        <Card className="overflow-hidden border-2 border-success/25 bg-gradient-to-br from-success/10 via-background to-background">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold">Sé que llegué</h2>
              <Badge variant="secondary" className="ml-auto">{completedGoals.length} {completedGoals.length === 1 ? 'llegada' : 'llegadas'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Cada meta terminada es un deseo cumplido. Este es tu registro de llegadas.
            </p>
            {completedGoals.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">Primera llegada pendiente</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Cuando termines una meta, pulsa «Llegué» en la tarjeta y aparecerá aquí para siempre.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {completedGoals.map(goal => {
                  const meta = STAGE_META[(goal.stage as GoalStage) || 'enfoque'];
                  return (
                    <div key={goal.id} className="flex items-center gap-3 rounded-xl border border-success/20 bg-card p-3">
                      <span className="text-2xl">{meta?.emoji || '🏁'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug">{goal.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Etapa {meta?.label || '—'} · Completada
                        </p>
                      </div>
                      <Badge className="bg-success/15 text-success border-success/20 shrink-0">
                        <Flag className="h-3 w-3 mr-1" />100%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {goals.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <Route className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Empieza a trazar tu ruta</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crea tu primera meta eligiendo la etapa del camino: <b>Sostén</b> (rutinas y hábitos),
                <b> Mejora acumulativa</b> (crecer hasta ser suficientemente bueno) o
                <b> Enfoque</b> (resultados mínimos).
              </p>
              <div className="pt-2"><AddDestinoGoalDialog onCreate={handleCreate} /></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}