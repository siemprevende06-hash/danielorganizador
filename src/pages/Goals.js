import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2, CheckCircle2, Calendar, Heart, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useImageUpload } from '@/hooks/useImageUpload';
import { lifeAreas } from "@/lib/data";
import { format, addMonths } from "date-fns";
import { es } from "date-fns/locale";
const QUARTER_MONTHS = 3;
function getQuarterDates() {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / QUARTER_MONTHS);
    const start = new Date(now.getFullYear(), currentQuarter * QUARTER_MONTHS, 1);
    const end = addMonths(start, QUARTER_MONTHS);
    return { start, end, quarter: currentQuarter + 1, year: now.getFullYear() };
}
export default function Goals() {
    const { goals, loading, fetchGoals, fetchGoalTasks, updateGoalProgress } = useGoalProgress();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [goalTasks, setGoalTasks] = useState(new Map());
    const [expandedGoal, setExpandedGoal] = useState(null);
    const { toast } = useToast();
    const { uploadImage, uploading } = useImageUpload();
    const quarterInfo = getQuarterDates();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [why, setWhy] = useState("");
    const [areaId, setAreaId] = useState("");
    const [targetDate, setTargetDate] = useState(format(quarterInfo.end, 'yyyy-MM-dd'));
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDueDate, setTaskDueDate] = useState("");
    const [dailySystem, setDailySystem] = useState("");
    useEffect(() => {
        if (goals.length > 0) {
            goals.forEach(async (goal) => {
                const tasks = await fetchGoalTasks(goal.id);
                setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
            });
        }
    }, [goals]);
    const handleCreateGoal = async () => {
        if (!title.trim())
            return;
        try {
            const { error } = await supabase.from('goals').insert({
                title: title.trim(),
                description: `${description.trim()}\n\n💡 ¿Por qué?: ${why.trim()}\n\n🔄 Sistema diario: ${dailySystem.trim()}`,
                area_id: areaId || null,
                target_date: targetDate || null,
                status: 'active',
            });
            if (error)
                throw error;
            toast({ title: "Objetivo creado" });
            setTitle("");
            setDescription("");
            setWhy("");
            setAreaId("");
            setDailySystem("");
            setTargetDate(format(quarterInfo.end, 'yyyy-MM-dd'));
            setDialogOpen(false);
            fetchGoals();
        }
        catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };
    const handleDeleteGoal = async (goalId) => {
        await supabase.from('goals').delete().eq('id', goalId);
        fetchGoals();
        toast({ title: "Objetivo eliminado" });
    };
    const handleAddTask = async () => {
        if (!taskTitle.trim() || !selectedGoalId)
            return;
        await supabase.from('goal_tasks').insert({
            goal_id: selectedGoalId, title: taskTitle.trim(), completed: false,
            due_date: taskDueDate || null,
        });
        setTaskTitle("");
        setTaskDueDate("");
        setTaskDialogOpen(false);
        const tasks = await fetchGoalTasks(selectedGoalId);
        setGoalTasks(prev => new Map(prev).set(selectedGoalId, tasks));
        await updateGoalProgress(selectedGoalId);
        fetchGoals();
    };
    const handleGoalImageUpload = async (goalId, event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const imageUrl = await uploadImage(file, 'goal-covers');
        if (imageUrl) {
            await supabase.from('goals').update({ cover_image: imageUrl }).eq('id', goalId);
            fetchGoals();
            toast({ title: 'Portada actualizada' });
        }
    };
    const handleToggleTask = async (goalId, task) => {
        await supabase.from('goal_tasks').update({ completed: !task.completed }).eq('id', task.id);
        const tasks = await fetchGoalTasks(goalId);
        setGoalTasks(prev => new Map(prev).set(goalId, tasks));
        await updateGoalProgress(goalId);
        fetchGoals();
    };
    const getAreaName = (areaId) => {
        if (!areaId)
            return null;
        for (const area of lifeAreas) {
            if (area.id === areaId)
                return area.name;
            if (area.subAreas) {
                for (const sub of area.subAreas) {
                    if (sub.id === areaId)
                        return sub.name;
                    if (sub.subAreas)
                        for (const s of sub.subAreas)
                            if (s.id === areaId)
                                return s.name;
                }
            }
        }
        return null;
    };
    // Parse stored why and system from description
    const parseGoalMeta = (desc) => {
        const whyMatch = desc?.match(/💡 ¿Por qué\?: (.*?)(?:\n|$)/);
        const systemMatch = desc?.match(/🔄 Sistema diario: (.*?)(?:\n|$)/);
        const cleanDesc = desc?.replace(/\n\n💡 ¿Por qué\?:.*$/s, '') || '';
        return { why: whyMatch?.[1] || '', system: systemMatch?.[1] || '', description: cleanDesc };
    };
    // Group tasks by timeline (monthly/weekly/daily)
    const groupTasksByTimeline = (tasks) => {
        const now = new Date();
        const thisWeekEnd = new Date(now);
        thisWeekEnd.setDate(now.getDate() + 7);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daily = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === now.toDateString());
        const weekly = tasks.filter(t => t.due_date && new Date(t.due_date) <= thisWeekEnd && !daily.includes(t));
        const monthly = tasks.filter(t => t.due_date && new Date(t.due_date) <= thisMonthEnd && !daily.includes(t) && !weekly.includes(t));
        const other = tasks.filter(t => !daily.includes(t) && !weekly.includes(t) && !monthly.includes(t));
        return { daily, weekly, monthly, other };
    };
    if (loading)
        return _jsx("div", { className: "p-8", children: "Cargando objetivos..." });
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-8 pt-24 pb-24", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-bold flex items-center gap-3", children: [_jsx(Target, { className: "h-8 w-8" }), "Objetivos Trimestrales"] }), _jsxs("p", { className: "text-muted-foreground mt-2", children: ["Q", quarterInfo.quarter, " ", quarterInfo.year, " \u00B7 ", format(quarterInfo.start, "d MMM", { locale: es }), " \u2192 ", format(quarterInfo.end, "d MMM yyyy", { locale: es })] })] }), _jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Nuevo Objetivo"] }) }), _jsxs(DialogContent, { className: "max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Crear Objetivo Trimestral" }), _jsx(DialogDescription, { children: "Define tu objetivo para los pr\u00F3ximos 3 meses" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "T\u00EDtulo" }), _jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Ej: Lanzar MVP del emprendimiento" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Descripci\u00F3n" }), _jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "\u00BFQu\u00E9 quieres lograr exactamente?", rows: 2 })] }), _jsxs("div", { className: "p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20", children: [_jsxs(Label, { className: "flex items-center gap-2", children: [_jsx(Heart, { className: "w-4 h-4 text-yellow-600" }), "\u00BFPor qu\u00E9 es importante? (Motivaci\u00F3n)"] }), _jsx(Textarea, { value: why, onChange: (e) => setWhy(e.target.value), placeholder: "Mi raz\u00F3n profunda para lograr esto...", rows: 2, className: "mt-2" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Sistema / Rutina Diaria" }), _jsx(Input, { value: dailySystem, onChange: (e) => setDailySystem(e.target.value), placeholder: "Ej: 2h de trabajo diario en el proyecto" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u00C1rea" }), _jsxs(Select, { value: areaId, onValueChange: setAreaId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u00C1rea" }) }), _jsx(SelectContent, { children: lifeAreas.map(a => _jsx(SelectItem, { value: a.id, children: a.name }, a.id)) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Fecha objetivo" }), _jsx(Input, { type: "date", value: targetDate, onChange: (e) => setTargetDate(e.target.value) })] })] }), _jsx(Button, { onClick: handleCreateGoal, className: "w-full", children: "Crear Objetivo" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold", children: activeGoals.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Activos" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsxs("p", { className: "text-3xl font-bold", children: [Math.round(activeGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / Math.max(activeGoals.length, 1)), "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Progreso Promedio" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold", children: completedGoals.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Completados" })] }) })] }), activeGoals.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(Target, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }), _jsx("p", { className: "text-lg font-medium", children: "No tienes objetivos a\u00FAn" })] }) })) : (_jsx("div", { className: "space-y-4", children: activeGoals.map((goal) => {
                        const tasks = goalTasks.get(goal.id) || [];
                        const meta = parseGoalMeta(goal.description);
                        const timeline = groupTasksByTimeline(tasks);
                        const completedTasks = tasks.filter(t => t.completed).length;
                        const isExpanded = expandedGoal === goal.id;
                        return (_jsxs(Card, { className: cn("overflow-hidden", !goal.cover_image && "border-l-4 border-l-primary/50"), children: [goal.cover_image && (_jsx("div", { className: "h-28 overflow-hidden", children: _jsx("img", { src: goal.cover_image, alt: goal.title, className: "w-full h-full object-cover" }) })), _jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardHeader, { className: "cursor-pointer", onClick: () => setExpandedGoal(isExpanded ? null : goal.id), children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [isExpanded ? _jsx(ChevronDown, { className: "w-5 h-5" }) : _jsx(ChevronRight, { className: "w-5 h-5" }), goal.title, _jsxs(Badge, { variant: "secondary", children: [goal.progress_percentage || 0, "%"] })] }), meta.description && _jsx(CardDescription, { className: "mt-1 ml-7", children: meta.description }), _jsxs("div", { className: "flex items-center gap-2 mt-2 ml-7", children: [getAreaName(goal.area_id) && _jsx(Badge, { variant: "outline", children: getAreaName(goal.area_id) }), goal.target_date && _jsxs(Badge, { variant: "outline", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })] })] })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: (e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }, children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }), _jsx(Progress, { value: goal.progress_percentage || 0, className: "h-2 mt-3" })] }), isExpanded && (_jsxs(CardContent, { className: "space-y-4 pt-0", children: [meta.why && (_jsxs("div", { className: "p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20", children: [_jsx("p", { className: "text-xs font-medium text-yellow-700 mb-1", children: "\uD83D\uDCA1 \u00BFPor qu\u00E9?" }), _jsx("p", { className: "text-sm", children: meta.why })] })), meta.system && (_jsxs("div", { className: "p-3 bg-primary/5 rounded-lg border border-primary/20", children: [_jsx("p", { className: "text-xs font-medium text-primary mb-1", children: "\uD83D\uDD04 Sistema diario" }), _jsx("p", { className: "text-sm", children: meta.system })] })), _jsxs("label", { className: "text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1", children: [goal.cover_image ? 'Cambiar portada' : 'Añadir portada', _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleGoalImageUpload(goal.id, e) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm font-medium", children: ["Tareas (", completedTasks, "/", tasks.length, ")"] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => { setSelectedGoalId(goal.id); setTaskDialogOpen(true); }, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Tarea"] })] }), [
                                                    { label: "📌 Hoy", items: timeline.daily },
                                                    { label: "📅 Esta semana", items: timeline.weekly },
                                                    { label: "🗓️ Este mes", items: timeline.monthly },
                                                    { label: "📋 Todas", items: timeline.other },
                                                ].filter(g => g.items.length > 0).map(group => (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: group.label }), group.items.map(task => (_jsxs("div", { className: "flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-muted/50 rounded px-2", onClick: () => handleToggleTask(goal.id, task), children: [_jsx(CheckCircle2, { className: `h-4 w-4 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-muted-foreground'}` }), _jsx("span", { className: task.completed ? 'line-through text-muted-foreground' : '', children: task.title }), task.due_date && _jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: format(new Date(task.due_date), 'dd/MM') })] }, task.id)))] }, group.label))), tasks.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground", children: "No hay tareas a\u00FAn" })] })] }))] }, goal.id));
                    }) })), _jsx(Dialog, { open: taskDialogOpen, onOpenChange: setTaskDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Agregar Tarea al Objetivo" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "T\u00EDtulo" }), _jsx(Input, { value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), placeholder: "Tarea espec\u00EDfica" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Fecha" }), _jsx(Input, { type: "date", value: taskDueDate, onChange: (e) => setTaskDueDate(e.target.value) })] }), _jsx(Button, { onClick: handleAddTask, className: "w-full", children: "Agregar" })] })] }) })] }) }));
}
