import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Shield, Activity } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { useWeeklyReview } from "@/hooks/useWeeklyReview";
const COLORS = {
    green: "#22c55e",
    blue: "#3b82f6",
    red: "#ef4444",
    amber: "#f59e0b",
    purple: "#a855f7",
    emerald: "#10b981",
    rose: "#f43f5e",
};
const AREA_COLORS = {
    universidad: COLORS.blue,
    emprendimiento: COLORS.purple,
    proyectos: COLORS.amber,
    idiomas: COLORS.emerald,
};
function StatDonut({ pct, value, label }) {
    const color = pct >= 90 ? COLORS.green : pct >= 60 ? COLORS.blue : pct >= 30 ? COLORS.amber : COLORS.red;
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("div", { className: "relative", children: [_jsx(PieChart, { width: 80, height: 80, children: _jsxs(Pie, { data: [
                                { name: "done", value: Math.max(pct, 1) },
                                { name: "remaining", value: Math.max(100 - pct, 0) },
                            ], cx: 40, cy: 40, innerRadius: 28, outerRadius: 36, startAngle: 90, endAngle: -270, dataKey: "value", stroke: "none", children: [_jsx(Cell, { fill: color }), _jsx(Cell, { fill: "hsl(var(--muted))" })] }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("span", { className: "text-[10px] font-bold leading-none", children: [pct, "%"] }) })] }), _jsx("span", { className: "text-xs font-semibold leading-tight text-center", children: value }), _jsx("span", { className: "text-[9px] text-muted-foreground leading-tight text-center", children: label })] }));
}
export function WeeklyReviewStats({ weekStart }) {
    const { data, loading } = useWeeklyReview(weekStart);
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "animate-pulse h-12 bg-muted rounded" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [1, 2, 3, 4].map(i => _jsx("div", { className: "animate-pulse h-24 bg-muted rounded" }, i)) })] }));
    }
    if (!data) {
        return (_jsx(Card, { className: "p-6 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "No hay datos para esta semana" }) }));
    }
    const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;
    const taskPct = pct(data.totalTasksCompleted, data.totalTasks);
    const habitsPct = pct(data.totalHabitsCompleted, data.totalHabits);
    const waterPct = pct(data.waterCompletions, data.waterTotal);
    const focusGoal = data.activeDays * 120;
    const focusPct = pct(data.totalFocusMinutes, focusGoal);
    const workoutGoal = data.activeDays * 45;
    const workoutPct = pct(data.totalWorkoutMinutes, workoutGoal);
    const totalTime = Object.values(data.timeData).reduce((a, b) => a + b, 0);
    const timePct = totalTime > 0 ? Math.min(100, Math.round(totalTime / (data.activeDays * 480) * 100)) : 0;
    const blocksPct = data.totalBlocks > 0 ? pct(data.totalBlockCompletions, data.totalBlocks) : 0;
    const activePct = pct(data.activeDays, data.totalDays);
    const statDonuts = [
        { pct: taskPct, value: `${data.totalTasksCompleted}/${data.totalTasks}`, label: "Tareas", min: 60, max: 100 },
        { pct: Math.round(data.avgOverallRating * 10), value: `${data.avgOverallRating}/10`, label: "Rating", min: 60, max: 90 },
        { pct: focusPct, value: `${Math.round(data.totalFocusMinutes / 60 * 10) / 10}h`, label: "Foco", min: 60, max: 100 },
        { pct: workoutPct, value: `${Math.round(data.totalWorkoutMinutes / 60 * 10) / 10}h`, label: "Ejercicio", min: 60, max: 100 },
        { pct: waterPct, value: `${data.waterCompletions}/${data.waterTotal}`, label: "Agua", min: 60, max: 100 },
        { pct: activePct, value: `${data.activeDays}/${data.totalDays}`, label: "Días activos", min: 60, max: 100 },
        { pct: timePct, value: `${Math.round(totalTime / 60 * 10) / 10}h`, label: "Tiempo invertido", min: 50, max: 80 },
        { pct: blocksPct, value: `${data.totalBlockCompletions}`, label: "Bloques", min: 50, max: 100 },
    ];
    const timeAreas = [
        { id: "universidad", label: "Universidad", icon: "🎓", goal: data.activeDays * 120 },
        { id: "emprendimiento", label: "Emprendimiento", icon: "💼", goal: data.activeDays * 60 },
        { id: "proyectos", label: "Proyectos", icon: "🚀", goal: data.activeDays * 60 },
        { id: "idiomas", label: "Idiomas", icon: "🌍", goal: data.activeDays * 60 },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Card, { className: cn("border-2 overflow-hidden", data.avgOverallRating >= 7 ? "border-green-500/30 bg-green-500/5" :
                    data.avgOverallRating >= 5 ? "border-amber-500/30 bg-amber-500/5" :
                        "border-red-500/30 bg-red-500/5"), children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("div", { className: "text-4xl font-bold mb-1", children: data.avgOverallRating }), _jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wider font-medium", children: "Rating promedio de la semana" }), _jsx("div", { className: "flex justify-center mt-2", children: _jsx(PieChart, { width: 120, height: 40, children: _jsxs(Pie, { data: [
                                        { name: "done", value: Math.max(Math.round(data.avgOverallRating * 10), 1) },
                                        { name: "remaining", value: Math.max(100 - Math.round(data.avgOverallRating * 10), 0) },
                                    ], cx: 60, cy: 40, innerRadius: 30, outerRadius: 38, startAngle: 180, endAngle: 0, dataKey: "value", stroke: "none", children: [_jsx(Cell, { fill: data.avgOverallRating >= 7 ? COLORS.green : data.avgOverallRating >= 5 ? COLORS.amber : COLORS.red }), _jsx(Cell, { fill: "hsl(var(--muted)/0.3)" })] }) }) }), _jsxs("div", { className: "flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground", children: [_jsxs("span", { children: [data.activeDays, " d\u00EDas activos"] }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [data.totalTasksCompleted, " tareas"] }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [Math.round(data.totalFocusMinutes / 60 * 10) / 10, "h foco"] })] })] }) }), _jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold mb-2 flex items-center gap-2", children: [_jsx(Activity, { className: "w-4 h-4 text-muted-foreground" }), "Desglose diario"] }), _jsx("div", { className: "grid grid-cols-7 gap-1.5", children: data.dayDetails.map(day => {
                            const score = day.overallRating * 10;
                            const date = new Date(day.date + "T12:00:00");
                            return (_jsxs(Card, { className: cn("p-1.5 text-center ring-1 transition-all", score >= 70 ? "ring-green-500/30" :
                                    score >= 40 ? "ring-amber-500/30" :
                                        day.overallRating > 0 ? "ring-red-500/30" : "ring-muted/20"), children: [_jsx("p", { className: "text-[9px] font-medium text-muted-foreground", children: format(date, "EEE", { locale: es }).slice(0, 2) }), _jsx("p", { className: "text-[10px] font-bold", children: format(date, "d", { locale: es }) }), day.overallRating > 0 ? (_jsx("div", { className: cn("text-xs font-bold mt-0.5", score >= 70 ? "text-green-600" :
                                            score >= 40 ? "text-amber-600" : "text-red-500"), children: day.overallRating })) : (_jsx("div", { className: "text-[9px] text-muted-foreground/40 mt-0.5", children: "\u2014" })), day.habitsCompleted > 0 && (_jsxs("div", { className: "text-[8px] text-muted-foreground", children: [day.habitsCompleted, "h"] }))] }, day.date));
                        }) })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: statDonuts.map((stat, i) => (_jsx(Card, { className: "p-3", children: _jsx(StatDonut, { pct: stat.pct, value: stat.value, label: stat.label }) }, i))) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-4", children: [_jsxs("h3", { className: "text-sm font-semibold mb-3 flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }), "Tiempo por \u00E1rea"] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: timeAreas.map(area => {
                                const spent = data.timeData[area.id] || 0;
                                const areaPct = Math.min(100, Math.round((spent / area.goal) * 100));
                                return (_jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [_jsx(PieChart, { width: 64, height: 64, children: _jsxs(Pie, { data: [
                                                    { name: "done", value: Math.max(areaPct, 1) },
                                                    { name: "remaining", value: Math.max(100 - areaPct, 0) },
                                                ], cx: 32, cy: 32, innerRadius: 22, outerRadius: 30, startAngle: 90, endAngle: -270, dataKey: "value", stroke: "none", children: [_jsx(Cell, { fill: AREA_COLORS[area.id] || COLORS.blue }), _jsx(Cell, { fill: "hsl(var(--muted))" })] }) }), _jsxs("span", { className: "text-xs font-medium text-center leading-tight", children: [area.icon, " ", area.label] }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [Math.round(spent / 60 * 10) / 10, "h / ", Math.round(area.goal / 60 * 10) / 10, "h"] })] }, area.id));
                            }) })] }) }), _jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold mb-2 flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4 text-muted-foreground" }), "H\u00E1bitos m\u00E1s consistentes"] }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [Object.entries(data.habitCompletions)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 10)
                                .map(([habitId, count]) => (_jsxs("span", { className: cn("text-[9px] px-2 py-0.5 rounded-full font-medium border", count >= data.totalDays * 0.7 ? "bg-green-500/15 text-green-600 border-green-500/30" :
                                    count >= data.totalDays * 0.4 ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
                                        "bg-muted text-muted-foreground border-transparent"), children: [habitId.replace(/-/g, ' '), " ", count, "/", data.totalDays] }, habitId))), Object.keys(data.habitCompletions).length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground", children: "No hay h\u00E1bitos registrados esta semana" }))] })] })] }));
}
