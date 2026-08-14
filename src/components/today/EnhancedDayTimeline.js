import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from "react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useBlockCompletions } from "@/hooks/useBlockCompletions";
import { supabase } from "@/integrations/supabase/client";
import { Play, Clock, MoveRight, ChevronDown, ChevronUp, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
export function EnhancedDayTimeline() {
    const { blocks, isLoaded } = useRoutineBlocksDB();
    const { isBlockCompleted, toggleBlockComplete, refreshCompletions } = useBlockCompletions();
    const [blocksWithTasks, setBlocksWithTasks] = useState([]);
    const [expandedBlocks, setExpandedBlocks] = useState(new Set());
    const [startTime, setStartTime] = useState('5:00');
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [taskToMove, setTaskToMove] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);
    // Calculate current position in timeline
    const currentMinutes = useMemo(() => {
        return currentTime.getHours() * 60 + currentTime.getMinutes();
    }, [currentTime]);
    useEffect(() => {
        if (isLoaded && blocks.length > 0) {
            loadTasksForBlocks();
        }
    }, [isLoaded, blocks, startTime]);
    const loadTasksForBlocks = async () => {
        const today = new Date().toISOString().split('T')[0];
        // Load regular tasks
        const { data: regularTasks } = await supabase
            .from('tasks')
            .select('id, title, completed, priority, source, routine_block_id')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`);
        // Load entrepreneurship tasks
        const { data: entrepreneurshipTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, title, completed, routine_block_id')
            .eq('due_date', today);
        const allTasks = [
            ...(regularTasks || []).map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority || undefined,
                source: t.source || 'general',
                routine_block_id: t.routine_block_id || undefined,
            })),
            ...(entrepreneurshipTasks || []).map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                source: 'entrepreneurship',
                routine_block_id: t.routine_block_id || undefined,
            })),
        ];
        // Filter blocks based on start time
        const startMinutes = startTime === '5:00' ? 5 * 60 : 6.5 * 60;
        const enrichedBlocks = blocks
            .map(block => {
            const [startH, startM] = block.startTime.split(':').map(Number);
            const [endH, endM] = block.endTime.split(':').map(Number);
            const blockStartMinutes = startH * 60 + startM;
            const blockEndMinutes = endH * 60 + endM;
            // Determine status
            let status = 'upcoming';
            if (currentMinutes >= blockStartMinutes && currentMinutes < blockEndMinutes) {
                status = 'current';
            }
            else if (currentMinutes >= blockEndMinutes) {
                status = 'passed';
            }
            // Check if block is manually completed
            if (isBlockCompleted(block.id)) {
                status = 'completed';
            }
            const blockTasks = allTasks.filter(t => t.routine_block_id === block.id);
            return {
                id: block.id,
                title: block.title,
                startTime: block.startTime,
                endTime: block.endTime,
                tasks: blockTasks,
                status,
            };
        })
            .filter(block => {
            const [h, m] = block.startTime.split(':').map(Number);
            const blockStartMinutes = h * 60 + m;
            return blockStartMinutes >= startMinutes || block.status === 'current';
        })
            .sort((a, b) => {
            const [aH, aM] = a.startTime.split(':').map(Number);
            const [bH, bM] = b.startTime.split(':').map(Number);
            return (aH * 60 + aM) - (bH * 60 + bM);
        });
        setBlocksWithTasks(enrichedBlocks);
        // Auto-expand current block
        const currentBlock = enrichedBlocks.find(b => b.status === 'current');
        if (currentBlock) {
            setExpandedBlocks(prev => new Set([...prev, currentBlock.id]));
        }
    };
    const toggleExpand = (blockId) => {
        setExpandedBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blockId)) {
                newSet.delete(blockId);
            }
            else {
                newSet.add(blockId);
            }
            return newSet;
        });
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
        await loadTasksForBlocks();
        toast.success(task.completed ? 'Tarea desmarcada' : 'Tarea completada');
    };
    const handleMoveTask = (task) => {
        setTaskToMove(task);
        setMoveDialogOpen(true);
    };
    const moveTaskToBlock = async (newBlockId) => {
        if (!taskToMove)
            return;
        const table = taskToMove.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        const { error } = await supabase
            .from(table)
            .update({ routine_block_id: newBlockId })
            .eq('id', taskToMove.id);
        if (error) {
            toast.error('Error al mover tarea');
            return;
        }
        setMoveDialogOpen(false);
        setTaskToMove(null);
        await loadTasksForBlocks();
        toast.success('Tarea movida');
    };
    const formatTime = (time) => {
        const [h, m] = time.split(':').map(Number);
        const hour = h % 12 || 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const getBlockDuration = (start, end) => {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        return (eH * 60 + eM) - (sH * 60 + sM);
    };
    const getTimelinePosition = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    if (!isLoaded) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map(i => (_jsx("div", { className: "animate-pulse h-16 bg-muted rounded" }, i))) }));
    }
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium", children: "Timeline del D\u00EDa" })] }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Button, { variant: startTime === '5:00' ? 'default' : 'outline', size: "sm", onClick: () => setStartTime('5:00'), className: "h-7 text-xs", children: [_jsx(Sun, { className: "w-3 h-3 mr-1" }), "5:00 AM"] }), _jsxs(Button, { variant: startTime === '6:30' ? 'default' : 'outline', size: "sm", onClick: () => setStartTime('6:30'), className: "h-7 text-xs", children: [_jsx(Moon, { className: "w-3 h-3 mr-1" }), "6:30 AM"] })] })] }), _jsxs("div", { className: "relative space-y-1", children: [blocksWithTasks.map((block, index) => {
                        const isExpanded = expandedBlocks.has(block.id);
                        const duration = getBlockDuration(block.startTime, block.endTime);
                        const blockStartMinutes = getTimelinePosition(block.startTime);
                        const blockEndMinutes = getTimelinePosition(block.endTime);
                        const isNowInBlock = currentMinutes >= blockStartMinutes && currentMinutes < blockEndMinutes;
                        const nowPosition = isNowInBlock
                            ? ((currentMinutes - blockStartMinutes) / (blockEndMinutes - blockStartMinutes)) * 100
                            : null;
                        return (_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs font-mono text-muted-foreground w-16", children: formatTime(block.startTime) }), _jsx("div", { className: "flex-1 h-px bg-border" })] }), _jsxs("div", { className: cn("relative ml-4 border rounded-lg transition-all overflow-hidden", block.status === 'current' && "ring-2 ring-primary bg-primary/5", block.status === 'completed' && "bg-success/10 border-success/30", block.status === 'passed' && !isBlockCompleted(block.id) && "opacity-60"), children: [isNowInBlock && nowPosition !== null && (_jsx("div", { className: "absolute left-0 right-0 h-0.5 bg-destructive z-10 flex items-center", style: { top: `${nowPosition}%` }, children: _jsx("span", { className: "absolute -left-4 text-[10px] text-destructive font-bold bg-background px-1", children: "AHORA" }) })), _jsxs("button", { onClick: () => toggleExpand(block.id), className: "w-full flex items-center gap-3 p-3 text-left", children: [_jsx(Checkbox, { checked: block.status === 'completed' || isBlockCompleted(block.id), onCheckedChange: () => toggleBlockComplete(block.id, block.tasks.length), onClick: (e) => e.stopPropagation(), className: "flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: cn("font-medium text-sm", (block.status === 'completed' || isBlockCompleted(block.id)) && "line-through text-muted-foreground"), children: block.title }), _jsxs(Badge, { variant: "outline", className: "text-[10px] h-5", children: [duration, " min"] })] }), block.tasks.length > 0 && (_jsx("div", { className: "flex items-center gap-1 mt-1", children: _jsxs("span", { className: "text-xs text-muted-foreground", children: [block.tasks.filter(t => t.completed).length, "/", block.tasks.length, " tareas"] }) }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [block.status === 'current' && (_jsxs(Badge, { className: "bg-primary text-primary-foreground text-[10px] animate-pulse", children: [_jsx(Play, { className: "w-3 h-3 mr-1 fill-current" }), "EN CURSO"] })), isExpanded ? (_jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground" })) : (_jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground" }))] })] }), isExpanded && block.tasks.length > 0 && (_jsx("div", { className: "px-3 pb-3 space-y-2 border-t", children: block.tasks.map(task => (_jsxs("div", { className: cn("flex items-center gap-2 p-2 rounded bg-muted/50", task.completed && "opacity-60"), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task), className: "flex-shrink-0" }), _jsx("span", { className: cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground"), children: task.title }), task.priority === 'high' && (_jsx(Badge, { variant: "destructive", className: "text-[10px] h-5", children: "ALTA" })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleMoveTask(task), className: "h-6 px-2", children: _jsx(MoveRight, { className: "w-3 h-3" }) })] }, task.id))) })), !isExpanded && block.tasks.length > 0 && (_jsxs("div", { className: "px-3 pb-2 flex flex-wrap gap-1", children: [block.tasks.slice(0, 2).map(task => (_jsx(Badge, { variant: "outline", className: cn("text-[10px]", task.completed && "line-through opacity-60"), children: task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title }, task.id))), block.tasks.length > 2 && (_jsxs(Badge, { variant: "outline", className: "text-[10px]", children: ["+", block.tasks.length - 2, " m\u00E1s"] }))] }))] })] }, block.id));
                    }), blocksWithTasks.length > 0 && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-mono text-muted-foreground w-16", children: formatTime(blocksWithTasks[blocksWithTasks.length - 1].endTime) }), _jsx("div", { className: "flex-1 h-px bg-border" })] }))] }), _jsx(Dialog, { open: moveDialogOpen, onOpenChange: setMoveDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Mover tarea a otro bloque" }) }), _jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: blocksWithTasks
                                .filter(b => b.id !== taskToMove?.routine_block_id)
                                .map(block => (_jsxs(Button, { variant: "outline", className: "w-full justify-start", onClick: () => moveTaskToBlock(block.id), children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), formatTime(block.startTime), " - ", block.title] }, block.id))) })] }) })] }));
}
