import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTimelineProgress } from '@/hooks/useTimelineProgress';
import { cn } from '@/lib/utils';
import { Clock, Target } from 'lucide-react';
const AREA_COLORS = {
    universidad: 'bg-blue-500',
    emprendimiento: 'bg-purple-500',
    proyectos: 'bg-orange-500',
    gym: 'bg-green-500',
    idiomas: 'bg-cyan-500',
    lectura: 'bg-amber-500',
    musica: 'bg-pink-500',
    general: 'bg-slate-500',
};
export function AreaStatsToday() {
    const { today, week, loading } = useTimelineProgress();
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/2" }), _jsx("div", { className: "h-8 bg-muted rounded" }), _jsx("div", { className: "h-8 bg-muted rounded" }), _jsx("div", { className: "h-8 bg-muted rounded" })] }) }) }));
    }
    const { areaBreakdown, hoursWorked, score } = today;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "flex items-center gap-2 text-lg", children: "\uD83D\uDCCA Mi Progreso Hoy por \u00C1rea" }), _jsxs(Badge, { variant: score >= 70 ? "default" : score >= 40 ? "secondary" : "outline", className: cn(score >= 70 && "bg-green-500 hover:bg-green-600", score < 40 && "border-destructive text-destructive"), children: ["Score: ", score, "/100"] })] }) }), _jsx(CardContent, { className: "space-y-4", children: areaBreakdown.length > 0 ? (_jsxs(_Fragment, { children: [areaBreakdown.map((area) => (_jsx(AreaProgressRow, { area: area, weeklyObjectives: week.objectivesProgress }, area.areaId))), _jsxs("div", { className: "pt-4 border-t space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Clock, { className: "w-4 h-4" }), "Tiempo productivo hoy"] }), _jsxs("span", { className: "font-mono font-medium", children: [hoursWorked, "h"] })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Target, { className: "w-4 h-4" }), "Tareas completadas"] }), _jsxs("span", { className: "font-mono font-medium", children: [today.tasksCompleted, "/", today.tasksTotal] })] })] })] })) : (_jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No hay tareas para mostrar estad\u00EDsticas" }), _jsx("p", { className: "text-sm", children: "Agrega tareas para ver tu progreso por \u00E1rea" })] })) })] }));
}
function AreaProgressRow({ area, weeklyObjectives }) {
    const barColor = AREA_COLORS[area.areaId] || AREA_COLORS.general;
    // Find matching weekly objective
    const weeklyObj = area.weeklyObjective ||
        weeklyObjectives.find(o => o.area.toLowerCase() === area.areaId);
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: area.icon }), _jsx("span", { className: "font-medium text-sm", children: area.area })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: [area.tasksCompleted, "/", area.tasksTotal, " tareas"] }), _jsxs(Badge, { variant: "outline", className: cn("font-mono", area.todayPercent >= 80 && "border-green-500 text-green-600 bg-green-500/10", area.todayPercent >= 40 && area.todayPercent < 80 && "border-amber-500 text-amber-600 bg-amber-500/10", area.todayPercent < 40 && "border-muted text-muted-foreground"), children: [Math.round(area.todayPercent), "%"] })] })] }), _jsxs("div", { className: "relative", children: [_jsx(Progress, { value: area.todayPercent, className: "h-2" }), _jsx("div", { className: cn("absolute top-0 left-0 h-2 rounded-full transition-all", barColor), style: { width: `${Math.min(100, area.todayPercent)}%` } })] }), weeklyObj && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground pl-7", children: [_jsxs("span", { children: ["Obj. semanal: ", weeklyObj.title] }), _jsxs("span", { className: "font-mono", children: ["[", weeklyObj.currentValue, "/", weeklyObj.targetValue, " = ", Math.round(weeklyObj.percent), "%]"] }), weeklyObj.percent >= 100 && (_jsx(Badge, { variant: "secondary", className: "text-[10px] px-1 py-0 bg-green-500/20 text-green-600", children: "\u2713 Logrado" }))] }))] }));
}
