import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Briefcase, FolderKanban, ListTodo, Focus, Clock, Target, ArrowRight, Save, CalendarDays, X, Sun, Moon, Coffee, Book, Music, Dumbbell, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCombinedFocusTime } from "@/hooks/useCombinedFocusTime";
import { useActiveSelection } from "@/hooks/useActiveSelection";
import { useUniversity } from "@/hooks/useUniversity";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
const AREA_CARD_CONFIG = {
    universidad: { label: 'Universidad', icon: GraduationCap, gradient: "from-purple-600 to-purple-400", color: "text-purple-500", bg: "bg-purple-500/10", route: "/university" },
    emprendimiento: { label: 'Emprendimiento', icon: Briefcase, gradient: "from-amber-600 to-amber-400", color: "text-amber-500", bg: "bg-amber-500/10", route: "/entrepreneurship" },
    proyectos: { label: 'Proyectos', icon: FolderKanban, gradient: "from-cyan-600 to-cyan-400", color: "text-cyan-500", bg: "bg-cyan-500/10", route: "/projects" },
};
const progressSemaphore = (pct) => {
    if (pct >= 80)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Completado" };
    if (pct >= 50)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
    if (pct > 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Pendiente" };
    return { ring: "ring-muted/40", bg: "bg-muted/5", text: "text-muted-foreground", label: "Sin empezar" };
};
const FOCUS_COLORS = {
    universidad: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Universidad' },
    emprendimiento: { border: 'border-l-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500', label: 'Emprendimiento' },
    proyectos: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Proyectos' },
    idiomas: { border: 'border-l-teal-500', bg: 'bg-teal-500/10', dot: 'bg-teal-500', label: 'Idiomas' },
    musica: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Música' },
    lectura: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Lectura' },
    descanso: { border: 'border-l-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500', label: 'Descanso' },
    gym: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Gym' },
    estructural: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Estructural' },
    alimentacion: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', label: 'Alimentación' },
    default: { border: 'border-l-muted-foreground/30', bg: 'bg-muted/30', dot: 'bg-muted-foreground', label: 'Otros' },
};
function getBlockFocusKey(block) {
    const focus = block.currentFocus || block.defaultFocus;
    if (focus && focus !== 'none')
        return focus;
    const title = block.title.toLowerCase();
    if (title.includes('gym') || title.includes('entreno'))
        return 'gym';
    if (title.includes('activación') || title.includes('alistamiento') || title.includes('desactivación') || title.includes('dormir'))
        return 'estructural';
    if (title.includes('almuerzo') || title.includes('comida') || title.includes('desayuno') || title.includes('merienda'))
        return 'alimentacion';
    if (title.includes('lectura') || title.includes('música') || title.includes('piano') || title.includes('ajedrez'))
        return 'lectura';
    return 'default';
}
function getBlockIcon(block) {
    const focus = getBlockFocusKey(block);
    switch (focus) {
        case 'universidad': return _jsx(GraduationCap, { className: "h-4 w-4 text-blue-500" });
        case 'emprendimiento': return _jsx(Briefcase, { className: "h-4 w-4 text-purple-500" });
        case 'proyectos': return _jsx(FolderKanban, { className: "h-4 w-4 text-emerald-500" });
        case 'descanso': return _jsx(Moon, { className: "h-4 w-4 text-slate-500" });
        case 'lectura': return _jsx(Book, { className: "h-4 w-4 text-indigo-500" });
        case 'musica': return _jsx(Music, { className: "h-4 w-4 text-pink-500" });
        case 'gym': return _jsx(Dumbbell, { className: "h-4 w-4 text-orange-500" });
        case 'estructural': return _jsx(Sun, { className: "h-4 w-4 text-indigo-500" });
        case 'alimentacion': return _jsx(Coffee, { className: "h-4 w-4 text-amber-500" });
        default: return _jsx(Clock, { className: "h-4 w-4 text-muted-foreground" });
    }
}
function formatTimeDisplay(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};
// ============================================================
//  ENFOQUE SECTION — Bloques + Tarjetas de enfoque
// ============================================================
export function EnfoqueSection({ blocks, tasksByBlock, onRemoveTask, tasks: propTasks, activeFocusAreas, onToggleActiveFocusArea, skipped, onSkipToggle }) {
    const navigate = useNavigate();
    const tasks = propTasks ?? [];
    const { areas, loading, setManualTime } = useCombinedFocusTime();
    const { subjects } = useUniversity();
    const { value: activeSubjectId } = useActiveSelection("activeSubjectId");
    const { value: activeEntId } = useActiveSelection("activeEntrepreneurshipId");
    const { value: activeProjectId } = useActiveSelection("selectedProjectId");
    const [entInfo, setEntInfo] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    // Tareas asignadas a bloques — se muestran siempre (son el plan de hoy)
    const todayTasksByBlock = useMemo(() => {
        if (!tasksByBlock)
            return undefined;
        const filtered = {};
        for (const [blockId, blockTasks] of Object.entries(tasksByBlock)) {
            const ok = blockTasks.filter(t => !t.completed);
            if (ok.length > 0)
                filtered[blockId] = ok;
        }
        return filtered;
    }, [tasksByBlock]);
    // Tareas NO asignadas a bloques — solo con due_date = hoy (como Tasks > Hoy)
    const todayTasks = useMemo(() => {
        const assignedIds = new Set();
        if (tasksByBlock) {
            for (const blockTasks of Object.values(tasksByBlock)) {
                blockTasks.forEach(t => assignedIds.add(t.id));
            }
        }
        return tasks.filter(t => !assignedIds.has(t.id) && !t.completed && t.due_date && t.due_date.startsWith(todayStr));
    }, [tasks, tasksByBlock, todayStr]);
    // Universidad — active subject info
    const activeSubject = subjects.find((s) => s.id === activeSubjectId) || null;
    const subjectInfo = activeSubject
        ? {
            name: activeSubject.name,
            done: activeSubject.tasks.filter((t) => t.completed).length,
            total: activeSubject.tasks.length,
            route: "/university",
        }
        : null;
    // Emprendimiento — fetch active
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
    // Proyectos — from app_settings
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
    const infoByArea = {
        universidad: subjectInfo,
        emprendimiento: entInfo,
        proyectos: projectInfo,
    };
    // Filter + sort work blocks by start time
    const WORK_FOCUSES = ['universidad', 'emprendimiento', 'proyectos', 'idiomas'];
    const sortedBlocks = useMemo(() => {
        if (!blocks)
            return [];
        return [...blocks].filter(b => {
            const focus = b.currentFocus || b.defaultFocus;
            if (focus && WORK_FOCUSES.includes(focus))
                return true;
            const t = b.title.toLowerCase();
            return t.includes('deep work') || t.includes('work-') || t.includes('trabajo') || (t.includes('bloque') && !t.includes('alistamiento'));
        }).sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    }, [blocks]);
    const hasBlocksContent = sortedBlocks.length > 0 && todayTasksByBlock &&
        Object.values(todayTasksByBlock).some(t => t.length > 0);
    // Group non-block tasks by source
    const groupedTasks = useMemo(() => {
        const assignedIds = new Set();
        if (tasksByBlock) {
            for (const blockTasks of Object.values(tasksByBlock)) {
                blockTasks.forEach(t => assignedIds.add(t.id));
            }
        }
        const groups = {};
        for (const task of todayTasks) {
            if (task.completed || assignedIds.has(task.id))
                continue;
            const key = task.source === 'university' ? 'universidad'
                : task.source === 'entrepreneurship' ? 'emprendimiento'
                    : task.source === 'projects' ? 'proyectos'
                        : 'general';
            if (!groups[key])
                groups[key] = [];
            groups[key].push(task);
        }
        return groups;
    }, [todayTasks, tasksByBlock]);
    const taskCount = Object.values(groupedTasks).reduce((sum, t) => sum + t.length, 0);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4 text-primary" }), _jsx("h2", { className: "text-sm font-bold uppercase tracking-wide", children: "ENFOQUE \u00B7 HOY" })] }), hasBlocksContent && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-indigo-500" }), _jsx("h3", { className: "text-sm font-semibold", children: "Bloques de Trabajo" })] }), _jsx("div", { className: "space-y-2", children: sortedBlocks.map(block => {
                                    const blockTasks = todayTasksByBlock?.[block.id] || [];
                                    if (blockTasks.length === 0)
                                        return null;
                                    const focusKey = getBlockFocusKey(block);
                                    const colors = FOCUS_COLORS[focusKey] || FOCUS_COLORS.default;
                                    return (_jsxs("div", { className: "rounded-lg border-l-[3px] overflow-hidden", style: { borderLeftColor: `var(--${colors.dot.replace('bg-', '')})` }, children: [_jsx("div", { className: cn("px-3 py-2 border-b border-border/30", colors.bg), children: _jsxs("div", { className: "flex items-center gap-2", children: [getBlockIcon(block), _jsx("span", { className: "text-xs font-semibold flex-1", children: block.title }), _jsxs("span", { className: "text-[10px] text-muted-foreground font-mono", children: [formatTimeDisplay(block.startTime), " \u2014 ", formatTimeDisplay(block.endTime)] }), _jsx(Badge, { variant: "outline", className: "text-[9px] px-1.5 py-0 h-4", children: blockTasks.length })] }) }), _jsx("div", { className: "px-3 py-1.5 space-y-0.5", children: blockTasks.map(task => (_jsxs("div", { className: "flex items-center justify-between py-1 px-2 rounded-md bg-background/60 group hover:bg-background transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx("span", { className: cn("w-1.5 h-1.5 rounded-full shrink-0", task.completed ? "bg-green-500" : colors.dot) }), _jsx("span", { className: cn("text-xs truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), task.priority && task.priority === 'high' && (_jsx("span", { className: "text-[9px] text-red-500 font-medium shrink-0", children: "Alta" }))] }), onRemoveTask && (_jsx("button", { onClick: () => { onRemoveTask(task.id); toast.success("Tarea quitada del bloque"); }, className: "h-5 w-5 p-0 flex items-center justify-center shrink-0 rounded hover:bg-destructive/10 transition-colors", children: _jsx(X, { className: "h-3 w-3 text-muted-foreground hover:text-destructive" }) }))] }, task.id))) })] }, block.id));
                                }) })] })] })), taskCount > 0 && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Focus, { className: "h-4 w-4 text-indigo-500" }), _jsx("h3", { className: "text-sm font-semibold", children: "Tareas del D\u00EDa" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [taskCount, " pendientes"] })] }), _jsx("div", { className: "space-y-2.5", children: ['universidad', 'emprendimiento', 'proyectos', 'general'].map(source => {
                                    const sourceTasks = groupedTasks[source];
                                    if (!sourceTasks?.length)
                                        return null;
                                    const SOURCE_CONFIG = {
                                        universidad: { label: 'Universidad', icon: _jsx(GraduationCap, { className: "h-3.5 w-3.5" }), color: 'text-blue-500' },
                                        emprendimiento: { label: 'Emprendimiento', icon: _jsx(Briefcase, { className: "h-3.5 w-3.5" }), color: 'text-purple-500' },
                                        proyectos: { label: 'Proyecto', icon: _jsx(FolderKanban, { className: "h-3.5 w-3.5" }), color: 'text-amber-500' },
                                        general: { label: 'General', icon: _jsx(ListTodo, { className: "h-3.5 w-3.5" }), color: 'text-muted-foreground' },
                                    };
                                    const cfg = SOURCE_CONFIG[source];
                                    const priorityColors = {
                                        high: 'border-l-red-400 bg-red-50/30', medium: 'border-l-amber-300 bg-amber-50/20', low: 'border-l-gray-200'
                                    };
                                    const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Baja' };
                                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: [_jsx("span", { className: cfg.color, children: cfg.icon }), _jsx("span", { children: cfg.label }), _jsxs("span", { className: "text-[9px] text-muted-foreground/60", children: ["(", sourceTasks.length, ")"] })] }), _jsx("div", { className: "space-y-0.5", children: sourceTasks.map(task => (_jsxs("div", { className: cn("flex items-center gap-2 py-1 px-2 rounded-lg border-l-2 text-xs", priorityColors[task.priority || 'medium']), children: [_jsx("span", { className: "flex-1 truncate", children: task.title }), task.priority && task.priority !== 'low' && (_jsx("span", { className: cn("text-[9px] font-medium shrink-0", task.priority === 'high' ? 'text-red-500' : 'text-amber-500'), children: priorityLabel[task.priority] }))] }, task.id))) })] }, source));
                                }) })] })] })), activeFocusAreas && onToggleActiveFocusArea && (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "\u00C1reas activas hoy" })] }), _jsx("div", { className: "flex gap-2", children: ['universidad', 'emprendimiento', 'proyectos'].map(id => {
                                const cfg = AREA_CARD_CONFIG[id];
                                const active = activeFocusAreas.includes(id);
                                return (_jsxs("button", { onClick: () => onToggleActiveFocusArea(id), className: cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", active
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"), children: [_jsx(cfg.icon, { className: "h-3.5 w-3.5" }), cfg.label] }, id));
                            }) }), _jsx("p", { className: "text-[9px] text-muted-foreground mt-1.5", children: "Las \u00E1reas no seleccionadas aparecer\u00E1n como \"No enfoque\" en estad\u00EDsticas" })] }) })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: areas.map((area) => {
                    const config = AREA_CARD_CONFIG[area.id];
                    if (!config)
                        return null;
                    const Icon = config.icon;
                    const sem = progressSemaphore(area.progress);
                    const info = infoByArea[area.id];
                    const taskPct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;
                    const areaActive = activeFocusAreas?.includes(area.id) ?? true;
                    const isSkipped = skipped?.[area.id] && area.manualMinutes === 0;
                    return (_jsx(FocusCard, { areaId: area.id, areaName: area.name, icon: Icon, gradient: config.gradient, color: config.color, bg: config.bg, route: config.route, sem: sem, info: info, taskPct: taskPct, manualMinutes: area.manualMinutes, focusMinutes: area.focusMinutes, totalMinutes: area.totalMinutes, goalMinutes: area.goalMinutes, progress: area.progress, onManualTimeChange: (v) => setManualTime(area.id, v), onNavigate: navigate, areaActive: areaActive, isSkipped: isSkipped, onSkip: () => onSkipToggle?.(area.id) }, area.id));
                }) })] }));
}
// ============================================================
//  FOCUS CARD — Tarjeta tipo Mejora para tiempo de enfoque
// ============================================================
function FocusCard({ areaId, areaName, icon: Icon, gradient, color, bg, route, sem, info, taskPct, manualMinutes, focusMinutes, totalMinutes, goalMinutes, progress, onManualTimeChange, onNavigate, areaActive = true, isSkipped = false, onSkip, }) {
    const MIN_GOAL = Math.round(goalMinutes * 0.5);
    const [draft, setDraft] = useState(manualMinutes);
    useEffect(() => setDraft(manualMinutes), [manualMinutes]);
    const handleSave = () => {
        onManualTimeChange(draft);
        toast.success(`${areaName}: ${draft} min guardados`);
    };
    return (_jsxs(Card, { className: cn("overflow-hidden p-0 ring-2 transition-all", sem.ring), children: [_jsxs("div", { className: cn("ios-grad-header p-4 flex items-center justify-between cursor-pointer", `bg-gradient-to-r ${gradient}`), onClick: () => onNavigate(route), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-white/20", children: _jsx(Icon, { className: "h-4 w-4 text-white" }) }), _jsx("span", { className: "text-white font-semibold text-sm", children: areaName })] }), _jsx(ArrowRight, { className: "h-4 w-4 text-white/80" })] }), _jsxs("div", { className: cn("p-4 space-y-3", isSkipped ? "bg-red-500/5" : areaActive ? sem.bg : "bg-muted/10"), children: [!areaActive && (_jsxs("div", { className: "text-center py-3", children: [_jsx(Badge, { variant: "secondary", className: "text-[10px] px-2 py-1 bg-muted text-muted-foreground", children: "No enfoque hoy" }), _jsx("p", { className: "text-[9px] text-muted-foreground mt-1", children: "\u00C1rea no seleccionada para hoy" })] })), areaActive && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => info && onNavigate(info.route), className: "w-full text-left rounded-md border border-border/50 bg-background/50 px-2 py-1.5 hover:bg-background transition-colors", children: info ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[11px] font-medium truncate", children: info.name }), _jsxs(Badge, { variant: "outline", className: "text-[9px] px-1 py-0 shrink-0", children: [info.done, "/", info.total] })] }), _jsx(Progress, { value: taskPct, className: "h-1 mt-1" })] })) : (_jsxs("span", { className: "text-[10px] text-muted-foreground", children: ["Selecciona ", areaId === "universidad" ? "una asignatura" : areaId === "emprendimiento" ? "una iniciativa" : "un proyecto", " activa"] })) }), _jsx(Separator, {}), _jsxs("div", { className: "bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Tiempo manual (min)" }), _jsx("span", { className: cn("text-[10px] font-bold", sem.text), children: sem.label })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "number", min: 0, value: draft || "", onChange: (e) => setDraft(parseInt(e.target.value) || 0), className: "h-8 text-sm font-bold text-center", placeholder: "0" }), _jsx(Button, { size: "sm", className: "h-8 px-2", onClick: handleSave, children: _jsx(Save, { className: "h-3 w-3" }) }), onSkip && (_jsxs("button", { onClick: () => { onManualTimeChange(0); onSkip(); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), title: "No lo hice", children: [_jsx(XCircle, { className: "h-3 w-3" }), isSkipped ? "Saltado" : "No hice"] }))] }), _jsx(Progress, { value: Math.min(100, progress), className: "h-1.5" }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center", children: [totalMinutes, " / ", goalMinutes, " min (", progress, "%)"] })] }), _jsx(WeekStreakBar, { habitId: `focus-${areaId}`, todayValue: totalMinutes, minThreshold: MIN_GOAL, maxThreshold: goalMinutes, compact: true }), _jsxs("div", { className: "grid grid-cols-3 gap-1.5 pt-1.5 border-t", children: [_jsx(Stat, { label: "Manual", value: `${manualMinutes}m` }), _jsx(Stat, { label: "Focus", value: `${focusMinutes}m` }), _jsx(Stat, { label: "Total", value: `${totalMinutes}m` })] })] }))] })] }));
}
const Stat = ({ label, value }) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-semibold text-xs", children: value }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: label })] }));
