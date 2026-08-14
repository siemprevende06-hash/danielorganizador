import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, addWeeks, subWeeks, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeeklyTimeBreakdown } from '@/components/weekly/WeeklyTimeBreakdown';
import { WeeklySystemsStats } from '@/components/systems/WeeklySystemsStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { MonthlyPlanSummary } from '@/components/monthly-planning/MonthlyPlanSummary';
import { getQuarterFromDate } from '@/lib/hierarchy';
import PeriodSections from '@/components/hierarchy/PeriodSections';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { FocusProcessPanel } from '@/components/focus/FocusProcessPanel';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle } from '@/components/control/EsfuerzoResultadosToggle';
import { PlanSemanal } from '@/components/plan/PlanSemanal';
import { ResultadosSemana } from '@/components/resultados/ResultadosSemana';
import { AutocriticaSection } from '@/components/autocritica/AutocriticaSection';
export default function WeeklyView() {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [viewMode, setViewMode] = useState('esfuerzo');
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart.toISOString()]);
    const { data: weekData } = useQuery({
        queryKey: ['weeklyData', format(weekStart, 'yyyy-MM-dd')],
        queryFn: async () => {
            const startStr = format(weekStart, 'yyyy-MM-dd');
            const endStr = format(weekEnd, 'yyyy-MM-dd');
            const [tasksRes, reviewsRes, activityRes, focusRes, habitsRes, systemsRes, areaStatsRes] = await Promise.all([
                supabase.from('tasks').select('*').gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
                supabase.from('daily_reviews').select('*').gte('review_date', startStr).lte('review_date', endStr),
                supabase.from('activity_tracking').select('*').gte('activity_date', startStr).lte('activity_date', endStr),
                supabase.from('focus_sessions').select('*').gte('start_time', `${startStr}T00:00:00`).lte('start_time', `${endStr}T23:59:59`),
                supabase.from('habit_history').select('*'),
                supabase.from('daily_systems_tracking').select('tracking_date, completions, time_data').gte('tracking_date', startStr).lte('tracking_date', endStr),
                supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', startStr).lte('stat_date', endStr),
            ]);
            return {
                tasks: tasksRes.data || [],
                reviews: reviewsRes.data || [],
                activities: activityRes.data || [],
                focusSessions: focusRes.data || [],
                habits: habitsRes.data || [],
                systems: systemsRes.data || [],
                areaStats: areaStatsRes.data || [],
            };
        }
    });
    const SOSTEN_IDS = [
        'meditacion', 'lectura_inspiradora', 'oracion', 'diario_agradecimiento',
        'ejercicio_mañana', 'caminata', 'hidratacion_agua',
        'bajar_pantallas', 'orden_habitacion', 'lectura_biblia',
        'suplementos', 'plan_dia', 'revision_dia',
    ];
    const getDayData = (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = weekData?.tasks.filter(t => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === dateStr) || [];
        const review = weekData?.reviews.find(r => r.review_date === dateStr);
        const activities = weekData?.activities.filter(a => a.activity_date === dateStr) || [];
        const focusMin = weekData?.focusSessions
            .filter(f => format(new Date(f.start_time), 'yyyy-MM-dd') === dateStr)
            .reduce((sum, f) => sum + (f.duration_minutes || 0), 0) || 0;
        const completed = dayTasks.filter(t => t.completed).length;
        const total = dayTasks.length;
        // Daily systems data
        const sysRow = weekData?.systems.find((s) => s.tracking_date === dateStr);
        const completions = sysRow?.completions || {};
        const timeData = sysRow?.time_data || {};
        const sosteenDone = SOSTEN_IDS.filter(id => completions[id] === true).length;
        const sosteenPct = SOSTEN_IDS.length > 0 ? Math.round((sosteenDone / SOSTEN_IDS.length) * 100) : 0;
        const totalMin = Object.values(timeData).reduce((s, v) => s + (Number(v) || 0), 0);
        const taskPct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const reviewScore = review?.overall_rating ? review.overall_rating * 20 : 0;
        const effortScore = Math.min(100, Math.round(totalMin / 1.2));
        const score = reviewScore > 0 ? reviewScore : Math.max(taskPct, sosteenPct, effortScore);
        const isFuture = isBefore(new Date(), day) && !isToday(day);
        return { tasks: dayTasks, completed, total, score, focusMin, activities, review, isFuture };
    };
    const monthForPlan = weekStart;
    const { quarter, year } = getQuarterFromDate(weekStart);
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-5xl mx-auto space-y-5", children: [_jsx("div", { className: "flex justify-center", children: _jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Semanal" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [format(weekStart, "d MMM", { locale: es }), " \u2013 ", format(weekEnd, "d 'de' MMMM", { locale: es })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setCurrentWeek(subWeeks(currentWeek, 1)), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", className: "h-8 text-xs rounded-full", onClick: () => setCurrentWeek(new Date()), children: "Hoy" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setCurrentWeek(addWeeks(currentWeek, 1)), children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }), viewMode === 'plan' ? (_jsx(PlanSemanal, { weekDays: weekDays, tasks: weekData?.tasks || [], queryKeyPrefix: "weeklyData" })) : viewMode === 'esfuerzo' ? (_jsxs(_Fragment, { children: [_jsx(PeriodControlSection, { scope: "week", start: weekStart, end: weekEnd }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Resumen" }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: weekDays.map(day => {
                                        const d = getDayData(day);
                                        const active = isToday(day);
                                        const scoreColor = d.isFuture ? 'border-muted/30' : d.score >= 70 ? 'border-green-500/40 bg-green-500/5' : d.score >= 40 ? 'border-amber-500/40 bg-amber-500/5' : d.score > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-muted/20';
                                        return (_jsx(Card, { className: cn("border bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm rounded-2xl transition-all", scoreColor, active && "ring-2 ring-primary ring-offset-2"), children: _jsxs(CardContent, { className: "p-2.5 space-y-2", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[9px] uppercase font-semibold text-muted-foreground/60", children: format(day, 'EEE', { locale: es }) }), _jsx("p", { className: cn("text-xl font-bold leading-tight mt-0.5", active && "text-primary"), children: format(day, 'd') })] }), !d.isFuture && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold", d.score >= 70 ? "text-green-600 bg-green-500/15" :
                                                                        d.score >= 40 ? "text-amber-600 bg-amber-500/15" :
                                                                            d.score > 0 ? "text-destructive bg-destructive/10" :
                                                                                "text-muted-foreground/40 bg-muted/30"), children: d.score || '0' }) }), _jsxs("div", { className: "space-y-0.5 text-[9px] text-muted-foreground text-center", children: [_jsxs("p", { children: [d.completed, "/", d.total, " tareas"] }), d.focusMin > 0 && _jsxs("p", { className: "text-[8px]", children: ["\u23F1 ", d.focusMin, "m"] })] }), d.total > 0 && (_jsx(Progress, { value: (d.completed / d.total) * 100, className: "h-0.5" }))] })), d.isFuture && (_jsx("p", { className: "text-[9px] text-center text-muted-foreground/30 pt-3", children: "\u2014" }))] }) }, day.toISOString()));
                                    }) }), _jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "p-4", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-3", children: "Rendimiento diario" }), _jsx("div", { className: "flex gap-1.5 h-20 items-end", children: weekDays.map(day => {
                                                    const d = getDayData(day);
                                                    const pct = Math.max(d.score, 3);
                                                    return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1", children: [_jsx("span", { className: "text-[8px] text-muted-foreground/60 font-mono", children: d.score > 0 ? d.score : '' }), _jsx("div", { className: "w-full flex-1 flex flex-col justify-end", children: _jsx("div", { className: cn("w-full rounded-lg transition-all min-h-[4px]", d.score >= 70 ? "bg-green-500" : d.score >= 40 ? "bg-amber-500" : d.score > 0 ? "bg-destructive/50" : "bg-muted/30"), style: { height: `${pct}%` } }) }), _jsx("p", { className: "text-[9px] text-muted-foreground/60", children: format(day, 'EEEEE', { locale: es }) })] }, day.toISOString()));
                                                }) })] }) })] }), _jsx(PeriodSections, { scope: "week", year: year, quarter: quarter, weekStart: weekStart, hideStats: true }), _jsx(MonthlyPlanSummary, { currentMonth: monthForPlan }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Tiempo" }), _jsx(WeeklyTimeBreakdown, { weekStart: weekStart, weekEnd: weekEnd })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Sistemas" }), _jsx("div", { className: "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4", children: _jsx(WeeklySystemsStats, { weekStart: weekStart }) })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Mejora" }), _jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-4", children: _jsx(MejoraProcessPanel, { anchorDate: weekStart }) }) })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Enfoque" }), _jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-4", children: _jsx(FocusProcessPanel, { anchorDate: weekStart }) }) })] })] })) : viewMode === 'resultados' ? (_jsx(ResultadosSemana, { weekStart: weekStart })) : (_jsx(AutocriticaSection, { start: weekStart, end: weekEnd, scope: 'week' }))] }) }));
}
