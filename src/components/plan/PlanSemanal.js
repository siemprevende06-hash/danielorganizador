import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { GripVertical, GraduationCap, Briefcase, FolderKanban, ListTodo, Check, Loader2 } from 'lucide-react';
const SECTIONS = [
    { key: 'universidad', label: 'Universidad', icon: _jsx(GraduationCap, { className: "w-3.5 h-3.5" }), accent: 'text-blue-500', chip: 'bg-blue-500/15 text-blue-600', dropBg: 'border-blue-400 bg-blue-500/10' },
    { key: 'emprendimiento', label: 'Emprendimiento', icon: _jsx(Briefcase, { className: "w-3.5 h-3.5" }), accent: 'text-purple-500', chip: 'bg-purple-500/15 text-purple-600', dropBg: 'border-purple-400 bg-purple-500/10' },
    { key: 'proyectos', label: 'Proyectos', icon: _jsx(FolderKanban, { className: "w-3.5 h-3.5" }), accent: 'text-amber-500', chip: 'bg-amber-500/15 text-amber-600', dropBg: 'border-amber-400 bg-amber-500/10' },
    { key: 'general', label: 'Tareas generales', icon: _jsx(ListTodo, { className: "w-3.5 h-3.5" }), accent: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground', dropBg: 'border-primary bg-primary/10' },
];
const AREA_ALIAS = {
    universidad: 'universidad',
    university: 'universidad',
    emprendimiento: 'emprendimiento',
    entrepreneurship: 'emprendimiento',
    entrepreneur: 'emprendimiento',
    proyectos: 'proyectos',
    project: 'proyectos',
    general: 'general',
};
function areaOf(t) {
    const raw = t.area_id || t.source;
    if (!raw)
        return 'general';
    return AREA_ALIAS[raw.toLowerCase()] || 'general';
}
const SOURCE_VALUE = {
    universidad: 'university',
    emprendimiento: 'entrepreneurship',
    proyectos: 'project',
    general: 'general',
};
const PRIORITY = {
    high: { label: 'Alta', badge: 'bg-red-500/15 text-red-600', bar: 'border-l-red-500' },
    medium: { label: 'Media', badge: 'bg-amber-500/15 text-amber-600', bar: 'border-l-amber-400' },
    low: { label: 'Baja', badge: 'bg-muted text-muted-foreground', bar: 'border-l-slate-300' },
};
function RingProgress({ done, total }) {
    const pct = total > 0 ? (done / total) * 100 : 0;
    return (_jsxs("div", { className: "relative w-10 h-10 shrink-0", children: [_jsxs("svg", { className: "w-10 h-10 -rotate-90", viewBox: "0 0 40 40", children: [_jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "4" }), _jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "currentColor", className: "text-emerald-500", strokeWidth: "4", strokeDasharray: `${2 * Math.PI * 16}`, strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(pct, 100) / 100)}` })] }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums", children: total > 0 ? `${Math.round(pct)}%` : '—' })] }));
}
export function PlanSemanal({ weekDays, tasks, queryKeyPrefix }) {
    const queryClient = useQueryClient();
    const [dragOver, setDragOver] = useState({ day: null, area: null });
    const [draggingId, setDraggingId] = useState(null);
    const [moving, setMoving] = useState(false);
    const [doneId, setDoneId] = useState(null);
    const dayStr = (d) => format(d, 'yyyy-MM-dd');
    const moveTask = async (taskId, targetDay, targetArea) => {
        setMoving(true);
        const patch = { due_date: `${targetDay}T12:00:00` };
        if (targetArea) {
            patch.area_id = SOURCE_VALUE[targetArea];
            patch.source = SOURCE_VALUE[targetArea];
        }
        const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
        setMoving(false);
        if (error) {
            console.error('Error al mover tarea:', error.message);
        }
        else {
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
        }
        setDragOver({ day: null, area: null });
        setDraggingId(null);
    };
    const toggleDone = async (taskId, completed) => {
        setDoneId(taskId);
        const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId);
        setDoneId(null);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
        }
    };
    const handleDropSection = (e, day, area) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId)
            moveTask(taskId, dayStr(day), area);
        else
            setDragOver({ day: null, area: null });
    };
    const handleDropDay = (e, day) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId)
            moveTask(taskId, dayStr(day), null);
        else
            setDragOver({ day: null, area: null });
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Plan de la semana" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Arrastra una tarea a otro d\u00EDa o a otra secci\u00F3n para reprogramarla y cambiar su \u00E1rea" })] }), moving && _jsx(Badge, { variant: "secondary", className: "text-xs", children: "Moviendo..." })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-3", children: weekDays.map(day => {
                    const ds = dayStr(day);
                    const dayTasks = tasks.filter(t => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === ds);
                    const done = dayTasks.filter(t => t.completed).length;
                    const overDay = dragOver.day === ds && dragOver.area === null;
                    return (_jsxs("div", { onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver.day !== ds)
                            setDragOver(p => ({ ...p, day: ds })); }, onDragLeave: () => setDragOver(p => p.day === ds && p.area === null ? { day: null, area: null } : p), onDrop: (e) => handleDropDay(e, day), className: cn('rounded-2xl border-2 transition-all flex flex-col overflow-hidden', isToday(day) && 'ring-2 ring-primary ring-offset-2', overDay
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm'), children: [_jsxs("div", { className: "p-2.5 border-b border-muted/60 flex items-center gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[9px] uppercase font-semibold text-muted-foreground/60", children: format(day, 'EEEE', { locale: es }) }), _jsx("p", { className: cn('text-base font-bold leading-tight', isToday(day) && 'text-primary'), children: format(day, 'd MMM') })] }), _jsx(RingProgress, { done: done, total: dayTasks.length })] }), _jsx("div", { className: "flex-1 divide-y divide-muted/40 overflow-y-auto overscroll-contain no-scrollbar max-h-[520px]", children: SECTIONS.map(section => {
                                    const sectionTasks = dayTasks.filter(t => areaOf(t) === section.key);
                                    const overThis = dragOver?.day === ds && dragOver.area === section.key;
                                    return (_jsxs("div", { onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; if (dragOver?.day !== ds || dragOver.area !== section.key)
                                            setDragOver({ day: ds, area: section.key }); }, onDragLeave: () => setDragOver(p => (p.day === ds && p.area === section.key) ? { day: null, area: null } : p), onDrop: (e) => handleDropSection(e, day, section.key), className: cn('p-2 transition-all', overThis && section.dropBg), children: [_jsxs("div", { className: "flex items-center gap-1.5 px-1 mb-1", children: [_jsx("span", { className: section.accent, children: section.icon }), _jsx("span", { className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground", children: section.label }), _jsxs(Badge, { variant: "outline", className: cn('text-[8px] px-1 py-0 h-3.5 ml-auto', section.chip), children: [sectionTasks.filter(t => t.completed).length, "/", sectionTasks.length] })] }), sectionTasks.length === 0 ? (_jsx("p", { className: "text-[9px] text-muted-foreground/40 text-center py-1.5 italic", children: "Suelta tareas aqu\u00ED" })) : (_jsx("div", { className: "space-y-1.5", children: sectionTasks.map(t => {
                                                    const prio = PRIORITY[t.priority || 'medium'] || PRIORITY.medium;
                                                    return (_jsxs("div", { draggable: true, onDragStart: (e) => {
                                                            e.dataTransfer.setData('text/plain', t.id);
                                                            e.dataTransfer.effectAllowed = 'move';
                                                            setDraggingId(t.id);
                                                        }, onDragEnd: () => { setDraggingId(null); setDragOver({ day: null, area: null }); }, className: cn('flex items-start gap-2 p-2 rounded-xl border border-border/50 border-l-[3px]', prio.bar, 'bg-white/60 dark:bg-zinc-900/50 cursor-grab active:cursor-grabbing select-none', t.completed && 'opacity-55', draggingId === t.id && 'opacity-40'), title: "Arrastra para reprogramar o cambiar de \u00E1rea", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); toggleDone(t.id, t.completed); }, className: cn('mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer', t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'), title: t.completed ? 'Marcar como pendiente' : 'Marcar como hecha', children: doneId === t.id ? _jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : t.completed && _jsx(Check, { className: "w-3 h-3" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn('text-xs leading-snug break-words', t.completed && 'line-through'), children: t.title }), t.priority && t.priority !== 'low' && (_jsx(Badge, { variant: "outline", className: cn('text-[8px] px-1 py-0 h-3.5 mt-1', prio.badge), children: prio.label }))] }), _jsx(GripVertical, { className: "h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" })] }, t.id));
                                                }) }))] }, section.key));
                                }) })] }, ds));
                }) })] }));
}
