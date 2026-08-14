import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
const GROUPS = [
    { key: 'universidad', label: 'Universidad', color: 'text-blue-500' },
    { key: 'emprendimiento', label: 'Emprendimiento', color: 'text-purple-500' },
    { key: 'proyectos', label: 'Proyectos', color: 'text-amber-500' },
    { key: 'general', label: 'Tareas generales', color: 'text-muted-foreground' },
];
const ALIAS = {
    university: 'universidad',
    entrepreneurship: 'emprendimiento',
    entrepreneur: 'emprendimiento',
    project: 'proyectos',
    proyectos: 'proyectos',
};
const groupOf = (t) => {
    const raw = t.area_id || t.source;
    if (!raw)
        return 'general';
    return ALIAS[raw.toLowerCase()] || 'general';
};
export function TaskChecklist({ tasks, onToggle }) {
    const [toggling, setToggling] = useState(null);
    const handleToggle = async (taskId) => {
        setToggling(taskId);
        try {
            await onToggle(taskId);
        }
        finally {
            setToggling(null);
        }
    };
    const done = tasks.filter(t => t.completed).length;
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-emerald-500 to-teal-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-sm font-semibold tracking-tight", children: "Tareas del d\u00EDa" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [done, "/", tasks.length, " hechas"] })] }), tasks.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground italic", children: "Sin tareas para hoy. Crea una en el panel de tareas." })) : (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: GROUPS.map(g => {
                            const groupTasks = tasks.filter(t => groupOf(t) === g.key);
                            if (groupTasks.length === 0)
                                return null;
                            return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: [_jsx("span", { className: g.color, children: "\u2022" }), _jsx("span", { children: g.label }), _jsxs("span", { className: "text-[9px] text-muted-foreground/60", children: ["(", groupTasks.filter(t => t.completed).length, "/", groupTasks.length, ")"] })] }), _jsx("div", { className: "space-y-1", children: groupTasks.map(task => (_jsxs("div", { className: cn('flex items-start gap-2.5 p-2 rounded-xl border text-xs transition-colors', task.completed
                                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60'
                                                : 'border-border/50 hover:bg-muted/30'), children: [_jsx("button", { onClick: () => handleToggle(task.id), className: cn('mt-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer', task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'), title: task.completed ? 'Desmarcar' : 'Marcar como hecha', children: toggling === task.id ? _jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : task.completed && _jsx(Check, { className: "w-3 h-3" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn('leading-snug break-words', task.completed && 'line-through text-muted-foreground'), children: task.title }), task.priority === 'high' && (_jsx(Badge, { variant: "destructive", className: "text-[8px] px-1 py-0 h-3.5 mt-1", children: "Alta" }))] })] }, task.id))) })] }, g.key));
                        }) }))] })] }));
}
