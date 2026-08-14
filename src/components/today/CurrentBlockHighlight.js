import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, ChevronRight, AlertTriangle, Plus, Zap, BookOpen, Briefcase, FolderKanban, Globe } from "lucide-react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { supabase } from "@/integrations/supabase/client";
import { BlockAIAssistant } from "./BlockAIAssistant";
import { BlockTaskAssigner } from "@/components/routine/BlockTaskAssigner";
import { PomodoroTracker } from "./PomodoroTracker";
import { LanguageBlockTasks } from "./LanguageBlockTasks";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
export function CurrentBlockHighlight() {
    const { blocks, getCurrentBlock, getBlockProgress, isLoaded } = useRoutineBlocksDB();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [blockTasks, setBlockTasks] = useState([]);
    const [assignerOpen, setAssignerOpen] = useState(false);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [quarterlyGoals, setQuarterlyGoals] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    const currentBlock = getCurrentBlock();
    useEffect(() => {
        loadQuarterlyGoals();
        loadAvailableTasks();
    }, []);
    useEffect(() => {
        if (currentBlock) {
            loadBlockTasks(currentBlock.id);
        }
    }, [currentBlock?.id, quarterlyGoals]);
    const loadQuarterlyGoals = async () => {
        const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
        const { data } = await supabase
            .from('twelve_week_goals')
            .select('id, title, category, progress_percentage')
            .eq('quarter', currentQuarter)
            .eq('year', new Date().getFullYear())
            .eq('status', 'active');
        setQuarterlyGoals(data || []);
    };
    const loadAvailableTasks = async () => {
        const today = new Date().toISOString().split('T')[0];
        // Load regular tasks
        const { data: regularTasks } = await supabase
            .from('tasks')
            .select('id, title, completed, priority, source, area_id, routine_block_id')
            .gte('due_date', `${today}T00:00:00`)
            .lte('due_date', `${today}T23:59:59`);
        // Load entrepreneurship tasks
        const { data: entrepreneurshipTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, title, completed')
            .eq('due_date', today);
        const mapped = [
            ...(regularTasks || []).map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                source: (t.source || 'tasks'),
                routine_block_id: t.routine_block_id || undefined
            })),
            ...(entrepreneurshipTasks || []).map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                source: 'entrepreneurship'
            }))
        ];
        setAvailableTasks(mapped);
    };
    const loadBlockTasks = async (blockId) => {
        const today = new Date().toISOString().split('T')[0];
        // Load regular tasks assigned to this block
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, completed, priority, area_id, source, source_id')
            .eq('routine_block_id', blockId);
        // Load entrepreneurship tasks assigned to this block  
        const { data: entrepreneurshipTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, title, completed, entrepreneurship_id');
        // Filter entrepreneurship tasks that have this block assigned (we need to check via tasks table or a field)
        // For now, we'll load all entrepreneurship tasks for today and filter by due_date
        const { data: todayEntrepreneurshipTasks } = await supabase
            .from('entrepreneurship_tasks')
            .select('id, title, completed, entrepreneurship_id, due_date')
            .eq('due_date', today);
        // Load entrepreneurship names for context
        const { data: entrepreneurships } = await supabase
            .from('entrepreneurships')
            .select('id, name');
        const entrepreneurshipMap = new Map((entrepreneurships || []).map(e => [e.id, e.name]));
        // Load university subjects for context
        const { data: subjects } = await supabase
            .from('university_subjects')
            .select('id, name');
        const subjectMap = new Map((subjects || []).map(s => [s.id, s.name]));
        // Map regular tasks - only those assigned to this block
        const mappedTasks = (tasks || []).map(t => {
            const linkedGoal = findLinkedGoal(t.area_id, t.source);
            const isUniversity = t.area_id === 'universidad' || t.source === 'university';
            return {
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority || undefined,
                source: t.source || 'general',
                sourceTable: 'tasks',
                areaId: t.area_id || undefined,
                subjectName: isUniversity && t.source_id ? subjectMap.get(t.source_id) : undefined,
                goalTitle: linkedGoal?.title,
                goalProgress: linkedGoal?.progress_percentage,
                goalCategory: linkedGoal?.category,
                contributionPercent: linkedGoal ? Math.round(100 / Math.max(1, quarterlyGoals.filter(g => g.category === linkedGoal.category).length)) : undefined
            };
        });
        // Note: Entrepreneurship tasks don't have routine_block_id field yet
        // We only show tasks that are explicitly assigned via tasks table
        setBlockTasks(mappedTasks);
    };
    const findLinkedGoal = (areaId, source) => {
        const categoryMap = {
            university: 'universidad',
            entrepreneurship: 'emprendimiento',
            projects: 'proyectos',
            gym: 'salud',
            piano: 'desarrollo_personal',
            reading: 'desarrollo_personal'
        };
        const category = categoryMap[areaId || source || ''];
        if (!category)
            return null;
        return quarterlyGoals.find(g => g.category.toLowerCase().includes(category) ||
            category.includes(g.category.toLowerCase()));
    };
    const handleAssignTasks = async (taskIds) => {
        if (!currentBlock)
            return;
        // Get currently assigned tasks to this block
        const currentlyAssigned = availableTasks
            .filter(t => t.routine_block_id === currentBlock.id)
            .map(t => t.id);
        // Tasks to unassign (were assigned, now not selected)
        const toUnassign = currentlyAssigned.filter(id => !taskIds.includes(id));
        // Tasks to assign (newly selected)
        const toAssign = taskIds.filter(id => !currentlyAssigned.includes(id));
        // Unassign tasks
        for (const taskId of toUnassign) {
            await supabase
                .from('tasks')
                .update({ routine_block_id: null })
                .eq('id', taskId);
        }
        // Assign new tasks
        for (const taskId of toAssign) {
            await supabase
                .from('tasks')
                .update({ routine_block_id: currentBlock.id })
                .eq('id', taskId);
        }
        toast.success(`${taskIds.length} tareas asignadas al bloque`);
        loadBlockTasks(currentBlock.id);
        loadAvailableTasks();
    };
    const getCategoryColor = (category) => {
        const colors = {
            universidad: 'from-blue-500 to-blue-600',
            emprendimiento: 'from-purple-500 to-purple-600',
            salud: 'from-green-500 to-green-600',
            desarrollo_personal: 'from-amber-500 to-amber-600',
            proyectos: 'from-emerald-500 to-emerald-600'
        };
        return colors[category?.toLowerCase() || ''] || 'from-primary to-primary';
    };
    const getCategoryIcon = (category) => {
        const icons = {
            universidad: '📚',
            emprendimiento: '💼',
            salud: '💪',
            desarrollo_personal: '🎯',
            proyectos: '🚀'
        };
        return icons[category?.toLowerCase() || ''] || '🎯';
    };
    if (!isLoaded) {
        return (_jsx(Card, { className: "border-2 border-foreground bg-card", children: _jsx(CardContent, { className: "p-6", children: _jsx("div", { className: "animate-pulse h-40 bg-muted rounded" }) }) }));
    }
    if (!currentBlock) {
        // Find next block
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextBlock = blocks.find(block => {
            const [startH, startM] = block.startTime.split(':').map(Number);
            return startH * 60 + startM > currentMinutes;
        });
        return (_jsx(Card, { className: "border border-border bg-card", children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("p", { className: "text-muted-foreground mb-2", children: "No hay bloque activo en este momento" }), nextBlock && (_jsxs("div", { className: "flex items-center justify-center gap-2 text-sm", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsxs("span", { children: ["Pr\u00F3ximo: ", _jsx("strong", { children: nextBlock.title }), " a las ", formatTime(nextBlock.startTime)] })] }))] }) }));
    }
    const progress = getBlockProgress(currentBlock);
    // Calculate time remaining
    const [endHour, endMinute] = currentBlock.endTime.split(':').map(Number);
    const endTimeMinutes = endHour * 60 + endMinute;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const remainingMinutes = Math.max(0, endTimeMinutes - currentMinutes);
    // Find next block
    const currentIndex = blocks.findIndex(b => b.id === currentBlock.id);
    const nextBlock = currentIndex >= 0 && currentIndex < blocks.length - 1
        ? blocks[currentIndex + 1]
        : null;
    const toggleTask = async (taskId) => {
        const task = blockTasks.find(t => t.id === taskId);
        if (task) {
            await supabase
                .from('tasks')
                .update({ completed: !task.completed })
                .eq('id', taskId);
            setBlockTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
        }
    };
    function formatTime(time) {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    const completedCount = blockTasks.filter(t => t.completed).length;
    const taskProgress = blockTasks.length > 0 ? (completedCount / blockTasks.length) * 100 : progress;
    const hasHighPriority = blockTasks.some(t => t.priority === 'high' && !t.completed);
    // Check if this is a language block
    const isLanguageBlock = currentBlock.title.toLowerCase().includes('idioma') ||
        currentBlock.title.toLowerCase().includes('language') ||
        currentBlock.title.toLowerCase().includes('inglés') ||
        currentBlock.title.toLowerCase().includes('italiano');
    // Determine block type and duration for language blocks
    const getLanguageBlockInfo = () => {
        if (!isLanguageBlock)
            return null;
        const [startH, startM] = currentBlock.startTime.split(':').map(Number);
        const [endH, endM] = currentBlock.endTime.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        // Morning block (before 12:00) = full version (90 min)
        // Afternoon/Evening block (7:00 PM - 7:30 PM) = reduced version (30 min)
        const blockType = startH < 12 ? 'morning' : 'afternoon';
        return { blockType, durationMinutes };
    };
    const languageBlockInfo = getLanguageBlockInfo();
    const getSourceLabel = (task) => {
        if (task.subjectName)
            return task.subjectName;
        if (task.entrepreneurshipName)
            return task.entrepreneurshipName;
        const labels = {
            university: 'Universidad',
            entrepreneurship: 'Emprendimiento',
            project: 'Proyecto',
            general: 'General'
        };
        return labels[task.source] || task.source;
    };
    const getSourceIcon = (source) => {
        switch (source) {
            case 'university': return _jsx(BookOpen, { className: "w-3 h-3" });
            case 'entrepreneurship': return _jsx(Briefcase, { className: "w-3 h-3" });
            case 'project': return _jsx(FolderKanban, { className: "w-3 h-3" });
            default: return null;
        }
    };
    return (_jsx(Card, { className: `border-2 ${hasHighPriority ? 'border-destructive' : 'border-foreground'} bg-card shadow-lg`, children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full animate-pulse ${hasHighPriority ? 'bg-destructive' : 'bg-foreground'}` }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Bloque Actual" }), hasHighPriority && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-destructive", children: [_jsx(AlertTriangle, { className: "w-3 h-3" }), "Prioridad Alta"] }))] }), _jsxs("span", { className: "text-sm font-mono text-muted-foreground", children: [formatTime(currentBlock.startTime), " - ", formatTime(currentBlock.endTime)] })] }), _jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: currentBlock.title }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Este bloque contribuye a tu progreso diario y metas trimestrales." }), remainingMinutes > 0 && (() => {
                    const [startH, startM] = currentBlock.startTime.split(':').map(Number);
                    const [endH, endM] = currentBlock.endTime.split(':').map(Number);
                    const blockDuration = (endH * 60 + endM) - (startH * 60 + startM);
                    if (blockDuration >= 60) {
                        return (_jsx("div", { className: "mb-4", children: _jsx(PomodoroTracker, { blockStartTime: currentBlock.startTime, blockEndTime: currentBlock.endTime, cycleDuration: 30 }) }));
                    }
                    return null;
                })(), isLanguageBlock && languageBlockInfo && (_jsxs("div", { className: "mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Globe, { className: "w-5 h-5 text-primary" }), _jsx("h3", { className: "font-semibold text-foreground", children: "Actividades de Idiomas" })] }), _jsx(LanguageBlockTasks, { blockDurationMinutes: languageBlockInfo.durationMinutes, blockType: languageBlockInfo.blockType })] })), !isLanguageBlock && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso del bloque" }), _jsxs("span", { className: "font-mono font-medium", children: [Math.round(taskProgress), "%"] })] }), _jsx(Progress, { value: taskProgress, className: "h-2" })] })), !isLanguageBlock && (_jsxs("div", { className: "space-y-3 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Qu\u00E9 hacer ahora:" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setAssignerOpen(true), className: "h-7 text-xs gap-1", children: [_jsx(Plus, { className: "w-3 h-3" }), "Asignar tareas"] })] }), blockTasks.length === 0 ? (_jsxs("div", { className: "text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "No hay tareas asignadas a este bloque" }), _jsxs(Button, { variant: "secondary", size: "sm", onClick: () => setAssignerOpen(true), className: "gap-1", children: [_jsx(Plus, { className: "w-4 h-4" }), "Asignar tareas del d\u00EDa"] })] })) : (blockTasks.map((task) => (_jsxs("div", { className: `rounded-lg overflow-hidden transition-all ${task.priority === 'high' && !task.completed
                                ? 'ring-2 ring-destructive/50'
                                : 'border border-border'}`, children: [task.goalTitle && (_jsxs("div", { className: `px-3 py-1.5 bg-gradient-to-r ${getCategoryColor(task.goalCategory)} text-white flex items-center justify-between`, children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-medium", children: [_jsx("span", { children: getCategoryIcon(task.goalCategory) }), _jsx("span", { className: "truncate", children: task.goalTitle })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-1.5 w-16 bg-white/30 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-white rounded-full transition-all", style: { width: `${task.goalProgress || 0}%` } }) }), _jsxs("span", { className: "text-xs font-bold", children: [task.goalProgress || 0, "%"] })] })] })), _jsxs("button", { onClick: () => toggleTask(task.id), className: `w-full flex items-start gap-3 p-3 transition-colors text-left ${task.completed ? 'bg-muted/50' : 'bg-card hover:bg-muted/30'}`, children: [task.completed ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-success flex-shrink-0 mt-0.5" })) : (_jsx(Circle, { className: "w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium", children: task.title }), _jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [getSourceIcon(task.source), _jsx("span", { className: "text-xs text-muted-foreground", children: getSourceLabel(task) })] }), task.contributionPercent && !task.completed && (_jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Zap, { className: "w-3 h-3 text-amber-500" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Aporta ~", task.contributionPercent, "% a tu meta"] })] }))] }), task.priority === 'high' && !task.completed && (_jsxs("span", { className: "px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full flex items-center gap-1", children: [_jsx(AlertTriangle, { className: "w-3 h-3" }), "Alta"] }))] })] }, task.id))))] })), currentBlock && (_jsx(BlockTaskAssigner, { open: assignerOpen, onOpenChange: setAssignerOpen, blockId: currentBlock.id, blockTitle: currentBlock.title, dailyTasks: availableTasks, onAssignTasks: handleAssignTasks })), _jsx("div", { className: "mb-4", children: _jsx(BlockAIAssistant, { dayContext: {
                            currentTime: format(currentTime, "HH:mm"),
                            currentBlock: {
                                title: currentBlock.title,
                                startTime: currentBlock.startTime,
                                endTime: currentBlock.endTime,
                                remainingMinutes,
                            },
                            tasks: blockTasks.map(t => ({
                                id: t.id,
                                title: t.title,
                                completed: t.completed,
                                priority: t.priority,
                                goalTitle: t.goalTitle,
                                goalProgress: t.goalProgress,
                            })),
                            completedTasksCount: completedCount,
                            totalTasksCount: blockTasks.length,
                            goals: [],
                            blocksCompleted: currentIndex,
                            blocksTotal: blocks.length,
                            nextBlock: nextBlock ? { title: nextBlock.title, startTime: nextBlock.startTime } : undefined,
                            weekNumber: Math.ceil((differenceInDays(new Date(), new Date(new Date().getFullYear(), 0, 1)) + 1) / 7) % 12 || 12,
                            daysRemainingInQuarter: 84 - (differenceInDays(new Date(), new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)) % 84),
                        } }) }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-border", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-mono", children: remainingMinutes > 0
                                        ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m restantes`
                                        : 'Bloque terminado' })] }), nextBlock && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-muted-foreground", children: [_jsx(ChevronRight, { className: "w-4 h-4" }), _jsxs("span", { children: ["Siguiente: ", nextBlock.title] })] }))] })] }) }));
}
