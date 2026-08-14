import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { Target, CheckCircle2, Calendar, Book, TrendingUp, FolderKanban, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { MonthlyAreaGoals } from './MonthlyAreaGoals';
export function MonthlyGoals({ currentMonth }) {
    const { goals, loading: goalsLoading, fetchGoalTasks } = useGoalProgress();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
    const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });
    const [goalTasksMap, setGoalTasksMap] = useState(new Map());
    const [twelveWeekGoals, setTwelveWeekGoals] = useState([]);
    const [books, setBooks] = useState([]);
    const [songs, setSongs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [systemStats, setSystemStats] = useState([]);
    const activeGoals = goals.filter(g => g.status === 'active');
    useEffect(() => {
        if (activeGoals.length > 0) {
            activeGoals.forEach(async (goal) => {
                const tasks = await fetchGoalTasks(goal.id);
                setGoalTasksMap(prev => new Map(prev).set(goal.id, tasks));
            });
        }
    }, [goals]);
    useEffect(() => {
        const loadIndicators = async () => {
            const [booksRes, songsRes, projectsRes, twelveRes, systemsRes] = await Promise.all([
                supabase.from('reading_library').select('*'),
                supabase.from('music_repertoire').select('*'),
                supabase.from('projects').select('*'),
                supabase.from('twelve_week_goals').select('*').eq('year', 2026).order('category'),
                supabase.from('daily_systems_tracking').select('*').gte('tracking_date', monthStartStr).lte('tracking_date', monthEndStr),
            ]);
            setBooks(booksRes.data || []);
            setSongs(songsRes.data || []);
            setProjects(projectsRes.data || []);
            setTwelveWeekGoals(twelveRes.data || []);
            setSystemStats(systemsRes.data || []);
        };
        loadIndicators();
    }, [currentMonth]);
    const getMonthTasks = (tasks) => {
        return tasks.filter(t => {
            if (!t.due_date)
                return false;
            const d = parseISO(t.due_date);
            return isWithinInterval(d, { start: monthStart, end: monthEnd });
        });
    };
    const currentBooks = books.filter(b => b.status === 'reading');
    const completedBooks = books.filter(b => b.status === 'read' && b.finish_date && b.finish_date >= monthStartStr && b.finish_date <= monthEndStr);
    const pianoSongs = songs.filter(s => s.instrument === 'piano');
    const guitarSongs = songs.filter(s => s.instrument === 'guitar');
    const gymTrackedDays = systemStats.length;
    if (goalsLoading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground animate-pulse", children: "Cargando..." }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-emerald-500 to-teal-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5" }), "Indicadores del Mes \u2014 ", monthName] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-muted/30 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Book, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { className: "text-xs font-medium", children: "Libros" })] }), _jsxs("p", { className: "text-lg font-bold", children: [completedBooks.length, _jsx("span", { className: "text-sm text-muted-foreground font-normal", children: "/2" })] }), _jsx(Progress, { value: Math.min(100, (completedBooks.length / 2) * 100), className: "h-1" }), currentBooks.length > 0 && _jsxs("p", { className: "text-[9px] text-muted-foreground truncate", children: ["Leyendo: ", currentBooks[0].title] })] }), _jsxs("div", { className: "p-3 rounded-xl bg-muted/30 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDFB9" }), _jsx("span", { className: "text-xs font-medium", children: "Piano" })] }), _jsxs("p", { className: "text-lg font-bold", children: [pianoSongs.filter(s => s.status === 'mastered').length, _jsx("span", { className: "text-sm text-muted-foreground font-normal", children: "/1" })] }), _jsx(Progress, { value: Math.min(100, pianoSongs.filter(s => s.status === 'mastered').length * 100), className: "h-1" }), pianoSongs.filter(s => s.status === 'learning').length > 0 && _jsxs("p", { className: "text-[9px] text-muted-foreground truncate", children: ["Aprendiendo: ", pianoSongs.find(s => s.status === 'learning')?.title] })] }), _jsxs("div", { className: "p-3 rounded-xl bg-muted/30 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDFB8" }), _jsx("span", { className: "text-xs font-medium", children: "Guitarra" })] }), _jsxs("p", { className: "text-lg font-bold", children: [guitarSongs.filter(s => s.status === 'mastered').length, _jsx("span", { className: "text-sm text-muted-foreground font-normal", children: "/1" })] }), _jsx(Progress, { value: Math.min(100, guitarSongs.filter(s => s.status === 'mastered').length * 100), className: "h-1" }), guitarSongs.filter(s => s.status === 'learning').length > 0 && _jsxs("p", { className: "text-[9px] text-muted-foreground truncate", children: ["Aprendiendo: ", guitarSongs.find(s => s.status === 'learning')?.title] })] }), _jsxs("div", { className: "p-3 rounded-xl bg-muted/30 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderKanban, { className: "w-4 h-4 text-blue-500" }), _jsx("span", { className: "text-xs font-medium", children: "Proyectos" })] }), _jsxs("p", { className: "text-lg font-bold", children: [projects.filter(p => p.status !== 'completed').length, _jsx("span", { className: "text-sm text-muted-foreground font-normal", children: " activos" })] }), _jsx(Progress, { value: projects.length > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0, className: "h-1" }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: [projects.filter(p => p.status === 'completed').length, "/", projects.length, " completados"] })] })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "w-3.5 h-3.5" }), "Metas Trimestrales \u2014 Tareas del Mes"] }), _jsx(Link, { to: "/goals", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver todas ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), activeGoals.length === 0 ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Target, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No hay metas activas este trimestre" })] }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: activeGoals.map(goal => {
                    const allTasks = goalTasksMap.get(goal.id) || [];
                    const monthTasks = getMonthTasks(allTasks);
                    const completedInMonth = monthTasks.filter(t => t.completed).length;
                    return (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-4 space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-sm truncate", children: goal.title }), goal.area_id && _jsx("p", { className: "text-[10px] text-muted-foreground capitalize", children: goal.area_id })] }), _jsxs(Badge, { variant: "secondary", className: "shrink-0 font-mono text-xs", children: [goal.progress_percentage, "%"] })] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-1.5" }), monthTasks.length > 0 && (_jsxs("div", { className: "pt-1", children: [_jsxs("p", { className: "text-[10px] font-medium text-muted-foreground flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), "Este mes (", completedInMonth, "/", monthTasks.length, ")"] }), monthTasks.slice(0, 3).map(task => (_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [_jsx(CheckCircle2, { className: cn("w-3 h-3 shrink-0", task.completed ? "text-green-500" : "text-muted-foreground/30") }), _jsx("span", { className: cn("truncate", task.completed && "line-through"), children: task.title }), task.due_date && (_jsx("span", { className: "text-[9px] text-muted-foreground/60 ml-auto", children: format(parseISO(task.due_date), 'd MMM', { locale: es }) }))] }, task.id))), monthTasks.length > 3 && _jsxs("p", { className: "text-[10px] text-muted-foreground/60 pl-5", children: ["+", monthTasks.length - 3, " m\u00E1s"] })] }))] }) }, goal.id));
                }) })), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-purple-500 to-pink-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5 text-purple-500" }), "Metas 12 Semanas"] }), _jsx(Link, { to: "/12-week-year", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1", children: ["Ver ", _jsx(ArrowRight, { className: "w-3 h-3" })] }) })] }), _jsxs("div", { className: "space-y-2", children: [twelveWeekGoals.filter(g => g.status !== 'completed' || g.progress_percentage > 0).slice(0, 6).map(goal => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-xs font-medium truncate", children: goal.title }), _jsxs("span", { className: "text-[10px] font-mono text-muted-foreground", children: [goal.progress_percentage, "%"] })] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-1 mt-0.5" })] })] }, goal.id))), twelveWeekGoals.length === 0 && _jsx("p", { className: "text-xs text-muted-foreground text-center py-3", children: "Sin metas configuradas" })] })] })] }), _jsx(MonthlyAreaGoals, { currentMonth: currentMonth })] }));
}
