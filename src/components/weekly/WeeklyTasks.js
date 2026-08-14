import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ListTodo, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
const AREA_COLORS = {
    universidad: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    emprendimiento: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    proyectos: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    gym: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    idiomas: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export function WeeklyTasks({ weekStart, weekEnd }) {
    const queryClient = useQueryClient();
    const [selectedArea, setSelectedArea] = useState(null);
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart.getTime(), weekEnd.getTime()]);
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['weeklyTasks', format(weekStart, 'yyyy-MM-dd')],
        queryFn: async () => {
            const startStr = format(weekStart, 'yyyy-MM-dd');
            const endStr = format(weekEnd, 'yyyy-MM-dd');
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .gte('due_date', `${startStr}T00:00:00`)
                .lte('due_date', `${endStr}T23:59:59`)
                .order('due_date');
            return data || [];
        },
    });
    const toggleTask = useMutation({
        mutationFn: async ({ id, completed }) => {
            await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weeklyTasks', format(weekStart, 'yyyy-MM-dd')] });
        },
    });
    const tasksByDay = useMemo(() => {
        const byDay = {};
        weekDays.forEach(d => { byDay[format(d, 'yyyy-MM-dd')] = []; });
        tasks.forEach((t) => {
            const dayStr = t.due_date?.split('T')[0];
            if (dayStr && byDay[dayStr]) {
                byDay[dayStr].push(t);
            }
        });
        return byDay;
    }, [tasks, weekDays]);
    const filteredByDay = useMemo(() => {
        if (!selectedArea)
            return tasksByDay;
        const filtered = {};
        Object.entries(tasksByDay).forEach(([day, dayTasks]) => {
            filtered[day] = dayTasks.filter((t) => t.area_id === selectedArea);
        });
        return filtered;
    }, [tasksByDay, selectedArea]);
    const allAreas = useMemo(() => {
        const areas = new Set();
        tasks.forEach((t) => { if (t.area_id)
            areas.add(t.area_id); });
        return Array.from(areas);
    }, [tasks]);
    const totalCompleted = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;
    const overallPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    if (isLoading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground animate-pulse", children: "Cargando tareas..." }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(ListTodo, { className: "w-3.5 h-3.5" }), "Tareas de la Semana"] }), _jsx(Link, { to: "/tasks", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver todas ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsxs("span", { className: "text-lg font-bold", children: [totalCompleted, "/", totalTasks] }), _jsx(Progress, { value: overallPct, className: "flex-1 h-2" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [overallPct, "%"] })] }), allAreas.length > 0 && (_jsxs("div", { className: "flex gap-1.5 mt-3 flex-wrap", children: [_jsx("button", { onClick: () => setSelectedArea(null), className: cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors", !selectedArea ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"), children: "Todas" }), allAreas.map(area => (_jsx("button", { onClick: () => setSelectedArea(area === selectedArea ? null : area), className: cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors capitalize", selectedArea === area
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"), children: area }, area)))] }))] }) }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: weekDays.map((day, i) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayTasks = filteredByDay[dayStr] || [];
                    const done = dayTasks.filter((t) => t.completed).length;
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (_jsxs(Card, { className: cn("border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", isToday && "ring-2 ring-primary ring-offset-2"), children: [_jsxs("div", { className: cn("text-center py-2 border-b border-border/50", isToday && "bg-primary/5"), children: [_jsx("p", { className: "text-[9px] uppercase font-semibold text-muted-foreground/60", children: DAY_LABELS[i] }), _jsx("p", { className: cn("text-base font-bold leading-tight", isToday && "text-primary"), children: format(day, 'd') }), dayTasks.length > 0 && (_jsxs("p", { className: "text-[9px] text-muted-foreground/60", children: [done, "/", dayTasks.length] }))] }), _jsxs("div", { className: "p-1.5 space-y-1 min-h-[80px]", children: [dayTasks.length === 0 && (_jsx("p", { className: "text-[9px] text-center text-muted-foreground/30 py-4", children: "\u2014" })), dayTasks.slice(0, 4).map((task) => (_jsxs("button", { onClick: () => toggleTask.mutate({ id: task.id, completed: task.completed }), className: "w-full flex items-start gap-1.5 text-left p-1 rounded hover:bg-muted/50 transition-colors group", children: [task.completed
                                                ? _jsx(CheckCircle2, { className: "w-3 h-3 text-green-500 shrink-0 mt-0.5" })
                                                : _jsx(Circle, { className: "w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground/70" }), _jsx("span", { className: cn("text-[10px] leading-tight", task.completed && "line-through text-muted-foreground"), children: task.title })] }, task.id))), dayTasks.length > 4 && (_jsxs("p", { className: "text-[8px] text-center text-muted-foreground/40", children: ["+", dayTasks.length - 4, " m\u00E1s"] })), dayTasks.length > 0 && (_jsx(Progress, { value: dayTasks.length > 0 ? (done / dayTasks.length) * 100 : 0, className: "h-0.5 mt-1" }))] })] }, dayStr));
                }) })] }));
}
