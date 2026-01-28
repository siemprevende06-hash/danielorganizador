import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Calendar, Clock, Pencil, EyeOff, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/definitions';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { lifeAreas, centralAreas } from '@/lib/data';
import { flattenAreas } from '@/lib/utils';
import { BlockSelector } from '@/components/BlockSelector';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(1000, "La descripción es muy larga").optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional()
});

interface TaskWithBlock extends Task {
  routineBlockId?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithBlock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithBlock | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  
  const { toast } = useToast();
  const { blocks } = useRoutineBlocksDB();

  // Get all areas including subareas
  const allAreas = [
    ...flattenAreas(lifeAreas),
    ...flattenAreas(centralAreas),
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('source', 'general')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedTasks: TaskWithBlock[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as any,
        priority: task.priority as any,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        completed: task.completed,
        areaId: task.area_id || undefined,
        routineBlockId: task.routine_block_id || undefined
      }));
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setSelectedAreaId('');
    setSelectedBlockId('');
  };

  const handleCreateTask = async () => {
    try {
      const validated = taskSchema.parse({ title, description, priority, dueDate });
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: validated.title,
          description: validated.description || null,
          status: 'pendiente',
          priority: validated.priority,
          due_date: validated.dueDate || null,
          completed: false,
          source: 'general',
          area_id: selectedAreaId || null,
          routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
          user_id: null
        });

      if (error) throw error;

      await loadTasks();
      resetForm();
      setIsDialogOpen(false);
      toast({ title: 'Tarea creada', description: `${validated.title} ha sido añadida.` });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message
        });
      } else {
        console.error('Error creating task:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    
    try {
      const validated = taskSchema.parse({ title, description, priority, dueDate });
      
      const { error } = await supabase
        .from('tasks')
        .update({
          title: validated.title,
          description: validated.description || null,
          priority: validated.priority,
          due_date: validated.dueDate || null,
          area_id: selectedAreaId || null,
          routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      await loadTasks();
      resetForm();
      setEditingTask(null);
      setIsEditDialogOpen(false);
      toast({ title: 'Tarea actualizada' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message
        });
      } else {
        console.error('Error updating task:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (task: TaskWithBlock) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    setSelectedAreaId(task.areaId || '');
    setSelectedBlockId(task.routineBlockId || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({
          completed: !task.completed,
          status: task.completed ? 'pendiente' : 'completada'
        })
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-destructive';
      case 'medium': return 'border-primary';
      case 'low': return 'border-muted-foreground';
      default: return '';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return '';
    }
  };

  const filteredTasks = hideCompleted 
    ? tasks.filter(t => !t.completed) 
    : tasks;

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold">Tareas</h1>
          <p className="text-muted-foreground">
            {pendingCount} pendientes · {completedCount} completadas
          </p>
        </header>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="hide-completed"
              checked={hideCompleted}
              onCheckedChange={setHideCompleted}
            />
            <Label htmlFor="hide-completed" className="text-sm flex items-center gap-1">
              {hideCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {hideCompleted ? 'Mostrar' : 'Ocultar'} hechas
            </Label>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
                <DialogDescription>Define los detalles de tu nueva tarea.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la tarea" />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" />
                </div>
                <div>
                  <label className="text-sm font-medium">Área</label>
                  <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {allAreas.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha límite</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Bloque de Tiempo</label>
                  <BlockSelector value={selectedBlockId} onValueChange={setSelectedBlockId} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTask}>Crear Tarea</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingTask(null);
          resetForm();
        }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>Modifica los detalles de la tarea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la tarea" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" />
            </div>
            <div>
              <label className="text-sm font-medium">Área</label>
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {allAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha límite</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Bloque de Tiempo</label>
              <BlockSelector value={selectedBlockId} onValueChange={setSelectedBlockId} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditTask}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`${getPriorityColor(task.priority)} border-l-4`}>
            <CardHeader className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <CardTitle className={`text-base ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <CardDescription className="mt-1">{task.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="px-2 py-0.5 bg-muted rounded">
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </span>
                      )}
                      {task.routineBlockId && (
                        <span className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded text-primary">
                          <Clock className="h-3 w-3" />
                          {blocks.find(b => b.id === task.routineBlockId)?.title || 'Bloque'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
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

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {hideCompleted && completedCount > 0 
                ? `${completedCount} tareas completadas ocultas` 
                : 'No tienes tareas aún. Crea tu primera tarea para comenzar.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}