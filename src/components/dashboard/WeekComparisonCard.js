import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from "lucide-react";
import { useWeekComparison } from "@/hooks/useWeekComparison";
import { Skeleton } from "@/components/ui/skeleton";
function CompareRow({ label, current, previous }) {
    const diff = current - previous;
    const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
    return (_jsxs("div", { className: "flex items-center justify-between py-1", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: label }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-bold", children: current }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: ["vs ", previous] }), diff > 0 ? (_jsxs("span", { className: "text-[10px] text-green-500 flex items-center", children: [_jsx(ArrowUpRight, { className: "w-3 h-3" }), "+", pct, "%"] })) : diff < 0 ? (_jsxs("span", { className: "text-[10px] text-red-500 flex items-center", children: [_jsx(ArrowDownRight, { className: "w-3 h-3" }), pct, "%"] })) : (_jsxs("span", { className: "text-[10px] text-muted-foreground flex items-center", children: [_jsx(Minus, { className: "w-3 h-3" }), "0%"] }))] })] }));
}
export function WeekComparisonCard() {
    const { thisWeek, lastWeek, loading } = useWeekComparison();
    if (loading)
        return _jsx(Skeleton, { className: "h-36 w-full" });
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-primary" }), "Esta Semana vs Anterior"] }) }), _jsxs(CardContent, { className: "space-y-1", children: [_jsx(CompareRow, { label: "Tareas", current: thisWeek.tasksCompleted, previous: lastWeek.tasksCompleted }), _jsx(CompareRow, { label: "Focus (min)", current: thisWeek.focusMinutes, previous: lastWeek.focusMinutes }), _jsx(CompareRow, { label: "Bloques", current: thisWeek.blocksCompleted, previous: lastWeek.blocksCompleted })] })] }));
}
