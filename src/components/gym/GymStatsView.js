import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, TrendingUp, Dumbbell } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function GymStatsView() {
    const [month, setMonth] = useState(new Date());
    const [workoutDates, setWorkoutDates] = useState(new Set());
    const [progress, setProgress] = useState([]);
    const [totalSessions, setTotalSessions] = useState(0);
    useEffect(() => {
        (async () => {
            const start = format(startOfMonth(month), "yyyy-MM-dd");
            const end = format(endOfMonth(month), "yyyy-MM-dd");
            const { data: logs } = await supabase
                .from("exercise_logs")
                .select("log_date, weight_kg, reps_per_set, exercise:workout_exercises(name)")
                .gte("log_date", start).lte("log_date", end)
                .order("log_date");
            const dates = new Set();
            const byEx = {};
            (logs || []).forEach((l) => {
                dates.add(l.log_date);
                const name = l.exercise?.name || "Ejercicio";
                if (!byEx[name])
                    byEx[name] = { name, points: [] };
                const reps = Array.isArray(l.reps_per_set) ? l.reps_per_set.reduce((a, b) => a + b, 0) : 0;
                byEx[name].points.push({ date: l.log_date, weight: Number(l.weight_kg) || 0, reps });
            });
            setWorkoutDates(dates);
            setProgress(Object.values(byEx).slice(0, 6));
            setTotalSessions(dates.size);
        })();
    }, [month]);
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "icon", variant: "ghost", onClick: () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsxs("h3", { className: "text-sm font-semibold capitalize flex items-center gap-2", children: [_jsx(CalendarIcon, { className: "h-4 w-4" }), format(month, "MMMM yyyy", { locale: es })] }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [totalSessions, " sesiones"] })] }), _jsxs("div", { className: "grid grid-cols-7 gap-1", children: [["L", "M", "X", "J", "V", "S", "D"].map(d => _jsx("div", { className: "text-center text-[10px] text-muted-foreground", children: d }, d)), Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => _jsx("div", {}, "e" + i)), days.map(d => {
                                const ds = format(d, "yyyy-MM-dd");
                                const hit = workoutDates.has(ds);
                                const today = isSameDay(d, new Date());
                                return (_jsx("div", { className: `aspect-square rounded text-[10px] flex items-center justify-center
                ${hit ? "bg-primary text-primary-foreground font-bold" : "bg-muted/40"}
                ${today ? "ring-2 ring-primary" : ""}`, children: d.getDate() }, ds));
                            })] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("h3", { className: "text-sm font-semibold mb-3 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), "Progresi\u00F3n de ejercicios"] }), progress.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "A\u00FAn sin logs este mes." })) : (_jsx("div", { className: "space-y-3", children: progress.map(p => {
                            const max = Math.max(1, ...p.points.map(pt => pt.weight));
                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs mb-1", children: [_jsxs("span", { className: "font-medium flex items-center gap-1", children: [_jsx(Dumbbell, { className: "h-3 w-3" }), p.name] }), _jsxs("span", { className: "text-muted-foreground", children: [p.points.length, " sesiones \u00B7 m\u00E1x ", max, "kg"] })] }), _jsx("div", { className: "flex items-end gap-0.5 h-8", children: p.points.map((pt, i) => (_jsx("div", { className: "flex-1 bg-primary rounded-sm", title: `${pt.date}: ${pt.weight}kg`, style: { height: `${Math.max(10, (pt.weight / max) * 100)}%` } }, i))) })] }, p.name));
                        }) }))] })] }));
}
