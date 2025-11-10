import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PlusCircle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface EntrepreneurshipTask {
  id: string;
  title: string;
  description: string;
  task_type: 'normal' | 'improvement';
  completed: boolean;
  due_date?: string;
  subtasks: Subtask[];
}

interface Entrepreneurship {
  id: string;
  name: string;
  description: string;
  cover_image?: string;
}

export default function EntrepreneurshipDetail() {
  const { id } = useParams<{ id: string }>();
  const [entrepreneurship, setEntrepreneurship] = useState<Entrepreneurship | null>(null);
  const [tasks, setTasks] = useState<EntrepreneurshipTask[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTaskType, setCurrentTaskType] = useState<'normal' | 'improvement'>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEntrepreneurship();
    loadTasks();
  }, [id]);

  const loadEntrepreneurship = async () => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEntrepreneurship(data);
    } catch (error) {
      console.error('Error loading entrepreneurship:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('entrepreneurship_tasks')
        .select('*')
        .eq('entrepreneurship_id', id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const tasksWithSubtasks = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { data: subtasksData } = await supabase
            .from('subtasks')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true });

          return {
            id: task.id,
            title: task.title,
            description: task.description || '',
            task_type: task.task_type as 'normal' | 'improvement',
            completed: task.completed,
            due_date: task.due_date || undefined,
            subtasks: subtasksData || []
          };
        })
      );

      setTasks(tasksWithSubtasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;

    try {
      const { error } = await supabase
        .from('entrepreneurship_tasks')
        .insert({
          entrepreneurship_id: id,
          title,
          description,
          task_type: currentTaskType,
          completed: false,
          due_date: dueDate || null
        });

      if (error) throw error;

      await loadTasks();
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsDialogOpen(false);
      toast({ title: 'Tarea creada' });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('entrepreneurship_tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('entrepreneurship_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
      toast({ title: 'Tarea eliminada' });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddSubtask = async (taskId: string) => {
    if (!subtaskInput.trim()) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          title: subtaskInput,
          completed: false
        });

      if (error) throw error;

      await loadTasks();
      setSubtaskInput('');
      setCurrentTaskId(null);
    } catch (error: any) {
      console.error('Error adding subtask:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !completed })
        .eq('id', subtaskId);

      if (error) throw error;
      await loadTasks();
    } catch (error: any) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
      await loadTasks();
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (!entrepreneurship) {
    return <div className="container mx-auto px-4 py-24">Cargando...</div>;
  }

  const normalTasks = tasks.filter(t => t.task_type === 'normal');
  const improvementTasks = tasks.filter(t => t.task_type === 'improvement');

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/entrepreneurship">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-bold">{entrepreneurship.name}</h1>
          {entrepreneurship.description && (
            <p className="text-muted-foreground">{entrepreneurship.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="normal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normal">Tareas Normales ({normalTasks.length})</TabsTrigger>
          <TabsTrigger value="improvement">Mejoras ({improvementTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="normal" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen && currentTaskType === 'normal'} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setCurrentTaskType('normal');
            }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Tarea Normal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Tarea Normal</DialogTitle>
                  <DialogDescription>Define una nueva tarea para este emprendimiento.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Título</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha de vencimiento</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateTask}>Crear Tarea</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {normalTasks.map((task) => (
              <Card key={task.id} className={task.completed ? 'border-green-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </CardTitle>
                          {task.subtasks.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskExpansion(task.id)}
                            >
                              {expandedTasks.has(task.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>

                {expandedTasks.has(task.id) && (
                  <CardContent className="space-y-3">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 pl-6">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
                        />
                        <span className={subtask.completed ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {currentTaskId === task.id ? (
                      <div className="flex gap-2 pl-6">
                        <Input
                          placeholder="Nueva subtarea..."
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubtask(task.id);
                            }
                          }}
                        />
                        <Button onClick={() => handleAddSubtask(task.id)}>Añadir</Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-6"
                        onClick={() => setCurrentTaskId(task.id)}
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Añadir subtarea
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {normalTasks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay tareas normales aún.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="improvement" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen && currentTaskType === 'improvement'} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setCurrentTaskType('improvement');
            }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Mejora
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Mejora</DialogTitle>
                  <DialogDescription>Define una mejora para este emprendimiento.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Título</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha de vencimiento</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateTask}>Crear Mejora</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {improvementTasks.map((task) => (
              <Card key={task.id} className={task.completed ? 'border-green-500' : 'border-blue-500'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </CardTitle>
                          <Badge variant="outline">Mejora</Badge>
                          {task.subtasks.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskExpansion(task.id)}
                            >
                              {expandedTasks.has(task.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>

                {expandedTasks.has(task.id) && (
                  <CardContent className="space-y-3">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 pl-6">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
                        />
                        <span className={subtask.completed ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {currentTaskId === task.id ? (
                      <div className="flex gap-2 pl-6">
                        <Input
                          placeholder="Nueva subtarea..."
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubtask(task.id);
                            }
                          }}
                        />
                        <Button onClick={() => handleAddSubtask(task.id)}>Añadir</Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-6"
                        onClick={() => setCurrentTaskId(task.id)}
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Añadir subtarea
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {improvementTasks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay mejoras aún.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}