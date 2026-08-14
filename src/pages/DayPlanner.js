import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Plus, Clock, Target, X, GripVertical, ChevronDown, ChevronRight, Settings2, Loader2, BookOpen, Briefcase, FolderKanban, ListTodo, Dumbbell, Coffee, Moon, Sun, Languages, Zap, Activity, BatteryLow, Heart, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRoutineBlocks, ROUTINES } from "@/hooks/useRoutineBlocks";
import { useRoutinePresets } from "@/hooks/useRoutinePresets";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";
import { QuickDateSelector } from "@/components/routine/QuickDateSelector";
import { PresetSchedulePicker } from "@/components/routine/PresetSchedulePicker";
const SOURCE_CONFIG = {
    general: { label: 'General', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: _jsx(ListTodo, { className: "h-3 w-3" }) },
    university: { label: 'Universidad', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: _jsx(BookOpen, { className: "h-3 w-3" }) },
    entrepreneurship: { label: 'Emprendimiento', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: _jsx(Briefcase, { className: "h-3 w-3" }) },
    project: { label: 'Proyecto', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: _jsx(FolderKanban, { className: "h-3 w-3" }) },
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
const AREAS = [
    { id: 'general', name: 'General', source: 'general' },
    { id: 'universidad', name: 'Universidad', source: 'university' },
    { id: 'emprendimiento', name: 'Emprendimiento', source: 'entrepreneurship' },
    { id: 'proyectos', name: 'Proyectos', source: 'project' },
];
const ROUTINE_STYLES = {
    disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
    normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
    super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
    descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};
export default function DayPlanner() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [mode, setMode] = useState('normal');
    const [notes, setNotes] = useState('');
    const [allTasks, setAllTasks] = useState([]);
    const [taskAssignments, setTaskAssignments] = useState({});
    const [loading, setLoading] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [dragOverBlockId, setDragOverBlockId] = useState(null);
    const [planRoutineType, setPlanRoutineType] = useState('normal');
    // Quick task creation
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskArea, setNewTaskArea] = useState('general');
    const [creating, setCreating] = useState(false);
    // Preset config
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    const [wakeTime, setWakeTime] = useState('06:30');
    const [sleepTime, setSleepTime] = useState('22:30');
    const { blocks: routineBlocks, isLoaded: blocksLoaded, routineType, setRoutineType } = useRoutineBlocks();
    const { presets, isLoading: presetsLoading } = useRoutinePresets();
    const { modes, selectMode } = usePerformanceModes();
    const { toast } = useToast();
    // Sort blocks by time
    const sortedBlocks = useMemo(() => {
        return [...routineBlocks]
            .filter(block => {
            const startMinutes = parseTimeToMinutes(block.startTime);
            return startMinutes >= 300;
        })
            .sort((a, b) => a.order - b.order);
    }, [routineBlocks]);
    // Calculate sleep hours
    const sleepHours = useMemo(() => {
        const [wakeH, wakeM] = wakeTime.split(':').map(Number);
        const [sleepH, sleepM] = sleepTime.split(':').map(Number);
        let wakeMinutes = wakeH * 60 + wakeM + 24 * 60;
        let sleepMinutes = sleepH * 60 + sleepM;
        return (wakeMinutes - sleepMinutes) / 60;
    }, [wakeTime, sleepTime]);
    // Set default preset
    useEffect(() => {
        if (!presetsLoading && presets.length > 0 && !selectedPresetId) {
            const defaultPreset = presets.find(p => p.is_default);
            if (defaultPreset) {
                setSelectedPresetId(defaultPreset.id);
                setWakeTime(defaultPreset.wake_time);
                setSleepTime(defaultPreset.sleep_time);
            }
        }
    }, [presetsLoading, presets, selectedPresetId]);
    useEffect(() => { loadTasks(); }, []);
    useEffect(() => { loadExistingPlan(); }, [selectedDate]);
    const loadTasks = async () => {
        try {
            const [{ data: regularTasks }, { data: entrepreneurshipTasks }, { data: entrepreneurships }] = await Promise.all([
                supabase.from('tasks').select('id, title, description, source, completed, due_date, priority, area_id').eq('completed', false),
                supabase.from('entrepreneurship_tasks').select('id, title, completed, due_date, entrepreneurship_id').eq('completed', false),
                supabase.from('entrepreneurships').select('id, name'),
            ]);
            const entMap = new Map(entrepreneurships?.map(e => [e.id, e.name]) || []);
            const mapped = [
                ...(regularTasks || []).map(t => ({ ...t, completed: t.completed || false, source: t.source || 'general' })),
                ...(entrepreneurshipTasks || []).map(t => ({
                    id: t.id, title: t.title, source: 'entrepreneurship', sourceName: entMap.get(t.entrepreneurship_id),
                    completed: t.completed, due_date: t.due_date,
                })),
            ];
            setAllTasks(mapped);
        }
        catch (error) {
            console.error('Error loading tasks:', error);
        }
    };
    const loadExistingPlan = async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { data: plan } = await supabase.from('daily_plans').select('*').eq('plan_date', dateStr).maybeSingle();
            if (plan) {
                setMode(plan.mode);
                setNotes(plan.notes || '');
                if (plan.preset_id)
                    setSelectedPresetId(plan.preset_id);
                if (plan.wake_time)
                    setWakeTime(plan.wake_time);
                if (plan.sleep_time)
                    setSleepTime(plan.sleep_time);
                if (plan.routine_type) {
                    setPlanRoutineType(plan.routine_type);
                    setRoutineType(plan.routine_type);
                }
                if (plan.block_assignments) {
                    setTaskAssignments(plan.block_assignments);
                }
                else {
                    setTaskAssignments({});
                }
            }
            else {
                setMode('normal');
                setNotes('');
                setPlanRoutineType(routineType);
                setTaskAssignments({});
            }
        }
        catch (error) {
            console.error('Error loading plan:', error);
        }
    };
    // Filtered unassigned tasks
    const allAssignedIds = useMemo(() => new Set(Object.values(taskAssignments).flat()), [taskAssignments]);
    const unassignedTasks = useMemo(() => {
        return allTasks.filter(t => {
            if (allAssignedIds.has(t.id))
                return false;
            if (sourceFilter !== 'all' && t.source !== sourceFilter)
                return false;
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                return false;
            return true;
        });
    }, [allTasks, allAssignedIds, sourceFilter, searchQuery]);
    // Drag and drop handlers
    const handleDragStart = (taskId) => setDraggedTaskId(taskId);
    const handleDragEnd = () => { setDraggedTaskId(null); setDragOverBlockId(null); };
    const handleBlockDragOver = (e, blockId) => {
        e.preventDefault();
        setDragOverBlockId(blockId);
    };
    const handleBlockDrop = (e, blockId) => {
        e.preventDefault();
        if (draggedTaskId) {
            assignTaskToBlock(draggedTaskId, blockId);
        }
        setDraggedTaskId(null);
        setDragOverBlockId(null);
    };
    const assignTaskToBlock = useCallback((taskId, blockId) => {
        // Remove from any current block
        const newAssignments = { ...taskAssignments };
        Object.keys(newAssignments).forEach(bId => {
            newAssignments[bId] = newAssignments[bId].filter(id => id !== taskId);
        });
        // Add to new block
        if (!newAssignments[blockId])
            newAssignments[blockId] = [];
        newAssignments[blockId].push(taskId);
        setTaskAssignments(newAssignments);
    }, [taskAssignments]);
    const removeTaskFromBlock = (blockId, taskId) => {
        setTaskAssignments(prev => ({
            ...prev,
            [blockId]: (prev[blockId] || []).filter(id => id !== taskId),
        }));
    };
    const handleQuickCreate = async () => {
        if (!newTaskTitle.trim())
            return;
        setCreating(true);
        try {
            const area = AREAS.find(a => a.id === newTaskArea);
            const { error } = await supabase.from('tasks').insert({
                title: newTaskTitle.trim(),
                source: area?.source || 'general',
                area_id: newTaskArea,
                priority: 'medium',
                due_date: `${format(selectedDate, 'yyyy-MM-dd')}T12:00:00`,
                completed: false,
                status: 'pendiente',
            });
            if (error)
                throw error;
            setNewTaskTitle('');
            toast({ title: "Tarea creada" });
            loadTasks();
        }
        catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        finally {
            setCreating(false);
        }
    };
    const handleSavePlan = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await supabase.from('daily_plans').upsert({
                plan_date: dateStr, mode, notes,
                preset_id: selectedPresetId,
                wake_time: wakeTime, sleep_time: sleepTime,
                routine_type: planRoutineType,
                block_assignments: taskAssignments,
            }, { onConflict: 'plan_date' });
            // Also update routine_block_id on tasks directly for TODAY only,
            // so the current hoy/inicio view (without plan support) still works
            if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
                for (const [blockId, taskIds] of Object.entries(taskAssignments)) {
                    for (const taskId of taskIds) {
                        const task = allTasks.find(t => t.id === taskId);
                        if (task?.source === 'entrepreneurship') {
                            await supabase.from('entrepreneurship_tasks').update({ routine_block_id: blockId }).eq('id', taskId);
                        }
                        else {
                            await supabase.from('tasks').update({ routine_block_id: blockId }).eq('id', taskId);
                        }
                    }
                }
                const allAssigned = Object.values(taskAssignments).flat();
                const toUnassign = allTasks.filter(t => !allAssigned.includes(t.id));
                for (const task of toUnassign) {
                    if (task.source === 'entrepreneurship') {
                        await supabase.from('entrepreneurship_tasks').update({ routine_block_id: null }).eq('id', task.id);
                    }
                    else {
                        await supabase.from('tasks').update({ routine_block_id: null }).eq('id', task.id);
                    }
                }
            }
            selectMode(mode);
            toast({ title: "Plan guardado ✓", description: `${format(selectedDate, "d 'de' MMMM", { locale: es })} · ${Object.values(taskAssignments).flat().length} tareas asignadas` });
        }
        catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        finally {
            setLoading(false);
        }
    };
    const totalAssigned = Object.values(taskAssignments).flat().length;
    const modeIcons = {
        'alto-rendimiento': _jsx(Zap, { className: "h-4 w-4" }),
        'normal': _jsx(Activity, { className: "h-4 w-4" }),
        'bajo-rendimiento': _jsx(BatteryLow, { className: "h-4 w-4" }),
        'recuperacion': _jsx(Heart, { className: "h-4 w-4" }),
    };
    return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: _jsxs("div", { className: "max-w-[1400px] mx-auto space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Planificar D\u00EDa" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Arrastra tareas a los bloques de tu rutina" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(QuickDateSelector, { selectedDate: selectedDate, onDateChange: setSelectedDate }), _jsxs(Button, { onClick: handleSavePlan, disabled: loading, size: "sm", className: "gap-1.5", children: [_jsx(Save, { className: "h-4 w-4" }), loading ? 'Guardando...' : 'Guardar'] })] })] }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs(Badge, { variant: "outline", className: "gap-1 py-1", children: [_jsx(Target, { className: "h-3 w-3" }), " ", totalAssigned, " asignadas"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 py-1", children: [_jsx(ListTodo, { className: "h-3 w-3" }), " ", allTasks.length - totalAssigned, " pendientes"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 py-1", children: [modeIcons[mode], " ", modes.find(m => m.id === mode)?.name || mode] }), _jsxs(Badge, { variant: "outline", className: cn("gap-1 py-1", sleepHours >= 8 ? 'text-green-500' : sleepHours >= 7 ? 'text-yellow-500' : 'text-red-500'), children: [_jsx(Moon, { className: "h-3 w-3" }), " ", sleepHours.toFixed(1), "h sue\u00F1o"] })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                        const style = ROUTINE_STYLES[r.type];
                        const isActive = planRoutineType === r.type;
                        return (_jsxs("button", { onClick: () => {
                                setPlanRoutineType(r.type);
                                setRoutineType(r.type);
                            }, className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: "text-xl leading-none transition-transform duration-300", children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                    }) }), _jsxs(Collapsible, { open: settingsOpen, onOpenChange: setSettingsOpen, children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1.5 text-muted-foreground", children: [_jsx(Settings2, { className: "h-4 w-4" }), "Configuraci\u00F3n", settingsOpen ? _jsx(ChevronDown, { className: "h-3 w-3" }) : _jsx(ChevronRight, { className: "h-3 w-3" })] }) }), _jsx(CollapsibleContent, { children: _jsx(Card, { className: "p-4 mt-2", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Preset" }), _jsxs(Select, { value: selectedPresetId || '', onValueChange: (v) => {
                                                        setSelectedPresetId(v);
                                                        const preset = presets.find(p => p.id === v);
                                                        if (preset) {
                                                            setWakeTime(preset.wake_time);
                                                            setSleepTime(preset.sleep_time);
                                                        }
                                                    }, children: [_jsx(SelectTrigger, { className: "h-9", children: _jsx(SelectValue, { placeholder: "Seleccionar..." }) }), _jsx(SelectContent, { children: presets.map(p => _jsx(SelectItem, { value: p.id, children: p.name }, p.id)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Modo" }), _jsxs(Select, { value: mode, onValueChange: setMode, children: [_jsx(SelectTrigger, { className: "h-9", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: modes.map(m => _jsx(SelectItem, { value: m.id, children: m.name }, m.id)) })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Despertar" }), _jsx(Input, { type: "time", value: wakeTime, onChange: (e) => setWakeTime(e.target.value), className: "h-9" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Dormir" }), _jsx(Input, { type: "time", value: sleepTime, onChange: (e) => setSleepTime(e.target.value), className: "h-9" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "Notas" }), _jsx(Input, { placeholder: "Notas del d\u00EDa...", value: notes, onChange: (e) => setNotes(e.target.value), className: "h-9" })] })] }) }) })] }), _jsx(PresetSchedulePicker, { persistToToday: false, selectedPresetId: selectedPresetId, onSelectPreset: (id, preset) => {
                        setSelectedPresetId(id);
                        setWakeTime(preset.wake_time);
                        setSleepTime(preset.sleep_time);
                    } }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("h2", { className: "text-sm font-medium text-muted-foreground mb-2", children: "Bloques del D\u00EDa" }), !blocksLoaded ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => _jsx("div", { className: "h-16 bg-muted/30 rounded-lg animate-pulse" }, i)) })) : (sortedBlocks.map((block) => {
                                    const assignedTasks = (taskAssignments[block.id] || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean);
                                    const isWorkBlock = block.title.toLowerCase().includes('deep work') || block.title.toLowerCase().includes('focus') || block.blockType === 'configurable' || block.blockType === 'dinamico';
                                    const isDragOver = dragOverBlockId === block.id;
                                    return (_jsxs("div", { onDragOver: (e) => handleBlockDragOver(e, block.id), onDragLeave: () => setDragOverBlockId(null), onDrop: (e) => handleBlockDrop(e, block.id), className: cn("flex items-start gap-2 transition-all"), children: [_jsx("div", { className: "w-14 flex-shrink-0 text-[11px] text-muted-foreground font-mono pt-2.5 text-right", children: formatTime(block.startTime) }), _jsxs(Card, { className: cn("flex-1 p-2.5 border-l-[3px] transition-all min-h-[48px]", isWorkBlock ? "border-l-primary" : "border-l-muted-foreground/20", isDragOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]", assignedTasks.length > 0 && !isDragOver && "bg-primary/[0.03]"), children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [getBlockIcon(block.title), _jsx("span", { className: "font-medium text-sm truncate", children: block.title }), _jsx("span", { className: "text-[10px] text-muted-foreground hidden sm:inline", children: formatTime(block.endTime) })] }), isWorkBlock && assignedTasks.length === 0 && (_jsx("span", { className: "text-[10px] text-muted-foreground italic", children: "Arrastra tareas aqu\u00ED" })), assignedTasks.length > 0 && (_jsx(Badge, { variant: "secondary", className: "text-[10px] h-5", children: assignedTasks.length }))] }), assignedTasks.length > 0 && (_jsx("div", { className: "mt-1.5 space-y-1", children: assignedTasks.map((task) => {
                                                            const cfg = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.general;
                                                            return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(task.id), onDragEnd: handleDragEnd, className: "flex items-center justify-between p-1.5 bg-background/80 rounded group cursor-grab active:cursor-grabbing", children: [_jsxs("div", { className: "flex items-center gap-1.5 flex-1 min-w-0", children: [_jsx(GripVertical, { className: "h-3 w-3 text-muted-foreground/40 flex-shrink-0" }), _jsx(Badge, { variant: "outline", className: cn("text-[10px] px-1 py-0 h-4 flex-shrink-0", cfg.color), children: cfg.icon }), _jsx("span", { className: "text-xs truncate", children: task.title })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeTaskFromBlock(block.id, task.id), className: "opacity-0 group-hover:opacity-100 h-5 w-5 p-0 flex-shrink-0", children: _jsx(X, { className: "h-3 w-3" }) })] }, task.id));
                                                        }) }))] })] }, block.id));
                                }))] }), _jsxs("div", { className: "space-y-3 lg:sticky lg:top-20 lg:self-start", children: [_jsxs(Card, { className: "p-3", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Crear tarea r\u00E1pida" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { placeholder: "Nueva tarea...", value: newTaskTitle, onChange: (e) => setNewTaskTitle(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleQuickCreate(), className: "h-8 text-sm", disabled: creating }), _jsxs(Select, { value: newTaskArea, onValueChange: setNewTaskArea, children: [_jsx(SelectTrigger, { className: "h-8 w-[100px] text-xs", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: AREAS.map(a => _jsx(SelectItem, { value: a.id, className: "text-xs", children: a.name }, a.id)) })] }), _jsx(Button, { size: "sm", className: "h-8 w-8 p-0", onClick: handleQuickCreate, disabled: creating || !newTaskTitle.trim(), children: creating ? _jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : _jsx(Plus, { className: "h-3 w-3" }) })] })] }), _jsxs(Card, { className: "p-3", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsxs("p", { className: "text-xs font-medium text-muted-foreground", children: ["Tareas sin asignar (", unassignedTasks.length, ")"] }) }), _jsxs("div", { className: "flex gap-1.5 mb-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" }), _jsx(Input, { placeholder: "Buscar...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-7 text-xs pl-7" })] }), _jsxs(Select, { value: sourceFilter, onValueChange: setSourceFilter, children: [_jsx(SelectTrigger, { className: "h-7 w-[90px] text-[10px]", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", className: "text-xs", children: "Todas" }), Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (_jsx(SelectItem, { value: key, className: "text-xs", children: cfg.label }, key)))] })] })] }), _jsx(ScrollArea, { className: "h-[calc(100vh-380px)] min-h-[300px]", children: _jsxs("div", { className: "space-y-1", children: [unassignedTasks.map((task) => {
                                                        const cfg = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.general;
                                                        return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(task.id), onDragEnd: handleDragEnd, className: cn("flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50", draggedTaskId === task.id && "opacity-40 scale-95"), children: [_jsx(GripVertical, { className: "h-3 w-3 text-muted-foreground/40 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium truncate", children: task.title }), _jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [_jsxs(Badge, { variant: "outline", className: cn("text-[9px] px-1 py-0 h-3.5", cfg.color), children: [cfg.icon, _jsx("span", { className: "ml-0.5", children: task.sourceName || cfg.label })] }), task.priority === 'high' && (_jsx(Badge, { variant: "destructive", className: "text-[9px] px-1 py-0 h-3.5", children: "Alta" }))] })] })] }, task.id));
                                                    }), unassignedTasks.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-8", children: searchQuery || sourceFilter !== 'all' ? 'Sin resultados' : '¡Todas las tareas están asignadas! 🎯' }))] }) })] })] })] })] }) }));
}
