import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Briefcase, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    const stored = localStorage.getItem('entrepreneurshipTasks');
    if (stored) {
      setTasks(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('entrepreneurshipTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleCreateTask = () => {
    if (!title.trim()) return;

    const newTask: EntrepreneurshipTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      completed: false,
      dueDate: dueDate || undefined,
    };

    setTasks(prev => [...prev, newTask]);
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsDialogOpen(false);
    toast({ title: 'Tarea creada', description: `${title} ha sido añadida.` });
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

  const handleUpdateTask = () => {
    if (!currentTask || !title.trim()) return;

    setTasks(prev =>
      prev.map(t =>
        t.id === currentTask.id
          ? { ...t, title, description, dueDate: dueDate || undefined }
          : t
      )
    );

    setTitle('');
    setDescription('');
    setDueDate('');
    setCurrentTask(null);
    setIsEditDialogOpen(false);
    toast({ title: 'Tarea actualizada' });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'Tarea eliminada' });
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
