import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
const SYSTEM_IDS = [
    { id: "estructural", label: "Estructural", color: "#3b82f6", habitIds: ["rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion"] },
    { id: "fisica", label: "Física", color: "#f97316", habitIds: ["entrenamiento-fisico"] },
    { id: "hobbys", label: "Hobbys", color: "#a855f7", habitIds: ["lectura", "musica", "ajedrez"] },
    { id: "apariencia", label: "Apariencia", color: "#ec4899", habitIds: ["skincare-manana", "skincare-noche", "banarme-vestirme"] },
    { id: "alimentacion", label: "Alimentación", color: "#f59e0b", habitIds: ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"] },
];
const TOTAL_HABITS = SYSTEM_IDS.reduce((a, s) => a + s.habitIds.length, 0);
export function SystemsWeeklyChart() {
    const [history, setHistory] = useState([]);
    const [period, setPeriod] = useState("7");
    useEffect(() => {
        const load = async () => {
            const days = parseInt(period);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startStr = startDate.toISOString().split("T")[0];
            const { data: rows } = await supabase
                .from("daily_systems_tracking")
                .select("tracking_date, completions, time_data, water_data, block_completions, workout_duration")
                .gte("tracking_date", startStr)
                .order("tracking_date", { ascending: true });
            setHistory(rows || []);
        };
        load();
    }, [period]);
    // Build daily completion data
    const dailyData = history.map(row => {
        const completions = (row.completions || {});
        const completed = Object.values(completions).filter(Boolean).length;
        const percent = TOTAL_HABITS > 0 ? Math.round((completed / TOTAL_HABITS) * 100) : 0;
        const day = new Date(row.tracking_date + "T12:00:00");
        const label = day.toLocaleDateString("es", { weekday: "short", day: "numeric" });
        const waterCount = Object.values((row.water_data || {})).filter(Boolean).length;
        const blocksCompleted = Object.values((row.block_completions || {})).filter(Boolean).length;
        return {
            date: label,
            completion: percent,
            habits: completed,
            water: waterCount * 300,
            blocks: blocksCompleted,
            workout: row.workout_duration || 0,
        };
    });
    // Build system breakdown for pie chart (today or average)
    const latestRow = history[history.length - 1];
    const pieData = SYSTEM_IDS.map(sys => {
        if (!latestRow)
            return { name: sys.label, value: 0, color: sys.color };
        const completions = (latestRow.completions || {});
        const completed = sys.habitIds.filter(id => completions[id]).length;
        return { name: sys.label, value: completed, color: sys.color };
    }).filter(d => d.value > 0);
    return (_jsxs(Card, { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\uD83D\uDCCA Estad\u00EDsticas de Sistemas" }), _jsx(Tabs, { value: period, onValueChange: setPeriod, children: _jsxs(TabsList, { className: "h-8", children: [_jsx(TabsTrigger, { value: "7", className: "text-xs px-2 h-6", children: "7D" }), _jsx(TabsTrigger, { value: "14", className: "text-xs px-2 h-6", children: "14D" }), _jsx(TabsTrigger, { value: "30", className: "text-xs px-2 h-6", children: "30D" })] }) })] }), dailyData.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "No hay datos a\u00FAn. Completa tu d\u00EDa para ver estad\u00EDsticas." })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Completamiento Diario (%)" }), _jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(LineChart, { data: dailyData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }), _jsx(YAxis, { domain: [0, 100], tick: { fontSize: 10 } }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "completion", stroke: "hsl(var(--primary))", strokeWidth: 2, dot: { r: 3 } })] }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "H\u00E1bitos vs Bloques" }), _jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(BarChart, { data: dailyData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "habits", fill: "#22c55e", radius: [4, 4, 0, 0], name: "H\u00E1bitos" }), _jsx(Bar, { dataKey: "blocks", fill: "#3b82f6", radius: [4, 4, 0, 0], name: "Bloques" })] }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Agua (ml) y Ejercicio (min)" }), _jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(BarChart, { data: dailyData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 10 } }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "water", fill: "#3b82f6", radius: [4, 4, 0, 0], name: "Agua (ml)" }), _jsx(Bar, { dataKey: "workout", fill: "#f97316", radius: [4, 4, 0, 0], name: "Ejercicio (min)" })] }) })] }), pieData.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Distribuci\u00F3n por Sistema (\u00DAltimo D\u00EDa)" }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsx(ResponsiveContainer, { width: 160, height: 160, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 35, outerRadius: 60, dataKey: "value", paddingAngle: 3, children: pieData.map((entry, i) => (_jsx(Cell, { fill: entry.color }, i))) }), _jsx(Tooltip, {})] }) }), _jsx("div", { className: "space-y-1", children: pieData.map(d => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: d.color } }), _jsxs("span", { className: "text-xs", children: [d.name, ": ", d.value] })] }, d.name))) })] })] }))] }))] }));
}
