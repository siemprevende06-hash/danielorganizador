import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { lifeAreas } from "@/lib/data";
import { flattenAreas } from "@/lib/utils";
import { useRoutineBlocks, ROUTINES } from "@/hooks/useRoutineBlocks";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import HoyDashboard from "@/components/today/HoyDashboard";
import { MinutesGoalInput } from "@/components/hierarchy/MinutesGoalInput";
import { setDayGoal, getDayGoalEffective, getDayGoalSum, ALL_HIERARCHY_AREAS, AREA_LABELS, } from "@/lib/hierarchy";
import { Sun, Moon, Clock, Target, ListTodo, Briefcase, GraduationCap, Languages, FolderKanban, Save, Dumbbell, Coffee, BookOpen, ChevronDown, ChevronRight, Brain, Gamepad2, PlusCircle, Loader2, GripVertical } from "lucide-react";
const SYSTEM_HABITS = [
    { id: "lectura", name: "Lectura", icon: BookOpen, baseMin: 20 },
    { id: "ajedrez", name: "Ajedrez", icon: Gamepad2, baseMin: 15 },
    { id: "game", name: "Game (Seducción)", icon: Gamepad2, baseMin: 15 },
    { id: "idiomas", name: "Idiomas", icon: Languages, baseMin: 30 },
    { id: "gym", name: "Gym", icon: Dumbbell, baseMin: 45 },
    { id: "musica", name: "Música", icon: BookOpen, baseMin: 30 },
];
const INTENSITY_MULTIPLIER = {
    minimo: 0.5, maximo: 1, extra: 1.5,
};
const AREAS = [
    { id: "general", label: "General", icon: ListTodo, color: "bg-blue-500/15 text-blue-500" },
    { id: "proyectos", label: "Proyectos", icon: FolderKanban, color: "bg-orange-500/15 text-orange-500" },
    { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "bg-purple-500/15 text-purple-500" },
    { id: "universidad", label: "Universidad", icon: GraduationCap, color: "bg-emerald-500/15 text-emerald-500" },
    { id: "idiomas", label: "Idiomas", icon: Languages, color: "bg-cyan-500/15 text-cyan-500" },
];
const POOL_SOURCE_CONFIG = {
    general: { label: 'General', icon: _jsx(ListTodo, { className: "h-3 w-3" }), color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    university: { label: 'Universidad', icon: _jsx(GraduationCap, { className: "h-3 w-3" }), color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    entrepreneurship: { label: 'Emprendimiento', icon: _jsx(Briefcase, { className: "h-3 w-3" }), color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    project: { label: 'Proyecto', icon: _jsx(FolderKanban, { className: "h-3 w-3" }), color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    idiomas: { label: 'Idiomas', icon: _jsx(Languages, { className: "h-3 w-3" }), color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
};
const POOL_SOURCE_ORDER = ['university', 'entrepreneurship', 'project', 'idiomas', 'general'];
const getBlockIcon = (title) => {
    const l = title.toLowerCase();
    if (l.includes("gym") || l.includes("ejercicio"))
        return _jsx(Dumbbell, { className: "h-3.5 w-3.5" });
    if (l.includes("activación") || l.includes("despertar"))
        return _jsx(Sun, { className: "h-3.5 w-3.5" });
    if (l.includes("desactivación") || l.includes("dormir"))
        return _jsx(Moon, { className: "h-3.5 w-3.5" });
    if (l.includes("desayuno") || l.includes("almuerzo") || l.includes("comida"))
        return _jsx(Coffee, { className: "h-3.5 w-3.5" });
    if (l.includes("lectura") || l.includes("idiomas"))
        return _jsx(BookOpen, { className: "h-3.5 w-3.5" });
    if (l.includes("deep") || l.includes("focus") || l.includes("trabajo"))
        return _jsx(Target, { className: "h-3.5 w-3.5" });
    return _jsx(Clock, { className: "h-3.5 w-3.5" });
};
const formatTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};
function DateSwitchTabs({ mode, onModeChange }) {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const todayLabel = format(today, "d MMM", { locale: es });
    const tomorrowLabel = format(tomorrow, "d MMM", { locale: es });
    return (_jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "inline-flex bg-muted/80 rounded-xl p-0.5 shadow-sm border border-border/40", children: [_jsxs("button", { onClick: () => onModeChange('hoy'), className: cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === 'hoy'
                        ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground"), children: [_jsx(Sun, { className: "h-3.5 w-3.5" }), "Hoy", _jsx("span", { className: "text-[10px] text-muted-foreground/70 font-normal", children: todayLabel })] }), _jsxs("button", { onClick: () => onModeChange('manana'), className: cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === 'manana'
                        ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground"), children: [_jsx(Moon, { className: "h-3.5 w-3.5" }), "Ma\u00F1ana", _jsx("span", { className: "text-[10px] text-muted-foreground/70 font-normal", children: tomorrowLabel })] })] }) }));
}
export default function PlanManana() {
    const [mode, setMode] = useState('manana');
    // --- ALL HOOKS MUST BE UNCONDITIONAL (before any return) ---
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
    const tomorrowDisplay = format(tomorrow, "EEEE d 'de' MMMM", { locale: es });
    const tomorrowCapitalized = tomorrowDisplay.charAt(0).toUpperCase() + tomorrowDisplay.slice(1);
    const { blocks, routineType, setRoutineType, updateBlockFocus } = useRoutineBlocks();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [entreTasks, setEntreTasks] = useState([]);
    const [uniTasks, setUniTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [blockAssignments, setBlockAssignments] = useState({});
    const [systemIntensity, setSystemIntensity] = useState({});
    const [areaCollapsed, setAreaCollapsed] = useState({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [newDueDate, setNewDueDate] = useState('');
    const [newAreaId, setNewAreaId] = useState('');
    const [creating, setCreating] = useState(false);
    const allAreas = useMemo(() => flattenAreas(lifeAreas), []);
    const [saving, setSaving] = useState(false);
    const [languageChoice, setLanguageChoice] = useState("ingles");
    const [musicInstrument, setMusicInstrument] = useState("piano");
    const [goalsVersion, setGoalsVersion] = useState(0);
    const applyDayGoal = (area, value) => {
        const mins = Math.max(0, parseInt(value) || 0);
        setDayGoal(tomorrow, area, mins);
        setGoalsVersion(v => v + 1);
    };
    const dayGoalSum = getDayGoalSum(tomorrow);
    const tasksByBlockForPlanner = useMemo(() => {
        const result = {};
        const allTaskItems = [
            ...tasks.map(t => ({ id: t.id, title: t.title, source: t.source, completed: t.completed })),
            ...entreTasks.map(t => ({ id: t.id, title: t.title, source: "entrepreneurship", completed: t.completed })),
            ...uniTasks.map(t => ({ id: t.id, title: t.title, source: "university", completed: t.completed })),
            ...projects.flatMap(p => p.tasks.map(t => ({ id: t.id, title: t.title, source: "project", completed: t.completed }))),
        ];
        for (const [blockId, taskIds] of Object.entries(blockAssignments)) {
            result[blockId] = taskIds.map(id => allTaskItems.find(t => t.id === id)).filter(Boolean);
        }
        return result;
    }, [tasks, entreTasks, uniTasks, projects, blockAssignments]);
    const handleRemoveTask = useCallback((taskId) => {
        setBlockAssignments(prev => {
            const next = {};
            for (const [blockId, taskIds] of Object.entries(prev)) {
                next[blockId] = taskIds.filter(id => id !== taskId);
            }
            return next;
        });
        setSelectedTasks(prev => { const n = new Set(prev); n.add(taskId); return n; });
    }, []);
    useEffect(() => {
        if (mode === 'manana') {
            loadData();
            const saved = localStorage.getItem(`planManana_intensity`);
            if (saved)
                setSystemIntensity(JSON.parse(saved));
            const savedLang = localStorage.getItem(`planManana_language`);
            if (savedLang)
                setLanguageChoice(savedLang);
            const savedInst = localStorage.getItem(`planManana_instrument`);
            if (savedInst)
                setMusicInstrument(savedInst);
        }
    }, [mode]);
    // --- Hoy mode ---
    if (mode === 'hoy') {
        return (_jsx(HoyDashboard, { headerExtra: _jsx("div", { className: "pt-2 pb-1", children: _jsx(DateSwitchTabs, { mode: mode, onModeChange: setMode }) }) }));
    }
    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksRes, entreRes, uniRes] = await Promise.all([
                supabase.from("tasks").select("id, title, source, area_id, completed, routine_block_id").eq("completed", false),
                supabase.from("entrepreneurship_tasks").select("id, title, completed, entrepreneurship_id").eq("completed", false),
                supabase.from("tasks").select("id, title, completed, source_id").eq("completed", false).eq("source", "university"),
            ]);
            if (tasksRes.data)
                setTasks(tasksRes.data);
            if (entreRes.data)
                setEntreTasks(entreRes.data);
            if (uniRes.data)
                setUniTasks(uniRes.data.map(t => ({ id: t.id, title: t.title, completed: t.completed, subject_id: t.source_id })));
        }
        catch {
            toast.error("Error al cargar datos");
        }
        try {
            const { data } = await supabase.from('projects').select('id, title, tasks');
            if (data && data.length > 0) {
                setProjects(data.map((p) => ({
                    id: p.id,
                    name: p.title,
                    tasks: (p.tasks || []).filter((t) => !t.completed),
                })));
            }
        }
        catch { }
        setLoading(false);
    };
    const getAreaTasks = (areaId) => {
        switch (areaId) {
            case "general": return tasks.filter(t => t.source === "general" || (!t.source && !t.area_id));
            case "proyectos": return [];
            case "emprendimiento": return tasks.filter(t => t.source === "entrepreneurship");
            case "universidad": return tasks.filter(t => t.source === "university");
            case "idiomas": return tasks.filter(t => t.area_id === "idiomas" || t.source === "idiomas");
            default: return [];
        }
    };
    const toggleTask = (taskId) => {
        setSelectedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId))
                next.delete(taskId);
            else
                next.add(taskId);
            return next;
        });
    };
    const assignTaskToBlock = (taskId, blockId) => {
        setBlockAssignments(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(bid => { next[bid] = next[bid].filter(id => id !== taskId); });
            next[blockId] = [...(next[blockId] || []), taskId];
            return next;
        });
        setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    };
    const removeFromBlock = (taskId, blockId) => {
        setBlockAssignments(prev => ({
            ...prev,
            [blockId]: (prev[blockId] || []).filter(id => id !== taskId),
        }));
        setSelectedTasks(prev => { const n = new Set(prev); n.add(taskId); return n; });
    };
    const handleCreateTask = async () => {
        if (!newTitle.trim())
            return;
        setCreating(true);
        try {
            const { error } = await supabase.from('tasks').insert({
                title: newTitle.trim(),
                description: newDescription.trim() || null,
                priority: newPriority,
                due_date: newDueDate || null,
                area_id: newAreaId || null,
                completed: false,
                source: 'general',
                status: 'pendiente',
            });
            if (error)
                throw error;
            toast.success('Tarea creada');
            setIsCreateOpen(false);
            setNewTitle('');
            setNewDescription('');
            setNewPriority('medium');
            setNewDueDate('');
            setNewAreaId('');
            loadData();
        }
        catch (error) {
            toast.error(error.message || 'Error al crear tarea');
        }
        finally {
            setCreating(false);
        }
    };
    const resetCreateForm = () => {
        setNewTitle('');
        setNewDescription('');
        setNewPriority('medium');
        setNewDueDate('');
        setNewAreaId('');
    };
    const handlePoolDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const getTaskLabel = (taskId) => {
        const all = [...tasks, ...entreTasks, ...uniTasks, ...projects.flatMap(p => p.tasks)];
        const t = all.find(t => t.id === taskId) || tasks.find(t => t.id === taskId);
        return t?.title || taskId;
    };
    const selectedPoolTasks = useMemo(() => {
        const assignedIds = new Set(Object.values(blockAssignments).flat());
        const pool = [];
        tasks.forEach(t => {
            if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
                pool.push({ id: t.id, title: t.title, source: t.area_id === 'idiomas' || t.source === 'idiomas' ? 'idiomas' : t.source || 'general' });
        });
        entreTasks.forEach(t => {
            if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
                pool.push({ id: t.id, title: t.title, source: 'entrepreneurship' });
        });
        uniTasks.forEach(t => {
            if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
                pool.push({ id: t.id, title: t.title, source: 'university' });
        });
        projects.forEach(p => {
            p.tasks.forEach(t => {
                if (selectedTasks.has(t.id) && !assignedIds.has(t.id))
                    pool.push({ id: t.id, title: t.title, source: 'project' });
            });
        });
        return pool;
    }, [selectedTasks, blockAssignments, tasks, entreTasks, uniTasks, projects]);
    const getTaskSource = (taskId) => {
        const t = tasks.find(t => t.id === taskId);
        if (t)
            return t.area_id === 'idiomas' || t.source === 'idiomas' ? 'idiomas' : t.source || 'general';
        if (entreTasks.some(t => t.id === taskId))
            return 'entrepreneurship';
        if (uniTasks.some(t => t.id === taskId))
            return 'university';
        if (projects.some(p => p.tasks.some(t => t.id === taskId)))
            return 'project';
        return 'general';
    };
    const savePlan = async () => {
        setSaving(true);
        try {
            const assignments = { ...blockAssignments };
            const assignedIds = new Set(Object.values(assignments).flat());
            const unassignedInPlan = [...selectedTasks].filter(id => !assignedIds.has(id));
            if (unassignedInPlan.length > 0) {
                assignments["_unassigned"] = unassignedInPlan;
            }
            const existing = await supabase.from("daily_plans").select("id").eq("plan_date", tomorrowStr).maybeSingle();
            if (existing.data) {
                await supabase.from("daily_plans").update({
                    routine_type: routineType,
                    block_assignments: JSON.parse(JSON.stringify(assignments)),
                    notes: JSON.stringify({ systemIntensity, language: languageChoice, instrument: musicInstrument }),
                }).eq("id", existing.data.id);
            }
            else {
                await supabase.from("daily_plans").insert({
                    plan_date: tomorrowStr,
                    mode: routineType,
                    routine_type: routineType,
                    block_assignments: JSON.parse(JSON.stringify(assignments)),
                    notes: JSON.stringify({ systemIntensity, language: languageChoice, instrument: musicInstrument }),
                });
            }
            localStorage.setItem(`planManana_tasks_${tomorrowStr}`, JSON.stringify({
                selectedTasks: [...selectedTasks],
                blockAssignments: assignments,
                routineType,
            }));
            localStorage.setItem("planManana_intensity", JSON.stringify(systemIntensity));
            localStorage.setItem("planManana_language", languageChoice);
            localStorage.setItem("planManana_instrument", musicInstrument);
            toast.success("Plan para mañana guardado");
        }
        catch {
            toast.error("Error al guardar");
        }
        setSaving(false);
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24 flex items-center justify-center", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-8 w-48 bg-muted rounded" }), _jsx("div", { className: "h-64 w-full bg-muted rounded" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-4xl mx-auto space-y-5", children: [_jsx(DateSwitchTabs, { mode: mode, onModeChange: setMode }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Planificar Ma\u00F1ana" }), _jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5", children: [_jsx(Clock, { className: "h-3.5 w-3.5" }), " ", tomorrowCapitalized] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "h-8 rounded-full gap-1.5", onClick: () => { resetCreateForm(); setIsCreateOpen(true); }, children: [_jsx(PlusCircle, { className: "h-3.5 w-3.5" }), " Nueva"] }), _jsxs(Button, { onClick: savePlan, disabled: saving, size: "sm", className: "h-8 rounded-full gap-1.5", children: [_jsx(Save, { className: "h-3.5 w-3.5" }), " ", saving ? "Guardando..." : "Guardar Plan"] })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }), _jsxs(CardContent, { className: "p-3.5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-indigo-500" }), _jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Rutina" })] }), _jsx("div", { className: "flex gap-1.5", children: ROUTINES.map(r => (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border", routineType === r.type
                                                ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                                                : "bg-white/50 dark:bg-zinc-950/50 border-border/60 hover:border-indigo-300 text-muted-foreground hover:text-foreground"), children: [_jsx("span", { className: "text-sm", children: r.icon }), _jsx("span", { children: r.label }), _jsxs("span", { className: "text-[9px] opacity-60", children: [r.wakeTime, "-", r.sleepTime] })] }, r.type))) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-4 w-4 text-primary" }), " Tareas del d\u00EDa"] }), AREAS.map(area => {
                                        const Icon = area.icon;
                                        if (area.id === "proyectos") {
                                            return (_jsx(Card, { className: "border border-border/50 shadow-sm rounded-xl overflow-hidden", children: _jsxs("div", { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("w-6 h-6 rounded-lg flex items-center justify-center", area.color), children: _jsx(Icon, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-xs font-semibold", children: area.label })] }), _jsxs(Select, { value: selectedProject, onValueChange: setSelectedProject, children: [_jsx(SelectTrigger, { className: "h-8 text-xs", children: _jsx(SelectValue, { placeholder: "Seleccionar proyecto..." }) }), _jsx(SelectContent, { children: projects.map(p => (_jsx(SelectItem, { value: p.id, className: "text-xs", children: p.name }, p.id))) })] }), selectedProject && (_jsx("div", { className: "space-y-1 mt-1 max-h-40 overflow-y-auto", children: (() => {
                                                                const proj = projects.find(p => p.id === selectedProject);
                                                                return proj?.tasks.length ? proj.tasks.map((pt) => (_jsxs("label", { className: "flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs", children: [_jsx(Checkbox, { checked: selectedTasks.has(pt.id), onCheckedChange: () => toggleTask(pt.id) }), _jsx("span", { className: cn("flex-1", pt.completed && "line-through text-muted-foreground"), children: pt.title }), _jsx(Badge, { variant: "outline", className: "text-[9px] px-1.5 py-0", children: "Proyecto" })] }, pt.id))) : _jsx("p", { className: "text-xs text-muted-foreground py-2 text-center", children: "Sin tareas pendientes" });
                                                            })() }))] }) }, area.id));
                                        }
                                        const areaTasks = getAreaTasks(area.id);
                                        if (areaTasks.length === 0 && area.id !== "emprendimiento")
                                            return null;
                                        return (_jsx(Collapsible, { open: !areaCollapsed[area.id], onOpenChange: o => setAreaCollapsed(p => ({ ...p, [area.id]: !o })), children: _jsxs(Card, { className: "border border-border/50 shadow-sm rounded-xl overflow-hidden", children: [_jsxs(CollapsibleTrigger, { className: "w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("w-6 h-6 rounded-lg flex items-center justify-center", area.color), children: _jsx(Icon, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-xs font-semibold", children: area.label }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: areaTasks.length })] }), areaCollapsed[area.id] ? _jsx(ChevronRight, { className: "h-3.5 w-3.5" }) : _jsx(ChevronDown, { className: "h-3.5 w-3.5" })] }), _jsx(CollapsibleContent, { children: _jsx("div", { className: "px-3 pb-3 space-y-1 max-h-48 overflow-y-auto", children: areaTasks.map(t => (_jsxs("label", { className: "flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs", children: [_jsx(Checkbox, { checked: selectedTasks.has(t.id), onCheckedChange: () => toggleTask(t.id) }), _jsx("span", { className: "flex-1", children: t.title })] }, t.id))) }) })] }) }, area.id));
                                    }), entreTasks.length > 0 && (_jsx(Collapsible, { children: _jsxs(Card, { className: "border border-border/50 shadow-sm rounded-xl overflow-hidden", children: [_jsxs(CollapsibleTrigger, { className: "w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-500", children: _jsx(Briefcase, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-xs font-semibold", children: "Emprendimiento" }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: entreTasks.length })] }), _jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" })] }), _jsx(CollapsibleContent, { children: _jsx("div", { className: "px-3 pb-3 space-y-1 max-h-48 overflow-y-auto", children: entreTasks.map(t => (_jsxs("label", { className: "flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs", children: [_jsx(Checkbox, { checked: selectedTasks.has(t.id), onCheckedChange: () => toggleTask(t.id) }), _jsx("span", { className: "flex-1", children: t.title })] }, t.id))) }) })] }) })), uniTasks.length > 0 && (_jsx(Collapsible, { children: _jsxs(Card, { className: "border border-border/50 shadow-sm rounded-xl overflow-hidden", children: [_jsxs(CollapsibleTrigger, { className: "w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-500", children: _jsx(GraduationCap, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-xs font-semibold", children: "Universidad" }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: uniTasks.length })] }), _jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" })] }), _jsx(CollapsibleContent, { children: _jsx("div", { className: "px-3 pb-3 space-y-1 max-h-48 overflow-y-auto", children: uniTasks.map(t => (_jsxs("label", { className: "flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs", children: [_jsx(Checkbox, { checked: selectedTasks.has(t.id), onCheckedChange: () => toggleTask(t.id) }), _jsx("span", { className: "flex-1", children: t.title })] }, t.id))) }) })] }) }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx(DailyTimelinePlanner, { blocks: blocks, tasksByBlock: tasksByBlockForPlanner, onToggleBlock: () => { }, isBlockCompleted: () => false, onDropTask: (taskId, blockId) => assignTaskToBlock(taskId, blockId), onRemoveTask: handleRemoveTask, onUpdateFocus: (blockId, focus) => updateBlockFocus(blockId, focus), musicInstrument: musicInstrument === "piano" ? "piano" : "guitar", languageChoice: languageChoice, isFutureView: true }), _jsxs(Card, { className: "border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-500" }), _jsxs(CardContent, { className: "p-3", children: [_jsxs("h3", { className: "text-xs font-semibold flex items-center gap-2 mb-1", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-indigo-500" }), " Metas de minutos del d\u00EDa"] }), _jsx("p", { className: "text-[10px] text-muted-foreground mb-2", children: "Precargadas del mes/semana. Editarlas propaga hacia arriba." }), _jsx("div", { className: "space-y-1.5", children: ALL_HIERARCHY_AREAS.map(area => (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: AREA_LABELS[area] }), _jsx(MinutesGoalInput, { value: getDayGoalEffective(tomorrow, area), onApply: v => applyDayGoal(area, v), className: "h-6 w-20 text-[10px]" })] }, area))) }), _jsxs("p", { className: "text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-2", children: ["Total d\u00EDa: ", dayGoalSum, " min"] })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-pink-500 to-rose-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("h3", { className: "text-xs font-semibold flex items-center gap-2", children: [_jsx(Languages, { className: "h-4 w-4 text-pink-500" }), " Preferencias"] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-muted-foreground mb-1.5", children: "Idioma a repasar:" }), _jsx("div", { className: "flex gap-1.5", children: [
                                                                            { value: "italiano", label: "Italiano", flag: "🇮🇹" },
                                                                            { value: "ingles", label: "Inglés", flag: "🇬🇧" },
                                                                        ].map(lang => (_jsxs("button", { onClick: () => setLanguageChoice(lang.value), className: cn("px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all border", languageChoice === lang.value
                                                                                ? "bg-pink-500 text-white border-pink-500"
                                                                                : "bg-muted/50 border-border/60 text-muted-foreground hover:border-pink-300"), children: [lang.flag, " ", lang.label] }, lang.value))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-muted-foreground mb-1.5", children: "Instrumento musical:" }), _jsx("div", { className: "flex gap-1.5", children: [
                                                                            { value: "piano", label: "Piano", icon: "🎹" },
                                                                            { value: "guitarra", label: "Guitarra", icon: "🎸" },
                                                                        ].map(inst => (_jsxs("button", { onClick: () => setMusicInstrument(inst.value), className: cn("px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all border", musicInstrument === inst.value
                                                                                ? "bg-pink-500 text-white border-pink-500"
                                                                                : "bg-muted/50 border-border/60 text-muted-foreground hover:border-pink-300"), children: [inst.icon, " ", inst.label] }, inst.value))) })] })] })] })] }), selectedPoolTasks.length > 0 && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }), _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-xs font-semibold flex items-center gap-1.5", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-indigo-500" }), "Tareas seleccionadas"] }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: selectedPoolTasks.length })] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "Arr\u00E1stralas a los bloques de la rutina para asignarlas" }), _jsx("div", { className: "space-y-1.5 max-h-64 overflow-y-auto", children: POOL_SOURCE_ORDER.map(source => {
                                                            const sectionTasks = selectedPoolTasks.filter(t => t.source === source);
                                                            if (sectionTasks.length === 0)
                                                                return null;
                                                            const cfg = POOL_SOURCE_CONFIG[source] || POOL_SOURCE_CONFIG.general;
                                                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1 px-1 py-0.5", children: [_jsx("span", { className: cfg.color.split(' ')[0] + ' ' + cfg.color.split(' ')[1] + ' p-0.5 rounded', children: cfg.icon }), _jsx("span", { className: "text-[9px] font-semibold uppercase tracking-wider text-muted-foreground", children: cfg.label }), _jsx(Badge, { variant: "outline", className: "text-[7px] px-1 py-0 h-3 ml-auto", children: sectionTasks.length })] }), _jsx("div", { className: "space-y-0.5", children: sectionTasks.map(task => (_jsxs("div", { draggable: true, onDragStart: (e) => handlePoolDragStart(e, task.id), className: "flex items-center gap-1.5 p-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50 group bg-background/40", children: [_jsx(GripVertical, { className: "h-3 w-3 text-muted-foreground/40 shrink-0" }), _jsx("span", { className: "text-[11px] flex-1 truncate", children: task.title }), _jsx("button", { onClick: () => { setSelectedTasks(prev => { const n = new Set(prev); n.delete(task.id); return n; }); }, className: "h-4 w-4 p-0 flex items-center justify-center shrink-0 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all", children: _jsx("span", { className: "text-[9px] text-muted-foreground hover:text-destructive", children: "\u2715" }) })] }, task.id))) })] }, source));
                                                        }) })] })] }))] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-amber-500 to-orange-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("h2", { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Brain, { className: "h-4 w-4 text-amber-500" }), " Sistemas Acumulativos", _jsx("span", { className: "text-[9px] text-muted-foreground font-normal", children: "\u2014 define la intensidad para ma\u00F1ana" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: SYSTEM_HABITS.map(sys => {
                                            const Icon = sys.icon;
                                            const level = systemIntensity[sys.id] || "normal";
                                            const multiplier = INTENSITY_MULTIPLIER[level];
                                            const estimatedMin = Math.round(sys.baseMin * multiplier);
                                            return (_jsxs("div", { className: "flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center", children: _jsx(Icon, { className: "h-3.5 w-3.5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium", children: sys.name }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: ["~", estimatedMin, " min"] })] })] }), _jsx("div", { className: "flex gap-1", children: ["minimo", "maximo", "extra"].map(opt => (_jsx("button", { onClick: () => setSystemIntensity(p => ({ ...p, [sys.id]: opt })), className: cn("px-2 py-1 rounded-lg text-[9px] font-medium transition-all border", level === opt
                                                                ? opt === "minimo" ? "bg-blue-500 text-white border-blue-500"
                                                                    : opt === "maximo" ? "bg-green-500 text-white border-green-500"
                                                                        : "bg-amber-500 text-white border-amber-500"
                                                                : "bg-transparent border-border/50 text-muted-foreground hover:border-foreground/30"), children: opt === "minimo" ? "Mín" : opt === "maximo" ? "Máx" : "Extra" }, opt))) })] }, sys.id));
                                        }) })] })] })] }), _jsx(Dialog, { open: isCreateOpen, onOpenChange: o => { if (!o) {
                    resetCreateForm();
                } setIsCreateOpen(o); }, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nueva Tarea" }), _jsx(DialogDescription, { children: "Crea una tarea para planificar ma\u00F1ana." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "T\u00EDtulo" }), _jsx(Input, { value: newTitle, onChange: e => setNewTitle(e.target.value), placeholder: "\u00BFQu\u00E9 necesitas hacer?", onKeyDown: e => e.key === 'Enter' && handleCreateTask(), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Descripci\u00F3n" }), _jsx(Textarea, { value: newDescription, onChange: e => setNewDescription(e.target.value), placeholder: "Detalles adicionales...", className: "mt-1 resize-none", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Prioridad" }), _jsxs(Select, { value: newPriority, onValueChange: (v) => setNewPriority(v), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "\uD83D\uDFE2 Baja" }), _jsx(SelectItem, { value: "medium", children: "\uD83D\uDFE1 Media" }), _jsx(SelectItem, { value: "high", children: "\uD83D\uDD34 Alta" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Fecha l\u00EDmite" }), _jsx(Input, { type: "date", value: newDueDate, onChange: e => setNewDueDate(e.target.value), className: "mt-1" })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "\u00C1rea" }), _jsxs(Select, { value: newAreaId, onValueChange: setNewAreaId, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Seleccionar" }) }), _jsx(SelectContent, { children: allAreas.map(area => (_jsx(SelectItem, { value: area.id, children: area.name }, area.id))) })] })] }), _jsx(DialogFooter, { children: _jsxs(Button, { onClick: handleCreateTask, disabled: creating || !newTitle.trim(), className: "w-full", children: [creating ? _jsx(Loader2, { className: "h-4 w-4 animate-spin mr-1" }) : null, "Crear Tarea"] }) })] })] }) })] }));
}
