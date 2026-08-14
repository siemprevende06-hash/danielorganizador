import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, addWeeks, addMonths, addQuarters, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
const SCOPE_OPTIONS = [
    { id: "day", label: "Diario" },
    { id: "week", label: "Semanal" },
    { id: "month", label: "Mensual" },
    { id: "quarter", label: "Trimestral" },
];
const dateKey = (d) => format(d, "yyyy-MM-dd");
export function ReadingTrendChart() {
    const [scope, setScope] = useState("day");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from("daily_area_stats")
                    .select("stat_date, pages_done")
                    .eq("area_id", "lectura")
                    .gte("stat_date", dateKey(subDays(new Date(), 750)));
                if (alive && data)
                    setRows(data);
            }
            catch { }
            if (alive)
                setLoading(false);
        })();
        return () => { alive = false; };
    }, []);
    const byDay = useMemo(() => {
        const m = {};
        rows.forEach(r => { m[r.stat_date] = (m[r.stat_date] || 0) + (r.pages_done || 0); });
        return m;
    }, [rows]);
    const total = useMemo(() => Object.values(byDay).reduce((s, v) => s + v, 0), [byDay]);
    const data = useMemo(() => {
        const today = new Date();
        const out = [];
        if (scope === "day") {
            for (let i = 13; i >= 0; i--) {
                const d = subDays(today, i);
                out.push({ label: format(d, "d MMM", { locale: es }), pages: byDay[dateKey(d)] || 0 });
            }
            return out;
        }
        if (scope === "week") {
            const start = startOfWeek(today, { weekStartsOn: 1 });
            for (let i = 11; i >= 0; i--) {
                const ws = addWeeks(start, -i);
                let pages = 0;
                for (let d = 0; d < 7; d++)
                    pages += byDay[dateKey(addDays(ws, d))] || 0;
                out.push({ label: format(ws, "d MMM", { locale: es }), pages });
            }
            return out;
        }
        if (scope === "month") {
            const start = startOfMonth(today);
            for (let i = 11; i >= 0; i--) {
                const ms = addMonths(start, -i);
                const me = addMonths(ms, 1);
                let pages = 0;
                for (let d = ms; d < me; d = addDays(d, 1))
                    pages += byDay[dateKey(d)] || 0;
                out.push({ label: format(ms, "MMM yy", { locale: es }), pages });
            }
            return out;
        }
        const start = startOfQuarter(today);
        for (let i = 7; i >= 0; i--) {
            const qs = addQuarters(start, -i);
            const qe = addQuarters(qs, 1);
            let pages = 0;
            for (let d = qs; d < qe; d = addDays(d, 1))
                pages += byDay[dateKey(d)] || 0;
            out.push({ label: `Q${Math.floor(qs.getMonth() / 3) + 1} ${format(qs, "yy")}`, pages });
        }
        return out;
    }, [scope, byDay]);
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5" }), " Tendencia de lectura"] }), _jsx("div", { className: "flex rounded-lg border bg-muted/40 p-0.5", children: SCOPE_OPTIONS.map(opt => (_jsx("button", { onClick: () => setScope(opt.id), className: cn("px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors", scope === opt.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"), children: opt.label }, opt.id))) })] }), total === 0 && !loading ? (_jsx("p", { className: "text-xs text-muted-foreground py-6 text-center", children: "A\u00FAn no hay p\u00E1ginas registradas para mostrar la tendencia" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(BarChart, { data: data, margin: { top: 4, right: 4, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))", vertical: false }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 9 }, interval: scope === "day" ? 1 : 0, tickLine: false, axisLine: false }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 9 }, tickLine: false, axisLine: false }), _jsx(Tooltip, { cursor: { fill: "hsl(var(--muted))", opacity: 0.6 }, contentStyle: { fontSize: 11, borderRadius: 8 }, formatter: (value) => [`${value} p\u00E1ginas`, "Le\u00EDdas"] }), _jsx(Bar, { dataKey: "pages", fill: "#8b5cf6", radius: [4, 4, 0, 0], maxBarSize: 28 })] }) }))] }));
}
