import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Loader2, BookOpen, Briefcase, FolderKanban, Target, GripVertical, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
const SOURCE_CONFIG = {
    general: { label: 'General', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: _jsx(Target, { className: "h-3 w-3" }) },
    university: { label: 'Universidad', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: _jsx(BookOpen, { className: "h-3 w-3" }) },
    entrepreneurship: { label: 'Emprendimiento', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: _jsx(Briefcase, { className: "h-3 w-3" }) },
    project: { label: 'Proyecto', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: _jsx(FolderKanban, { className: "h-3 w-3" }) },
};
export function TaskPoolPanel({ unassignedTasks, onTaskCreated }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskArea, setNewTaskArea] = useState('general');
    const [creating, setCreating] = useState(false);
    const { toast } = useToast();
    const filteredTasks = unassignedTasks.filter(t => {
        if (sourceFilter !== 'all' && t.source !== sourceFilter)
            return false;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            return false;
        return true;
    });
    const handleQuickCreate = async () => {
        if (!newTaskTitle.trim())
            return;
        setCreating(true);
        try {
            const areaMap = {
                general: 'general',
                university: 'university',
                entrepreneurship: 'entrepreneurship',
                project: 'project',
            };
            const { error } = await supabase.from('tasks').insert({
                title: newTaskTitle.trim(),
                source: areaMap[newTaskArea] || 'general',
                area_id: newTaskArea,
                priority: 'medium',
                due_date: `${format(new Date(), 'yyyy-MM-dd')}T12:00:00`,
                completed: false,
                status: 'pendiente',
            });
            if (error)
                throw error;
            setNewTaskTitle('');
            toast({ title: 'Tarea creada' });
            onTaskCreated();
        }
        catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
        finally {
            setCreating(false);
        }
    };
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    return (_jsxs(Card, { className: "flex flex-col h-full", children: [_jsxs("div", { className: "p-3 border-b", children: [_jsxs("h3", { className: "text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2 mb-2", children: [_jsx(Target, { className: "h-4 w-4 text-primary" }), "Tareas Pendientes", _jsx(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: unassignedTasks.length })] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { placeholder: "Nueva tarea...", value: newTaskTitle, onChange: (e) => setNewTaskTitle(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleQuickCreate(), className: "h-7 text-xs flex-1", disabled: creating }), _jsxs(Select, { value: newTaskArea, onValueChange: setNewTaskArea, children: [_jsx(SelectTrigger, { className: "h-7 w-[90px] text-[10px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (_jsx(SelectItem, { value: key, className: "text-xs", children: cfg.label }, key))) })] }), _jsx(Button, { size: "sm", className: "h-7 w-7 p-0", onClick: handleQuickCreate, disabled: creating || !newTaskTitle.trim(), children: creating ? _jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : _jsx(Plus, { className: "h-3 w-3" }) })] })] }), _jsx("div", { className: "p-3 border-b", children: _jsxs("div", { className: "flex gap-1.5", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" }), _jsx(Input, { placeholder: "Buscar...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-7 text-xs pl-7" })] }), _jsxs(Select, { value: sourceFilter, onValueChange: setSourceFilter, children: [_jsx(SelectTrigger, { className: "h-7 w-[80px] text-[10px]", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", className: "text-xs", children: "Todas" }), Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (_jsx(SelectItem, { value: key, className: "text-xs", children: cfg.label }, key)))] })] })] }) }), _jsx(ScrollArea, { className: "flex-1 min-h-[200px]", children: _jsxs("div", { className: "p-2 space-y-3", children: [filteredTasks.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-center text-muted-foreground", children: [_jsx(AlertCircle, { className: "h-6 w-6 mb-2 opacity-50" }), _jsx("p", { className: "text-xs", children: searchQuery || sourceFilter !== 'all' ? 'Sin resultados' : '¡Todo asignado! 🎯' })] })), ['university', 'entrepreneurship', 'project', 'general'].map(section => {
                            const sectionTasks = filteredTasks.filter(t => t.source === section);
                            if (sectionTasks.length === 0)
                                return null;
                            const cfg = SOURCE_CONFIG[section];
                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 px-1 py-1", children: [cfg.icon, _jsx("span", { className: "text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70", children: cfg.label }), _jsx(Badge, { variant: "outline", className: "text-[8px] px-1 py-0 h-3.5 ml-auto", children: sectionTasks.length })] }), _jsx("div", { className: "space-y-0.5", children: sectionTasks.map(task => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, task.id), className: "flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50 group", children: [_jsx(GripVertical, { className: "h-3 w-3 text-muted-foreground/40 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium truncate", children: task.title }), task.priority === 'high' && (_jsx(Badge, { variant: "destructive", className: "text-[8px] px-1 py-0 h-3.5 mt-0.5", children: "Alta" }))] })] }, task.id))) })] }, section));
                        })] }) }), _jsx("div", { className: "p-2 border-t text-[9px] text-muted-foreground text-center", children: "Arrastra tareas a los bloques del horario" })] }));
}
