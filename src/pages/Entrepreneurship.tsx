import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Briefcase, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EntrepreneurshipTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

export default function EntrepreneurshipPage() {
  const [tasks, setTasks] = useState<EntrepreneurshipTask[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<EntrepreneurshipTask | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('source', 'entrepreneurship')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedTasks: EntrepreneurshipTask[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        completed: task.completed,
        dueDate: task.due_date || undefined
      }));
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          completed: false,
          due_date: dueDate || null,
          source: 'entrepreneurship',
          status: 'pendiente',
          user_id: null
        });

      if (error) throw error;

      await loadTasks();
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsDialogOpen(false);
      toast({ title: 'Tarea creada', description: `${title} ha sido añadida.` });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate || '');
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTask = async () => {
    if (!currentTask || !title.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          due_date: dueDate || null
        })
        .eq('id', currentTask.id);

      if (error) throw error;

      await loadTasks();
      setTitle('');
      setDescription('');
      setDueDate('');
      setCurrentTask(null);
      setIsEditDialogOpen(false);
      toast({ title: 'Tarea actualizada' });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
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
        .from('tasks')
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

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Emprendimiento
          </h1>
          <p className="text-muted-foreground">Gestiona tus proyectos emprendedores</p>
        </header>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea de Emprendimiento</DialogTitle>
              <DialogDescription>Define tu tarea emprendedora.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Desarrollar MVP" />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles de la tarea..." />
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
        {tasks.map((task) => (
          <Card key={task.id} className={task.completed ? 'border-green-500' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <CardDescription className="mt-1">{task.description}</CardDescription>
                    )}
                    {task.dueDate && (
                      <CardDescription className="mt-1 text-xs">
                        Vence: {new Date(task.dueDate).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTask(task.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes tareas de emprendimiento aún.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea de Emprendimiento</DialogTitle>
            <DialogDescription>Actualiza los detalles de tu tarea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Desarrollar MVP" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles de la tarea..." />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de vencimiento</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTask}>Actualizar Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
