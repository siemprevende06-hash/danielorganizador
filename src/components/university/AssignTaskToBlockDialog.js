import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, GraduationCap, Briefcase, FolderKanban, Zap, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
const FOCUS_LABELS = {
    universidad: { label: 'Universidad', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
    emprendimiento: { label: 'Emprendimiento', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
    proyectos: { label: 'Proyectos', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
    none: { label: 'Sin enfoque', color: 'bg-muted text-muted-foreground border-border' },
};
const FOCUS_ICONS = {
    universidad: GraduationCap,
    emprendimiento: Briefcase,
    proyectos: FolderKanban,
    none: Zap,
};
export function AssignTaskToBlockDialog({ open, onOpenChange, task, onAssigned }) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState('today');
    const dateKey = selectedDate === 'today'
        ? format(new Date(), 'yyyy-MM-dd')
        : format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
    useEffect(() => {
        if (open) {
            loadBlocks();
            setSelectedBlockId(null);
        }
    }, [open]);
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
    const isAssignedToCurrentTask = (blockId) => {
        if (!open || !task)
            return false;
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return false;
            const parsed = JSON.parse(stored);
            const taskItem = (parsed.tasks || []).find((t) => t.id === task.id);
            return taskItem?.routine_block_id === blockId;
        }
        catch {
            return false;
        }
    };
    const getAssignedBlockId = () => {
        if (!task)
            return null;
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return null;
            const parsed = JSON.parse(stored);
            const taskItem = (parsed.tasks || []).find((t) => t.id === task.id);
            return taskItem?.routine_block_id || null;
        }
        catch {
            return null;
        }
    };
    const handleSave = async () => {
        if (!task || !selectedBlockId)
            return;
        setSaving(true);
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            let data = stored
                ? JSON.parse(stored)
                : { tasks: [], completedIds: [] };
            const existingIndex = data.tasks.findIndex((t) => t.id === task.id);
            const taskEntry = {
                id: task.id,
                title: task.title,
                source: task.source,
                sourceName: task.subjectName,
                routine_block_id: selectedBlockId,
                completed: false,
                dueDate: undefined,
            };
            if (existingIndex >= 0) {
                data.tasks[existingIndex] = { ...data.tasks[existingIndex], ...taskEntry };
            }
            else {
                data.tasks.push(taskEntry);
            }
            localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(data));
            onAssigned?.();
            onOpenChange(false);
        }
        catch (error) {
            console.error('Error saving task assignment:', error);
        }
        finally {
            setSaving(false);
        }
    };
    const handleRemoveAssignment = async () => {
        if (!task)
            return;
        setSaving(true);
        try {
            const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
            if (!stored)
                return;
            const data = JSON.parse(stored);
            data.tasks = (data.tasks || []).filter((t) => t.id !== task.id);
            localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(data));
            onAssigned?.();
            onOpenChange(false);
        }
        catch (error) {
            console.error('Error removing task assignment:', error);
        }
        finally {
            setSaving(false);
        }
    };
    const alreadyAssignedBlockId = getAssignedBlockId();
    const alreadyAssignedBlock = alreadyAssignedBlockId
        ? blocks.find(b => b.id === alreadyAssignedBlockId)
        : null;
    const size = 'h-3.5 w-3.5';
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-lg max-h-[85vh] flex flex-col", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5" }), "Asignar a Bloque de Rutina"] }), _jsx(DialogDescription, { children: task?.title })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: selectedDate === 'today' ? 'default' : 'outline', size: "sm", onClick: () => setSelectedDate('today'), children: ["Hoy (", format(new Date(), 'd MMM'), ")"] }), _jsxs(Button, { variant: selectedDate === 'tomorrow' ? 'default' : 'outline', size: "sm", onClick: () => setSelectedDate('tomorrow'), children: ["Ma\u00F1ana (", format(new Date(Date.now() + 86400000), 'd MMM'), ")"] })] }), alreadyAssignedBlock && (_jsx(Card, { className: "p-3 bg-primary/5 border-primary/20", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Check, { className: "h-4 w-4 text-green-600" }), _jsx("span", { className: "font-medium", children: "Asignado a:" }), _jsx(Badge, { variant: "outline", className: "text-xs", children: alreadyAssignedBlock.title }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [alreadyAssignedBlock.startTime, " - ", alreadyAssignedBlock.endTime] })] }), _jsx(Button, { variant: "destructive", size: "sm", className: "h-7 text-xs", onClick: handleRemoveAssignment, disabled: saving, children: "Quitar" })] }) })), _jsx("div", { className: "flex-1 min-h-0", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }) })) : (_jsx(ScrollArea, { className: "h-[350px] pr-2", children: _jsx("div", { className: "space-y-1.5", children: blocks.map(block => {
                                const focus = block.currentFocus || block.defaultFocus;
                                const FocusIcon = FOCUS_ICONS[focus] || Zap;
                                const focusCfg = FOCUS_LABELS[focus] || FOCUS_LABELS.none;
                                const isSelected = selectedBlockId === block.id;
                                const alreadyAssigned = isAssignedToCurrentTask(block.id);
                                const canAssign = block.blockType !== 'fijo';
                                return (_jsxs("div", { className: cn('flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all', isSelected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : alreadyAssigned
                                            ? 'border-green-500/50 bg-green-500/5'
                                            : 'hover:bg-accent/50 border-border', !canAssign && 'opacity-50 cursor-not-allowed'), onClick: () => canAssign && setSelectedBlockId(block.id), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-sm", children: block.title }), _jsxs(Badge, { variant: "outline", className: cn('text-[10px] px-1.5', focusCfg.color), children: [_jsx(FocusIcon, { className: cn('mr-0.5', size) }), focusCfg.label] }), block.blockType !== 'configurable' && block.blockType !== 'dinamico' && (_jsx(Badge, { variant: "secondary", className: "text-[10px]", children: block.blockType }))] }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5 text-xs text-muted-foreground", children: [_jsx(Clock, { className: size }), _jsxs("span", { children: [block.startTime, " - ", block.endTime] })] })] }), alreadyAssigned && (_jsxs(Badge, { variant: "secondary", className: "text-xs shrink-0", children: [_jsx(Check, { className: "h-3 w-3 mr-1" }), "Asignada"] }))] }, block.id));
                            }) }) })) }), _jsxs(DialogFooter, { className: "gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), selectedBlockId && (_jsxs(Button, { onClick: handleSave, disabled: saving || !selectedBlockId, children: [saving ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-1" })) : (_jsx(Check, { className: "h-4 w-4 mr-1" })), "Asignar a este bloque"] }))] })] }) }));
}
