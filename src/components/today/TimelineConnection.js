import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimelineProgress } from '@/hooks/useTimelineProgress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
export function TimelineConnection() {
    const { today, week, month, quarter, projections, loading } = useTimelineProgress();
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-4 bg-muted rounded w-2/3" }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "h-24 bg-muted rounded flex-1" }), _jsx("div", { className: "h-24 bg-muted rounded flex-1" }), _jsx("div", { className: "h-24 bg-muted rounded flex-1" }), _jsx("div", { className: "h-24 bg-muted rounded flex-1" })] })] }) }) }));
    }
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return _jsx(TrendingUp, { className: "w-4 h-4 text-green-500" });
            case 'down': return _jsx(TrendingDown, { className: "w-4 h-4 text-destructive" });
            default: return _jsx(Minus, { className: "w-4 h-4 text-muted-foreground" });
        }
    };
    const todayPending = today.tasksTotal - today.tasksCompleted;
    const weeklyImprovement = projections.weeklyCompletionIfTodayDone - projections.currentWeeklyPercent;
    return (_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "flex items-center gap-2 text-lg", children: "\uD83D\uDD17 C\u00F3mo Hoy Construye Mi Futuro" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-4 gap-2 relative", children: [_jsx("div", { className: "absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-primary/50 to-muted hidden sm:block" }), _jsx(TimelineNode, { label: "HOY", primary: `${today.tasksCompleted}/${today.tasksTotal}`, sublabel: "tareas", progress: today.score, isActive: true, status: today.score >= 70 ? 'success' : today.score >= 40 ? 'warning' : 'pending' }), _jsx(TimelineNode, { label: "SEMANA", primary: `${week.tasksCompleted}/${week.tasksTotal}`, sublabel: `${week.daysRemaining}d restantes`, progress: week.averagePercent, status: week.onTrack ? 'success' : 'warning' }), _jsx(TimelineNode, { label: "MES", primary: `${month.tasksCompleted}/${month.tasksTotal}`, sublabel: `${month.daysProductiveCount} días prod.`, progress: (month.tasksCompleted / Math.max(1, month.tasksTotal)) * 100, trend: month.trend, status: month.averageScore >= 3.5 ? 'success' : month.averageScore >= 2.5 ? 'warning' : 'pending' }), _jsx(TimelineNode, { label: "TRIMESTRE", primary: `S${quarter.weekNumber}/12`, sublabel: `${quarter.goalsProgress.length} metas`, progress: quarter.goalsProgress.length > 0
                                    ? quarter.goalsProgress.reduce((sum, g) => sum + g.progressPercent, 0) / quarter.goalsProgress.length
                                    : 0, status: quarter.onTrack ? 'success' : 'warning' })] }), _jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg", todayPending > 0
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-green-500/10 border border-green-500/20"), children: [_jsx(Lightbulb, { className: cn("w-5 h-5 mt-0.5 shrink-0", todayPending > 0 ? "text-amber-500" : "text-green-500") }), _jsx("div", { className: "space-y-1 text-sm", children: todayPending > 0 ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "font-medium", children: ["Si completas tus ", todayPending, " tarea", todayPending > 1 ? 's' : '', " pendiente", todayPending > 1 ? 's' : '', ":"] }), _jsxs("p", { className: "text-muted-foreground", children: ["Tu semana subir\u00E1 de ", projections.currentWeeklyPercent, "% a ", projections.weeklyCompletionIfTodayDone, "%", _jsxs("span", { className: "text-green-600 font-medium", children: [" (+", Math.round(weeklyImprovement), "%)"] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-medium text-green-700 dark:text-green-300", children: "\u00A1Excelente! Has completado todas las tareas de hoy \uD83C\uDF89" }), _jsxs("p", { className: "text-muted-foreground", children: ["Progreso semanal actual: ", projections.currentWeeklyPercent, "%"] })] })) })] }), quarter.goalsProgress.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Metas trimestrales" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: quarter.goalsProgress.slice(0, 4).map((goal) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs", children: [_jsxs("div", { className: "w-8 h-8 rounded-full bg-background flex items-center justify-center font-mono font-bold text-xs", children: [goal.progressPercent, "%"] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate", children: goal.title }), _jsx("p", { className: "text-muted-foreground capitalize", children: goal.category })] })] }, goal.id))) })] }))] })] }));
}
function TimelineNode({ label, primary, sublabel, progress, isActive, status, trend, }) {
    const statusColors = {
        success: 'border-green-500 bg-green-500/10',
        warning: 'border-amber-500 bg-amber-500/10',
        pending: 'border-muted bg-muted/50',
    };
    const dotColors = {
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        pending: 'bg-muted-foreground',
    };
    return (_jsxs("div", { className: "relative z-10 text-center", children: [_jsx("div", { className: cn("w-4 h-4 rounded-full mx-auto mb-2 ring-4 ring-background", dotColors[status], isActive && "ring-primary ring-2") }), _jsxs("div", { className: cn("p-2 rounded-lg border transition-all", statusColors[status], isActive && "ring-2 ring-primary/50"), children: [_jsx("p", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wide", children: label }), _jsx("p", { className: "text-lg font-bold font-mono", children: primary }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: sublabel }), _jsx("div", { className: "mt-1.5 h-1 bg-background rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all", status === 'success' ? 'bg-green-500' :
                                status === 'warning' ? 'bg-amber-500' : 'bg-muted-foreground'), style: { width: `${Math.min(100, progress)}%` } }) }), trend && (_jsxs("div", { className: "mt-1 flex justify-center", children: [trend === 'up' && _jsx(TrendingUp, { className: "w-3 h-3 text-green-500" }), trend === 'down' && _jsx(TrendingDown, { className: "w-3 h-3 text-destructive" }), trend === 'stable' && _jsx(Minus, { className: "w-3 h-3 text-muted-foreground" })] }))] })] }));
}
