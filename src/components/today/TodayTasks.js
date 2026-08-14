import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
export function TodayTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { blocks, isLoaded: blocksLoaded } = useRoutineBlocksDB();
    useEffect(() => {
        loadTasks();
    }, []);
    const loadTasks = async () => {
        const today = new Date().toISOString().split('T')[0];
        // Load regular tasks
        const { data: regularTasks } = await supabase
            .from('tasks')
            .select('id, title, completed, priority, source, area_id, routine_block_id')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`)
            .order('priority', { ascending: false });
        // Load entrepreneurship tasks
        const { data: entrepreneurshipTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, title, completed')
            .eq('due_date', today);
        const mapped = [
            ...(regularTasks || []).map(t => ({
                ...t,
                source: t.source || 'general',
                routine_block_id: t.routine_block_id || undefined
            })),
            ...(entrepreneurshipTasks || []).map(t => ({
                ...t,
                source: 'entrepreneurship',
                priority: 'medium',
                routine_block_id: undefined
            }))
        ];
        // Sort by priority and completion
        mapped.sort((a, b) => {
            if (a.completed !== b.completed)
                return a.completed ? 1 : -1;
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0);
        });
        setTasks(mapped);
        setLoading(false);
    };
    const toggleTask = async (task) => {
        const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        const { error } = await supabase
            .from(table)
            .update({ completed: !task.completed })
            .eq('id', task.id);
        if (error) {
            toast.error('Error al actualizar tarea');
            return;
        }
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    };
    const assignToBlock = async (taskId, blockId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.source === 'entrepreneurship')
            return;
        const { error } = await supabase
            .from('tasks')
            .update({ routine_block_id: blockId })
            .eq('id', taskId);
        if (error) {
            toast.error('Error al asignar tarea');
            return;
        }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routine_block_id: blockId || undefined } : t));
        toast.success(blockId ? 'Tarea asignada al bloque' : 'Tarea desasignada');
    };
    const getBlockTitle = (blockId) => {
        if (!blockId)
            return null;
        const block = blocks.find(b => b.id === blockId);
        return block?.title || null;
    };
    const getSourceLabel = (source) => {
        const labels = {
            university: 'Uni',
            entrepreneurship: 'Emp',
            projects: 'Proy',
            general: 'Gen'
        };
        return labels[source] || source;
    };
    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-l-4 border-l-destructive';
            case 'medium':
                return 'border-l-4 border-l-primary';
            default:
                return 'border-l-4 border-l-muted';
        }
    };
    if (loading || !blocksLoaded) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => (_jsx("div", { className: "animate-pulse h-12 bg-muted rounded" }, i))) }));
    }
    if (tasks.length === 0) {
        return (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx("p", { children: "No hay tareas para hoy" }), _jsx("p", { className: "text-sm mt-1", children: "\u00A1D\u00EDa libre o a\u00F1ade tareas!" })] }));
    }
    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    return (_jsxs("div", { className: "space-y-2", children: [pendingTasks.map((task) => (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted transition-all ${getPriorityStyle(task.priority)}`, children: [_jsx("button", { onClick: () => toggleTask(task), className: "flex-shrink-0", children: _jsx(Circle, { className: "w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-foreground block", children: task.title }), task.routine_block_id && (_jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1 mt-0.5", children: [_jsx(Clock, { className: "w-3 h-3" }), getBlockTitle(task.routine_block_id)] }))] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [task.source !== 'entrepreneurship' && (_jsxs(Select, { value: task.routine_block_id || "none", onValueChange: (value) => assignToBlock(task.id, value === "none" ? null : value), children: [_jsx(SelectTrigger, { className: "h-7 w-[100px] text-xs", children: _jsx(SelectValue, { placeholder: "Bloque" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Sin bloque" }), blocks.map((block) => (_jsx(SelectItem, { value: block.id, children: block.title.substring(0, 15) }, block.id)))] })] })), _jsx("span", { className: "text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground", children: getSourceLabel(task.source) }), task.priority === 'high' && (_jsx(AlertTriangle, { className: "w-4 h-4 text-destructive" }))] })] }, task.id))), completedTasks.length > 0 && (_jsxs("div", { className: "pt-2 border-t border-border mt-4", children: [_jsxs("p", { className: "text-xs text-muted-foreground mb-2", children: ["Completadas (", completedTasks.length, ")"] }), completedTasks.map((task) => (_jsxs("button", { onClick: () => toggleTask(task), className: "w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-all text-left", children: [_jsx(CheckCircle2, { className: "w-5 h-5 text-success flex-shrink-0" }), _jsx("span", { className: "flex-1 line-through text-muted-foreground", children: task.title })] }, task.id)))] }))] }));
}
