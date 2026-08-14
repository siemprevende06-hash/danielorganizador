import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffortConfig } from '@/hooks/useEffortConfig';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { getDaysInPeriod } from '@/hooks/useWeeklyData';
export function AreaEffortCard({ areaId, areaLabel, areaIcon, areaColor, periodType, periodDays, actualMinutes }) {
    const { getConfig, updateConfig } = useEffortConfig();
    const config = getConfig(areaId);
    const days = periodDays > 0 ? periodDays : getDaysInPeriod(periodType, new Date());
    const avgDailyMinutes = days > 0 ? Math.round(actualMinutes / days) : 0;
    const effectiveLevel = avgDailyMinutes >= config.alto ? 'alto' : avgDailyMinutes >= config.normal ? 'normal' : avgDailyMinutes >= config.bajo ? 'bajo' : null;
    const targetForPeriod = (level) => level * days;
    const bajoTarget = targetForPeriod(config.bajo);
    const normalTarget = targetForPeriod(config.normal);
    const altoTarget = targetForPeriod(config.alto);
    const progressVs = (target) => target > 0 ? Math.min(100, Math.round((actualMinutes / target) * 100)) : 0;
    const activeProgress = config.normal > 0 ? progressVs(config.normal * days) : 0;
    return (_jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("w-2.5 h-2.5 rounded-full", areaColor) }), _jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: "Esfuerzo" })] }), _jsx("div", { className: "flex items-center gap-2", children: ['bajo', 'normal', 'alto'].map(level => {
                    const val = config[level];
                    const pct = progressVs(targetForPeriod(val));
                    const isActive = effectiveLevel === level;
                    return (_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-1 mb-1", children: [_jsx("span", { className: cn("text-[10px] font-medium uppercase", isActive ? "text-foreground" : "text-muted-foreground/60"), children: level }), _jsxs("div", { className: "flex items-center gap-0.5 ml-auto", children: [_jsx("input", { type: "number", min: 1, max: 999, className: cn("w-12 h-6 text-xs text-center rounded-md border bg-transparent", "focus:outline-none focus:ring-1 focus:ring-primary", isActive && "border-primary/50"), value: val, onChange: e => {
                                                    const v = parseInt(e.target.value) || 1;
                                                    updateConfig(areaId, { ...config, [level]: v });
                                                } }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "min" })] })] }), _jsx(Progress, { value: pct, className: cn("h-1.5", isActive ? "opacity-100" : "opacity-30") }), _jsxs("p", { className: "text-[9px] text-muted-foreground/60 mt-0.5 text-right", children: [actualMinutes, "/", targetForPeriod(val), "min"] })] }, level));
                }) }), _jsxs("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5", children: [_jsxs("span", { children: ["Promedio real: ", _jsxs("strong", { children: [avgDailyMinutes, " min/d\u00EDa"] })] }), _jsxs("span", { children: ["Meta activa: ", _jsx("strong", { className: cn(effectiveLevel === 'alto' && 'text-green-500', effectiveLevel === 'normal' && 'text-amber-500', effectiveLevel === 'bajo' && 'text-blue-500', !effectiveLevel && 'text-muted-foreground'), children: effectiveLevel ? `${config[effectiveLevel]} min/día (${effectiveLevel})` : 'Sin actividad' })] })] })] }));
}
