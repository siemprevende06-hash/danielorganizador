import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';
const AREA_CONFIG = {
    universidad: { icon: '🎓', label: 'Universidad', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
    emprendimiento: { icon: '💼', label: 'Emprendimiento', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
    proyectos: { icon: '🚀', label: 'Proyectos', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' },
    gym: { icon: '💪', label: 'Gym', color: 'bg-green-500/20 text-green-700 dark:text-green-300' },
    idiomas: { icon: '🌍', label: 'Idiomas', color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' },
    lectura: { icon: '📖', label: 'Lectura', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
    musica: { icon: '🎹', label: 'Música', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-300' },
    general: { icon: '📋', label: 'General', color: 'bg-muted text-muted-foreground' },
    development: { icon: '💻', label: 'Desarrollo', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
    marketing: { icon: '📢', label: 'Marketing', color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300' },
    operations: { icon: '⚙️', label: 'Operaciones', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
};
const DAILY_HABITS = [
    { id: 'gym', title: 'Gym 1 hora', area: 'gym' },
    { id: 'lectura', title: 'Lectura 30 min', area: 'lectura' },
    { id: 'musica', title: 'Piano o Guitarra', area: 'musica' },
    { id: 'meditacion', title: 'Meditación', area: 'general' },
    { id: 'journaling', title: 'Journaling', area: 'general' },
];
export function DailyActionPlan() {
    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    useEffect(() => {
        loadTasks();
        loadHabits();
    }, [todayStr]);
    const loadTasks = async () => {
        setLoading(true);
        const [tasksRes, entrepreneurshipRes] = await Promise.all([
            supabase
                .from('tasks')
                .select('*')
                .gte('due_date', `${todayStr}T00:00:00`)
                .lte('due_date', `${todayStr}T23:59:59`)
                .order('priority', { ascending: false }),
            supabase
                .from('entrepreneurship_tasks')
                .select('*')
                .eq('due_date', todayStr),
        ]);
        const allTasks = [
            ...(tasksRes.data || []).map(t => ({ ...t, source: 'tasks' })),
            ...(entrepreneurshipRes.data || []).map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                priority: 'medium',
                task_type: t.task_type,
                routine_block_id: t.routine_block_id,
                source: 'entrepreneurship',
            })),
        ];
        setTasks(allTasks);
        setLoading(false);
    };
    const loadHabits = async () => {
        const { data: habitHistory } = await supabase
            .from('habit_history')
            .select('habit_id, completed_dates');
        const habitsWithStatus = DAILY_HABITS.map(habit => {
            const history = habitHistory?.find(h => h.habit_id === habit.id);
            const completedDates = history?.completed_dates || [];
            const todayEntry = completedDates.find((d) => d.date === todayStr && d.status === 'completed');
            return {
                id: habit.id,
                title: habit.title,
                completed: !!todayEntry,
            };
        });
        setHabits(habitsWithStatus);
    };
    const toggleTask = async (task) => {
        const newCompleted = !task.completed;
        if (task.source === 'tasks') {
            await supabase
                .from('tasks')
                .update({ completed: newCompleted, status: newCompleted ? 'completada' : 'pendiente' })
                .eq('id', task.id);
        }
        else {
            await supabase
                .from('entrepreneurship_tasks')
                .update({ completed: newCompleted })
                .eq('id', task.id);
        }
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
    };
    const toggleHabit = async (habit) => {
        const newCompleted = !habit.completed;
        // Get current habit history
        const { data: existing } = await supabase
            .from('habit_history')
            .select('*')
            .eq('habit_id', habit.id)
            .single();
        if (existing) {
            const completedDates = existing.completed_dates || [];
            const filtered = completedDates.filter((d) => d.date !== todayStr);
            if (newCompleted) {
                filtered.push({ date: todayStr, status: 'completed' });
            }
            await supabase
                .from('habit_history')
                .update({ completed_dates: filtered })
                .eq('habit_id', habit.id);
        }
        else if (newCompleted) {
            await supabase
                .from('habit_history')
                .insert({
                habit_id: habit.id,
                completed_dates: [{ date: todayStr, status: 'completed' }],
            });
        }
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completed: newCompleted } : h));
    };
    const getAreaConfig = (task) => {
        const areaId = (task.area_id || task.task_type || 'general').toLowerCase();
        return AREA_CONFIG[areaId] || AREA_CONFIG.general;
    };
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-destructive';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-muted-foreground';
            default: return 'text-muted-foreground';
        }
    };
    const highPriority = tasks.filter(t => t.priority?.toLowerCase() === 'high' && !t.completed);
    const mediumPriority = tasks.filter(t => t.priority?.toLowerCase() !== 'high' && !t.completed);
    const completed = tasks.filter(t => t.completed);
    const incompleteHabits = habits.filter(h => !h.completed);
    const completedHabits = habits.filter(h => h.completed);
    const totalItems = tasks.length + habits.length;
    const completedItems = completed.length + completedHabits.length;
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-10 bg-muted rounded" }), _jsx("div", { className: "h-10 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { className: "border-2 border-primary/10", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "flex items-center gap-2 text-lg", children: "\uD83D\uDCCB Mi Plan de Hoy" }), _jsxs(Badge, { variant: completedItems === totalItems && totalItems > 0 ? "default" : "secondary", children: [completedItems, "/", totalItems, " completadas"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [highPriority.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-destructive", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "ALTA PRIORIDAD"] }), highPriority.map(task => (_jsx(TaskItem, { task: task, onToggle: () => toggleTask(task), areaConfig: getAreaConfig(task) }, task.id)))] })), mediumPriority.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400", children: [_jsx(Clock, { className: "w-4 h-4" }), "TAREAS DEL D\u00CDA"] }), mediumPriority.map(task => (_jsx(TaskItem, { task: task, onToggle: () => toggleTask(task), areaConfig: getAreaConfig(task) }, task.id)))] })), (incompleteHabits.length > 0 || completedHabits.length > 0) && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400", children: [_jsx(Circle, { className: "w-4 h-4" }), "H\u00C1BITOS DEL D\u00CDA"] }), incompleteHabits.map(habit => (_jsx(HabitItem, { habit: habit, onToggle: () => toggleHabit(habit) }, habit.id))), completedHabits.map(habit => (_jsx(HabitItem, { habit: habit, onToggle: () => toggleHabit(habit) }, habit.id)))] })), completed.length > 0 && (_jsxs("div", { className: "space-y-2 opacity-60", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), "COMPLETADAS (", completed.length, ")"] }), completed.slice(0, 3).map(task => (_jsx(TaskItem, { task: task, onToggle: () => toggleTask(task), areaConfig: getAreaConfig(task) }, task.id))), completed.length > 3 && (_jsxs("p", { className: "text-xs text-muted-foreground pl-6", children: ["+", completed.length - 3, " m\u00E1s completadas"] }))] })), totalItems === 0 && (_jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No hay tareas programadas para hoy" }), _jsx("p", { className: "text-sm", children: "Agrega tareas en el Planificador" })] }))] })] }));
}
function TaskItem({ task, onToggle, areaConfig }) {
    return (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-lg transition-all", "hover:bg-muted/50", task.completed && "opacity-50"), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: onToggle, className: "h-5 w-5" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: cn("text-sm font-medium truncate", task.completed && "line-through text-muted-foreground"), children: task.title }) }), _jsxs(Badge, { variant: "outline", className: cn("text-xs shrink-0", areaConfig.color), children: [areaConfig.icon, " ", areaConfig.label] })] }));
}
function HabitItem({ habit, onToggle }) {
    const habitConfig = DAILY_HABITS.find(h => h.id === habit.id);
    const areaConfig = AREA_CONFIG[habitConfig?.area || 'general'] || AREA_CONFIG.general;
    return (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-lg transition-all", "hover:bg-muted/50", habit.completed && "opacity-50"), children: [_jsx(Checkbox, { checked: habit.completed, onCheckedChange: onToggle, className: "h-5 w-5" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: cn("text-sm font-medium truncate", habit.completed && "line-through text-muted-foreground"), children: habit.title }) }), _jsx(Badge, { variant: "outline", className: cn("text-xs shrink-0", areaConfig.color), children: areaConfig.icon })] }));
}
