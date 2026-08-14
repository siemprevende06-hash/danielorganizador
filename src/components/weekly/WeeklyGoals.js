import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { Target, CheckCircle2, Calendar, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
export function WeeklyGoals({ weekStart, weekEnd }) {
    const { goals, loading: goalsLoading, fetchGoalTasks } = useGoalProgress();
    const { objectives } = useWeeklyObjectives();
    const [goalTasksMap, setGoalTasksMap] = useState(new Map());
    const [twelveWeekGoals, setTwelveWeekGoals] = useState([]);
    const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'completed');
    useEffect(() => {
        if (activeGoals.length > 0) {
            activeGoals.forEach(async (goal) => {
                const tasks = await fetchGoalTasks(goal.id);
                setGoalTasksMap(prev => new Map(prev).set(goal.id, tasks));
            });
        }
    }, [goals]);
    useEffect(() => {
        supabase.from('twelve_week_goals')
            .select('*')
            .eq('year', 2026)
            .order('category')
            .then(({ data }) => setTwelveWeekGoals(data || []));
    }, []);
    const getWeekTasks = (tasks) => {
        return tasks.filter(t => {
            if (!t.due_date)
                return false;
            const d = parseISO(t.due_date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });
    };
    if (goalsLoading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground animate-pulse", children: "Cargando metas..." }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [objectives.length > 0 && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-amber-500 to-orange-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Flame, { className: "w-3.5 h-3.5 text-amber-500" }), "Objetivos de la Semana"] }), _jsxs(Badge, { variant: "outline", className: "text-[10px] rounded-full", children: [objectives.length, " activos"] })] }), _jsx("div", { className: "space-y-2", children: objectives.map(obj => {
                                    const pct = obj.target_value
                                        ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100))
                                        : obj.completed ? 100 : 0;
                                    return (_jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsx("div", { className: cn("w-2 h-2 rounded-full shrink-0", obj.completed ? "bg-green-500" : "bg-amber-500") }), _jsx("span", { className: cn("flex-1 truncate", obj.completed && "line-through text-muted-foreground"), children: obj.title }), obj.target_value && (_jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: [obj.current_value, "/", obj.target_value] })), _jsx(Progress, { value: pct, className: "w-16 h-1.5" })] }, obj.id));
                                }) })] })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "w-3.5 h-3.5" }), "Metas Trimestrales Activas"] }), _jsx(Link, { to: "/goals", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver todas ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), activeGoals.length === 0 ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Target, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No hay metas activas" }), _jsx("p", { className: "text-xs text-muted-foreground/60 mt-1", children: "Crea metas trimestrales para verlas aqu\u00ED" })] }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: activeGoals.map(goal => {
                    const allTasks = goalTasksMap.get(goal.id) || [];
                    const weekTasks = getWeekTasks(allTasks);
                    const completed = weekTasks.filter(t => t.completed).length;
                    const isCore = goal.progress_percentage >= 50;
                    return (_jsxs(Card, { className: cn("border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md", isCore && "ring-1 ring-primary/20"), children: [isCore && _jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-semibold text-sm truncate", children: goal.title }), isCore && _jsx(Badge, { className: "text-[9px] h-4 rounded-full bg-primary/10 text-primary border-0 shrink-0", children: "Core" })] }), goal.area_id && (_jsx("p", { className: "text-[10px] text-muted-foreground capitalize mt-0.5", children: goal.area_id }))] }), _jsxs(Badge, { variant: "secondary", className: "shrink-0 font-mono text-xs", children: [goal.progress_percentage, "%"] })] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-1.5" }), weekTasks.length > 0 && (_jsxs("div", { className: "space-y-1 pt-1", children: [_jsxs("p", { className: "text-[10px] font-medium text-muted-foreground flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), "Esta semana (", completed, "/", weekTasks.length, ")"] }), weekTasks.slice(0, 3).map(task => (_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [_jsx(CheckCircle2, { className: cn("w-3 h-3 shrink-0", task.completed ? "text-green-500" : "text-muted-foreground/30") }), _jsx("span", { className: cn("truncate", task.completed && "line-through"), children: task.title }), task.due_date && (_jsx("span", { className: "text-[9px] text-muted-foreground/60 ml-auto shrink-0", children: format(parseISO(task.due_date), 'EEE', { locale: es }) }))] }, task.id))), weekTasks.length > 3 && (_jsxs("p", { className: "text-[10px] text-muted-foreground/60 pl-5", children: ["+", weekTasks.length - 3, " m\u00E1s"] }))] })), _jsxs("div", { className: "flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), allTasks.filter(t => t.completed).length, "/", allTasks.length, " tareas"] }), goal.target_date && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), format(parseISO(goal.target_date), 'd MMM', { locale: es })] }))] })] })] }, goal.id));
                }) })), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-purple-500 to-pink-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5 text-purple-500" }), "Metas 12 Semanas"] }), _jsx(Link, { to: "/12-week-year", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), _jsxs("div", { className: "space-y-2", children: [twelveWeekGoals.filter(g => g.status !== 'completed' || g.progress_percentage > 0).slice(0, 6).map(goal => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-xs font-medium truncate", children: goal.title }), _jsxs("span", { className: "text-[10px] font-mono text-muted-foreground", children: [goal.progress_percentage, "%"] })] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-1 mt-0.5" })] })] }, goal.id))), twelveWeekGoals.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-3", children: "Sin metas de 12 semanas configuradas" }))] })] })] })] }));
}
