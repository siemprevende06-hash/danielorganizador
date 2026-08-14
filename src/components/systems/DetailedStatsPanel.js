import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
const startOfQuarter = (d) => {
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3, 1);
};
const endOfQuarter = (d) => {
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3 + 3, 0);
};
export function DetailedStatsPanel({ totalHabits }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            const start = format(startOfQuarter(new Date()), "yyyy-MM-dd");
            const end = format(new Date(), "yyyy-MM-dd");
            const { data } = await supabase
                .from("daily_systems_tracking")
                .select("tracking_date, completions, time_data, count_data, water_data, block_completions, workout_duration")
                .gte("tracking_date", start)
                .lte("tracking_date", end)
                .order("tracking_date");
            setRows(data?.map(r => ({
                tracking_date: r.tracking_date,
                completions: r.completions || {},
                time_data: r.time_data || {},
                count_data: r.count_data || {},
                water_data: r.water_data || {},
                block_completions: r.block_completions || {},
                workout_duration: r.workout_duration || 0,
            })) || []);
            setLoading(false);
        };
        load();
    }, []);
    const summarize = (subset) => {
        if (subset.length === 0)
            return { avg: 0, totalMin: 0, water: 0, workout: 0, best: 0, worst: 0, days: 0 };
        const dayPercents = subset.map(r => {
            const done = Object.values(r.completions).filter(Boolean).length;
            return totalHabits > 0 ? Math.round((done / totalHabits) * 100) : 0;
        });
        const totalMin = subset.reduce((s, r) => s + Object.values(r.time_data).reduce((a, b) => a + b, 0), 0);
        const water = subset.reduce((s, r) => s + Object.values(r.water_data).filter(Boolean).length, 0);
        const workout = subset.reduce((s, r) => s + r.workout_duration, 0);
        return {
            avg: Math.round(dayPercents.reduce((a, b) => a + b, 0) / dayPercents.length),
            totalMin,
            water,
            workout,
            best: Math.max(...dayPercents),
            worst: Math.min(...dayPercents),
            days: subset.length,
        };
    };
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const wkStart = startOfWeek(today, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(today, { weekStartsOn: 1 });
    const moStart = startOfMonth(today);
    const moEnd = endOfMonth(today);
    const qtStart = startOfQuarter(today);
    const qtEnd = endOfQuarter(today);
    const inRange = (s, a, b) => s >= format(a, "yyyy-MM-dd") && s <= format(b, "yyyy-MM-dd");
    const todayRow = rows.find(r => r.tracking_date === todayStr);
    const week = rows.filter(r => inRange(r.tracking_date, wkStart, wkEnd));
    const month = rows.filter(r => inRange(r.tracking_date, moStart, moEnd));
    const quarter = rows;
    const todayStats = todayRow ? summarize([todayRow]) : { avg: 0, totalMin: 0, water: 0, workout: 0, best: 0, worst: 0, days: 0 };
    const wkStats = summarize(week);
    const moStats = summarize(month);
    const qtStats = summarize(quarter);
    // Trend: compare second half vs first half of current period
    const trend = (subset) => {
        if (subset.length < 4)
            return "stable";
        const mid = Math.floor(subset.length / 2);
        const a = summarize(subset.slice(0, mid)).avg;
        const b = summarize(subset.slice(mid)).avg;
        if (b > a + 5)
            return "up";
        if (b < a - 5)
            return "down";
        return "stable";
    };
    const TrendIcon = ({ t }) => t === "up" ? _jsx(TrendingUp, { className: "h-4 w-4 text-success" }) :
        t === "down" ? _jsx(TrendingDown, { className: "h-4 w-4 text-destructive" }) :
            _jsx(Minus, { className: "h-4 w-4 text-muted-foreground" });
    const renderPeriod = (label, s, t, periodLen) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsxs("span", { className: "text-3xl font-bold", children: [s.avg, "%"] }), _jsx(TrendIcon, { t: t })] })] }), _jsxs(Badge, { variant: "outline", className: "font-mono", children: [s.days, "/", periodLen, " d\u00EDas"] })] }), _jsx(Progress, { value: s.avg, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "p-2 rounded-lg bg-muted/40", children: [_jsx("p", { className: "text-muted-foreground", children: "\u23F1 Tiempo total" }), _jsxs("p", { className: "font-bold", children: [Math.round(s.totalMin / 60), "h ", s.totalMin % 60, "m"] })] }), _jsxs("div", { className: "p-2 rounded-lg bg-muted/40", children: [_jsx("p", { className: "text-muted-foreground", children: "\uD83D\uDCA7 Vasos agua" }), _jsx("p", { className: "font-bold", children: s.water })] }), _jsxs("div", { className: "p-2 rounded-lg bg-muted/40", children: [_jsx("p", { className: "text-muted-foreground", children: "\uD83D\uDCAA Min entreno" }), _jsxs("p", { className: "font-bold", children: [s.workout, " min"] })] }), _jsxs("div", { className: "p-2 rounded-lg bg-muted/40", children: [_jsx("p", { className: "text-muted-foreground", children: "\uD83D\uDD25 Mejor d\u00EDa" }), _jsxs("p", { className: "font-bold", children: [s.best, "%"] })] })] })] }));
    if (loading) {
        return _jsx(Card, { className: "p-4 animate-pulse h-48 bg-muted/20" });
    }
    return (_jsxs(Card, { className: "p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(BarChart3, { className: "h-5 w-5 text-primary" }), _jsx("h3", { className: "font-bold", children: "Estad\u00EDsticas Detalladas" })] }), _jsxs(Tabs, { defaultValue: "today", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-4 w-full", children: [_jsx(TabsTrigger, { value: "today", className: "text-xs", children: "Hoy" }), _jsx(TabsTrigger, { value: "week", className: "text-xs", children: "Semana" }), _jsx(TabsTrigger, { value: "month", className: "text-xs", children: "Mes" }), _jsx(TabsTrigger, { value: "quarter", className: "text-xs", children: "Trimestre" })] }), _jsx(TabsContent, { value: "today", className: "mt-4", children: renderPeriod("Promedio de hoy", todayStats, "stable", 1) }), _jsx(TabsContent, { value: "week", className: "mt-4", children: renderPeriod("Promedio semanal", wkStats, trend(week), 7) }), _jsx(TabsContent, { value: "month", className: "mt-4", children: renderPeriod("Promedio mensual", moStats, trend(month), differenceInDays(moEnd, moStart) + 1) }), _jsx(TabsContent, { value: "quarter", className: "mt-4", children: renderPeriod("Promedio trimestral", qtStats, trend(quarter), differenceInDays(qtEnd, qtStart) + 1) })] }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-3 text-center", children: "An\u00E1lisis basado en tus marcaciones diarias guardadas autom\u00E1ticamente" })] }));
}
