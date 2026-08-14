import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Play, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
export function DayTimeline() {
    const { blocks, getCurrentBlock, isLoaded } = useRoutineBlocksDB();
    const [blocksWithTasks, setBlocksWithTasks] = useState([]);
    const [expandedBlock, setExpandedBlock] = useState(null);
    useEffect(() => {
        if (isLoaded && blocks.length > 0) {
            loadTasksForBlocks();
        }
    }, [isLoaded, blocks]);
    const loadTasksForBlocks = async () => {
        const today = new Date().toISOString().split('T')[0];
        const currentBlock = getCurrentBlock();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        // Load all tasks for today
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, completed, priority, source, routine_block_id')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`);
        const enrichedBlocks = blocks.map(block => {
            const [endH, endM] = block.endTime.split(':').map(Number);
            const endMinutes = endH * 60 + endM;
            const blockTasks = (tasks || [])
                .filter(t => t.routine_block_id === block.id)
                .map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority || undefined,
                source: t.source || 'general'
            }));
            const completedCount = blockTasks.filter(t => t.completed).length;
            const progress = blockTasks.length > 0
                ? Math.round((completedCount / blockTasks.length) * 100)
                : 0;
            let status = 'upcoming';
            if (currentBlock?.id === block.id)
                status = 'current';
            else if (currentMinutes >= endMinutes)
                status = 'completed';
            return {
                id: block.id,
                title: block.title,
                startTime: block.startTime,
                endTime: block.endTime,
                tasks: blockTasks,
                status,
                progress
            };
        });
        setBlocksWithTasks(enrichedBlocks);
        // Auto-expand current block
        if (currentBlock) {
            setExpandedBlock(currentBlock.id);
        }
    };
    if (!isLoaded) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map(i => (_jsx("div", { className: "animate-pulse h-10 bg-muted rounded" }, i))) }));
    }
    const formatTime = (time) => {
        const [h, m] = time.split(':').map(Number);
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')}`;
    };
    const getSourceBadge = (source) => {
        const config = {
            university: { label: 'Uni', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            entrepreneurship: { label: 'Emp', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            projects: { label: 'Proy', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            general: { label: 'Gen', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
        };
        return config[source] || config.general;
    };
    const totalTasks = blocksWithTasks.reduce((acc, b) => acc + b.tasks.length, 0);
    const completedTasks = blocksWithTasks.reduce((acc, b) => acc + b.tasks.filter(t => t.completed).length, 0);
    return (_jsxs("div", { className: "space-y-1", children: [totalTasks > 0 && (_jsxs("div", { className: "flex items-center justify-between mb-3 pb-2 border-b border-border", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: [completedTasks, "/", totalTasks, " tareas"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0, className: "w-16 h-1.5" }), _jsxs("span", { className: "text-xs font-mono", children: [Math.round((completedTasks / totalTasks) * 100), "%"] })] })] })), blocksWithTasks.map((block) => {
                const isExpanded = expandedBlock === block.id;
                const hasTasks = block.tasks.length > 0;
                return (_jsxs("div", { className: cn("rounded-lg transition-all overflow-hidden", block.status === 'current' && "ring-2 ring-primary"), children: [_jsxs("button", { onClick: () => setExpandedBlock(isExpanded ? null : block.id), className: cn("w-full flex items-center gap-3 p-3 transition-all text-left", block.status === 'current'
                                ? 'bg-foreground text-background font-medium'
                                : block.status === 'completed'
                                    ? 'bg-muted/50 text-muted-foreground'
                                    : 'hover:bg-muted/50'), children: [_jsx("div", { className: "flex-shrink-0", children: block.status === 'completed' ? (_jsx(CheckCircle2, { className: cn("w-5 h-5", block.progress === 100 ? "text-success" : "text-warning") })) : block.status === 'current' ? (_jsx(Play, { className: "w-5 h-5 fill-current animate-pulse" })) : (_jsx(Circle, { className: "w-5 h-5 text-muted-foreground" })) }), _jsx("span", { className: cn("font-mono text-sm w-12 flex-shrink-0", block.status === 'current' ? 'text-background' : 'text-muted-foreground'), children: formatTime(block.startTime) }), _jsx("span", { className: cn("flex-1 truncate text-sm", block.status === 'completed' && block.progress === 100 && 'line-through'), children: block.title }), hasTasks && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex items-center gap-1", children: _jsxs("span", { className: cn("text-xs font-mono", block.status === 'current' ? 'text-background/70' : 'text-muted-foreground'), children: [block.tasks.filter(t => t.completed).length, "/", block.tasks.length] }) }), _jsx("div", { className: cn("w-8 h-1.5 rounded-full overflow-hidden", block.status === 'current' ? 'bg-background/30' : 'bg-muted'), children: _jsx("div", { className: cn("h-full rounded-full transition-all", block.progress === 100 ? 'bg-success' : 'bg-primary'), style: { width: `${block.progress}%` } }) })] })), block.status === 'current' && (_jsx("span", { className: "text-xs px-2 py-0.5 bg-background text-foreground rounded font-semibold", children: "AHORA" }))] }), isExpanded && hasTasks && (_jsx("div", { className: cn("px-3 pb-3 space-y-1.5 animate-fade-in", block.status === 'current'
                                ? 'bg-foreground/90'
                                : 'bg-muted/30'), children: _jsx("div", { className: "pt-1 border-t border-border/20", children: block.tasks.map(task => {
                                    const sourceBadge = getSourceBadge(task.source);
                                    return (_jsxs("div", { className: cn("flex items-center gap-2 py-2 px-2 rounded transition-all", task.completed && "opacity-60"), children: [task.completed ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-success flex-shrink-0" })) : (_jsx(Circle, { className: cn("w-4 h-4 flex-shrink-0", block.status === 'current' ? 'text-background/50' : 'text-muted-foreground') })), _jsx("span", { className: cn("flex-1 text-sm truncate", task.completed && "line-through", block.status === 'current' && !task.completed && 'text-background'), children: task.title }), _jsx(Badge, { variant: "outline", className: cn("text-[10px] px-1.5 py-0", sourceBadge.class), children: sourceBadge.label }), task.priority === 'high' && !task.completed && (_jsx(Zap, { className: "w-3 h-3 text-destructive" }))] }, task.id));
                                }) }) })), !isExpanded && hasTasks && block.status !== 'completed' && (_jsxs("div", { className: cn("px-12 pb-2 flex flex-wrap gap-1", block.status === 'current' ? 'bg-foreground/90' : ''), children: [block.tasks.slice(0, 3).map(task => (_jsx("span", { className: cn("text-xs px-2 py-0.5 rounded-full", task.completed
                                        ? 'bg-success/20 text-success line-through'
                                        : task.priority === 'high'
                                            ? 'bg-destructive/20 text-destructive'
                                            : block.status === 'current'
                                                ? 'bg-background/20 text-background'
                                                : 'bg-muted text-muted-foreground'), children: task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title }, task.id))), block.tasks.length > 3 && (_jsxs("span", { className: cn("text-xs px-2 py-0.5", block.status === 'current' ? 'text-background/70' : 'text-muted-foreground'), children: ["+", block.tasks.length - 3, " m\u00E1s"] }))] }))] }, block.id));
            })] }));
}
