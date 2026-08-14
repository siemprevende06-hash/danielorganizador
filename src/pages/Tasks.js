import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Trash2, Calendar, Clock, Pencil, CheckCircle2, Circle, AlertTriangle, ListTodo, ArrowUpDown, LayoutGrid, List, Zap, Play, BookOpen, Briefcase, FolderKanban, Sparkles, Languages, TrendingUp, BarChart3, Layers, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isTomorrow, isPast, isThisWeek, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cachedQuery, cachedMutation } from '@/lib/supabaseCache';
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
const categorize = (t) => {
    if (t.areaId === 'universidad' || t.source === 'university')
        return 'universidad';
    if (t.areaId === 'emprendimiento' || t.source === 'entrepreneurship')
        return 'emprendimiento';
    if (t.areaId === 'proyectos' || t.source === 'projects')
        return 'proyectos';
    if (t.areaId === 'idiomas')
        return 'idiomas';
    return 'tareas';
};
const AREA_CONFIG = {
    universidad: {
        icon: _jsx(BookOpen, { className: "w-4 h-4" }),
        gradient: 'from-blue-600 to-blue-400',
        lightBg: 'bg-blue-500/10',
    },
    emprendimiento: {
        icon: _jsx(Briefcase, { className: "w-4 h-4" }),
        gradient: 'from-purple-600 to-purple-400',
        lightBg: 'bg-purple-500/10',
    },
    proyectos: {
        icon: _jsx(FolderKanban, { className: "w-4 h-4" }),
        gradient: 'from-amber-600 to-amber-400',
        lightBg: 'bg-amber-500/10',
    },
    tareas: {
        icon: _jsx(ListTodo, { className: "w-4 h-4" }),
        gradient: 'from-emerald-600 to-emerald-400',
        lightBg: 'bg-emerald-500/10',
    },
    idiomas: {
        icon: _jsx(Languages, { className: "w-4 h-4" }),
        gradient: 'from-teal-600 to-teal-400',
        lightBg: 'bg-teal-500/10',
    },
};
function TimeStatCard({ label, completed, total, pct, icon, gradient }) {
    return (_jsxs(Card, { className: "overflow-hidden border-0 shadow-sm", children: [_jsx("div", { className: `h-1.5 bg-gradient-to-r ${gradient}` }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-medium", children: label }), _jsxs("p", { className: "text-2xl font-bold mt-0.5 tabular-nums", children: [pct, "%"] })] }), _jsx("div", { className: `p-2 rounded-lg ${gradient.replace('from-', 'bg-').replace('to-', '/20')} bg-opacity-20`, children: icon })] }), _jsxs("div", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [_jsx("span", { className: "font-medium text-foreground", children: completed }), _jsx("span", { children: "de" }), _jsx("span", { className: "font-medium text-foreground", children: total }), _jsx("span", { children: "tareas" })] }), _jsx(Progress, { value: pct, className: "h-1 mt-2" })] })] }));
}
function AreaCard({ category, active, counts, onClick }) {
    const config = category === 'all'
        ? { icon: _jsx(Sparkles, { className: "w-4 h-4" }), gradient: 'from-primary to-primary/60', lightBg: 'bg-primary/10', label: 'Todas' }
        : { ...AREA_CONFIG[category], label: category.charAt(0).toUpperCase() + category.slice(1) };
    const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
    return (_jsx("button", { onClick: onClick, className: "text-left w-full", children: _jsx(Card, { className: `transition-all duration-200 hover:shadow-md ${active ? 'ring-2 ring-primary ring-offset-2' : ''}`, children: _jsx(CardContent, { className: "p-3.5", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg ${config.lightBg}`, children: config.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-sm font-semibold", children: config.label }), _jsxs(Badge, { variant: active ? 'default' : 'outline', className: "text-[10px] h-4 px-1.5", children: [counts.pending, " pend."] })] }), _jsxs("div", { className: "flex items-center gap-2 mt-1 text-[10px] text-muted-foreground", children: [_jsxs("span", { children: [counts.done, "/", counts.total, " completadas"] }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { className: pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-amber-500' : 'text-muted-foreground', children: [pct, "%"] })] }), _jsx(Progress, { value: pct, className: "h-1 mt-1.5" })] }), _jsx(ChevronRight, { className: `w-4 h-4 shrink-0 transition-opacity ${active ? 'opacity-100 text-primary' : 'opacity-30'}` })] }) }) }) }));
}
export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('priority');
    const [viewMode, setViewMode] = useState('list');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [selectedBlockId, setSelectedBlockId] = useState('');
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
            if (error)
                throw error;
            if (data) {
                const mapped = data.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || undefined,
                    priority: t.priority,
                    completed: t.completed || false,
                    dueDate: t.due_date ? new Date(t.due_date) : undefined,
                    areaId: t.area_id || undefined,
                    routineBlockId: t.routine_block_id || undefined,
                    source: t.source,
                    createdAt: new Date(t.created_at),
                }));
                setTasks(mapped);
            }
        }
        catch (error) {
            const { data: cached } = await cachedQuery("tasks", "all", async () => [], 60 * 1000);
            if (cached && cached.length > 0) {
                setTasks(cached.map((t) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || undefined,
                    priority: t.priority,
                    completed: t.completed || false,
                    dueDate: t.due_date ? new Date(t.due_date) : undefined,
                    areaId: t.area_id || undefined,
                    routineBlockId: t.routine_block_id || undefined,
                    source: t.source,
                    createdAt: new Date(t.created_at),
                })));
            }
        }
        finally {
            setLoading(false);
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
            }
            else {
                toast({ title: 'Tarea creada ✓' });
            }
            await loadTasks();
            resetForm();
            setIsDialogOpen(false);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
            }
            else {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };
    const handleEditTask = async () => {
        if (!editingTask)
            return;
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
            }
            else {
                toast({ title: 'Tarea actualizada ✓' });
            }
            await loadTasks();
            resetForm();
            setEditingTask(null);
            setIsEditDialogOpen(false);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
            }
            else {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            }
        }
    };
    const openEditDialog = (task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority || 'medium');
        setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
        setSelectedAreaId(task.areaId || '');
        setSelectedBlockId(task.routineBlockId || '');
        setIsEditDialogOpen(true);
    };
    const handleToggleTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task)
            return;
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
        const { queued } = await cachedMutation("tasks", "update", {
            completed: !task.completed, status: task.completed ? 'pendiente' : 'completada'
        }, { id: taskId });
        if (queued) {
            toast({ title: 'Cambio guardado offline — pendiente de sincronización' });
        }
    };
    const handleDeleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        const { queued } = await cachedMutation("tasks", "delete", undefined, { id: taskId });
        if (queued) {
            toast({ title: 'Eliminado offline — pendiente de sincronización' });
        }
        else {
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
    const tasksInRange = (start, end) => {
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
        const cats = ['universidad', 'emprendimiento', 'proyectos', 'tareas'];
        const stats = {};
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
        const c = { universidad: 0, emprendimiento: 0, proyectos: 0, tareas: 0 };
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
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (sortBy === 'priority') {
            list = [...list].sort((a, b) => (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0));
        }
        else if (sortBy === 'date') {
            list = [...list].sort((a, b) => {
                if (!a.dueDate && !b.dueDate)
                    return 0;
                if (!a.dueDate)
                    return 1;
                if (!b.dueDate)
                    return -1;
                return a.dueDate.getTime() - b.dueDate.getTime();
            });
        }
        return list;
    }, [tasks, activeTab, activeCategory, sortBy]);
    const groupedByArea = useMemo(() => {
        const groups = { 'Sin área': [] };
        filteredTasks.forEach(t => {
            const area = allAreas.find(a => a.id === t.areaId);
            const key = area ? area.name : 'Sin área';
            if (!groups[key])
                groups[key] = [];
            groups[key].push(t);
        });
        return Object.entries(groups).filter(([, tasks]) => tasks.length > 0);
    }, [filteredTasks, allAreas]);
    // === RENDER HELPERS ===
    const getDateLabel = (date) => {
        if (!date)
            return null;
        if (isToday(date))
            return 'Hoy';
        if (isTomorrow(date))
            return 'Mañana';
        if (isPast(date))
            return 'Vencida';
        if (isThisWeek(date))
            return format(date, 'EEEE', { locale: es });
        return format(date, 'dd MMM', { locale: es });
    };
    const getDateStyle = (date) => {
        if (!date)
            return '';
        if (isPast(date) && !isToday(date))
            return 'text-destructive font-medium';
        if (isToday(date))
            return 'text-foreground font-medium';
        return 'text-muted-foreground';
    };
    const renderTaskForm = (onSubmit, submitLabel) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "T\u00EDtulo" }), _jsx(Input, { value: title, onChange: e => setTitle(e.target.value), placeholder: "\u00BFQu\u00E9 necesitas hacer?", onKeyDown: e => e.key === 'Enter' && onSubmit(), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Descripci\u00F3n" }), _jsx(Textarea, { value: description, onChange: e => setDescription(e.target.value), placeholder: "Detalles adicionales...", className: "mt-1 resize-none", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Prioridad" }), _jsxs(Select, { value: priority, onValueChange: (v) => setPriority(v), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "\uD83D\uDFE2 Baja" }), _jsx(SelectItem, { value: "medium", children: "\uD83D\uDFE1 Media" }), _jsx(SelectItem, { value: "high", children: "\uD83D\uDD34 Alta" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Fecha l\u00EDmite" }), _jsx(Input, { type: "date", value: dueDate, onChange: e => setDueDate(e.target.value), className: "mt-1" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "\u00C1rea" }), _jsxs(Select, { value: selectedAreaId, onValueChange: setSelectedAreaId, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Seleccionar" }) }), _jsx(SelectContent, { children: allAreas.map(area => (_jsx(SelectItem, { value: area.id, children: area.name }, area.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Bloque" }), _jsx("div", { className: "mt-1", children: _jsx(BlockSelector, { value: selectedBlockId, onValueChange: setSelectedBlockId }) })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: onSubmit, className: "w-full", children: submitLabel }) })] }));
    const assignToCurrentBlock = async (taskId) => {
        if (!currentBlock) {
            toast({ title: 'No hay bloque activo ahora' });
            return;
        }
        const { error } = await supabase.from('tasks').update({ routine_block_id: currentBlock.id }).eq('id', taskId);
        if (error) {
            toast({ title: 'Error', variant: 'destructive' });
            return;
        }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routineBlockId: currentBlock.id } : t));
        toast({ title: `Asignada a "${currentBlock.title}"` });
    };
    const sendToFocus = async (task) => {
        if (!task.routineBlockId && currentBlock) {
            await supabase.from('tasks').update({ routine_block_id: currentBlock.id }).eq('id', task.id);
        }
        navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}`);
    };
    const renderTask = (task) => {
        const priorityStyles = {
            high: 'border-l-destructive',
            medium: 'border-l-foreground/40',
            low: 'border-l-muted-foreground/30',
        };
        const areaName = allAreas.find(a => a.id === task.areaId)?.name;
        const blockName = blocks.find(b => b.id === task.routineBlockId)?.title;
        return (_jsxs("div", { className: `group flex items-start gap-3 p-3 rounded-lg border border-l-[3px] ${priorityStyles[task.priority || 'low']} 
          bg-card hover:shadow-sm transition-all ${task.completed ? 'opacity-60' : ''}`, children: [_jsx("button", { onClick: () => handleToggleTask(task.id), className: "mt-0.5 flex-shrink-0", children: task.completed
                        ? _jsx(CheckCircle2, { className: "w-5 h-5 text-success" })
                        : _jsx(Circle, { className: "w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`, children: task.title }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-1", children: task.description })), _jsxs("div", { className: "flex items-center gap-2 mt-1.5 flex-wrap", children: [task.dueDate && (_jsxs("span", { className: `text-xs flex items-center gap-1 ${getDateStyle(task.dueDate)}`, children: [_jsx(Calendar, { className: "w-3 h-3" }), getDateLabel(task.dueDate)] })), areaName && (_jsx(Badge, { variant: "outline", className: "text-[10px] px-1.5 py-0 h-4 font-normal", children: areaName })), blockName && (_jsxs(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0 h-4 font-normal gap-0.5", children: [_jsx(Clock, { className: "w-2.5 h-2.5" }), " ", blockName] })), task.priority === 'high' && !task.completed && (_jsx(AlertTriangle, { className: "w-3 h-3 text-destructive" }))] })] }), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0", children: [!task.completed && (_jsxs(_Fragment, { children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-primary", onClick: () => sendToFocus(task), children: _jsx(Zap, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Ir a Focus" }) })] }), currentBlock && !task.routineBlockId && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => assignToCurrentBlock(task.id), children: _jsx(Play, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Asignar al bloque actual" }) })] }))] })), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => openEditDialog(task), children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Editar" }) })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => handleDeleteTask(task.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Eliminar" }) })] })] }) })] }, task.id));
    };
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24 space-y-4", children: [1, 2, 3, 4].map(i => _jsx("div", { className: "animate-pulse h-16 bg-muted rounded-lg" }, i)) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent", children: "Tareas" }), _jsxs("p", { className: "text-sm text-muted-foreground mt-0.5", children: [pendingTasks.length, " pendientes \u00B7 ", completedTasks.length, " completadas \u00B7 ", completionRate, "% \u00E9xito"] })] }), _jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", onClick: () => { resetForm(); setIsDialogOpen(true); }, children: [_jsx(PlusCircle, { className: "mr-1.5 h-4 w-4" }), " Nueva"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nueva Tarea" }), _jsx(DialogDescription, { children: "Define los detalles de tu tarea." })] }), renderTaskForm(handleCreateTask, 'Crear Tarea')] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(TimeStatCard, { label: "Esta Semana", completed: weeklyStats.done, total: weeklyStats.total, pct: weeklyStats.total > 0 ? Math.round((weeklyStats.done / weeklyStats.total) * 100) : 0, icon: _jsx(Layers, { className: "w-4 h-4 text-blue-500" }), gradient: "from-blue-500 to-cyan-400" }), _jsx(TimeStatCard, { label: "Este Mes", completed: monthlyStats.done, total: monthlyStats.total, pct: monthlyStats.total > 0 ? Math.round((monthlyStats.done / monthlyStats.total) * 100) : 0, icon: _jsx(BarChart3, { className: "w-4 h-4 text-purple-500" }), gradient: "from-purple-500 to-pink-400" }), _jsx(TimeStatCard, { label: "Este Trimestre", completed: quarterlyStats.done, total: quarterlyStats.total, pct: quarterlyStats.total > 0 ? Math.round((quarterlyStats.done / quarterlyStats.total) * 100) : 0, icon: _jsx(TrendingUp, { className: "w-4 h-4 text-amber-500" }), gradient: "from-amber-500 to-orange-400" })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2", children: "\u00C1REAS" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2", children: ['all', 'universidad', 'emprendimiento', 'proyectos'].map(cat => {
                            const counts = cat === 'all'
                                ? { pending: pendingTasks.length, total: tasks.length, done: completedTasks.length }
                                : areaStats[cat] || { pending: 0, total: 0, done: 0 };
                            return (_jsx(AreaCard, { category: cat, active: activeCategory === cat, counts: counts, onClick: () => setActiveCategory(cat) }, cat));
                        }) })] }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1", children: _jsxs(TabsList, { className: "h-8 p-0.5", children: [_jsxs(TabsTrigger, { value: "pending", className: "text-xs h-7 px-3", children: ["Pendientes (", pendingTasks.length, ")"] }), _jsxs(TabsTrigger, { value: "today", className: "text-xs h-7 px-3", children: ["Hoy (", todayTasks, ")"] }), overdueTasks > 0 && (_jsxs(TabsTrigger, { value: "overdue", className: "text-xs h-7 px-3 text-destructive", children: ["Vencidas (", overdueTasks, ")"] })), _jsxs(TabsTrigger, { value: "completed", className: "text-xs h-7 px-3", children: ["Hechas (", completedTasks.length, ")"] })] }) }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "icon", className: "h-7 w-7", onClick: () => setViewMode('list'), children: _jsx(List, { className: "h-3.5 w-3.5" }) }), _jsx(Button, { variant: viewMode === 'grouped' ? 'secondary' : 'ghost', size: "icon", className: "h-7 w-7", onClick: () => setViewMode('grouped'), children: _jsx(LayoutGrid, { className: "h-3.5 w-3.5" }) }), _jsxs(Select, { value: sortBy, onValueChange: (v) => setSortBy(v), children: [_jsxs(SelectTrigger, { className: "h-7 w-[110px] text-xs", children: [_jsx(ArrowUpDown, { className: "h-3 w-3 mr-1" }), _jsx(SelectValue, {})] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "priority", children: "Prioridad" }), _jsx(SelectItem, { value: "date", children: "Fecha" })] })] })] })] }), filteredTasks.length === 0 ? (_jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(ListTodo, { className: "w-10 h-10 mx-auto text-muted-foreground/40 mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: activeTab === 'completed' ? 'No hay tareas completadas aún'
                                : activeTab === 'overdue' ? '¡Sin tareas vencidas! 🎉'
                                    : activeTab === 'today' ? 'No hay tareas para hoy'
                                        : 'No hay tareas pendientes. ¡Crea una!' })] }) })) : viewMode === 'grouped' ? (_jsx("div", { className: "space-y-4", children: groupedByArea.map(([areaName, areaTasks]) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: areaName }), _jsx(Badge, { variant: "outline", className: "text-[10px] h-4", children: areaTasks.length })] }), _jsx("div", { className: "space-y-1.5", children: areaTasks.map(renderTask) })] }, areaName))) })) : (_jsx("div", { className: "space-y-1.5", children: filteredTasks.map(renderTask) })), _jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-2 mb-3", children: _jsx("h2", { className: "text-xs font-bold uppercase tracking-wide text-muted-foreground", children: "CALENDARIO DE EVENTOS" }) }), _jsx(NotionCalendar, {})] }), _jsx(Dialog, { open: isEditDialogOpen, onOpenChange: open => {
                    if (!open) {
                        setEditingTask(null);
                        resetForm();
                    }
                    setIsEditDialogOpen(open);
                }, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Editar Tarea" }), _jsx(DialogDescription, { children: "Modifica los detalles de la tarea." })] }), renderTaskForm(handleEditTask, 'Guardar Cambios')] }) })] }));
}
