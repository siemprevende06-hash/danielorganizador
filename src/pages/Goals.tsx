import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, Trash2, CheckCircle2, Calendar, Heart, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGoalProgress, Goal, GoalTask } from "@/hooks/useGoalProgress";
import { lifeAreas } from "@/lib/data";
import { format, addMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const QUARTER_MONTHS = 3;

function getQuarterDates() {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / QUARTER_MONTHS);
  const start = new Date(now.getFullYear(), currentQuarter * QUARTER_MONTHS, 1);
  const end = addMonths(start, QUARTER_MONTHS);
  return { start, end, quarter: currentQuarter + 1, year: now.getFullYear() };
}

export default function Goals() {
  const { goals, loading, fetchGoals, fetchGoalTasks, updateGoalProgress } = useGoalProgress();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalTasks, setGoalTasks] = useState<Map<string, GoalTask[]>>(new Map());
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { toast } = useToast();
  const quarterInfo = getQuarterDates();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [why, setWhy] = useState("");
  const [areaId, setAreaId] = useState("");
  const [targetDate, setTargetDate] = useState(format(quarterInfo.end, 'yyyy-MM-dd'));
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [dailySystem, setDailySystem] = useState("");

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
      });
    }
  }, [goals]);

  const handleCreateGoal = async () => {
    if (!title.trim()) return;
    try {
      const { error } = await supabase.from('goals').insert({
        title: title.trim(),
        description: `${description.trim()}\n\n💡 ¿Por qué?: ${why.trim()}\n\n🔄 Sistema diario: ${dailySystem.trim()}`,
        area_id: areaId || null,
        target_date: targetDate || null,
        status: 'active',
      });
      if (error) throw error;
      toast({ title: "Objetivo creado" });
      setTitle(""); setDescription(""); setWhy(""); setAreaId(""); setDailySystem("");
      setTargetDate(format(quarterInfo.end, 'yyyy-MM-dd'));
      setDialogOpen(false);
      fetchGoals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await supabase.from('goals').delete().eq('id', goalId);
    fetchGoals();
    toast({ title: "Objetivo eliminado" });
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !selectedGoalId) return;
    await supabase.from('goal_tasks').insert({
      goal_id: selectedGoalId, title: taskTitle.trim(), completed: false,
      due_date: taskDueDate || null,
    });
    setTaskTitle(""); setTaskDueDate(""); setTaskDialogOpen(false);
    const tasks = await fetchGoalTasks(selectedGoalId);
    setGoalTasks(prev => new Map(prev).set(selectedGoalId, tasks));
    await updateGoalProgress(selectedGoalId);
    fetchGoals();
  };

  const handleToggleTask = async (goalId: string, task: GoalTask) => {
    await supabase.from('goal_tasks').update({ completed: !task.completed }).eq('id', task.id);
    const tasks = await fetchGoalTasks(goalId);
    setGoalTasks(prev => new Map(prev).set(goalId, tasks));
    await updateGoalProgress(goalId);
    fetchGoals();
  };

  const getAreaName = (areaId: string | null) => {
    if (!areaId) return null;
    for (const area of lifeAreas) {
      if (area.id === areaId) return area.name;
      if (area.subAreas) {
        for (const sub of area.subAreas) {
          if (sub.id === areaId) return sub.name;
          if (sub.subAreas) for (const s of sub.subAreas) if (s.id === areaId) return s.name;
        }
      }
    }
    return null;
  };

  // Parse stored why and system from description
  const parseGoalMeta = (desc: string | null) => {
    const whyMatch = desc?.match(/💡 ¿Por qué\?: (.*?)(?:\n|$)/);
    const systemMatch = desc?.match(/🔄 Sistema diario: (.*?)(?:\n|$)/);
    const cleanDesc = desc?.replace(/\n\n💡 ¿Por qué\?:.*$/s, '') || '';
    return { why: whyMatch?.[1] || '', system: systemMatch?.[1] || '', description: cleanDesc };
  };

  // Group tasks by timeline (monthly/weekly/daily)
  const groupTasksByTimeline = (tasks: GoalTask[]) => {
    const now = new Date();
    const thisWeekEnd = new Date(now); thisWeekEnd.setDate(now.getDate() + 7);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const daily = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === now.toDateString());
    const weekly = tasks.filter(t => t.due_date && new Date(t.due_date) <= thisWeekEnd && !daily.includes(t));
    const monthly = tasks.filter(t => t.due_date && new Date(t.due_date) <= thisMonthEnd && !daily.includes(t) && !weekly.includes(t));
    const other = tasks.filter(t => !daily.includes(t) && !weekly.includes(t) && !monthly.includes(t));
    
    return { daily, weekly, monthly, other };
  };

  if (loading) return <div className="p-8">Cargando objetivos...</div>;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8" />Objetivos Trimestrales
            </h1>
            <p className="text-muted-foreground mt-2">
              Q{quarterInfo.quarter} {quarterInfo.year} · {format(quarterInfo.start, "d MMM", { locale: es })} → {format(quarterInfo.end, "d MMM yyyy", { locale: es })}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo Objetivo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Objetivo Trimestral</DialogTitle>
                <DialogDescription>Define tu objetivo para los próximos 3 meses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Lanzar MVP del emprendimiento" /></div>
                <div><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Qué quieres lograr exactamente?" rows={2} /></div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Label className="flex items-center gap-2"><Heart className="w-4 h-4 text-yellow-600" />¿Por qué es importante? (Motivación)</Label>
                  <Textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Mi razón profunda para lograr esto..." rows={2} className="mt-2" />
                </div>
                <div><Label>Sistema / Rutina Diaria</Label><Input value={dailySystem} onChange={(e) => setDailySystem(e.target.value)} placeholder="Ej: 2h de trabajo diario en el proyecto" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Área</Label>
                    <Select value={areaId} onValueChange={setAreaId}>
                      <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
                      <SelectContent>
                        {lifeAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fecha objetivo</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
                </div>
                <Button onClick={handleCreateGoal} className="w-full">Crear Objetivo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{activeGoals.length}</p><p className="text-xs text-muted-foreground">Activos</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{Math.round(activeGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / Math.max(activeGoals.length, 1))}%</p><p className="text-xs text-muted-foreground">Progreso Promedio</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{completedGoals.length}</p><p className="text-xs text-muted-foreground">Completados</p></CardContent></Card>
        </div>

        {/* Goals */}
        {activeGoals.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg font-medium">No tienes objetivos aún</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const tasks = goalTasks.get(goal.id) || [];
              const meta = parseGoalMeta(goal.description);
              const timeline = groupTasksByTimeline(tasks);
              const completedTasks = tasks.filter(t => t.completed).length;
              const isExpanded = expandedGoal === goal.id;

              return (
                <Card key={goal.id} className="border-l-4 border-l-primary/50">
                  <CardHeader className="cursor-pointer" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          {goal.title}
                          <Badge variant="secondary">{goal.progress_percentage || 0}%</Badge>
                        </CardTitle>
                        {meta.description && <CardDescription className="mt-1 ml-7">{meta.description}</CardDescription>}
                        <div className="flex items-center gap-2 mt-2 ml-7">
                          {getAreaName(goal.area_id) && <Badge variant="outline">{getAreaName(goal.area_id)}</Badge>}
                          {goal.target_date && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Progress value={goal.progress_percentage || 0} className="h-2 mt-3" />
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-0">
                      {/* Why */}
                      {meta.why && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-xs font-medium text-yellow-700 mb-1">💡 ¿Por qué?</p>
                          <p className="text-sm">{meta.why}</p>
                        </div>
                      )}

                      {/* Daily System */}
                      {meta.system && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1">🔄 Sistema diario</p>
                          <p className="text-sm">{meta.system}</p>
                        </div>
                      )}

                      {/* Tasks by timeline */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Tareas ({completedTasks}/{tasks.length})</p>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedGoalId(goal.id); setTaskDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" />Tarea
                          </Button>
                        </div>

                        {[
                          { label: "📌 Hoy", items: timeline.daily },
                          { label: "📅 Esta semana", items: timeline.weekly },
                          { label: "🗓️ Este mes", items: timeline.monthly },
                          { label: "📋 Todas", items: timeline.other },
                        ].filter(g => g.items.length > 0).map(group => (
                          <div key={group.label}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">{group.label}</p>
                            {group.items.map(task => (
                              <div key={task.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
                                onClick={() => handleToggleTask(goal.id, task)}>
                                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                                {task.due_date && <span className="text-xs text-muted-foreground ml-auto">{format(new Date(task.due_date), 'dd/MM')}</span>}
                              </div>
                            ))}
                          </div>
                        ))}

                        {tasks.length === 0 && <p className="text-sm text-muted-foreground">No hay tareas aún</p>}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Task Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar Tarea al Objetivo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Título</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Tarea específica" /></div>
              <div><Label>Fecha</Label><Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} /></div>
              <Button onClick={handleAddTask} className="w-full">Agregar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}