import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  PlusCircle, Trash2, Calendar, Clock, Pencil,
  CheckCircle2, Circle, Target,
  ListTodo, ArrowUpDown, LayoutGrid, List, Zap, Play,
  BookOpen, Briefcase, FolderKanban, Sparkles, Languages,
  TrendingUp, BarChart3, Layers, ChevronRight, Repeat, Tags as TagsIcon, Timer,
  Search, CheckCheck, Flame, X, ChevronDown, Inbox
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday, isTomorrow, isPast, isThisWeek, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cachedQuery, cachedMutation } from '@/lib/supabaseCache';
import { z } from 'zod';
import { lifeAreas, centralAreas } from '@/lib/data';
import { flattenAreas, cn } from '@/lib/utils';
import { BlockSelector } from '@/components/BlockSelector';
import { DatePicker } from '@/components/ui/date-picker';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import NotionCalendar from '@/components/calendar/NotionCalendar';

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido").max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(0).max(600).optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]),
  priorityAbcd: z.enum(["a", "b", "c", "d"]),
});

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  priorityAbcd?: 'a' | 'b' | 'c' | 'd';
  completed: boolean;
  dueDate?: Date;
  areaId?: string;
  routineBlockId?: string;
  source: string;
  createdAt: Date;
  estimatedMinutes?: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  tags?: string[];
  parentId?: string;
}

type Category = 'all' | 'universidad' | 'emprendimiento' | 'proyectos' | 'idiomas' | 'tareas';
type PriorityAbcd = 'a' | 'b' | 'c' | 'd';
type PriorityFilter = 'all' | PriorityAbcd;

const categorize = (t: { areaId?: string; source?: string }): Exclude<Category, 'all'> => {
  if (t.areaId === 'universidad' || t.source === 'university') return 'universidad';
  if (t.areaId === 'emprendimiento' || t.source === 'entrepreneurship') return 'emprendimiento';
  if (t.areaId === 'proyectos' || t.source === 'projects') return 'proyectos';
  if (t.areaId === 'idiomas' || t.source === 'idiomas') return 'idiomas';
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
  idiomas: {
    icon: <Languages className="w-4 h-4" />,
    gradient: 'from-teal-600 to-teal-400',
    lightBg: 'bg-teal-500/10',
  },
};

const ABCD_META: Record<PriorityAbcd, {
  label: string;
  hint: string;
  order: number;
  badge: string;
  border: string;
  chip: string;
  text: string;
}> = {
  a: {
    label: 'Crítica',
    hint: 'Importante y urgente — hazla ahora',
    order: 4,
    badge: 'bg-red-500/15 text-red-600 border-red-500/40',
    border: 'border-l-red-500',
    chip: 'bg-red-500 text-white border-red-500',
    text: 'text-red-500',
  },
  b: {
    label: 'Importante',
    hint: 'Importante, no urgente — prográmala',
    order: 3,
    badge: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    border: 'border-l-amber-500',
    chip: 'bg-amber-500 text-white border-amber-500',
    text: 'text-amber-500',
  },
  c: {
    label: 'Normal',
    hint: 'Sin prisa — hazla si sobra tiempo',
    order: 2,
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
    border: 'border-l-blue-500',
    chip: 'bg-blue-500 text-white border-blue-500',
    text: 'text-blue-500',
  },
  d: {
    label: 'Delegar / Descartar',
    hint: 'Delegable o de bajo valor',
    order: 1,
    badge: 'bg-muted/60 text-muted-foreground border-muted-foreground/30',
    border: 'border-l-slate-400',
    chip: 'bg-slate-400 text-white border-slate-400',
    text: 'text-muted-foreground',
  },
};

const abcdOf = (t: { priorityAbcd?: PriorityAbcd; priority?: string }): PriorityAbcd => {
  if (t.priorityAbcd && ABCD_META[t.priorityAbcd]) return t.priorityAbcd;
  if (t.priority === 'high') return 'b';
  if (t.priority === 'low') return 'd';
  return 'c';
};

const legacyOf = (code: PriorityAbcd): 'low' | 'medium' | 'high' =>
  code === 'a' || code === 'b' ? 'high' : code === 'c' ? 'medium' : 'low';

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

function PendingStatCard({ pending, critical, overdue }: { pending: number; critical: number; overdue: number }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-slate-700 to-slate-500" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pendientes</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{pending}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/60">
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" />
            <span className="font-bold text-red-500">{critical}</span> críticas (A)
          </span>
          {overdue > 0 && (
            <span className="flex items-center gap-1">
              <span className="font-bold text-destructive">{overdue}</span> vencidas
            </span>
          )}
        </div>
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

function AbcdBadge({ code, className = '' }: { code: PriorityAbcd; className?: string }) {
  return (
    <span
      title={`${ABCD_META[code].label}: ${ABCD_META[code].hint}`}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-extrabold shadow-sm',
        ABCD_META[code].badge,
        className
      )}
    >
      {code.toUpperCase()}
    </span>
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
  const [priorityAbcd, setPriorityAbcd] = useState<PriorityAbcd>('c');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [parentTaskId, setParentTaskId] = useState<string>('none');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmCompleteAll, setConfirmCompleteAll] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkAreaId, setBulkAreaId] = useState('');
  const [bulkBlockId, setBulkBlockId] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  useEffect(() => { setSelectedIds([]); }, [activeTab, activeCategory, priorityFilter, tagFilter, searchQuery]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = (data as any[]).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          priority: t.priority as any,
          priorityAbcd: (t.priority_abcd as any) || undefined,
          completed: t.completed || false,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          areaId: t.area_id || undefined,
          routineBlockId: t.routine_block_id || undefined,
          source: t.source,
          createdAt: new Date(t.created_at),
          estimatedMinutes: t.estimated_minutes || undefined,
          recurrence: (t.recurrence as any) || 'none',
          tags: t.tags || [],
          parentId: t.parent_id || undefined,
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
          priorityAbcd: (t.priority_abcd as any) || undefined,
          completed: t.completed || false,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          areaId: t.area_id || undefined,
          routineBlockId: t.routine_block_id || undefined,
          source: t.source,
          createdAt: new Date(t.created_at),
          estimatedMinutes: t.estimated_minutes || undefined,
          recurrence: t.recurrence || 'none',
          tags: t.tags || [],
          parentId: t.parent_id || undefined,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriorityAbcd('c');
    setDueDate(''); setSelectedAreaId(''); setSelectedBlockId('');
    setEstimatedMinutes(''); setRecurrence('none'); setTags([]); setTagInput(''); setParentTaskId('none');
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const advanceDate = (d: Date | undefined, rule: 'none' | 'daily' | 'weekly' | 'monthly'): string | null => {
    if (!d) return null;
    if (rule === 'daily') return addDays(d, 1).toISOString();
    if (rule === 'weekly') return addWeeks(d, 1).toISOString();
    if (rule === 'monthly') return addMonths(d, 1).toISOString();
    return null;
  };

  const maybeScheduleNext = async (task: TaskItem, allTasks: TaskItem[]) => {
    if (!task.completed && task.recurrence && task.recurrence !== 'none') {
      const nextDue = advanceDate(task.dueDate, task.recurrence);
      const exists = allTasks.some(t =>
        t.id !== task.id && t.title === task.title && !t.completed &&
        t.recurrence === task.recurrence && t.dueDate?.toISOString().slice(0, 10) === nextDue?.slice(0, 10)
      );
      if (nextDue && !exists) {
        const code = abcdOf(task);
        const { queued: nextQueued, error: nextError } = await cachedMutation("tasks", "insert", {
          title: task.title, description: task.description || null,
          priority: task.priority || legacyOf(code), due_date: nextDue, completed: false,
          status: 'pendiente', source: 'general',
          area_id: task.areaId || null, routine_block_id: task.routineBlockId || null,
          estimated_minutes: task.estimatedMinutes || null, recurrence: task.recurrence,
          tags: task.tags && task.tags.length > 0 ? task.tags : null,
          parent_id: task.parentId || null,
          priority_abcd: task.priorityAbcd || null,
        });
        if (nextQueued) {
          toast({ title: 'Recurrencia programada (offline) — se sincronizará al reconectar' });
        } else if (nextError) {
          toast({ variant: "destructive", title: "No se pudo programar la próxima tarea", description: nextError?.message || "Error desconocido" });
        } else {
          toast({ title: 'Recurrencia: se programó la próxima tarea' });
        }
      }
    }
  };

  const handleCreateTask = async () => {
    try {
      const legacy = legacyOf(priorityAbcd);
      const validated = taskSchema.parse({
        title, description, priority: legacy, dueDate,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        recurrence, priorityAbcd,
      });
      const payload = {
        title: validated.title, description: validated.description || null,
        status: 'pendiente', priority: legacy,
        due_date: validated.dueDate || null, completed: false, source: 'general',
        area_id: selectedAreaId || null,
        routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
        estimated_minutes: validated.estimatedMinutes || null,
        recurrence: validated.recurrence,
        tags: tags.length > 0 ? tags : null,
        parent_id: parentTaskId && parentTaskId !== 'none' ? parentTaskId : null,
        priority_abcd: priorityAbcd,
      };
      const { queued, error } = await cachedMutation("tasks", "insert", payload);
      if (queued) {
        toast({ title: 'Tarea creada (offline) — se sincronizará al reconectar' });
      } else if (error) {
        toast({ variant: "destructive", title: "No se pudo crear la tarea", description: error?.message || "Error desconocido" });
        return;
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
      const legacy = legacyOf(priorityAbcd);
      const validated = taskSchema.parse({
        title, description, priority: legacy, dueDate,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        recurrence, priorityAbcd,
      });
      const payload = {
        title: validated.title, description: validated.description || null,
        priority: legacy, due_date: validated.dueDate || null,
        area_id: selectedAreaId || null,
        routine_block_id: selectedBlockId && selectedBlockId !== 'none' ? selectedBlockId : null,
        estimated_minutes: validated.estimatedMinutes || null,
        recurrence: validated.recurrence,
        tags: tags.length > 0 ? tags : null,
        parent_id: parentTaskId && parentTaskId !== 'none' ? parentTaskId : null,
        priority_abcd: priorityAbcd,
      };
      const { queued, error } = await cachedMutation("tasks", "update", payload, { id: editingTask.id });
      if (queued) {
        toast({ title: 'Tarea actualizada (offline) — se sincronizará al reconectar' });
      } else if (error) {
        toast({ variant: "destructive", title: "No se pudo actualizar la tarea", description: error?.message || "Error desconocido" });
        return;
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
    setPriorityAbcd(abcdOf(task));
    setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
    setSelectedAreaId(task.areaId || ''); setSelectedBlockId(task.routineBlockId || '');
    setEstimatedMinutes(task.estimatedMinutes ? String(task.estimatedMinutes) : '');
    setRecurrence(task.recurrence || 'none'); setTags(task.tags || []); setTagInput('');
    setParentTaskId(task.parentId || 'none');
    setIsEditDialogOpen(true);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: nextCompleted } : t));
    const { queued, error } = await cachedMutation("tasks", "update", {
      completed: nextCompleted, status: task.completed ? 'pendiente' : 'completada'
    }, { id: taskId });

    if (nextCompleted) await maybeScheduleNext({ ...task, completed: false }, tasks);

    if (queued) {
      toast({ title: 'Cambio guardado offline — pendiente de sincronización' });
    } else if (error) {
      toast({ variant: "destructive", title: "No se pudo actualizar", description: error?.message || "Error desconocido" });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: task.completed } : t));
    }
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    const { queued, error } = await cachedMutation("tasks", "delete", undefined, { id: taskId });
    if (queued) {
      toast({ title: 'Eliminado offline — pendiente de sincronización' });
    } else if (error) {
      toast({ variant: "destructive", title: "No se pudo eliminar", description: error?.message || "Error desconocido" });
      if (taskToDelete) setTasks(prev => [taskToDelete, ...prev]);
    } else {
      toast({ title: 'Tarea eliminada' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkComplete = async () => {
    const targets = tasks.filter(t => selectedIds.includes(t.id) && !t.completed);
    for (const t of targets) {
      await cachedMutation("tasks", "update", { completed: true, status: 'completada' }, { id: t.id });
      await maybeScheduleNext(t, tasks);
    }
    if (targets.length > 0) toast({ title: `${targets.length} tareas completadas` });
    setSelectedIds([]);
    await loadTasks();
  };

  const bulkDelete = async () => {
    const targets = tasks.filter(t => selectedIds.includes(t.id));
    for (const t of targets) {
      await cachedMutation("tasks", "delete", undefined, { id: t.id });
    }
    if (targets.length > 0) toast({ title: `${targets.length} tareas eliminadas` });
    setSelectedIds([]);
    setConfirmBulkDelete(false);
    await loadTasks();
  };

  const bulkApplyArea = async (areaId: string | null) => {
    const targets = tasks.filter(t => selectedIds.includes(t.id));
    for (const t of targets) {
      await cachedMutation("tasks", "update", { area_id: areaId }, { id: t.id });
    }
    if (targets.length > 0) toast({ title: `Área asignada a ${targets.length} tareas` });
    setSelectedIds([]);
    await loadTasks();
  };

  const bulkApplyBlock = async (blockId: string) => {
    const targets = tasks.filter(t => selectedIds.includes(t.id));
    for (const t of targets) {
      await cachedMutation("tasks", "update", {
        routine_block_id: blockId && blockId !== 'none' ? blockId : null
      }, { id: t.id });
    }
    if (targets.length > 0) toast({ title: `Bloque asignado a ${targets.length} tareas` });
    setSelectedIds([]);
    await loadTasks();
  };

  const completeAllPending = async () => {
    const targets = filteredTasks.filter(t => !t.completed);
    for (const t of targets) {
      await cachedMutation("tasks", "update", { completed: true, status: 'completada' }, { id: t.id });
      await maybeScheduleNext(t, tasks);
    }
    if (targets.length > 0) toast({ title: `${targets.length} tareas marcadas como completadas` });
    setConfirmCompleteAll(false);
    setSelectedIds([]);
    await loadTasks();
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
  const criticalTasks = pendingTasks.filter(t => abcdOf(t) === 'a').length;
  const todayTasks = pendingTasks.filter(t => t.dueDate && isToday(t.dueDate)).length;
  const overdueTasks = pendingTasks.filter(t => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate)).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // === AREAS ===
  const areaStats = useMemo(() => {
    const cats: Category[] = ['universidad', 'emprendimiento', 'proyectos', 'tareas', 'idiomas'];
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

  // === FILTERED TASKS ===
  const matchesSearch = (t: TaskItem, q: string) => {
    if (!q) return true;
    return t.title.toLowerCase().includes(q)
      || (t.description || '').toLowerCase().includes(q)
      || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => (t.tags || []).forEach(tag => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const abcdCounts = useMemo(() => {
    const scope = (activeCategory === 'all' ? tasks : tasks.filter(t => categorize(t) === activeCategory))
      .filter(t => !t.completed);
    const q = searchQuery.trim().toLowerCase();
    const scoped = scope.filter(t => matchesSearch(t, q));
    return {
      all: scoped.length,
      a: scoped.filter(t => abcdOf(t) === 'a').length,
      b: scoped.filter(t => abcdOf(t) === 'b').length,
      c: scoped.filter(t => abcdOf(t) === 'c').length,
      d: scoped.filter(t => abcdOf(t) === 'd').length,
    };
  }, [tasks, activeCategory, searchQuery]);

  const filteredTasks = useMemo(() => {
    const byCat = activeCategory === 'all' ? tasks : tasks.filter(t => categorize(t) === activeCategory);
    const pending = byCat.filter(t => !t.completed);
    const done = byCat.filter(t => t.completed);
    let list = activeTab === 'pending' ? pending
      : activeTab === 'completed' ? done
      : activeTab === 'overdue' ? pending.filter(t => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate))
      : activeTab === 'today' ? pending.filter(t => t.dueDate && (isToday(t.dueDate) || isTomorrow(t.dueDate)))
      : byCat;

    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(t => matchesSearch(t, q));

    if (priorityFilter !== 'all') list = list.filter(t => abcdOf(t) === priorityFilter);

    if (tagFilter !== 'all') list = list.filter(t => t.tags?.includes(tagFilter));

    if (sortBy === 'priority') {
      list = [...list].sort((a, b) => (ABCD_META[abcdOf(b)].order) - (ABCD_META[abcdOf(a)].order));
    } else if (sortBy === 'date') {
      list = [...list].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    } else if (sortBy === 'area') {
      list = [...list].sort((a, b) => {
        const na = allAreas.find(x => x.id === a.areaId)?.name || '';
        const nb = allAreas.find(x => x.id === b.areaId)?.name || '';
        return na.localeCompare(nb);
      });
    }
    return list;
  }, [tasks, activeTab, activeCategory, sortBy, searchQuery, priorityFilter, tagFilter, allAreas]);

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

  const renderOrder = useMemo(() => {
    const parents = filteredTasks.filter(t => !t.parentId);
    const kids = filteredTasks.filter(t => t.parentId);
    const out: TaskItem[] = [];
    parents.forEach(p => {
      out.push(p);
      kids.filter(k => k.parentId === p.id).forEach(k => out.push(k));
    });
    kids.forEach(k => { if (!out.includes(k)) out.push(k); });
    return out;
  }, [filteredTasks]);

  const renderAbcdSelector = () => (
    <div>
      <Label className="text-sm font-medium">Prioridad (A–D)</Label>
      <div className="grid grid-cols-4 gap-1.5 mt-1">
        {(['a', 'b', 'c', 'd'] as PriorityAbcd[]).map(code => (
          <button
            key={code}
            type="button"
            onClick={() => setPriorityAbcd(code)}
            className={cn(
              'rounded-lg border px-1 py-2 text-center transition-all',
              priorityAbcd === code
                ? 'border-border bg-muted shadow-sm ring-1 ring-primary/40'
                : 'border-border/60 bg-transparent hover:bg-muted/50'
            )}
          >
            <span
              className={cn(
                'mx-auto flex h-6 w-6 items-center justify-center rounded-md border text-xs font-extrabold',
                priorityAbcd === code ? ABCD_META[code].badge : 'bg-muted text-muted-foreground border-transparent'
              )}
            >
              {code.toUpperCase()}
            </span>
            <span className={cn('mt-1 block text-[10px] font-medium leading-tight', priorityAbcd === code ? ABCD_META[code].text : 'text-muted-foreground')}>
              {ABCD_META[code].label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">{ABCD_META[priorityAbcd].hint}</p>
    </div>
  );

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
      {renderAbcdSelector()}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Fecha límite</Label>
          <DatePicker
            value={dueDate ? parseISO(dueDate) : undefined}
            onChange={(date) => setDueDate(date ? format(date, 'yyyy-MM-dd') : '')}
            placeholder="Seleccionar fecha"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Minutos estimados</Label>
          <div className="relative mt-1">
            <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input type="number" min={0} step={5} value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)}
              placeholder="60" className="pl-8" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Repetición</Label>
          <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No repetir</SelectItem>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Etiquetas</Label>
          <div className="flex gap-1.5 mt-1">
            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Nueva etiqueta..."
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={addTag}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map(t => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1.5 pl-2.5 text-[11px]">
              <TagsIcon className="h-3 w-3" />{t}
              <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-foreground">
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
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
      <div>
        <Label className="text-sm font-medium">Sub-tarea de</Label>
        <Select value={parentTaskId} onValueChange={setParentTaskId}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Ninguna (tarea principal)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ninguna (tarea principal)</SelectItem>
            {tasks.filter(t => !t.completed && !t.parentId).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    const code = abcdOf(task);
    const areaName = allAreas.find(a => a.id === task.areaId)?.name;
    const blockName = blocks.find(b => b.id === task.routineBlockId)?.title;
    const isSub = !!task.parentId;
    const isSelected = selectedIds.includes(task.id);

    return (
      <div
        key={task.id}
        className={`group flex items-start gap-2.5 p-3 rounded-lg border border-l-[3px] ${ABCD_META[code].border}
          bg-card hover:shadow-sm transition-all ${task.completed ? 'opacity-60' : ''} ${isSub ? 'ml-6 border-dashed' : ''} ${isSelected ? 'ring-1 ring-primary/60 bg-muted/30' : ''}`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelect(task.id)}
          className="mt-1.5 opacity-50 hover:opacity-100"
          aria-label={`Seleccionar ${task.title}`}
        />
        <button onClick={() => handleToggleTask(task.id)} className="mt-1 flex-shrink-0">
          {task.completed
            ? <CheckCircle2 className="w-5 h-5 text-success" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <AbcdBadge code={code} />
            <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </p>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 ml-[26px]">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap ml-[26px]">
            {task.dueDate && (
              <span className={`text-xs flex items-center gap-1 ${getDateStyle(task.dueDate)}`}>
                <Calendar className="w-3 h-3" />
                {getDateLabel(task.dueDate)}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <Timer className="w-3 h-3" />{task.estimatedMinutes}m
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                <Repeat className="w-3 h-3" />
                {task.recurrence === 'daily' ? 'Diaria' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensual'}
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
            {task.tags && task.tags.length > 0 && task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal gap-0.5 text-primary">
                <TagsIcon className="w-2.5 h-2.5" /> {tag}
              </Badge>
            ))}
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
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

  const pendingInFilter = filteredTasks.filter(t => !t.completed);

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Tareas generales
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{pendingTasks.length} pendientes · {completedTasks.length} completadas · {completionRate}% éxito</span>
            {criticalTasks > 0 && (
              <span className="flex items-center gap-0.5 text-red-500">
                <Flame className="w-3 h-3" /> {criticalTasks} críticas (A)
              </span>
            )}
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <PendingStatCard pending={pendingTasks.length} critical={criticalTasks} overdue={overdueTasks} />
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

      {/* Legend ABCD */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mr-1">Prioridad:</span>
        {(['a', 'b', 'c', 'd'] as PriorityAbcd[]).map(code => (
          <span key={code} title={ABCD_META[code].hint} className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <AbcdBadge code={code} />
            {ABCD_META[code].label}
          </span>
        ))}
      </div>

      {/* Area Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">ÁREAS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(['all', 'universidad', 'emprendimiento', 'proyectos', 'tareas', 'idiomas'] as Category[]).map(cat => {
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

      {/* Search + Filters + Task List */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, descripción o etiqueta..."
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="all" className="text-xs h-7 px-3">
                Todas ({tasks.length})
              </TabsTrigger>
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
                <SelectItem value="area">Área</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={priorityFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm" className="h-7 text-xs px-3"
              onClick={() => setPriorityFilter('all')}
            >
              Todas ({abcdCounts.all})
            </Button>
            {(['a', 'b', 'c', 'd'] as PriorityAbcd[]).map(code => (
              <button
                key={code}
                onClick={() => setPriorityFilter(priorityFilter === code ? 'all' : code)}
                className={cn(
                  'h-7 rounded-full border px-2.5 text-xs font-semibold transition-all flex items-center gap-1',
                  priorityFilter === code
                    ? ABCD_META[code].chip
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                )}
              >
                {code.toUpperCase()}
                <span className={cn('tabular-nums', priorityFilter === code ? 'text-white/80' : 'text-muted-foreground/70')}>
                  {abcdCounts[code]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-7 w-[150px] text-xs">
                <TagsIcon className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pendingInFilter.length > 0 && activeTab !== 'completed' && (
              <AlertDialog open={confirmCompleteAll} onOpenChange={setConfirmCompleteAll}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Completar pendientes ({pendingInFilter.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Completar todas las pendientes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se marcarán como completadas las {pendingInFilter.length} tareas pendientes del filtro actual.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={completeAllPending}>Sí, completar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || priorityFilter !== 'all' || tagFilter !== 'all'
                ? 'No hay tareas que coincidan con los filtros.'
                : activeTab === 'completed' ? 'No hay tareas completadas aún'
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
                {renderOrder.filter(t => areaTasks.includes(t)).map(renderTask)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {renderOrder.map(renderTask)}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-3 z-20">
          <Card className="border-primary/30 shadow-lg">
            <CardContent className="py-2.5 flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="h-6">
                {selectedIds.length} seleccionadas
              </Badge>
              <Button size="sm" variant="default" className="h-8 text-xs" onClick={bulkComplete}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completar
              </Button>
              <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-8 text-xs">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar {selectedIds.length} tareas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={bulkDelete}>Sí, eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="w-px h-6 bg-border" />
              <Select value={bulkAreaId} onValueChange={v => { bulkApplyArea(v === '__none__' ? null : v); setBulkAreaId(''); }}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Asignar área..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin área</SelectItem>
                  {allAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-40">
                <BlockSelector value={bulkBlockId} onValueChange={v => { bulkApplyBlock(v); setBulkBlockId(''); }} placeholder="Asignar bloque..." />
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 ml-auto" onClick={() => setSelectedIds([])} aria-label="Cancelar selección">
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Events Calendar (collapsible) */}
      <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
        <div className="flex items-center mb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-0 hover:bg-transparent">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Calendario de eventos
              <ChevronDown className={`h-3.5 w-3.5 ml-1.5 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <NotionCalendar />
        </CollapsibleContent>
      </Collapsible>

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