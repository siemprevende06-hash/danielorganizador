import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, CalendarDays, TrendingUp, BarChart3, Clock, Droplets, Flame, Dumbbell, CheckCircle2, Target, Activity } from 'lucide-react';
import { useTimeRangeStats } from '@/hooks/useTimeRangeStats';
const TF_LABELS = {
    today: 'HOY',
    week: 'SEMANA',
    month: 'MES',
    quarter: 'TRIMESTRE',
    year: 'AÑO',
    sprint: 'SPRINT',
};
const TF_ICONS = {
    today: _jsx(Zap, { className: "h-4 w-4 text-primary" }),
    week: _jsx(CalendarDays, { className: "h-4 w-4 text-purple-500" }),
    month: _jsx(BarChart3, { className: "h-4 w-4 text-blue-500" }),
    quarter: _jsx(TrendingUp, { className: "h-4 w-4 text-emerald-500" }),
    year: _jsx(Activity, { className: "h-4 w-4 text-amber-500" }),
    sprint: _jsx(Target, { className: "h-4 w-4 text-rose-500" }),
};
function getScoreColor(pct) {
    if (pct >= 80)
        return 'text-green-500';
    if (pct >= 50)
        return 'text-amber-500';
    return 'text-red-500';
}
function getScoreBg(pct) {
    if (pct >= 80)
        return 'bg-green-500/10 border-green-500/30';
    if (pct >= 50)
        return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
}
export function RealStatsDashboard({ timeframe }) {
    const stats = useTimeRangeStats();
    if (stats.loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" }) }) }));
    }
    const { day, week, month, quarter, currentStreak } = stats;
    const renderToday = () => (_jsx(Card, { className: cn("border-2", getScoreBg(day.completionPct)), children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "h-4 w-4 text-primary" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "HOY" })] }), day.hasData && (_jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [day.wakeTime || '--', " \u00B7 ", day.sleepTime || '--'] }))] }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: cn("text-3xl font-bold", getScoreColor(day.completionPct)), children: [day.completionPct, "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Completado" })] }), _jsx(Progress, { value: day.completionPct, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-sm font-bold", children: [day.habitsDone, "/", day.totalHabits] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "h\u00E1bitos" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-primary mx-auto mb-0.5" }), _jsxs("p", { className: "text-sm font-bold", children: [day.totalMinutes, "m"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "minutos" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Droplets, { className: "h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-sm font-bold", children: [day.waterGlasses, "/7"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "agua" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Dumbbell, { className: "h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-sm font-bold", children: [day.workoutMinutes, "m"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "gym" })] })] })] }) }));
    const renderWeek = () => (_jsx(Card, { className: "border-2 border-primary/10", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4 text-purple-500" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "SEMANA" }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [week.activeDays, "/7 d\u00EDas"] })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsxs("span", { className: cn("text-3xl font-bold", getScoreColor(week.avgCompletionPct)), children: [week.avgCompletionPct, "%"] }), _jsx("span", { className: "text-lg", children: week.trend === 'up' ? '📈' : week.trend === 'down' ? '📉' : '➡️' })] }), _jsxs("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: ["Promedio \u00B7 vs ", week.previousWeekAvg, "% semana anterior"] })] }), _jsx(Progress, { value: week.avgCompletionPct, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold text-green-500", children: [week.bestDay, "%"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "mejor" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold", children: [week.totalMinutes, "m"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "totales" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold text-red-500", children: [week.worstDay, "%"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "peor" })] })] }), week.totalWorkouts > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground justify-center", children: [_jsx(Dumbbell, { className: "h-3 w-3 text-orange-500" }), _jsxs("span", { children: [week.totalWorkouts, " workouts \u00B7 ", week.avgMinutesPerDay, " min/d\u00EDa"] })] }))] }) }));
    const renderMonth = () => (_jsx(Card, { className: "border-2 border-primary/10", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BarChart3, { className: "h-4 w-4 text-blue-500" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "MES" }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [month.activeDays, " d\u00EDas"] })] }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: cn("text-3xl font-bold", getScoreColor(month.avgCompletionPct)), children: [month.avgCompletionPct, "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Promedio mensual" })] }), _jsx(Progress, { value: month.avgCompletionPct, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold text-green-500", children: [month.bestDay, "%"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "mejor d\u00EDa" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold", children: [month.totalMinutes, "m"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "totales" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Flame, { className: "h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" }), _jsx("p", { className: "text-sm font-bold", children: currentStreak }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "racha" })] })] })] }) }));
    const renderQuarter = () => (_jsx(Card, { className: "border-2 border-primary/10", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-emerald-500" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "TRIMESTRE" }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [quarter.activeDays, "d"] })] }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: cn("text-3xl font-bold", getScoreColor(quarter.overallConsistency)), children: [quarter.overallConsistency, "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Consistencia global" })] }), _jsx(Progress, { value: quarter.overallConsistency, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold", children: [quarter.avgCompletionPct, "%"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "promedio" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(CalendarDays, { className: "h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" }), _jsxs("p", { className: "text-sm font-bold", children: [quarter.activeDays, "/", quarter.totalActiveDays] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "d\u00EDas activos" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Flame, { className: "h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" }), _jsx("p", { className: "text-sm font-bold", children: currentStreak }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "racha actual" })] })] })] }) }));
    const renderYear = () => {
        const yearProgress = quarter.avgCompletionPct || 0;
        return (_jsx(Card, { className: "border-2 border-primary/10", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-4 w-4 text-amber-500" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "A\u00D1O" }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [quarter.activeDays, "d"] })] }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: cn("text-3xl font-bold", getScoreColor(yearProgress)), children: [yearProgress, "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Consistencia anual" })] }), _jsx(Progress, { value: yearProgress, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsxs("p", { className: "text-sm font-bold", children: [quarter.avgCompletionPct, "%"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "promedio trimestre" })] }), _jsxs("div", { className: "p-2 rounded bg-muted/30", children: [_jsx(Flame, { className: "h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" }), _jsx("p", { className: "text-sm font-bold", children: currentStreak }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: "racha actual" })] })] })] }) }));
    };
    const renderSprint = () => renderMonth();
    const RENDERERS = {
        today: renderToday,
        week: renderWeek,
        month: renderMonth,
        quarter: renderQuarter,
        year: renderYear,
        sprint: renderSprint,
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [TF_ICONS[timeframe] || TF_ICONS.today, _jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: TF_LABELS[timeframe] || 'HOY' }), _jsx("div", { className: "flex items-center gap-1 ml-auto", children: _jsxs("span", { className: cn("text-lg font-bold", getScoreColor(timeframe === 'today' ? day.completionPct :
                                timeframe === 'week' ? week.avgCompletionPct :
                                    timeframe === 'month' ? month.avgCompletionPct :
                                        timeframe === 'quarter' ? quarter.overallConsistency :
                                            timeframe === 'year' ? quarter.overallConsistency :
                                                month.avgCompletionPct)), children: [timeframe === 'today' ? day.completionPct :
                                    timeframe === 'week' ? week.avgCompletionPct :
                                        timeframe === 'month' ? month.avgCompletionPct :
                                            timeframe === 'quarter' ? quarter.overallConsistency :
                                                timeframe === 'year' ? quarter.overallConsistency :
                                                    month.avgCompletionPct, "%"] }) })] }), (RENDERERS[timeframe] || renderToday)()] }));
}
