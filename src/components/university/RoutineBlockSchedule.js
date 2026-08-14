import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Briefcase, FolderKanban, Zap, Calendar, X, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
const FOCUS_STYLE = {
    universidad: { label: 'UNI', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: GraduationCap },
    emprendimiento: { label: 'EMP', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Briefcase },
    proyectos: { label: 'PRO', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: FolderKanban },
    none: { label: '—', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: Zap },
};
export function RoutineBlockSchedule({ onTaskUnassigned }) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('today');
    const dateKey = selectedDate === 'today'
        ? format(new Date(), 'yyyy-MM-dd')
        : format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
    useEffect(() => {
        loadBlocks();
    }, []);
    useEffect(() => {
        const handleRefresh = () => {
            setBlocks(prev => [...prev]);
        };
        window.addEventListener('taskAssignmentChanged', handleRefresh);
        return () => window.removeEventListener('taskAssignmentChanged', handleRefresh);
    }, []);
    const loadBlocks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('routine_blocks')
                .select('*')
                .order('order_index', { ascending: true });
            if (error)
                throw error;
            const mapped = (data || []).map((row) => ({
                id: row.block_id,
                title: row.title,
                startTime: row.start_time,
                endTime: row.end_time,
                blockType: row.block_type || 'fijo',
                defaultFocus: row.default_focus || 'none',
                currentFocus: row.current_focus || undefined,
                order: row.order_index,
            }));
            setBlocks(mapped);
        }
        catch (error) {
            console.error('Error loading routine blocks:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getAssignedTasks = (blockId) => {
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return [];
            const parsed = JSON.parse(stored);
            return (parsed.tasks || []).filter((t) => t.routine_block_id === blockId && t.source === 'university');
        }
        catch {
            return [];
        }
    };
    const getTasksForDate = () => {
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return [];
            const parsed = JSON.parse(stored);
            return (parsed.tasks || []).filter((t) => t.source === 'university');
        }
        catch {
            return [];
        }
    };
    const handleUnassign = (taskId) => {
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return;
            const parsed = JSON.parse(stored);
            parsed.tasks = (parsed.tasks || []).filter((t) => t.id !== taskId);
            localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(parsed));
            setBlocks(prev => [...prev]);
            onTaskUnassigned?.();
        }
        catch (error) {
            console.error('Error unassigning task:', error);
        }
    };
    const allUniversityTasks = getTasksForDate();
    const unassignedTasks = allUniversityTasks.filter(t => !t.routine_block_id);
    if (loading) {
        return (_jsx(Card, { children: _jsxs(CardContent, { className: "py-8 text-center", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto text-muted-foreground" }), _jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Cargando bloques..." })] }) }));
    }
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-primary" }), "Bloques de Estudio en mi Rutina"] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Button, { variant: selectedDate === 'today' ? 'default' : 'outline', size: "sm", className: "h-7 text-xs", onClick: () => setSelectedDate('today'), children: "Hoy" }), _jsx(Button, { variant: selectedDate === 'tomorrow' ? 'default' : 'outline', size: "sm", className: "h-7 text-xs", onClick: () => setSelectedDate('tomorrow'), children: "Ma\u00F1ana" })] })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: format(selectedDate === 'today' ? new Date() : new Date(Date.now() + 86400000), "EEEE d 'de' MMMM", { locale: es }) })] }), _jsxs(CardContent, { children: [blocks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No hay bloques de rutina configurados" })) : (_jsx(ScrollArea, { className: "max-h-[400px] pr-2", children: _jsx("div", { className: "space-y-1.5", children: blocks.map(block => {
                                const focus = block.currentFocus || block.defaultFocus;
                                const style = FOCUS_STYLE[focus] || FOCUS_STYLE.none;
                                const Icon = style.icon;
                                const assignedTasks = getAssignedTasks(block.id);
                                const isUniFocus = focus === 'universidad';
                                return (_jsxs("div", { className: cn('flex items-start gap-3 p-2.5 rounded-lg border transition-colors', isUniFocus ? style.bg + ' ' + style.border : 'border-border'), children: [_jsxs("div", { className: "text-center shrink-0 w-14 pt-0.5", children: [_jsx("p", { className: "text-xs font-bold leading-tight", children: block.startTime }), _jsx("p", { className: "text-[10px] text-muted-foreground leading-tight", children: block.endTime })] }), _jsx("div", { className: cn('w-0.5 shrink-0 rounded-full self-stretch', isUniFocus ? 'bg-blue-500' : 'bg-border') }), _jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-sm font-medium", children: block.title }), _jsxs(Badge, { variant: "outline", className: cn('text-[10px] px-1.5 py-0', style.bg, style.color, style.border), children: [_jsx(Icon, { className: "h-2.5 w-2.5 mr-0.5" }), style.label] })] }), assignedTasks.length > 0 && (_jsx("div", { className: "space-y-1", children: assignedTasks.map(task => (_jsxs("div", { className: "flex items-center gap-2 pl-2 py-1 rounded bg-background/80 border border-blue-500/20", children: [_jsx(BookOpen, { className: "h-3 w-3 text-blue-600 shrink-0" }), _jsx("span", { className: "text-xs truncate flex-1", children: task.title }), task.sourceName && (_jsx(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: task.sourceName })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 shrink-0", onClick: () => handleUnassign(task.id), children: _jsx(X, { className: "h-3 w-3" }) })] }, task.id))) }))] })] }, block.id));
                            }) }) })), unassignedTasks.length > 0 && (_jsxs("div", { className: "mt-3 pt-3 border-t", children: [_jsxs("p", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5", children: ["Tareas universitarias sin bloque (", unassignedTasks.length, ")"] }), _jsxs("div", { className: "space-y-1", children: [unassignedTasks.slice(0, 5).map(task => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(BookOpen, { className: "h-3 w-3" }), _jsx("span", { className: "truncate flex-1", children: task.title }), task.sourceName && (_jsx(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: task.sourceName }))] }, task.id))), unassignedTasks.length > 5 && (_jsxs("p", { className: "text-xs text-muted-foreground italic", children: ["+", unassignedTasks.length - 5, " m\u00E1s"] }))] })] }))] })] }));
}
