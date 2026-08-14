import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AREAS_WITH_METRICS } from '@/data/areaMetricsData';
import { useWeeklyData, getWeekKey, getWeeksInRange } from '@/hooks/useWeeklyData';
import { AreaEffortCard } from './AreaEffortCard';
import { AreaResultsCard } from './AreaResultsCard';
export function AreaEffortResultsPanel({ periodType, periodStart }) {
    const { getWeek, setEffortMinutes, setMetricValue, sumEffortForWeeks, sumMetricForWeeks, getEffortMinutes, getMetricValue } = useWeeklyData();
    const { weekKeys, daysInPeriod, periodLabel } = useMemo(() => {
        if (periodType === 'week') {
            const wk = getWeekKey(periodStart);
            return { weekKeys: [wk], daysInPeriod: 7, periodLabel: `Sem ${format(periodStart, "w", { locale: es })}` };
        }
        if (periodType === 'month') {
            const start = startOfMonth(periodStart);
            const end = endOfMonth(periodStart);
            const keys = getWeeksInRange(start, end);
            const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return { weekKeys: keys, daysInPeriod: days, periodLabel: format(periodStart, 'MMMM', { locale: es }) };
        }
        const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
        const end = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0);
        const keys = getWeeksInRange(start, end);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return { weekKeys: keys, daysInPeriod: days, periodLabel: `Q${Math.floor(periodStart.getMonth() / 3) + 1}` };
    }, [periodType, periodStart]);
    const editable = periodType === 'week';
    const mainWeekKey = weekKeys[0];
    const groups = useMemo(() => {
        const principales = AREAS_WITH_METRICS.filter(a => a.group === 'principales');
        const adicionales = AREAS_WITH_METRICS.filter(a => a.group === 'adicionales');
        return [principales, adicionales].filter(g => g.length > 0);
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("p", { className: "text-xs text-muted-foreground", children: [periodType === 'week' ? 'Edita tu esfuerzo y resultados de esta semana.' :
                        periodType === 'month' ? 'Resumen del mes basado en tus semanas. Los valores son de solo lectura.' :
                            'Resumen del trimestre basado en tus semanas. Los valores son de solo lectura.', !editable && weekKeys.length > 0 && (_jsxs("span", { className: "block text-[10px] text-muted-foreground/60 mt-0.5", children: ["Datos agregados de ", weekKeys.length, " semana", weekKeys.length !== 1 ? 's' : ''] }))] }), groups.map((group, gi) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("span", { children: gi === 0 ? 'Metas Principales' : 'Metas Adicionales' }), _jsx("div", { className: "h-px flex-1 bg-border" })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: group.map(area => {
                            const actualMinutes = editable
                                ? getEffortMinutes(mainWeekKey, area.areaId)
                                : sumEffortForWeeks(weekKeys, area.areaId);
                            const getCurrentValue = (metricId) => {
                                if (editable)
                                    return getMetricValue(mainWeekKey, area.areaId, metricId);
                                return sumMetricForWeeks(weekKeys, area.areaId, metricId);
                            };
                            const targetForPeriod = (m) => {
                                if (periodType === 'week' && m.targetWeek !== null)
                                    return m.targetWeek;
                                if (periodType === 'month')
                                    return m.targetMonth;
                                return m.targetQuarter;
                            };
                            return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-1", area.color) }), _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: "text-lg", children: area.icon }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm", children: area.label }), editable && (_jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: "Esfuerzo semanal:" }), _jsx("input", { type: "number", min: 0, className: "w-16 h-5 text-[10px] text-center rounded border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary", value: actualMinutes, onChange: e => setEffortMinutes(mainWeekKey, area.areaId, parseInt(e.target.value) || 0) }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "min" })] }))] })] }), _jsx(AreaEffortCard, { areaId: area.areaId, areaLabel: area.label, areaIcon: area.icon, areaColor: area.color, periodType: periodType, periodDays: daysInPeriod, actualMinutes: actualMinutes }), _jsx("div", { className: "border-t border-border/50 pt-3", children: _jsx(AreaResultsCard, { areaId: area.areaId, metrics: area.metrics, getCurrentValue: getCurrentValue, targetForPeriod: targetForPeriod, editable: editable, onMetricChange: (metricId, value) => setMetricValue(mainWeekKey, area.areaId, metricId, value), periodLabel: periodLabel }) })] })] }, area.areaId));
                        }) })] }, gi)))] }));
}
