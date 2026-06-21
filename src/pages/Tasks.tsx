import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PlusCircle, Trash2, Calendar, Clock, Pencil, 
  CheckCircle2, Circle, AlertTriangle, Target,
  ListTodo, ArrowUpDown, LayoutGrid, List, Zap, Play,
  BookOpen, Briefcase, FolderKanban, Sparkles,
  TrendingUp, BarChart3, Layers, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isTomorrow, isPast, isThisWeek, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cachedQuery, cachedMutation, clearCacheForTable } from '@/lib/supabaseCache';
import { z } from 'zod';
import { lifeAreas, centralAreas } from '@/lib/data';
import { flattenAreas } from '@/lib/utils';
import { BlockSelector } from '@/components/BlockSelector';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import NotionCalendar from '@/components/calendar/NotionCalendar';

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional()
});

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: Date;
  areaId?: string;
  routineBlockId?: string;
  source: string;
  createdAt: Date;
}

type Category = 'all' | 'universidad' | 'emprendimiento' | 'proyectos' | 'tareas';

const categorize = (t: { areaId?: string; source?: string }): Exclude<Category, 'all'> => {
  if (t.areaId === 'universidad' || t.source === 'university') return 'universidad';
  if (t.areaId === 'emprendimiento' || t.source === 'entrepreneurship') return 'emprendimiento';
  if (t.areaId === 'proyectos' || t.source === 'projects') return 'proyectos';
  return 'tareas';
};

const AREA_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; lightBg: string }> = {
  universidad: {
    icon: <BookOpen className="w-4 h-4" />,
    gradient: 'from-blue-600 to-blue-400',
    lightBg: 'bg-blue-500/10',
  },
  emprendimiento: {
    icon: <Briefcase className="w-4 h-4" />,
    gradient: 'from-purple-600 to-purple-400',
    lightBg: 'bg-purple-500/10',
  },
  proyectos: {
    icon: <FolderKanban className="w-4 h-4" />,
    gradient: 'from-amber-600 to-amber-400',
    lightBg: 'bg-amber-500/10',
  },
  tareas: {
    icon: <ListTodo className="w-4 h-4" />,
    gradient: 'from-emerald-600 to-emerald-400',
    lightBg: 'bg-emerald-500/10',
  },
};

function TimeStatCard({ label, completed, total, pct, icon, gradient }: { label: string; completed: number; total: number; pct: number; icon: React.ReactNode; gradient: string }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{pct}%</p>
          </div>
          <div className={`p-2 rounded-lg ${gradient.replace('from-', 'bg-').replace('to-', '/20')} bg-opacity-20`}>
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{completed}</span>
          <span>de</span>
          <span className="font-medium text-foreground">{total}</span>
          <span>tareas</span>
        </div>
        <Progress value={pct} className="h-1 mt-2" />
      </CardContent>
    </Card>
  );
}

function AreaCard({ category, active, counts, onClick }: { category: Category; active: boolean; counts: { pending: number; total: number; done: number }; onClick: () => void }) {
  const config = category === 'all' 
    ? { icon: <Sparkles className="w-4 h-4" />, gradient: 'from-primary to-primary/60', lightBg: 'bg-primary/10', label: 'Todas' }
    : { ...AREA_CONFIG[category], label: category.charAt(0).toUpperCase() + category.slice(1) };
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className={`transition-all duration-200 hover:shadow-md ${active ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <CardContent className="p-3.5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.lightBg}`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{config.label}</p>
                <Badge variant={active ? 'default' : 'outline'} className="text-[10px] h-4 px-1.5">
                  {counts.pending} pend.
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>{counts.done}/{counts.total} completadas</span>
                <span>·</span>
                <span className={pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-amber-500' : 'text-muted-foreground'}>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1 mt-1.5" />
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-opacity ${active ? 'opacity-100 text-primary' : 'opacity-30'}`} />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'area'>('priority');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  
  const { toast } = useToast();
  const { blocks } = useRoutineBlocksDB();
  const { getCurrentBlock } = useRoutineBlocks();
  const navigate = useNavigate();
  const currentBlock = getCurrentBlock();

  const allAreas = useMemo(() => [
    ...flattenAreas(lifeAreas),
    ...flattenAreas(centralAreas),
  ], []);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const mapped = data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          priority: t.priority as any,
          completed: t.completed || false,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          areaId: t.area_id || undefined,
          routineBlockId: t.routine_block_id || undefined,
          source: t.source,
          createdAt: new Date(t.created_at),
        }));
        setTasks(mapped);
      }
    } catch (error) {
      const { data: cached } = await cachedQuery<any[]>(
        "tasks", "all", 
        async () => [], 
        60 * 1000
      );
      if (cached && cached.length > 0) {
        setTasks(cached.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          priority: t.priority as any,
          completed: t.completed || false,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          areaId: t.area_id || undefined,
          routineBlockId: t.routine_block_id || undefined,
          source: t.source,
          createdAt: new Date(t.created_at),
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium');
    setDueDate(''); setSelectedAreaId(''); setSelectedBlockId('');
  };

  const handleCreateTask = async () => {
    try {
      const validated = taskSchema.parse({ title, description, priority, dueDate });
      const payload = {
        title: validated.title, description: validated.description || null,
        status: 'pendiente', priority: validated.priority,
        due_date: validated.dueDate || null, completed: false, source: 'general',
        area_id: selectedAreaId || null,
        routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
        user_id: null,
      };
      const { queued } = await cachedMutation("tasks", "insert", payload);
      if (queued) {
        toast({ title: 'Tarea creada (offline) — se sincronizará al reconectar' });
      } else {
        toast({ title: 'Tarea creada ✓' });
      }
      await loadTasks(); resetForm(); setIsDialogOpen(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    try {
      const validated = taskSchema.parse({ title, description, priority, dueDate });
      const payload = {
        title: validated.title, description: validated.description || null,
        priority: validated.priority, due_date: validated.dueDate || null,
        area_id: selectedAreaId || null,
        routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
      };
      const { queued } = await cachedMutation("tasks", "update", payload, { id: editingTask.id });
      if (queued) {
        toast({ title: 'Tarea actualizada (offline) — se sincronizará al reconectar' });
      } else {
        toast({ title: 'Tarea actualizada ✓' });
      }
      await loadTasks(); resetForm(); setEditingTask(null); setIsEditDialogOpen(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title); setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
    setSelectedAreaId(task.areaId || ''); setSelectedBlockId(task.routineBlockId || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    const { queued } = await cachedMutation("tasks", "update", {
      completed: !task.completed, status: task.completed ? 'pendiente' : 'completada'
    }, { id: taskId });
    if (queued) {
      toast({ title: 'Cambio guardado offline — pendiente de sincronización' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    const { queued } = await cachedMutation("tasks", "delete", undefined, { id: taskId });
    if (queued) {
      toast({ title: 'Eliminado offline — pendiente de sincronización' });
    } else {
      toast({ title: 'Tarea eliminada' });
    }
  };

  // === STATS ===
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStartDate = startOfMonth(now);
  const monthEndDate = endOfMonth(now);
  const quarterStart = startOfQuarter(now);
  const quarterEnd = endOfQuarter(now);

  const tasksInRange = (start: Date, end: Date) => {
    const pending = tasks.filter(t => !t.completed && t.dueDate && isWithinInterval(t.dueDate, { start, end }));
    const done = tasks.filter(t => t.completed && t.dueDate && isWithinInterval(t.dueDate, { start, end }));
    return { pending: pending.length, done: done.length, total: pending.length + done.length };
  };

  const weeklyStats = tasksInRange(weekStart, weekEnd);
  const monthlyStats = tasksInRange(monthStartDate, monthEndDate);
  const quarterlyStats = tasksInRange(quarterStart, quarterEnd);

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const highPriority = pendingTasks.filter(t => t.priority === 'high').length;
  const todayTasks = pendingTasks.filter(t => t.dueDate && isToday(t.dueDate)).length;
  const overdueTasks = pendingTasks.filter(t => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate)).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // === AREAS ===
  const areaStats = useMemo(() => {
    const cats: Category[] = ['universidad', 'emprendimiento', 'proyectos', 'tareas'];
    const stats: Record<string, { pending: number; total: number; done: number }> = {};
    cats.forEach(c => {
      const catTasks = tasks.filter(t => categorize(t) === c);
      stats[c] = {
        pending: catTasks.filter(t => !t.completed).length,
        total: catTasks.length,
        done: catTasks.filter(t => t.completed).length,
      };
    });
    return stats;
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { universidad: 0, emprendimiento: 0, proyectos: 0, tareas: 0 };
    tasks.filter(t => !t.completed).forEach(t => { c[categorize(t)]++; });
    return c;
  }, [tasks]);

  // === FILTERED TASKS ===
  const filteredTasks = useMemo(() => {
    const byCat = activeCategory === 'all' ? tasks : tasks.filter(t => categorize(t) === activeCategory);
    const pending = byCat.filter(t => !t.completed);
    const done = byCat.filter(t => t.completed);
    let list = activeTab === 'pending' ? pending
      : activeTab === 'completed' ? done
      : activeTab === 'overdue' ? pending.filter(t => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate))
      : activeTab === 'today' ? pending.filter(t => t.dueDate && (isToday(t.dueDate) || isTomorrow(t.dueDate)))
      : byCat;

    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    if (sortBy === 'priority') {
      list = [...list].sort((a, b) => (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0));
    } else if (sortBy === 'date') {
      list = [...list].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    }
    return list;
  }, [tasks, activeTab, activeCategory, sortBy]);

  const groupedByArea = useMemo(() => {
    const groups: Record<string, TaskItem[]> = { 'Sin área': [] };
    filteredTasks.forEach(t => {
      const area = allAreas.find(a => a.id === t.areaId);
      const key = area ? area.name : 'Sin área';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).filter(([, tasks]) => tasks.length > 0);
  }, [filteredTasks, allAreas]);

  // === RENDER HELPERS ===
  const getDateLabel = (date?: Date) => {
    if (!date) return null;
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isPast(date)) return 'Vencida';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: es });
    return format(date, 'dd MMM', { locale: es });
  };

  const getDateStyle = (date?: Date) => {
    if (!date) return '';
    if (isPast(date) && !isToday(date)) return 'text-destructive font-medium';
    if (isToday(date)) return 'text-foreground font-medium';
    return 'text-muted-foreground';
  };

  const renderTaskForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Título</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué necesitas hacer?" 
          onKeyDown={e => e.key === 'Enter' && onSubmit()} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm font-medium">Descripción</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} 
          placeholder="Detalles adicionales..." className="mt-1 resize-none" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Prioridad</Label>
          <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🟢 Baja</SelectItem>
              <SelectItem value="medium">🟡 Media</SelectItem>
              <SelectItem value="high">🔴 Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Fecha límite</Label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Área</Label>
          <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {allAreas.map(area => (
                <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Bloque</Label>
          <div className="mt-1">
            <BlockSelector value={selectedBlockId} onValueChange={setSelectedBlockId} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} className="w-full">{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  const assignToCurrentBlock = async (taskId: string) => {
    if (!currentBlock) { toast({ title: 'No hay bloque activo ahora' }); return; }
    const { error } = await supabase.from('tasks').update({ routine_block_id: currentBlock.id }).eq('id', taskId);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routineBlockId: currentBlock.id } : t));
    toast({ title: `Asignada a "${currentBlock.title}"` });
  };

  const sendToFocus = async (task: TaskItem) => {
    if (!task.routineBlockId && currentBlock) {
      await supabase.from('tasks').update({ routine_block_id: currentBlock.id }).eq('id', task.id);
    }
    navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}`);
  };

  const renderTask = (task: TaskItem) => {
    const priorityStyles: Record<string, string> = {
      high: 'border-l-destructive',
      medium: 'border-l-foreground/40',
      low: 'border-l-muted-foreground/30',
    };
    const areaName = allAreas.find(a => a.id === task.areaId)?.name;
    const blockName = blocks.find(b => b.id === task.routineBlockId)?.title;

    return (
      <div
        key={task.id}
        className={`group flex items-start gap-3 p-3 rounded-lg border border-l-[3px] ${priorityStyles[task.priority || 'low']} 
          bg-card hover:shadow-sm transition-all ${task.completed ? 'opacity-60' : ''}`}
      >
        <button onClick={() => handleToggleTask(task.id)} className="mt-0.5 flex-shrink-0">
          {task.completed 
            ? <CheckCircle2 className="w-5 h-5 text-success" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          }
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.dueDate && (
              <span className={`text-xs flex items-center gap-1 ${getDateStyle(task.dueDate)}`}>
                <Calendar className="w-3 h-3" />
                {getDateLabel(task.dueDate)}
              </span>
            )}
            {areaName && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">{areaName}</Badge>
            )}
            {blockName && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {blockName}
              </Badge>
            )}
            {task.priority === 'high' && !task.completed && (
              <AlertTriangle className="w-3 h-3 text-destructive" />
            )}
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {!task.completed && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => sendToFocus(task)}>
                      <Zap className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ir a Focus</p></TooltipContent>
                </Tooltip>
                {currentBlock && !task.routineBlockId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => assignToCurrentBlock(task.id)}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Asignar al bloque actual</p></TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(task)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Editar</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Eliminar</p></TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Tareas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingTasks.length} pendientes · {completedTasks.length} completadas · {completionRate}% éxito
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <PlusCircle className="mr-1.5 h-4 w-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
              <DialogDescription>Define los detalles de tu tarea.</DialogDescription>
            </DialogHeader>
            {renderTaskForm(handleCreateTask, 'Crear Tarea')}
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly / Monthly / Quarterly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TimeStatCard
          label="Esta Semana"
          completed={weeklyStats.done}
          total={weeklyStats.total}
          pct={weeklyStats.total > 0 ? Math.round((weeklyStats.done / weeklyStats.total) * 100) : 0}
          icon={<Layers className="w-4 h-4 text-blue-500" />}
          gradient="from-blue-500 to-cyan-400"
        />
        <TimeStatCard
          label="Este Mes"
          completed={monthlyStats.done}
          total={monthlyStats.total}
          pct={monthlyStats.total > 0 ? Math.round((monthlyStats.done / monthlyStats.total) * 100) : 0}
          icon={<BarChart3 className="w-4 h-4 text-purple-500" />}
          gradient="from-purple-500 to-pink-400"
        />
        <TimeStatCard
          label="Este Trimestre"
          completed={quarterlyStats.done}
          total={quarterlyStats.total}
          pct={quarterlyStats.total > 0 ? Math.round((quarterlyStats.done / quarterlyStats.total) * 100) : 0}
          icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
          gradient="from-amber-500 to-orange-400"
        />
      </div>

      {/* Area Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">ÁREAS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(['all', 'universidad', 'emprendimiento', 'proyectos'] as Category[]).map(cat => {
            const counts = cat === 'all'
              ? { pending: pendingTasks.length, total: tasks.length, done: completedTasks.length }
              : areaStats[cat] || { pending: 0, total: 0, done: 0 };
            return (
              <AreaCard
                key={cat}
                category={cat}
                active={activeCategory === cat}
                counts={counts}
                onClick={() => setActiveCategory(cat)}
              />
            );
          })}
        </div>
      </div>

      {/* Filters + Task List */}
      <div className="flex items-center justify-between gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="pending" className="text-xs h-7 px-3">
              Pendientes ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs h-7 px-3">
              Hoy ({todayTasks})
            </TabsTrigger>
            {overdueTasks > 0 && (
              <TabsTrigger value="overdue" className="text-xs h-7 px-3 text-destructive">
                Vencidas ({overdueTasks})
              </TabsTrigger>
            )}
            <TabsTrigger value="completed" className="text-xs h-7 px-3">
              Hechas ({completedTasks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="icon" className="h-7 w-7"
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={viewMode === 'grouped' ? 'secondary' : 'ghost'} 
            size="icon" className="h-7 w-7"
            onClick={() => setViewMode('grouped')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Prioridad</SelectItem>
              <SelectItem value="date">Fecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ListTodo className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'completed' ? 'No hay tareas completadas aún' 
                : activeTab === 'overdue' ? '¡Sin tareas vencidas! 🎉'
                : activeTab === 'today' ? 'No hay tareas para hoy'
                : 'No hay tareas pendientes. ¡Crea una!'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-4">
          {groupedByArea.map(([areaName, areaTasks]) => (
            <div key={areaName}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{areaName}</h3>
                <Badge variant="outline" className="text-[10px] h-4">{areaTasks.length}</Badge>
              </div>
              <div className="space-y-1.5">
                {areaTasks.map(renderTask)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTasks.map(renderTask)}
        </div>
      )}

      {/* Monthly Events Calendar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">CALENDARIO DE EVENTOS</h2>
        </div>
        <NotionCalendar />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={open => {
        if (!open) { setEditingTask(null); resetForm(); }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>Modifica los detalles de la tarea.</DialogDescription>
          </DialogHeader>
          {renderTaskForm(handleEditTask, 'Guardar Cambios')}
        </DialogContent>
      </Dialog>
    </div>
  );
}