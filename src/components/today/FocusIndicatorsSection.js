import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, GraduationCap, Briefcase, Code2, Clock, Target, Shield, ListChecks, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCombinedFocusTime } from "@/hooks/useCombinedFocusTime";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { useActiveSelection } from "@/hooks/useActiveSelection";
import { useUniversity } from "@/hooks/useUniversity";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DailyTaskSelector } from "@/components/routine/DailyTaskSelector";
import { TodayTasksByCategory } from "@/components/today/TodayTasksByCategory";
import { isOnline } from "@/lib/isOnline";
import { getCached, setCache } from "@/lib/offlineCache";
function semaphore(progress) {
    if (progress >= 80)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
    if (progress >= 50)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
    if (progress > 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
    return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin empezar" };
}
export function FocusIndicatorsSection() {
    const navigate = useNavigate();
    const { areas, loading, setManualTime } = useCombinedFocusTime();
    const { data: systemsData, loading: systemsLoading } = useSystemsTracking();
    const { subjects } = useUniversity();
    const { value: activeSubjectId } = useActiveSelection("activeSubjectId");
    const { value: activeEntId } = useActiveSelection("activeEntrepreneurshipId");
    const { value: activeProjectId } = useActiveSelection("selectedProjectId");
    const [entInfo, setEntInfo] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);
    const [generalTasks, setGeneralTasks] = useState({ done: 0, total: 0 });
    const DAILY_PLAN_KEY = "dailyPlanTasks";
    const [dailyTasks, setDailyTasks] = useState([]);
    const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
    const [planDate, setPlanDate] = useState("today");
    const getDateKey = (date) => {
        const d = date === "today" ? new Date() : new Date(Date.now() + 86400000);
        return `${DAILY_PLAN_KEY}_${d.toISOString().split('T')[0]}`;
    };
    useEffect(() => {
        const stored = localStorage.getItem(getDateKey(planDate));
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setDailyTasks(parsed.tasks || []);
                setCompletedTaskIds(new Set(parsed.completedIds || []));
            }
            catch {
                setDailyTasks([]);
                setCompletedTaskIds(new Set());
            }
        }
        else {
            setDailyTasks([]);
            setCompletedTaskIds(new Set());
        }
    }, [planDate]);
    useEffect(() => {
        if (dailyTasks.length > 0 || completedTaskIds.size > 0) {
            localStorage.setItem(getDateKey(planDate), JSON.stringify({
                tasks: dailyTasks,
                completedIds: Array.from(completedTaskIds),
            }));
            setCache("daily_plan", `checklist_${getDateKey(planDate)}`, { tasks: dailyTasks, completedIds: [...completedTaskIds] }, 300000);
        }
    }, [dailyTasks, completedTaskIds, planDate]);
    const handleTasksChange = (tasks) => {
        setDailyTasks(tasks);
    };
    const handleToggleComplete = (taskId) => {
        setCompletedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId))
                next.delete(taskId);
            else
                next.add(taskId);
            return next;
        });
    };
    const handleRemoveTask = (taskId) => {
        setDailyTasks(prev => prev.filter(t => t.id !== taskId));
        setCompletedTaskIds(prev => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
        });
    };
    useEffect(() => {
        if (!isOnline()) {
            getCached("daily_plan", `checklist_${getDateKey(planDate)}`)
                .then(cached => {
                if (cached) {
                    setDailyTasks(cached.tasks || []);
                    setCompletedTaskIds(new Set(cached.completedIds || []));
                }
            });
        }
    }, [planDate]);
    // Universidad — from active subject
    const activeSubject = subjects.find((s) => s.id === activeSubjectId) || null;
    const subjectInfo = activeSubject
        ? {
            name: activeSubject.name,
            done: activeSubject.tasks.filter((t) => t.completed).length,
            total: activeSubject.tasks.length,
            route: "/university",
        }
        : null;
    // Emprendimiento — fetch active from Supabase
    useEffect(() => {
        if (!activeEntId) {
            setEntInfo(null);
            return;
        }
        (async () => {
            const [{ data: ent }, { count: total }, { count: done }] = await Promise.all([
                supabase.from("entrepreneurships").select("name").eq("id", activeEntId).maybeSingle(),
                supabase.from("entrepreneurship_tasks").select("*", { count: "exact", head: true }).eq("entrepreneurship_id", activeEntId),
                supabase.from("entrepreneurship_tasks").select("*", { count: "exact", head: true }).eq("entrepreneurship_id", activeEntId).eq("completed", true),
            ]);
            if (ent)
                setEntInfo({ name: ent.name, done: done || 0, total: total || 0, route: `/entrepreneurship/${activeEntId}` });
            else
                setEntInfo(null);
        })();
    }, [activeEntId]);
    // Proyectos — from app_settings (Supabase) with localStorage fallback
    useEffect(() => {
        if (!activeProjectId) {
            setProjectInfo(null);
            return;
        }
        (async () => {
            try {
                const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
                let list = [];
                if (data?.setting_value && Array.isArray(data.setting_value)) {
                    list = data.setting_value;
                }
                else {
                    const stored = localStorage.getItem("userProjects");
                    if (stored)
                        list = JSON.parse(stored);
                }
                const p = list.find((x) => x.id === activeProjectId);
                if (!p) {
                    setProjectInfo(null);
                    return;
                }
                const total = p.tasks?.length || 0;
                const done = p.tasks?.filter((t) => t.completed).length || 0;
                setProjectInfo({ name: p.name, done, total, route: "/projects" });
            }
            catch {
                try {
                    const stored = localStorage.getItem("userProjects");
                    if (stored) {
                        const list = JSON.parse(stored);
                        const p = list.find((x) => x.id === activeProjectId);
                        if (!p) {
                            setProjectInfo(null);
                            return;
                        }
                        const total = p.tasks?.length || 0;
                        const done = p.tasks?.filter((t) => t.completed).length || 0;
                        setProjectInfo({ name: p.name, done, total, route: "/projects" });
                    }
                    else {
                        setProjectInfo(null);
                    }
                }
                catch {
                    setProjectInfo(null);
                }
            }
        })();
    }, [activeProjectId]);
    // Tareas Generales — from tasks table for today with source='general'
    useEffect(() => {
        (async () => {
            const today = new Date().toISOString().split("T")[0];
            const { data } = await supabase
                .from("tasks")
                .select("id, completed, source")
                .gte("due_date", `${today}T00:00:00`)
                .lte("due_date", `${today}T23:59:59`);
            const gen = (data || []).filter((t) => !t.source || t.source === "general");
            setGeneralTasks({ done: gen.filter((t) => t.completed).length, total: gen.length });
        })();
    }, []);
    if (loading || systemsLoading) {
        return (_jsx(Card, { className: "p-4", children: _jsx("div", { className: "flex items-center justify-center py-6", children: _jsx("div", { className: "animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" }) }) }));
    }
    const SOSTEN_IDS = [
        "rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion",
        "skincare-manana", "skincare-noche", "banarme-vestirme",
        "pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir",
    ];
    const sostenCount = SOSTEN_IDS.filter((id) => systemsData.completions[id]).length;
    const sostenTotal = SOSTEN_IDS.length;
    const sostenPct = Math.round((sostenCount / sostenTotal) * 100);
    const infoByArea = {
        universidad: subjectInfo,
        emprendimiento: entInfo,
        proyectos: projectInfo,
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4 text-primary" }), _jsx("h2", { className: "text-sm font-bold uppercase tracking-wide", children: "FOCUS \u00B7 HOY" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: areas.map((area) => {
                    const sem = semaphore(area.progress);
                    const Icon = area.id === "universidad" ? GraduationCap : area.id === "emprendimiento" ? Briefcase : Code2;
                    const colorMap = {
                        universidad: "text-purple-500 bg-purple-500/10 ring-purple-500/20",
                        emprendimiento: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
                        proyectos: "text-cyan-500 bg-cyan-500/10 ring-cyan-500/20",
                    };
                    const routeMap = {
                        universidad: "/university",
                        emprendimiento: "/entrepreneurship",
                        proyectos: "/projects",
                    };
                    const info = infoByArea[area.id];
                    const taskPct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;
                    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all", sem.ring, sem.bg, "flex flex-col gap-2"), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("p-1.5 rounded-lg", colorMap[area.id]), children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsx("span", { className: "font-semibold text-sm", children: area.name })] }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] }), _jsx("button", { type: "button", onClick: () => navigate(info?.route || routeMap[area.id]), className: "text-left rounded-md border border-border/50 bg-background/50 px-2 py-1.5 hover:bg-background transition-colors", children: info ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[11px] font-medium truncate", children: info.name }), _jsxs(Badge, { variant: "outline", className: "text-[9px] px-1 py-0 shrink-0", children: [info.done, "/", info.total] })] }), _jsx(Progress, { value: taskPct, className: "h-1 mt-1" })] })) : (_jsxs("span", { className: "text-[10px] text-muted-foreground", children: ["Selecciona una ", area.id === "universidad" ? "asignatura" : area.id === "emprendimiento" ? "iniciativa" : "proyecto", " activa"] })) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-3 w-3 text-muted-foreground shrink-0" }), _jsx("span", { className: "text-[11px] text-muted-foreground shrink-0", children: "Manual:" }), _jsx(Input, { type: "number", min: 0, value: area.manualMinutes || "", onChange: (e) => setManualTime(area.id, parseInt(e.target.value) || 0), placeholder: "min", className: "w-16 h-7 text-xs text-center" }), _jsx("span", { className: "text-[11px] text-muted-foreground", children: "min" })] }), _jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground", children: [_jsx(Target, { className: "h-3 w-3 text-primary" }), _jsxs("span", { children: ["Focus: ", _jsx("strong", { children: area.focusMinutes }), " min"] }), _jsx("span", { className: "mx-1", children: "\u00B7" }), _jsxs("span", { children: ["Total: ", _jsx("strong", { className: "text-foreground", children: area.totalMinutes }), " / ", area.goalMinutes, " min"] })] }), _jsx(Progress, { value: area.progress, className: "h-1.5" })] }, area.id));
                }) }), _jsxs(Card, { className: "p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors", onClick: () => navigate("/tasks"), children: [_jsx("div", { className: "p-1.5 rounded-lg bg-foreground/10 text-foreground", children: _jsx(ListChecks, { className: "h-4 w-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold", children: "Tareas Generales \u00B7 Hoy" }), _jsxs("span", { className: "text-[10px] text-muted-foreground flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "h-3 w-3" }), generalTasks.done, "/", generalTasks.total] })] }), _jsx(Progress, { value: generalTasks.total > 0 ? Math.round((generalTasks.done / generalTasks.total) * 100) : 0, className: "h-1 mt-1" })] })] }), _jsx(TodayTasksByCategory, {}), _jsx(Card, { className: "p-3 bg-muted/10", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Shield, { className: "h-3.5 w-3.5 text-blue-500" }), _jsx("span", { className: "text-[10px] font-semibold text-muted-foreground", children: "Sost\u00E9n" }), _jsxs("span", { className: cn("text-xs font-bold", sostenPct >= 70 ? "text-green-500" : sostenPct >= 40 ? "text-amber-500" : "text-red-500"), children: [sostenCount, "/", sostenTotal] })] }), _jsx(Progress, { value: sostenPct, className: "h-1.5 flex-1" }), _jsxs("span", { className: "text-[10px] text-muted-foreground tabular-nums", children: [sostenPct, "%"] })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }), "Plan del D\u00EDa"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: planDate === "today" ? "default" : "outline", size: "sm", onClick: () => setPlanDate("today"), children: "Hoy" }), _jsx(Button, { variant: planDate === "tomorrow" ? "default" : "outline", size: "sm", onClick: () => setPlanDate("tomorrow"), children: "Ma\u00F1ana" })] })] }), dailyTasks.length > 0 && (_jsxs("div", { className: "space-y-2 pt-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso" }), _jsxs("span", { className: "font-medium", children: [completedTaskIds.size, "/", dailyTasks.length] })] }), _jsx(Progress, { value: dailyTasks.length > 0 ? (completedTaskIds.size / dailyTasks.length) * 100 : 0, className: "h-2" })] }))] }), _jsxs(CardContent, { className: "space-y-3", children: [dailyTasks.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsxs("p", { className: "mb-4", children: ["No hay tareas planificadas para ", planDate === "today" ? "hoy" : "mañana"] }), _jsx(DailyTaskSelector, { selectedTasks: dailyTasks, onTasksChange: handleTasksChange })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "space-y-2", children: dailyTasks.map(task => (_jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg border transition-all", completedTaskIds.has(task.id)
                                                ? "bg-green-500/10 border-green-500/30"
                                                : "hover:bg-muted/50"), children: [_jsx("input", { type: "checkbox", checked: completedTaskIds.has(task.id), onChange: () => handleToggleComplete(task.id), className: "mt-1 h-4 w-4 rounded border-gray-300" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn("font-medium text-sm", completedTaskIds.has(task.id) && "line-through text-muted-foreground"), children: task.title }), task.sourceName && (_jsx(Badge, { variant: "outline", className: "mt-1 text-xs", children: task.sourceName }))] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: () => handleRemoveTask(task.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, task.id))) }), _jsx("div", { className: "pt-2", children: _jsx(DailyTaskSelector, { selectedTasks: dailyTasks, onTasksChange: handleTasksChange }) })] })), dailyTasks.length > 0 && completedTaskIds.size === dailyTasks.length && (_jsxs("div", { className: "text-center py-4 bg-green-500/10 rounded-lg border border-green-500/30", children: [_jsx(CheckCircle2, { className: "h-8 w-8 text-green-500 mx-auto mb-2" }), _jsx("p", { className: "font-medium text-green-600 dark:text-green-400", children: "\u00A1Todas las tareas completadas!" })] }))] })] })] }));
}
