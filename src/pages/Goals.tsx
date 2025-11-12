import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GoalBlockConnector } from "@/components/goals/GoalBlockConnector";
import { useGoalProgress, Goal, GoalTask, GoalBlockConnection } from "@/hooks/useGoalProgress";
import { lifeAreas } from "@/lib/data";

// Available routine blocks for selection
const ROUTINE_BLOCKS = [
  { id: "1", title: "Rutina Activación", duration: 30 },
  { id: "2", title: "Idiomas", duration: 30 },
  { id: "3", title: "Gym", duration: 60 },
  { id: "5", title: "Focus Emprendimiento", duration: 55 },
  { id: "6", title: "Lectura", duration: 15 },
  { id: "8-13", title: "Deep Work (5 bloques)", duration: 400 },
  { id: "16", title: "Focus Universidad", duration: 90 },
  { id: "19", title: "Guitarra o Piano", duration: 30 },
];

export default function Goals() {
  const { goals, loading, fetchGoals, fetchGoalTasks, fetchGoalBlocks, updateGoalProgress } = useGoalProgress();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalTasks, setGoalTasks] = useState<Map<string, GoalTask[]>>(new Map());
  const [goalBlocks, setGoalBlocks] = useState<Map<string, GoalBlockConnection[]>>(new Map());
  const { toast } = useToast();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  useEffect(() => {
    if (goals.length > 0) {
      // Fetch tasks and blocks for each goal
      goals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        const blocks = await fetchGoalBlocks(goal.id);
        setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
        setGoalBlocks(prev => new Map(prev).set(goal.id, blocks));
      });
    }
  }, [goals]);

  const handleCreateGoal = async () => {
    if (!title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          area_id: areaId || null,
          target_date: targetDate || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Meta creada",
        description: "Tu nueva meta ha sido agregada exitosamente",
      });

      setTitle("");
      setDescription("");
      setAreaId("");
      setTargetDate("");
      setDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la meta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Meta eliminada",
        description: "La meta ha sido eliminada",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la meta",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !selectedGoalId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('goal_tasks')
        .insert({
          goal_id: selectedGoalId,
          user_id: user.id,
          title: taskTitle.trim(),
          completed: false,
        });

      if (error) throw error;

      toast({
        title: "Tarea agregada",
        description: "Nueva tarea añadida a la meta",
      });

      setTaskTitle("");
      setTaskDialogOpen(false);

      // Refresh tasks for this goal
      const tasks = await fetchGoalTasks(selectedGoalId);
      setGoalTasks(prev => new Map(prev).set(selectedGoalId, tasks));
      await updateGoalProgress(selectedGoalId);
      fetchGoals();
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (goalId: string, task: GoalTask) => {
    try {
      const { error } = await supabase
        .from('goal_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;

      // Refresh tasks for this goal
      const tasks = await fetchGoalTasks(goalId);
      setGoalTasks(prev => new Map(prev).set(goalId, tasks));
      await updateGoalProgress(goalId);
      fetchGoals();

      toast({
        title: task.completed ? "Tarea desmarcada" : "Tarea completada",
        description: task.completed ? "Tarea marcada como pendiente" : "¡Buen trabajo!",
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleBlocksUpdated = async (goalId: string) => {
    const blocks = await fetchGoalBlocks(goalId);
    setGoalBlocks(prev => new Map(prev).set(goalId, blocks));
  };

  const getAreaName = (areaId: string | null) => {
    if (!areaId) return null;
    
    for (const area of lifeAreas) {
      if (area.id === areaId) return area.name;
      if (area.subAreas) {
        for (const subArea of area.subAreas) {
          if (subArea.id === areaId) return subArea.name;
        }
      }
    }
    return null;
  };

  if (loading) {
    return <div className="p-8">Cargando metas...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8" />
              Metas y Objetivos
            </h1>
            <p className="text-muted-foreground mt-2">
              Define tus metas y conéctalas con tu rutina diaria
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Meta</DialogTitle>
                <DialogDescription>
                  Define una meta y conéctala con los bloques de tu rutina
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Lanzar mi startup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tu meta..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Área de Vida</Label>
                  <Select value={areaId} onValueChange={setAreaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {lifeAreas.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Fecha Objetivo</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full">
                  Crear Meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tienes metas aún</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crea tu primera meta para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {goals.map((goal) => {
              const tasks = goalTasks.get(goal.id) || [];
              const blocks = goalBlocks.get(goal.id) || [];
              const completedTasks = tasks.filter(t => t.completed).length;

              return (
                <Card key={goal.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {goal.title}
                          <Badge variant="secondary">
                            {goal.progress_percentage}%
                          </Badge>
                        </CardTitle>
                        {goal.description && (
                          <CardDescription className="mt-2">
                            {goal.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {getAreaName(goal.area_id) && (
                            <Badge variant="outline">
                              {getAreaName(goal.area_id)}
                            </Badge>
                          )}
                          {goal.target_date && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(goal.target_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={goal.progress_percentage} className="h-2" />

                    {/* Blocks Connected */}
                    {blocks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Bloques conectados:</p>
                        <div className="flex flex-wrap gap-1">
                          {blocks.map(block => (
                            <Badge key={block.id} variant="outline" className="text-xs">
                              {block.block_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Tareas ({completedTasks}/{tasks.length})
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setTaskDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {tasks.length > 0 ? (
                        <div className="space-y-1">
                          {tasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                              onClick={() => handleToggleTask(goal.id, task)}
                            >
                              <CheckCircle2
                                className={`h-4 w-4 ${
                                  task.completed ? 'text-green-500' : 'text-muted-foreground'
                                }`}
                              />
                              <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {tasks.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{tasks.length - 3} más...
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay tareas aún
                        </p>
                      )}
                    </div>

                    <GoalBlockConnector
                      goalId={goal.id}
                      goalTitle={goal.title}
                      availableBlocks={ROUTINE_BLOCKS}
                      currentConnections={blocks.map(b => b.block_id)}
                      onUpdate={() => handleBlocksUpdated(goal.id)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Task Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Tarea</DialogTitle>
              <DialogDescription>
                Agrega una nueva tarea a esta meta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título de la Tarea</Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej: Investigar mercado objetivo"
                />
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Agregar Tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}