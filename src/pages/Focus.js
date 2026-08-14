import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useRoutineBlocks, formatTimeDisplay } from "@/hooks/useRoutineBlocks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useDailyAreaStats } from "@/hooks/useDailyAreaStats";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, Target, Clock, CheckCircle2, Brain, Coffee, BarChart3, GraduationCap, Briefcase, Code, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useLocation } from "react-router-dom";
const FOCUS_AREAS = [
    { id: "universidad", name: "Universidad", icon: GraduationCap },
    { id: "emprendimiento", name: "Emprendimiento", icon: Briefcase },
    { id: "proyectos", name: "Proyectos", icon: Code },
    { id: "idiomas", name: "Idiomas", icon: Brain },
];
const POMODORO_OPTIONS = [
    { label: "25 min", value: 25 },
    { label: "30 min", value: 30 },
    { label: "50 min", value: 50 },
    { label: "80 min", value: 80 },
];
const BREAK_TIME = 10;
const TASKS_CACHE_KEY = 'focus_tasks_cache';
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};
export default function Focus() {
    const { isLoaded, getCurrentBlock } = useRoutineBlocks();
    const { startSession, endSession, getTodayStats, getWeekStats } = useFocusSessions();
    const { stats: areaStats, addTime, updateTimeGoal, getProgress, refresh: refreshAreaStats } = useDailyAreaStats();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const todayStats = getTodayStats();
    const weeklyStats = getWeekStats();
    const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
    const [isBreak, setIsBreak] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [focusedTask, setFocusedTask] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [showTaskPicker, setShowTaskPicker] = useState(true);
    const [deepWorkBlock, setDeepWorkBlock] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [editingGoalArea, setEditingGoalArea] = useState(null);
    const [editingGoalValue, setEditingGoalValue] = useState("");
    const startTimeRef = useRef(0);
    const selectedAreaRef = useRef(null);
    const categorizeTask = useCallback((t) => {
        if (t.area_id === "universidad" || t.source === "university")
            return "universidad";
        if (t.area_id === "emprendimiento" || t.source === "entrepreneurship")
            return "emprendimiento";
        if (t.area_id === "proyectos" || t.source === "projects")
            return "proyectos";
        if (t.area_id === "idiomas")
            return "idiomas";
        return null;
    }, []);
    const filteredTasks = selectedArea
        ? availableTasks.filter(t => categorizeTask(t) === selectedArea)
        : availableTasks;
    // Load tasks
    useEffect(() => {
        (async () => {
            const [tr, etr] = await Promise.all([
                supabase.from("tasks").select("id,title,priority,source,area_id,routine_block_id").eq("completed", false).order("priority", { ascending: false }).then((r) => r).catch(() => null),
                supabase.from("entrepreneurship_tasks").select("id,title,routine_block_id").eq("completed", false).then((r) => r).catch(() => null),
            ]);
            let tasks = [];
            if (tr?.data || etr?.data) {
                tasks = [
                    ...((tr?.data || []).map((t) => ({ ...t, source: t.source || "general", routine_block_id: t.routine_block_id || undefined }))),
                    ...((etr?.data || []).map((t) => ({ id: t.id, title: t.title, source: "entrepreneurship", routine_block_id: t.routine_block_id || undefined }))),
                ];
                try {
                    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
                }
                catch { }
            }
            else {
                const cached = localStorage.getItem(TASKS_CACHE_KEY);
                if (cached) {
                    try {
                        tasks = JSON.parse(cached);
                    }
                    catch { }
                }
            }
            setAvailableTasks(tasks);
            const incomingTaskId = searchParams.get("taskId") || location.state?.taskId;
            const incomingTitle = searchParams.get("title") || location.state?.taskTitle;
            if (incomingTaskId && tasks.find(t => t.id === incomingTaskId)) {
                setSelectedTaskId(incomingTaskId);
                setSelectedTaskIds([incomingTaskId]);
                setShowTaskPicker(false);
            }
            else if (incomingTitle) {
                setTaskTitle(incomingTitle);
                setShowTaskPicker(false);
            }
        })();
    }, []);
    // Detect deep work block from routine
    useEffect(() => {
        if (!isLoaded)
            return;
        const check = () => {
            const block = getCurrentBlock();
            if (block && (block.isFocusBlock || block.title?.toLowerCase().includes("deep") || block.title?.toLowerCase().includes("focus") || block.title?.toLowerCase().includes("trabajo profundo"))) {
                setDeepWorkBlock({ title: block.title, time: `${formatTimeDisplay(block.startTime)} – ${formatTimeDisplay(block.endTime)}` });
            }
            else {
                setDeepWorkBlock(null);
            }
        };
        check();
        const iv = setInterval(check, 30000);
        return () => clearInterval(iv);
    }, [isLoaded, getCurrentBlock]);
    // Timer interval
    useEffect(() => {
        if (!isRunning)
            return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning]);
    // Auto-stop when timer hits 0
    useEffect(() => {
        if (timeRemaining > 0 || !isRunning)
            return;
        setIsRunning(false);
        const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
        if (elapsed < 1) {
            toast.error("Sesión demasiado corta (< 1 min) — no se guardó");
            setActiveSessionId(null);
            return;
        }
        const aId = selectedAreaRef.current;
        if (activeSessionId) {
            endSession(activeSessionId, !isBreak).catch(() => { });
            setActiveSessionId(null);
        }
        if (aId)
            addTime(aId, Math.round(elapsed));
        if (!isBreak) {
            toast.success("¡Tiempo completado! Tómate un descanso ☕");
            setIsBreak(true);
            setTimeRemaining(BREAK_TIME * 60);
        }
        else {
            toast.success("¡Descanso terminado! Listo para el siguiente 🚀");
            setIsBreak(false);
            setTimeRemaining(pomodoroMinutes * 60);
        }
    }, [timeRemaining]);
    const selectPomodoro = (minutes) => {
        if (isRunning)
            return;
        setPomodoroMinutes(minutes);
        if (!isBreak)
            setTimeRemaining(minutes * 60);
    };
    const selectArea = (areaId) => {
        if (isRunning)
            return;
        setSelectedArea(areaId === selectedArea ? null : areaId);
        setSelectedTaskIds([]);
        setSelectedTaskId("");
        setTaskTitle("");
    };
    const toggleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    };
    const handleStart = async () => {
        let title = taskTitle;
        let taskId;
        if (selectedTaskIds.length > 0) {
            const firstTask = availableTasks.find(x => x.id === selectedTaskIds[0]);
            if (firstTask) {
                title = firstTask.title;
                taskId = firstTask.id;
            }
        }
        else if (selectedTaskId) {
            const t = availableTasks.find(x => x.id === selectedTaskId);
            if (t) {
                title = t.title;
                taskId = t.id;
            }
        }
        if (!title.trim()) {
            toast.error("Selecciona o escribe una tarea");
            return;
        }
        setFocusedTask({ id: taskId, title });
        setShowTaskPicker(false);
        startTimeRef.current = Date.now();
        selectedAreaRef.current = selectedArea;
        const session = await startSession(title, taskId, selectedArea || undefined, undefined, selectedTaskIds.length > 0 ? selectedTaskIds : undefined);
        if (session) {
            setActiveSessionId(session.id);
        }
        setIsRunning(true);
        toast.success(`Enfocado en: ${title}${selectedArea ? ` · ${selectedArea}` : ""}`);
    };
    const handlePause = async () => {
        setIsRunning(false);
        const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
        const aId = selectedAreaRef.current;
        if (elapsed < 1 && activeSessionId) {
            endSession(activeSessionId, false).catch(() => { });
            setActiveSessionId(null);
            toast.error("Sesión demasiado corta (< 1 min) — no se guardó");
            return;
        }
        if (activeSessionId) {
            await endSession(activeSessionId, false).catch(() => { });
            setActiveSessionId(null);
        }
        if (aId && elapsed >= 1)
            addTime(aId, Math.round(elapsed));
    };
    const handleReset = () => {
        if (activeSessionId) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
            const aId = selectedAreaRef.current;
            if (elapsed >= 1) {
                endSession(activeSessionId, false).catch(() => { });
                if (aId)
                    addTime(aId, Math.round(elapsed));
            }
            setActiveSessionId(null);
        }
        setIsRunning(false);
        setIsBreak(false);
        setTimeRemaining(pomodoroMinutes * 60);
        setFocusedTask(null);
        setShowTaskPicker(true);
    };
    const handleGoalEdit = (areaId) => {
        const current = areaStats[areaId]?.time_goal_minutes || 60;
        setEditingGoalValue(String(current));
        setEditingGoalArea(areaId);
    };
    const handleGoalSave = async (areaId) => {
        const val = parseInt(editingGoalValue);
        if (isNaN(val) || val < 1) {
            toast.error("Meta inválida");
            return;
        }
        await updateTimeGoal(areaId, val);
        setEditingGoalArea(null);
    };
    const progressPct = pomodoroMinutes > 0 ? ((pomodoroMinutes * 60 - (isBreak ? BREAK_TIME * 60 - timeRemaining : timeRemaining)) / (pomodoroMinutes * 60)) * 100 : 0;
    const displayProgress = isBreak ? ((BREAK_TIME * 60 - timeRemaining) / (BREAK_TIME * 60)) * 100 : ((pomodoroMinutes * 60 - timeRemaining) / (pomodoroMinutes * 60)) * 100;
    if (!isLoaded) {
        return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-6", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center gap-3", children: [_jsx("div", { className: "h-16 w-16 rounded-full bg-muted" }), _jsx("div", { className: "h-4 w-32 bg-muted rounded" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.05)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-lg mx-auto space-y-4", children: [_jsxs("div", { className: "text-center space-y-1", children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Focus" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Temporizador Pomodoro" })] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: FOCUS_AREAS.map(area => {
                        const stat = areaStats[area.id];
                        const spent = stat?.time_spent_minutes || 0;
                        const goal = stat?.time_goal_minutes || 60;
                        const pct = Math.min(100, Math.round((spent / goal) * 100));
                        const isSelected = selectedArea === area.id;
                        const Icon = area.icon;
                        return (_jsxs(Card, { onClick: () => selectArea(area.id), className: `relative cursor-pointer transition-all p-3 border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg rounded-2xl hover:shadow-xl ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${isRunning ? "opacity-70 cursor-not-allowed" : ""}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `p-1.5 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`, children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsx("span", { className: "text-sm font-semibold", children: area.name })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("span", { className: "text-[10px] font-mono tabular-nums text-muted-foreground", children: [spent, "m"] }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "/" }), editingGoalArea === area.id ? (_jsx("div", { className: "flex items-center gap-1", onClick: e => e.stopPropagation(), children: _jsx(Input, { value: editingGoalValue, onChange: e => setEditingGoalValue(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                                            handleGoalSave(area.id); if (e.key === "Escape")
                                                            setEditingGoalArea(null); }, onBlur: () => handleGoalSave(area.id), className: "h-5 w-12 text-[10px] px-1 py-0", autoFocus: true }) })) : (_jsxs("button", { onClick: e => { e.stopPropagation(); handleGoalEdit(area.id); }, className: "group flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground", children: [_jsxs("span", { children: [goal, "m"] }), _jsx(Pencil, { className: "h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" })] }))] })] }), _jsx(Progress, { value: pct, className: "h-1.5" }), _jsxs("span", { className: "text-[9px] text-muted-foreground mt-1 block", children: [pct, "%"] })] }, area.id));
                    }) }), deepWorkBlock && (_jsx(Card, { className: "border-primary/20 bg-primary/5 py-2 px-3", children: _jsxs("div", { className: "flex items-center gap-2 text-[11px]", children: [_jsx(Brain, { className: "h-3.5 w-3.5 text-primary shrink-0" }), _jsx("span", { className: "text-muted-foreground", children: "Coincide con tu rutina:" }), _jsx("span", { className: "font-semibold", children: deepWorkBlock.title }), _jsx(Badge, { variant: "outline", className: "text-[9px] h-4 ml-auto", children: deepWorkBlock.time })] }) })), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl" }), _jsx(Card, { className: "relative border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden", children: _jsxs("div", { className: "p-8 flex flex-col items-center gap-6", children: [_jsxs("div", { className: "flex gap-1.5 bg-muted/50 p-1 rounded-xl w-full", children: [POMODORO_OPTIONS.map(opt => (_jsx("button", { onClick: () => selectPomodoro(opt.value), disabled: isRunning, className: `flex-1 py-2 text-xs font-medium rounded-lg transition-all ${pomodoroMinutes === opt.value && !isBreak
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"} ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`, children: opt.label }, opt.value))), _jsxs("button", { onClick: () => { if (!isRunning) {
                                                    setIsBreak(true);
                                                    setTimeRemaining(BREAK_TIME * 60);
                                                } }, disabled: isRunning, className: `flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${isBreak ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"} ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`, children: [_jsx(Coffee, { className: "h-3 w-3" }), " ", BREAK_TIME, " min"] })] }), _jsxs("div", { className: "relative w-56 h-56 md:w-64 md:h-64", children: [_jsxs("svg", { className: "w-full h-full -rotate-90", viewBox: "0 0 100 100", children: [_jsx("circle", { cx: "50", cy: "50", r: "44", fill: "none", stroke: "hsl(var(--muted))", strokeWidth: "6" }), _jsx("circle", { cx: "50", cy: "50", r: "44", fill: "none", stroke: isBreak ? "hsl(38, 92%, 50%)" : "hsl(var(--primary))", strokeWidth: "6", strokeLinecap: "round", strokeDasharray: `${2 * Math.PI * 44}`, strokeDashoffset: `${2 * Math.PI * 44 * (1 - Math.min(displayProgress / 100, 1))}`, className: "transition-all duration-700 ease-linear" })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tight", children: formatTime(timeRemaining) }), _jsx("span", { className: "text-[10px] text-muted-foreground mt-1 uppercase tracking-widest", children: isBreak ? "Descanso" : "Trabajo enfocado" }), selectedArea && (_jsx("span", { className: "text-[9px] text-muted-foreground/60", children: FOCUS_AREAS.find(a => a.id === selectedArea)?.name }))] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [!isRunning ? (_jsxs(Button, { onClick: handleStart, size: "lg", disabled: !focusedTask && !taskTitle && selectedTaskIds.length === 0 && !selectedTaskId, className: "w-28 h-12 rounded-full text-sm gap-2 shadow-lg shadow-primary/20", children: [_jsx(Play, { className: "w-4 h-4 fill-current" }), " Iniciar"] })) : (_jsxs(Button, { onClick: handlePause, size: "lg", variant: "outline", className: "w-28 h-12 rounded-full text-sm gap-2 border-2", children: [_jsx(Pause, { className: "w-4 h-4" }), " Pausar"] })), _jsx(Button, { onClick: handleReset, variant: "ghost", size: "icon", className: "h-12 w-12 rounded-full text-muted-foreground hover:text-foreground", children: _jsx(RotateCcw, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex items-center gap-4 text-[11px] text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), " Hoy: ", todayStats.totalMinutes, " min"] }), _jsx("span", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(BarChart3, { className: "w-3 h-3" }), " Semana: ", weeklyStats.totalHours, "h"] }), _jsx("span", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), " ", weeklyStats.sessionsCount, " sesiones"] })] })] }) })] }), showTaskPicker ? (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-lg rounded-2xl p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wider", children: selectedArea ? `Tareas de ${FOCUS_AREAS.find(a => a.id === selectedArea)?.name}` : "¿En qué te enfocas?" }), selectedArea && (_jsxs(Badge, { variant: "outline", className: "text-[9px] h-5", children: [filteredTasks.length, " tareas"] }))] }), filteredTasks.length > 0 && (_jsx("div", { className: "max-h-48 overflow-y-auto space-y-1 -mx-1", children: filteredTasks.map(t => (_jsxs("label", { className: `flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedTaskIds.includes(t.id) ? "bg-primary/5" : ""}`, children: [_jsx(Checkbox, { checked: selectedTaskIds.includes(t.id), onCheckedChange: () => toggleTaskSelection(t.id) }), _jsx("span", { className: "text-xs flex-1 min-w-0 truncate", children: t.title }), t.priority === "high" && (_jsx(Badge, { variant: "destructive", className: "text-[8px] h-4 px-1 shrink-0", children: "Alta" }))] }, t.id))) })), !selectedArea && filteredTasks.length > 0 && (_jsxs(Select, { value: selectedTaskId || "none", onValueChange: v => { setSelectedTaskId(v === "none" ? "" : v); setTaskTitle(""); }, children: [_jsx(SelectTrigger, { className: "h-9 text-xs", children: _jsx(SelectValue, { placeholder: "Seleccionar tarea..." }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Escribir manualmente" }), filteredTasks.map(t => (_jsx(SelectItem, { value: t.id, className: "text-xs", children: t.title }, t.id)))] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "O escribe una tarea...", value: taskTitle, onChange: e => { setTaskTitle(e.target.value); setSelectedTaskId(""); }, onKeyDown: e => e.key === "Enter" && handleStart(), className: "h-9 text-xs flex-1" }), _jsxs(Button, { onClick: handleStart, size: "sm", disabled: !taskTitle && selectedTaskIds.length === 0 && !selectedTaskId, className: "h-9", children: [_jsx(Target, { className: "w-3.5 h-3.5 mr-1" }), " Enfocar"] })] })] })) : focusedTask && (_jsx(Card, { className: "border-0 bg-primary/10 backdrop-blur-xl shadow-lg rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-full bg-primary/20", children: _jsx(Target, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Enfocado en" }), _jsx("p", { className: "text-sm font-medium truncate", children: focusedTask.title }), selectedAreaRef.current && (_jsx("p", { className: "text-[10px] text-muted-foreground/60", children: selectedAreaRef.current }))] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-[10px]", onClick: handleReset, children: "Cambiar" })] }) }))] }) }));
}
