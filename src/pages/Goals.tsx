import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Trash2, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  tasks: GoalTask[];
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('goals');
    if (stored) {
      setGoals(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('goals', JSON.stringify(goals));
    }
  }, [goals]);

  const handleCreateGoal = () => {
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      description,
      deadline,
      tasks: [],
    };

    setGoals(prev => [...prev, newGoal]);
    setTitle('');
    setDescription('');
    setDeadline('');
    setIsGoalDialogOpen(false);
    toast({ title: 'Meta creada', description: `${title} ha sido añadida.` });
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast({ title: 'Meta eliminada' });
  };

  const handleAddTask = () => {
    if (!currentGoal || !taskTitle.trim()) return;

    const newTask: GoalTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      completed: false,
    };

    setGoals(prev =>
      prev.map(g =>
        g.id === currentGoal.id
          ? { ...g, tasks: [...g.tasks, newTask] }
          : g
      )
    );

    setTaskTitle('');
    setIsTaskDialogOpen(false);
    toast({ title: 'Tarea añadida' });
  };

  const handleToggleTask = (goalId: string, taskId: string) => {
    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? {
              ...g,
              tasks: g.tasks.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : g
      )
    );
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.tasks.length === 0) return 0;
    const completed = goal.tasks.filter(t => t.completed).length;
    return (completed / goal.tasks.length) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold">Metas</h1>
          <p className="text-muted-foreground">Define y alcanza tus objetivos</p>
        </header>
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Meta</DialogTitle>
              <DialogDescription>Define tu nueva meta y fecha límite.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Perder 10kg" />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles de la meta..." />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha límite</label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGoal}>Crear Meta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = getGoalProgress(goal);
          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {goal.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{goal.description}</CardDescription>
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mt-2">Límite: {goal.deadline}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Tareas ({goal.tasks.filter(t => t.completed).length}/{goal.tasks.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentGoal(goal);
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {goal.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(goal.id, task.id)}
                        />
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes metas aún. Crea tu primera meta para comenzar.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>Añade una tarea a {currentGoal?.title}</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Título de la Tarea</label>
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ej: Ir al gym 3 veces por semana" />
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask}>Añadir Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
