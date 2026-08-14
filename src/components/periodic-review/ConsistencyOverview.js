import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame } from 'lucide-react';
export function ConsistencyOverview({ consistency }) {
    const overallAvg = consistency.length > 0
        ? Math.round(consistency.reduce((s, c) => s + c.percentage, 0) / consistency.length)
        : 0;
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Flame, { className: "h-5 w-5 text-orange-500" }), "Constancia del Per\u00EDodo"] }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Progress, { value: overallAvg, className: "h-2 flex-1" }), _jsxs("span", { className: "text-sm font-bold", children: [overallAvg, "%"] })] })] }), _jsxs(CardContent, { className: "space-y-3", children: [consistency.map(c => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "font-medium", children: c.label }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [c.totalMinutes !== undefined && c.totalMinutes > 0 && (_jsxs("span", { className: "flex items-center gap-0.5", children: [_jsx(Clock, { className: "h-3 w-3" }), Math.round(c.totalMinutes / 60), "h ", c.totalMinutes % 60, "m"] })), _jsxs("span", { className: "font-medium text-foreground", children: [c.daysActive, "/", c.totalDays, "d"] })] })] }), _jsx(Progress, { value: c.percentage, className: `h-1.5 ${c.percentage >= 80 ? '[&>div]:bg-green-500' :
                                    c.percentage >= 50 ? '[&>div]:bg-yellow-500' :
                                        '[&>div]:bg-destructive'}` })] }, c.area))), consistency.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Sin datos de constancia para este per\u00EDodo" }))] })] }));
}
