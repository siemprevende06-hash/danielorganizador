import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Edit3, DollarSign, ListTodo, CheckCircle2, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export default function EntrepreneurshipDetail() {
    const { id } = useParams();
    const [ent, setEnt] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [income, setIncome] = useState([]);
    const [goals, setGoals] = useState([]);
    const [expanded, setExpanded] = useState(new Set());
    // Task dialog
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskType, setTaskType] = useState('normal');
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [dueDate, setDueDate] = useState('');
    // Subtask
    const [subtaskInput, setSubtaskInput] = useState('');
    const [addingSubtaskTo, setAddingSubtaskTo] = useState(null);
    // Goals
    const [goalInput, setGoalInput] = useState('');
    // Income dialog
    const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeDesc, setIncomeDesc] = useState('');
    const [incomeDate, setIncomeDate] = useState(new Date().toISOString().slice(0, 10));
    const [incomeType, setIncomeType] = useState('revenue');
    // Edit entrepreneurship
    const [editEntOpen, setEditEntOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    useEffect(() => { if (id) {
        loadAll();
    } }, [id]);
    const loadAll = () => { loadEnt(); loadTasks(); loadIncome(); loadGoals(); };
    const loadEnt = async () => {
        const { data } = await supabase.from('entrepreneurships').select('*').eq('id', id).single();
        if (data)
            setEnt(data);
    };
    const loadTasks = async () => {
        const { data: tasksData } = await supabase.from('entrepreneurship_tasks')
            .select('*').eq('entrepreneurship_id', id).order('created_at', { ascending: false });
        const enriched = await Promise.all((tasksData || []).map(async (t) => {
            const { data: subs } = await supabase.from('subtasks').select('*').eq('task_id', t.id).order('created_at');
            return { ...t, description: t.description || '', task_type: t.task_type, subtasks: subs || [] };
        }));
        setTasks(enriched);
    };
    const loadIncome = async () => {
        const { data } = await supabase.from('entrepreneurship_income')
            .select('*').eq('entrepreneurship_id', id).order('income_date', { ascending: false });
        setIncome(data || []);
    };
    // Goals
    const loadGoals = async () => {
        const { data } = await supabase.from('entrepreneurship_goals')
            .select('*').eq('entrepreneurship_id', id).order('created_at', { ascending: true });
        setGoals(data || []);
    };
    const addGoal = async () => {
        if (!goalInput.trim())
            return;
        await supabase.from('entrepreneurship_goals').insert({ entrepreneurship_id: id, title: goalInput.trim(), completed: false });
        setGoalInput('');
        loadGoals();
        toast.success('Objetivo creado');
    };
    const toggleGoal = async (goalId) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal)
            return;
        await supabase.from('entrepreneurship_goals').update({ completed: !goal.completed }).eq('id', goalId);
        loadGoals();
    };
    const deleteGoal = async (goalId) => {
        await supabase.from('entrepreneurship_goals').delete().eq('id', goalId);
        setGoals(prev => prev.filter(g => g.id !== goalId));
        toast.success('Objetivo eliminado');
    };
    // Entrepreneurship edit
    const saveEnt = async () => {
        if (!editName.trim())
            return;
        await supabase.from('entrepreneurships').update({ name: editName.trim(), description: editDescription.trim() || null }).eq('id', id);
        setEditEntOpen(false);
        loadEnt();
        toast.success('Actualizado');
    };
    // Tasks CRUD
    const openNewTask = (type) => {
        setEditingTask(null);
        setTaskType(type);
        setTitle('');
        setDesc('');
        setDueDate('');
        setTaskDialogOpen(true);
    };
    const openEditTask = (task) => {
        setEditingTask(task);
        setTaskType(task.task_type);
        setTitle(task.title);
        setDesc(task.description);
        setDueDate(task.due_date || '');
        setTaskDialogOpen(true);
    };
    const saveTask = async () => {
        if (!title.trim()) {
            toast.error('Título requerido');
            return;
        }
        if (editingTask) {
            await supabase.from('entrepreneurship_tasks').update({ title: title.trim(), description: desc.trim() || null, due_date: dueDate || null }).eq('id', editingTask.id);
            await supabase.from('tasks').update({ title: title.trim(), description: desc.trim() || null, due_date: dueDate || null }).eq('source_id', editingTask.id).eq('source', 'entrepreneurship');
            toast.success('Tarea actualizada');
        }
        else {
            const { data: newTask } = await supabase.from('entrepreneurship_tasks').insert({
                entrepreneurship_id: id, title: title.trim(), description: desc.trim() || null,
                task_type: taskType, completed: false, due_date: dueDate || null
            }).select('id').single();
            if (newTask) {
                await supabase.from('tasks').insert({
                    title: title.trim(), description: desc.trim() || null,
                    status: 'pendiente', completed: false, source: 'entrepreneurship',
                    source_id: newTask.id, area_id: 'emprendimiento',
                    due_date: dueDate || null, priority: 'medium',
                });
            }
            toast.success('Tarea creada');
        }
        setTaskDialogOpen(false);
        loadTasks();
    };
    const toggleTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task)
            return;
        const newCompleted = !task.completed;
        await supabase.from('entrepreneurship_tasks').update({ completed: newCompleted }).eq('id', taskId);
        await supabase.from('tasks').update({ completed: newCompleted, status: newCompleted ? 'completada' : 'pendiente' }).eq('source_id', taskId).eq('source', 'entrepreneurship');
        loadTasks();
    };
    const deleteTask = async (taskId) => {
        await supabase.from('entrepreneurship_tasks').delete().eq('id', taskId);
        await supabase.from('tasks').delete().eq('source_id', taskId).eq('source', 'entrepreneurship');
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success('Tarea eliminada');
    };
    // Subtasks
    const addSubtask = async (taskId) => {
        if (!subtaskInput.trim())
            return;
        await supabase.from('subtasks').insert({ task_id: taskId, title: subtaskInput.trim(), completed: false });
        setSubtaskInput('');
        setAddingSubtaskTo(null);
        loadTasks();
    };
    const toggleSubtask = async (subId, completed) => {
        await supabase.from('subtasks').update({ completed: !completed }).eq('id', subId);
        loadTasks();
    };
    const deleteSubtask = async (subId) => {
        await supabase.from('subtasks').delete().eq('id', subId);
        loadTasks();
    };
    // Income
    const saveIncome = async () => {
        if (!incomeAmount || isNaN(Number(incomeAmount))) {
            toast.error('Monto inválido');
            return;
        }
        await supabase.from('entrepreneurship_income').insert({
            entrepreneurship_id: id, amount: Number(incomeAmount),
            description: incomeDesc.trim() || null, income_date: incomeDate, income_type: incomeType
        });
        setIncomeDialogOpen(false);
        setIncomeAmount('');
        setIncomeDesc('');
        loadIncome();
        toast.success('Ingreso registrado');
    };
    const deleteIncome = async (incId) => {
        await supabase.from('entrepreneurship_income').delete().eq('id', incId);
        setIncome(prev => prev.filter(i => i.id !== incId));
        toast.success('Ingreso eliminado');
    };
    const toggle = (taskId) => setExpanded(prev => {
        const n = new Set(prev);
        n.has(taskId) ? n.delete(taskId) : n.add(taskId);
        return n;
    });
    if (!ent)
        return _jsx("div", { className: "container mx-auto px-4 pt-24 flex justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) });
    const normalTasks = tasks.filter(t => t.task_type === 'normal');
    const improvementTasks = tasks.filter(t => t.task_type === 'improvement');
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
    const TaskCard = ({ task }) => {
        const isExpanded = expanded.has(task.id);
        const subsDone = task.subtasks.filter(s => s.completed).length;
        return (_jsx(Card, { className: `border-border transition-all ${task.completed ? 'opacity-60' : ''}`, children: _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "flex items-start gap-3 p-3", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1 min-w-0 cursor-pointer", onClick: () => toggle(task.id), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`, children: task.title }), task.subtasks.length > 0 && (_jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [subsDone, "/", task.subtasks.length] }))] }), task.description && _jsx("p", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-1", children: task.description }), task.due_date && (_jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsx(Calendar, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: new Date(task.due_date).toLocaleDateString() })] }))] }), _jsxs("div", { className: "flex gap-0.5 flex-shrink-0", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => openEditTask(task), children: _jsx(Edit3, { className: "h-3 w-3 text-muted-foreground" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => deleteTask(task.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => toggle(task.id), children: isExpanded ? _jsx(ChevronDown, { className: "h-3 w-3" }) : _jsx(ChevronRight, { className: "h-3 w-3" }) })] })] }), isExpanded && (_jsxs("div", { className: "px-3 pb-3 border-t border-border pt-2 space-y-1.5", children: [task.subtasks.map(sub => (_jsxs("div", { className: "flex items-center gap-2 pl-6", children: [_jsx(Checkbox, { checked: sub.completed, onCheckedChange: () => toggleSubtask(sub.id, sub.completed), className: "h-3.5 w-3.5" }), _jsx("span", { className: `text-xs flex-1 ${sub.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`, children: sub.title }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-5 w-5 p-0", onClick: () => deleteSubtask(sub.id), children: _jsx(Trash2, { className: "h-2.5 w-2.5 text-muted-foreground" }) })] }, sub.id))), addingSubtaskTo === task.id ? (_jsxs("div", { className: "flex gap-2 pl-6", children: [_jsx(Input, { className: "h-7 text-xs", placeholder: "Subtarea...", value: subtaskInput, onChange: e => setSubtaskInput(e.target.value), onKeyDown: e => e.key === 'Enter' && addSubtask(task.id), autoFocus: true }), _jsx(Button, { size: "sm", className: "h-7 text-xs", onClick: () => addSubtask(task.id), children: "+" })] })) : (_jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] ml-6 gap-1", onClick: () => { setAddingSubtaskTo(task.id); setSubtaskInput(''); }, children: [_jsx(Plus, { className: "h-3 w-3" }), " Subtarea"] }))] }))] }) }));
    };
    return (_jsxs("div", { className: "container mx-auto px-4 pt-20 pb-24 space-y-5", style: { paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }, children: [_jsx("header", { className: "space-y-1", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/entrepreneurship", children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(ArrowLeft, { className: "h-4 w-4" }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-xl font-bold text-foreground truncate", children: ent.name }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: () => { setEditName(ent.name); setEditDescription(ent.description || ''); setEditEntOpen(true); }, children: _jsx(Edit3, { className: "h-3.5 w-3.5 text-muted-foreground" }) })] }), ent.description && _jsx("p", { className: "text-xs text-muted-foreground truncate", children: ent.description })] })] }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(ListTodo, { className: "h-5 w-5 mx-auto text-primary mb-1" }), _jsxs("div", { className: "text-lg font-bold text-foreground", children: [completedTasks, "/", totalTasks] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Tareas" })] }) }), _jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mx-auto text-green-500 mb-1" }), _jsxs("div", { className: "text-lg font-bold text-foreground", children: [taskProgress, "%"] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Progreso" })] }) }), _jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(DollarSign, { className: "h-5 w-5 mx-auto text-yellow-500 mb-1" }), _jsxs("div", { className: "text-lg font-bold text-foreground", children: ["$", totalIncome.toLocaleString()] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Ingresos" })] }) })] }), _jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("span", { className: "text-xs font-medium text-foreground", children: "Progreso general" }), _jsxs("span", { className: "text-xs font-bold text-primary", children: [taskProgress, "%"] })] }), _jsx(Progress, { value: taskProgress, className: "h-2" })] }) }), _jsxs(Tabs, { defaultValue: "normal", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsxs(TabsTrigger, { value: "normal", className: "text-xs", children: ["Tareas (", normalTasks.length, ")"] }), _jsxs(TabsTrigger, { value: "improvement", className: "text-xs", children: ["Mejoras (", improvementTasks.length, ")"] }), _jsxs(TabsTrigger, { value: "goals", className: "text-xs", children: ["Objetivos (", goals.length, ")"] }), _jsxs(TabsTrigger, { value: "income", className: "text-xs", children: ["Ingresos (", income.length, ")"] })] }), _jsxs(TabsContent, { value: "normal", className: "space-y-3 mt-3", children: [_jsxs(Button, { size: "sm", className: "gap-1.5 w-full", variant: "outline", onClick: () => openNewTask('normal'), children: [_jsx(Plus, { className: "h-4 w-4" }), " Nueva Tarea"] }), normalTasks.map(t => _jsx(TaskCard, { task: t }, t.id)), normalTasks.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Sin tareas a\u00FAn" })] }), _jsxs(TabsContent, { value: "improvement", className: "space-y-3 mt-3", children: [_jsxs(Button, { size: "sm", className: "gap-1.5 w-full", variant: "outline", onClick: () => openNewTask('improvement'), children: [_jsx(Plus, { className: "h-4 w-4" }), " Nueva Mejora"] }), improvementTasks.map(t => _jsx(TaskCard, { task: t }, t.id)), improvementTasks.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Sin mejoras a\u00FAn" })] }), _jsxs(TabsContent, { value: "goals", className: "space-y-3 mt-3", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Nuevo objetivo...", value: goalInput, onChange: e => setGoalInput(e.target.value), onKeyDown: e => e.key === 'Enter' && addGoal() }), _jsxs(Button, { size: "sm", className: "gap-1.5 shrink-0", onClick: addGoal, children: [_jsx(Plus, { className: "h-4 w-4" }), " A\u00F1adir"] })] }), goals.map(goal => (_jsx(Card, { className: `border-border ${goal.completed ? 'opacity-60' : ''}`, children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx(Checkbox, { checked: goal.completed, onCheckedChange: () => toggleGoal(goal.id) }), _jsxs("div", { className: "flex-1 min-w-0 flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-primary shrink-0" }), _jsx("span", { className: `text-sm font-medium ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`, children: goal.title })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 flex-shrink-0", onClick: () => deleteGoal(goal.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })] }) }, goal.id))), goals.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Sin objetivos a\u00FAn. Define lo que quieres conseguir." })] }), _jsxs(TabsContent, { value: "income", className: "space-y-3 mt-3", children: [_jsxs(Button, { size: "sm", className: "gap-1.5 w-full", variant: "outline", onClick: () => setIncomeDialogOpen(true), children: [_jsx(Plus, { className: "h-4 w-4" }), " Registrar Ingreso"] }), income.length > 0 && (_jsx(Card, { className: "bg-primary/5 border-primary/20", children: _jsxs(CardContent, { className: "p-3 flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: "Total ingresos" }), _jsxs("span", { className: "text-lg font-bold text-primary", children: ["$", totalIncome.toLocaleString()] })] }) })), income.map(inc => (_jsx(Card, { className: "border-border", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0", children: _jsx(DollarSign, { className: "h-4 w-4 text-yellow-500" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium text-foreground", children: ["$", Number(inc.amount).toLocaleString()] }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: new Date(inc.income_date).toLocaleDateString() })] }), inc.description && _jsx("p", { className: "text-xs text-muted-foreground truncate", children: inc.description }), _jsx(Badge, { variant: "outline", className: "text-[10px] mt-1", children: inc.income_type === 'revenue' ? 'Ingreso' : inc.income_type })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0 flex-shrink-0", onClick: () => deleteIncome(inc.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })] }) }, inc.id))), income.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Sin ingresos registrados" })] })] }), _jsx(Dialog, { open: taskDialogOpen, onOpenChange: setTaskDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [editingTask ? 'Editar' : 'Nueva', " ", taskType === 'normal' ? 'Tarea' : 'Mejora'] }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { placeholder: "T\u00EDtulo", value: title, onChange: e => setTitle(e.target.value) }), _jsx(Textarea, { placeholder: "Descripci\u00F3n", value: desc, onChange: e => setDesc(e.target.value), rows: 2 }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Fecha de vencimiento" }), _jsx(Input, { type: "date", value: dueDate, onChange: e => setDueDate(e.target.value) })] }), _jsx(Button, { onClick: saveTask, className: "w-full", children: editingTask ? 'Guardar' : 'Crear' })] })] }) }), _jsx(Dialog, { open: incomeDialogOpen, onOpenChange: setIncomeDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Registrar Ingreso" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Monto ($)" }), _jsx(Input, { type: "number", placeholder: "0", value: incomeAmount, onChange: e => setIncomeAmount(e.target.value) })] }), _jsx(Input, { placeholder: "Descripci\u00F3n (opcional)", value: incomeDesc, onChange: e => setIncomeDesc(e.target.value) }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Fecha" }), _jsx(Input, { type: "date", value: incomeDate, onChange: e => setIncomeDate(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Tipo" }), _jsxs("select", { className: "w-full h-9 rounded-md border border-input bg-background px-3 text-sm", value: incomeType, onChange: e => setIncomeType(e.target.value), children: [_jsx("option", { value: "revenue", children: "Ingreso" }), _jsx("option", { value: "investment", children: "Inversi\u00F3n recibida" }), _jsx("option", { value: "refund", children: "Reembolso" }), _jsx("option", { value: "other", children: "Otro" })] })] }), _jsx(Button, { onClick: saveIncome, className: "w-full", children: "Registrar" })] })] }) }), _jsx(Dialog, { open: editEntOpen, onOpenChange: setEditEntOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Editar Emprendimiento" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { placeholder: "Nombre", value: editName, onChange: e => setEditName(e.target.value) }), _jsx(Textarea, { placeholder: "Descripci\u00F3n", value: editDescription, onChange: e => setEditDescription(e.target.value), rows: 2 }), _jsx(Button, { onClick: saveEnt, className: "w-full", children: "Guardar" })] })] }) })] }));
}
