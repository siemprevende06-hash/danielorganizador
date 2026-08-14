import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { Briefcase, FolderKanban, CheckSquare, Target, GraduationCap, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
const LABELS = {
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
    sprint: 'Sprint',
};
function useDateRange(timeframe) {
    const now = new Date();
    switch (timeframe) {
        case 'today':
            return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd'), daysBack: 0 };
        case 'week':
            return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), daysBack: 6 };
        case 'month':
            return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd'), daysBack: 29 };
        case 'quarter':
            return { start: format(startOfQuarter(now), 'yyyy-MM-dd'), end: format(endOfQuarter(now), 'yyyy-MM-dd'), daysBack: 89 };
        case 'year':
            return { start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'), daysBack: 364 };
        case 'sprint':
            return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd'), daysBack: 29 };
        default:
            return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd'), daysBack: 0 };
    }
}
function semaphore(value, min, max, hasData) {
    if (!hasData)
        return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin datos" };
    if (value >= max)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
    if (value >= min)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
    return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
}
function Sparkline({ data, color }) {
    const max = Math.max(1, ...data);
    return (_jsx("div", { className: "flex items-end gap-[1px] h-6 mt-1", children: data.map((v, i) => (_jsx("div", { className: "flex-1 rounded-sm", style: {
                height: `${Math.max(4, (v / max) * 100)}%`,
                backgroundColor: i === data.length - 1 ? color : `${color}40`,
            } }, i))) }));
}
export function QuickStatsGrid({ timeframe }) {
    const [university, setUniversity] = useState(null);
    const [entrepreneurship, setEntrepreneurship] = useState(null);
    const [projects, setProjects] = useState(null);
    const [general, setGeneral] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            const { start, end, daysBack } = useDateRange(timeframe);
            const today = format(new Date(), 'yyyy-MM-dd');
            const sparkStart = format(subDays(new Date(), daysBack || 6), 'yyyy-MM-dd');
            try {
                const [tasksR, entTasksR, uniTasksR, subjectsR, trackingR, weekTrackingR] = await Promise.all([
                    supabase.from("tasks").select("*"),
                    supabase.from("entrepreneurship_tasks").select("*"),
                    supabase.from("tasks").select("*").eq("source", "university"),
                    supabase.from("university_subjects").select("id,name").order("created_at"),
                    supabase.from("daily_systems_tracking").select("time_data").eq("tracking_date", today).maybeSingle(),
                    supabase.from("daily_systems_tracking").select("tracking_date,time_data")
                        .gte("tracking_date", sparkStart).lte("tracking_date", today).order("tracking_date", { ascending: true }),
                ]);
                const sparkByKey = (key) => {
                    const arr = [];
                    for (let i = (daysBack || 6); i >= 0; i--) {
                        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
                        const row = (weekTrackingR.data || []).find((r) => r.tracking_date === d);
                        arr.push(Number(row?.time_data?.[key]) || 0);
                    }
                    return arr;
                };
                // University
                const uniTasks = (uniTasksR.data || []).filter((t) => t.due_date >= start && t.due_date <= end);
                const subjList = subjectsR.data || [];
                setUniversity({
                    total: uniTasks.length,
                    completed: uniTasks.filter((t) => t.completed).length,
                    pct: uniTasks.length > 0 ? Math.round(uniTasks.filter((t) => t.completed).length / uniTasks.length * 100) : 0,
                    minutes: trackingR.data?.time_data?.universidad || 0,
                    label: subjList.length > 0 ? subjList[0].name : '—',
                    hasData: uniTasks.length > 0,
                    sparkData: sparkByKey("universidad"),
                });
                // Entrepreneurship
                const entTasks = (entTasksR.data || []).filter((t) => t.due_date >= start && t.due_date <= end);
                setEntrepreneurship({
                    total: entTasks.length,
                    completed: entTasks.filter((t) => t.completed).length,
                    pct: entTasks.length > 0 ? Math.round(entTasks.filter((t) => t.completed).length / entTasks.length * 100) : 0,
                    minutes: trackingR.data?.time_data?.emprendimiento || 0,
                    label: 'Emprendimiento',
                    hasData: entTasks.length > 0,
                    sparkData: sparkByKey("emprendimiento"),
                });
                // General tasks (non-uni, non-entrepreneurship, non-project)
                const generalTasks = (tasksR.data || []).filter((t) => {
                    if (t.source === "university" || t.source === "entrepreneurship" || t.source === "project")
                        return false;
                    if (t.area_id === "universidad" || t.area_id === "emprendimiento" || t.area_id === "proyectos")
                        return false;
                    return t.due_date >= start && t.due_date <= end;
                });
                setGeneral({
                    total: generalTasks.length,
                    completed: generalTasks.filter((t) => t.completed).length,
                    pct: generalTasks.length > 0 ? Math.round(generalTasks.filter((t) => t.completed).length / generalTasks.length * 100) : 0,
                    minutes: 0,
                    label: 'Generales',
                    hasData: generalTasks.length > 0,
                    sparkData: [],
                });
                // Projects
                loadProjects(setProjects);
            }
            catch {
                setDefaults(setUniversity, setEntrepreneurship, setProjects, setGeneral);
            }
            setLoading(false);
        })();
    }, [timeframe]);
    if (loading || !university || !entrepreneurship || !projects || !general) {
        return (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" }) }));
    }
    const uniSem = semaphore(university.minutes + university.completed, 30, 120, university.hasData);
    const entSem = semaphore(entrepreneurship.minutes + entrepreneurship.completed, 30, 120, entrepreneurship.hasData);
    const projSem = projects.hasData
        ? semaphore(projects.completed, 1, Math.max(1, projects.total), true)
        : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Inactivo" };
    const genSem = general.hasData
        ? semaphore(general.completed, 1, Math.max(1, general.total), true)
        : { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin tareas" };
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(CalendarDays, { className: "h-3.5 w-3.5 text-primary" }), _jsxs("span", { className: "text-[10px] font-bold uppercase tracking-wide text-muted-foreground", children: ["FOCUS \u00B7 ", LABELS[timeframe] || 'Hoy'] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs(Card, { className: cn("overflow-hidden ring-2 transition-all", uniSem.ring, uniSem.bg), children: [_jsxs(CardHeader, { className: "p-2 pb-0 flex flex-row items-center justify-between space-y-0", children: [_jsx(CardTitle, { className: "text-[10px] font-medium text-muted-foreground", children: "Universidad" }), _jsx(GraduationCap, { className: "h-3 w-3 text-muted-foreground" })] }), _jsxs(CardContent, { className: "p-2 space-y-1", children: [_jsx("p", { className: cn("text-xs font-semibold truncate", university.hasData ? "" : "text-muted-foreground"), children: university.label || '—' }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-lg font-bold", children: university.minutes }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "min" }), university.hasData && (_jsx("span", { className: cn("text-[8px] font-semibold ml-auto", uniSem.text), children: uniSem.label }))] }), _jsx("div", { className: "flex justify-between text-[9px] text-muted-foreground", children: _jsxs("span", { children: [university.completed, "/", university.total, " tareas"] }) }), university.total > 0 && _jsx(Progress, { value: university.pct, className: "h-1" }), university.sparkData.length > 0 && _jsx(Sparkline, { data: university.sparkData, color: "hsl(var(--primary))" })] })] }), _jsxs(Card, { className: cn("overflow-hidden ring-2 transition-all", entSem.ring, entSem.bg), children: [_jsxs(CardHeader, { className: "p-2 pb-0 flex flex-row items-center justify-between space-y-0", children: [_jsx(CardTitle, { className: "text-[10px] font-medium text-muted-foreground", children: "Emprendimiento" }), _jsx(Briefcase, { className: "h-3 w-3 text-muted-foreground" })] }), _jsxs(CardContent, { className: "p-2 space-y-1", children: [_jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-lg font-bold", children: entrepreneurship.minutes }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "min" }), entrepreneurship.hasData && (_jsx("span", { className: cn("text-[8px] font-semibold ml-auto", entSem.text), children: entSem.label }))] }), _jsx("div", { className: "flex justify-between text-[9px] text-muted-foreground", children: _jsxs("span", { children: [entrepreneurship.completed, "/", entrepreneurship.total, " tareas"] }) }), entrepreneurship.total > 0 && _jsx(Progress, { value: entrepreneurship.pct, className: "h-1" }), _jsxs("div", { className: "flex items-center gap-1 text-[9px] text-muted-foreground", children: [_jsx(Target, { className: "h-2.5 w-2.5" }), _jsx("span", { children: "Meta: 120 min/d\u00EDa" })] }), entrepreneurship.sparkData.length > 0 && _jsx(Sparkline, { data: entrepreneurship.sparkData, color: "hsl(var(--primary))" })] })] }), _jsxs(Card, { className: cn("overflow-hidden ring-2 transition-all", projSem.ring, projSem.bg), children: [_jsxs(CardHeader, { className: "p-2 pb-0 flex flex-row items-center justify-between space-y-0", children: [_jsx(CardTitle, { className: "text-[10px] font-medium text-muted-foreground", children: "Proyectos" }), _jsx(FolderKanban, { className: "h-3 w-3 text-muted-foreground" })] }), _jsx(CardContent, { className: "p-2 space-y-1", children: projects.hasData ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-lg font-bold", children: projects.total }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "tareas" }), _jsx("span", { className: cn("text-[8px] font-semibold ml-auto", projSem.text), children: projSem.label })] }), _jsx("div", { className: "flex justify-between text-[9px] text-muted-foreground", children: _jsxs("span", { children: [projects.completed, " completadas"] }) }), projects.total > 0 && _jsx(Progress, { value: projects.pct, className: "h-1" })] })) : (_jsxs("div", { className: "flex flex-col items-center py-2 text-muted-foreground", children: [_jsx(FolderKanban, { className: "h-5 w-5 mb-1 opacity-40" }), _jsx("p", { className: "text-[9px]", children: "Sin proyectos" })] })) })] }), _jsxs(Card, { className: cn("overflow-hidden ring-2 transition-all", genSem.ring, genSem.bg), children: [_jsxs(CardHeader, { className: "p-2 pb-0 flex flex-row items-center justify-between space-y-0", children: [_jsx(CardTitle, { className: "text-[10px] font-medium text-muted-foreground", children: "Tareas" }), _jsx(CheckSquare, { className: "h-3 w-3 text-muted-foreground" })] }), _jsx(CardContent, { className: "p-2 space-y-1", children: general.hasData ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-lg font-bold", children: general.total - general.completed }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "pendientes" }), _jsx("span", { className: cn("text-[8px] font-semibold ml-auto", genSem.text), children: genSem.label })] }), _jsx("div", { className: "flex justify-between text-[9px] text-muted-foreground", children: _jsxs("span", { children: [general.completed, "/", general.total, " completadas"] }) }), general.total > 0 && _jsx(Progress, { value: general.pct, className: "h-1" })] })) : (_jsxs("div", { className: "flex flex-col items-center py-2 text-muted-foreground", children: [_jsx(CheckSquare, { className: "h-5 w-5 mb-1 opacity-40" }), _jsx("p", { className: "text-[9px]", children: "Sin tareas" })] })) })] })] })] }));
}
function loadProjects(setProjects) {
    (async () => {
        try {
            const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
            let parsed = [];
            if (data?.setting_value && Array.isArray(data.setting_value)) {
                parsed = data.setting_value;
            }
            else {
                const stored = localStorage.getItem("userProjects");
                if (stored)
                    parsed = JSON.parse(stored);
            }
            const selectedId = localStorage.getItem("selectedProjectId");
            const selected = selectedId ? parsed.find((p) => p.id === selectedId) : parsed[0];
            const active = selected || null;
            const taskCompleted = active ? active.tasks.filter((t) => t.completed).length : 0;
            const taskTotal = active ? active.tasks.length : 0;
            setProjects({
                total: taskTotal,
                completed: taskCompleted,
                pct: taskTotal > 0 ? Math.round(taskCompleted / taskTotal * 100) : 0,
                minutes: 0,
                label: active?.name || '—',
                hasData: parsed.length > 0,
                sparkData: [],
            });
        }
        catch {
            try {
                const stored = localStorage.getItem("userProjects");
                const selectedId = localStorage.getItem("selectedProjectId");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const selected = selectedId ? parsed.find((p) => p.id === selectedId) : parsed[0];
                    const active = selected || null;
                    const taskCompleted = active ? active.tasks.filter((t) => t.completed).length : 0;
                    const taskTotal = active ? active.tasks.length : 0;
                    setProjects({
                        total: taskTotal,
                        completed: taskCompleted,
                        pct: taskTotal > 0 ? Math.round(taskCompleted / taskTotal * 100) : 0,
                        minutes: 0,
                        label: active?.name || '—',
                        hasData: parsed.length > 0,
                        sparkData: [],
                    });
                }
                else {
                    setDefaultsProjects(setProjects);
                }
            }
            catch {
                setDefaultsProjects(setProjects);
            }
        }
    })();
}
function setDefaultsProjects(setProjects) {
    setProjects({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
}
function setDefaults(setU, setE, setP, setG) {
    setU({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
    setE({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
    setP({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
    setG({ total: 0, completed: 0, pct: 0, minutes: 0, label: '', hasData: false, sparkData: [] });
}
