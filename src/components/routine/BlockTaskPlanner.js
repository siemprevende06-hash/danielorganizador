import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Clock, BookOpen, Briefcase, FolderKanban, ListTodo, Target, X, Dumbbell, Coffee, Moon, Sun, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
const getSourceIcon = (source) => {
    switch (source) {
        case "university":
            return _jsx(BookOpen, { className: "h-3 w-3" });
        case "entrepreneurship":
            return _jsx(Briefcase, { className: "h-3 w-3" });
        case "project":
            return _jsx(FolderKanban, { className: "h-3 w-3" });
        default:
            return _jsx(ListTodo, { className: "h-3 w-3" });
    }
};
const getSourceColor = (source) => {
    switch (source) {
        case "university":
            return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        case "entrepreneurship":
            return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        case "project":
            return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        default:
            return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
};
const getBlockIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('gym'))
        return _jsx(Dumbbell, { className: "h-4 w-4" });
    if (lower.includes('activación') || lower.includes('despertar'))
        return _jsx(Sun, { className: "h-4 w-4" });
    if (lower.includes('desactivación') || lower.includes('dormir'))
        return _jsx(Moon, { className: "h-4 w-4" });
    if (lower.includes('almuerzo') || lower.includes('comida') || lower.includes('desayuno'))
        return _jsx(Coffee, { className: "h-4 w-4" });
    if (lower.includes('idiomas') || lower.includes('lectura'))
        return _jsx(Languages, { className: "h-4 w-4" });
    if (lower.includes('deep work') || lower.includes('focus'))
        return _jsx(Target, { className: "h-4 w-4 text-primary" });
    return _jsx(Clock, { className: "h-4 w-4" });
};
const formatTime = (time) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};
const parseTimeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};
export function BlockTaskPlanner({ blocks, selectedDate, taskAssignments, onAssignmentChange }) {
    const [allTasks, setAllTasks] = useState([]);
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [tempSelectedIds, setTempSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadAllTasks();
    }, [selectedDate]);
    const loadAllTasks = async () => {
        setLoading(true);
        try {
            // Load regular tasks
            const { data: regularTasks } = await supabase
                .from('tasks')
                .select('id, title, source, completed, due_date, priority')
                .eq('completed', false);
            // Load entrepreneurship tasks
            const { data: entrepreneurshipTasks } = await supabase
                .from('entrepreneurship_tasks')
                .select('id, title, completed, due_date, entrepreneurship_id')
                .eq('completed', false);
            // Get entrepreneurship names
            const { data: entrepreneurships } = await supabase
                .from('entrepreneurships')
                .select('id, name');
            const entrepreneurshipMap = new Map(entrepreneurships?.map(e => [e.id, e.name]) || []);
            const mapped = [
                ...(regularTasks || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    source: t.source || 'general',
                    completed: t.completed || false,
                    due_date: t.due_date,
                    priority: t.priority
                })),
                ...(entrepreneurshipTasks || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    source: 'entrepreneurship',
                    sourceName: entrepreneurshipMap.get(t.entrepreneurship_id),
                    completed: t.completed,
                    due_date: t.due_date
                }))
            ];
            setAllTasks(mapped);
        }
        catch (error) {
            console.error('Error loading tasks:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Show ALL blocks sorted by time (from 5 AM to 9 PM)
    const sortedBlocks = [...blocks]
        .filter(block => {
        const startMinutes = parseTimeToMinutes(block.startTime);
        // Filter to show blocks between 5:00 AM (300) and 11:00 PM (1380)
        return startMinutes >= 300 && startMinutes <= 1380;
    })
        .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
        // Remove duplicates by block_id (keep first occurrence)
        .filter((block, index, self) => index === self.findIndex(b => b.id === block.id));
    const getAssignedTasks = (blockId) => {
        const taskIds = taskAssignments[blockId] || [];
        return allTasks.filter(t => taskIds.includes(t.id));
    };
    const getAvailableTasks = () => {
        const allAssigned = Object.values(taskAssignments).flat();
        return allTasks.filter(t => !allAssigned.includes(t.id));
    };
    const openAssigner = (blockId) => {
        setActiveBlockId(blockId);
        setTempSelectedIds(taskAssignments[blockId] || []);
    };
    const toggleTask = (taskId) => {
        setTempSelectedIds(prev => prev.includes(taskId)
            ? prev.filter(id => id !== taskId)
            : [...prev, taskId]);
    };
    const saveAssignments = async () => {
        if (activeBlockId) {
            onAssignmentChange(activeBlockId, tempSelectedIds);
            // Also update entrepreneurship_tasks with routine_block_id
            for (const taskId of tempSelectedIds) {
                const task = allTasks.find(t => t.id === taskId);
                if (task?.source === 'entrepreneurship') {
                    await supabase
                        .from('entrepreneurship_tasks')
                        .update({ routine_block_id: activeBlockId })
                        .eq('id', taskId);
                }
            }
        }
        setActiveBlockId(null);
        setTempSelectedIds([]);
    };
    const removeTaskFromBlock = (blockId, taskId) => {
        const current = taskAssignments[blockId] || [];
        onAssignmentChange(blockId, current.filter(id => id !== taskId));
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map(i => (_jsx("div", { className: "h-24 bg-muted/30 rounded-xl animate-pulse" }, i))) }));
    }
    const unassignedTasks = getAvailableTasks();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Horario Completo del D\u00EDa" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Asigna tareas a cualquier bloque de tu rutina" })] }), _jsxs(Badge, { variant: "outline", className: "gap-1", children: [_jsx(Target, { className: "w-3 h-3" }), allTasks.length, " tareas \u00B7 ", unassignedTasks.length, " sin asignar"] })] }), _jsx("div", { className: "space-y-2", children: sortedBlocks.map((block, index) => {
                    const assignedTasks = getAssignedTasks(block.id);
                    const isWorkBlock = block.title.toLowerCase().includes('deep work') ||
                        block.title.toLowerCase().includes('focus') ||
                        block.blockType === 'configurable' ||
                        block.blockType === 'dinamico';
                    return (_jsx("div", { className: "relative", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-16 flex-shrink-0 text-xs text-muted-foreground font-mono pt-3", children: formatTime(block.startTime) }), _jsxs(Card, { className: cn("flex-1 p-3 border-l-4 transition-all hover:shadow-md", isWorkBlock ? "border-l-primary" : "border-l-muted-foreground/30", assignedTasks.length > 0 && "bg-primary/5"), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [getBlockIcon(block.title), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium text-sm truncate", children: block.title }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [formatTime(block.startTime), " - ", formatTime(block.endTime)] })] })] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => openAssigner(block.id), className: "h-7 text-xs gap-1 flex-shrink-0", children: [_jsx(Plus, { className: "w-3 h-3" }), "Agregar"] })] }), assignedTasks.length > 0 && (_jsx("div", { className: "mt-2 space-y-1.5", children: assignedTasks.map((task) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-background rounded-lg group", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx(Badge, { variant: "outline", className: cn("text-xs flex-shrink-0", getSourceColor(task.source)), children: getSourceIcon(task.source) }), _jsx("span", { className: "text-sm truncate", children: task.title })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeTaskFromBlock(block.id, task.id), className: "opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0", children: _jsx(X, { className: "w-3 h-3" }) })] }, task.id))) }))] })] }) }, `${block.id}-${index}`));
                }) }), unassignedTasks.length > 0 && (_jsxs(Card, { className: "p-4 border-dashed border-2", children: [_jsxs("h4", { className: "font-medium mb-3 flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-4 w-4" }), "Tareas sin asignar (", unassignedTasks.length, ")"] }), _jsxs("div", { className: "space-y-2", children: [unassignedTasks.slice(0, 5).map((task) => (_jsx("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx(Badge, { variant: "outline", className: cn("text-xs", getSourceColor(task.source)), children: getSourceIcon(task.source) }), _jsx("span", { className: "text-sm truncate", children: task.title })] }) }, task.id))), unassignedTasks.length > 5 && (_jsxs("p", { className: "text-xs text-muted-foreground text-center pt-2", children: ["+", unassignedTasks.length - 5, " m\u00E1s..."] }))] })] })), _jsx(Dialog, { open: !!activeBlockId, onOpenChange: (open) => !open && setActiveBlockId(null), children: _jsxs(DialogContent, { className: "max-w-md max-h-[80vh]", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Asignar Tareas: ", blocks.find(b => b.id === activeBlockId)?.title] }) }), _jsx(ScrollArea, { className: "h-[400px] pr-4", children: _jsxs("div", { className: "space-y-2", children: [[...allTasks.filter(t => tempSelectedIds.includes(t.id)), ...getAvailableTasks()].map((task) => (_jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", tempSelectedIds.includes(task.id)
                                            ? "bg-primary/10 border-primary"
                                            : "hover:bg-muted/50 border-border"), onClick: () => toggleTask(task.id), children: [_jsx(Checkbox, { checked: tempSelectedIds.includes(task.id), onCheckedChange: () => toggleTask(task.id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: task.title }), _jsxs(Badge, { variant: "outline", className: cn("text-xs mt-1", getSourceColor(task.source)), children: [getSourceIcon(task.source), _jsx("span", { className: "ml-1", children: task.sourceName || task.source })] })] })] }, task.id))), allTasks.length === 0 && (_jsx("p", { className: "text-center text-muted-foreground py-8", children: "No hay tareas disponibles" }))] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setActiveBlockId(null), children: "Cancelar" }), _jsxs(Button, { onClick: saveAssignments, children: ["Guardar (", tempSelectedIds.length, " tareas)"] })] })] }) })] }));
}
