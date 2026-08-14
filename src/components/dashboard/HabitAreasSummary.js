import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { habits as allHabits, lifeAreas, centralAreas } from "@/lib/data";
import { formatISO } from "date-fns";
export default function HabitAreasSummary({ habitHistory }) {
    const areaStats = useMemo(() => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        const areas = [...lifeAreas, ...centralAreas];
        return areas.map((area) => {
            const areaHabits = allHabits.filter((h) => h.areaId === area.id);
            const completed = areaHabits.filter((h) => habitHistory[h.id]?.completedDates?.some((d) => d.date === todayStr && d.status === "completed")).length;
            const progress = areaHabits.length > 0 ? (completed / areaHabits.length) * 100 : 0;
            return {
                area,
                completed,
                total: areaHabits.length,
                progress,
            };
        }).filter((stat) => stat.total > 0);
    }, [habitHistory]);
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resumen por \u00C1reas" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: areaStats.map((stat) => {
                        const Icon = stat.area.icon;
                        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm font-medium", children: stat.area.name })] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [stat.completed, "/", stat.total] })] }), _jsx(Progress, { value: stat.progress, className: "h-2" })] }, stat.area.id));
                    }) }) })] }));
}
