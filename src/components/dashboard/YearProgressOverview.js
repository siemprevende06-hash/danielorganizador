import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { differenceInDays, startOfYear, endOfYear, getWeek, getQuarter } from "date-fns";
export function YearProgressOverview() {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const daysPassed = differenceInDays(now, yearStart) + 1;
    const totalDays = differenceInDays(yearEnd, yearStart) + 1;
    const daysRemaining = totalDays - daysPassed;
    const yearProgress = Math.round((daysPassed / totalDays) * 100);
    const currentWeek = getWeek(now, { weekStartsOn: 1 });
    const currentQuarter = getQuarter(now);
    const weekInQuarter = ((currentWeek - 1) % 12) + 1;
    return (_jsxs(Card, { className: "col-span-full", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), "Progreso del A\u00F1o 2026"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: ["D\u00EDa ", daysPassed, " de ", totalDays] }), _jsxs("span", { className: "font-semibold", children: [yearProgress, "%"] })] }), _jsx(Progress, { value: yearProgress, className: "h-3" }), _jsxs("p", { className: "text-xs text-muted-foreground text-center", children: [daysRemaining, " d\u00EDas restantes"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 pt-2", children: [_jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: currentWeek }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Semana del a\u00F1o" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsxs("div", { className: "text-2xl font-bold text-primary", children: ["Q", currentQuarter] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Trimestre" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsxs("div", { className: "text-2xl font-bold text-primary", children: [weekInQuarter, "/12"] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Semana en Q" })] })] })] })] }));
}
