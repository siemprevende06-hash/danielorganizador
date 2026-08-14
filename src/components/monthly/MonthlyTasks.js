import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ListTodo, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
export function MonthlyTasks({ currentMonth }) {
    const queryClient = useQueryClient();
    const [selectedArea, setSelectedArea] = useState(null);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['monthlyTasks', format(monthStart, 'yyyy-MM-dd')],
        queryFn: async () => {
            const startStr = format(monthStart, 'yyyy-MM-dd');
            const endStr = format(monthEnd, 'yyyy-MM-dd');
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
            queryClient.invalidateQueries({ queryKey: ['monthlyTasks', format(monthStart, 'yyyy-MM-dd')] });
        },
    });
    const weeks = useMemo(() => {
        const seen = new Set();
        const result = [];
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        monthDays.forEach(day => {
            const wn = getWeek(day, { weekStartsOn: 1 });
            if (seen.has(wn))
                return;
            seen.add(wn);
            result.push({
                weekNum: wn,
                start: startOfWeek(day, { weekStartsOn: 1 }),
                end: endOfWeek(day, { weekStartsOn: 1 }),
            });
        });
        return result;
    }, [monthStart, monthEnd]);
    const tasksByWeek = useMemo(() => {
        const byWeek = {};
        weeks.forEach(w => { byWeek[w.weekNum] = []; });
        tasks.forEach((t) => {
            const dueDate = t.due_date ? new Date(t.due_date) : null;
            if (!dueDate)
                return;
            const wn = getWeek(dueDate, { weekStartsOn: 1 });
            if (byWeek[wn])
                byWeek[wn].push(t);
        });
        return byWeek;
    }, [tasks, weeks]);
    const filteredByWeek = useMemo(() => {
        if (!selectedArea)
            return tasksByWeek;
        const filtered = {};
        Object.entries(tasksByWeek).forEach(([weekNum, weekTasks]) => {
            filtered[Number(weekNum)] = weekTasks.filter((t) => t.area_id === selectedArea);
        });
        return filtered;
    }, [tasksByWeek, selectedArea]);
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(ListTodo, { className: "w-3.5 h-3.5" }), "Tareas del Mes \u2014 ", monthName] }), _jsx(Link, { to: "/tasks", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver todas ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsxs("span", { className: "text-lg font-bold", children: [totalCompleted, "/", totalTasks] }), _jsx(Progress, { value: overallPct, className: "flex-1 h-2" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [overallPct, "%"] })] }), allAreas.length > 0 && (_jsxs("div", { className: "flex gap-1.5 mt-3 flex-wrap", children: [_jsx("button", { onClick: () => setSelectedArea(null), className: cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors", !selectedArea ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"), children: "Todas" }), allAreas.map(area => (_jsx("button", { onClick: () => setSelectedArea(area === selectedArea ? null : area), className: cn("text-[9px] px-2 py-0.5 rounded-full border transition-colors capitalize", selectedArea === area
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"), children: area }, area)))] }))] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: weeks.map(week => {
                    const weekTasks = filteredByWeek[week.weekNum] || [];
                    const done = weekTasks.filter((t) => t.completed).length;
                    const isCurrentWeek = getWeek(new Date(), { weekStartsOn: 1 }) === week.weekNum;
                    return (_jsxs(Card, { className: cn("border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", isCurrentWeek && "ring-2 ring-primary ring-offset-2"), children: [_jsxs("div", { className: cn("text-center py-2 border-b border-border/50", isCurrentWeek && "bg-primary/5"), children: [_jsxs("p", { className: "text-[10px] uppercase font-semibold text-muted-foreground/60", children: ["Semana ", week.weekNum] }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: [format(week.start, 'd MMM', { locale: es }), " \u2013 ", format(week.end, 'd MMM', { locale: es })] }), weekTasks.length > 0 && _jsxs("p", { className: "text-[9px] text-muted-foreground/60 mt-0.5", children: [done, "/", weekTasks.length, " tareas"] })] }), _jsxs("div", { className: "p-2 space-y-1 min-h-[100px]", children: [weekTasks.length === 0 && (_jsx("p", { className: "text-[9px] text-center text-muted-foreground/30 py-4", children: "Sin tareas" })), weekTasks.slice(0, 6).map((task) => (_jsxs("button", { onClick: () => toggleTask.mutate({ id: task.id, completed: task.completed }), className: "w-full flex items-start gap-1.5 text-left p-1.5 rounded hover:bg-muted/50 transition-colors group", children: [task.completed
                                                ? _jsx(CheckCircle2, { className: "w-3 h-3 text-green-500 shrink-0 mt-0.5" })
                                                : _jsx(Circle, { className: "w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground/70" }), _jsx("span", { className: cn("text-[10px] leading-tight", task.completed && "line-through text-muted-foreground"), children: task.title }), task.area_id && (_jsx(Badge, { variant: "outline", className: "text-[7px] px-1 py-0 ml-auto shrink-0 capitalize", children: task.area_id.slice(0, 4) }))] }, task.id))), weekTasks.length > 6 && (_jsxs("p", { className: "text-[8px] text-center text-muted-foreground/40", children: ["+", weekTasks.length - 6, " m\u00E1s"] })), weekTasks.length > 0 && (_jsx(Progress, { value: weekTasks.length > 0 ? (done / weekTasks.length) * 100 : 0, className: "h-0.5 mt-1" }))] })] }, week.weekNum));
                }) })] }));
}
