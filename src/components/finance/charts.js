import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, } from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
const COLORS = ["#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#BF5AF2", "#64D2FF", "#FFD60A"];
const formatCurrency = (v) => v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length)
        return null;
    return (_jsxs("div", { className: "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg shadow-black/5 text-xs", children: [_jsx("p", { className: "font-medium text-zinc-500 dark:text-zinc-400 mb-1.5", children: label }), payload.map((entry, idx) => (_jsxs("div", { className: "flex items-center gap-2 py-0.5", children: [_jsx("div", { className: "w-2 h-2 rounded-full", style: { background: entry.color } }), _jsxs("span", { className: "text-zinc-500 dark:text-zinc-400", children: [entry.name, ":"] }), _jsxs("span", { className: "font-semibold text-zinc-900 dark:text-zinc-100", children: [formatCurrency(Number(entry.value)), " CUP"] })] }, idx)))] }));
};
const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length)
        return null;
    const d = payload[0];
    return (_jsxs("div", { className: "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg shadow-black/5 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full", style: { background: d.color } }), _jsx("span", { className: "font-medium text-zinc-900 dark:text-zinc-100", children: d.name })] }), _jsxs("p", { className: "text-zinc-500 mt-0.5", children: [formatCurrency(d.value), " CUP"] })] }));
};
const TrendIndicator = ({ value }) => {
    if (value > 0)
        return _jsx(TrendingUp, { className: "h-3.5 w-3.5 text-green-500" });
    if (value < 0)
        return _jsx(TrendingDown, { className: "h-3.5 w-3.5 text-red-500" });
    return _jsx(Minus, { className: "h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" });
};
const EmptyChart = ({ message }) => (_jsxs("div", { className: "flex flex-col items-center justify-center aspect-[4/3] sm:aspect-video text-zinc-400 dark:text-zinc-500 gap-2", children: [_jsx(Activity, { className: "h-8 w-8" }), _jsx("span", { className: "text-sm", children: message })] }));
export const MonthlySummaryChart = ({ data }) => {
    if (data.length === 0)
        return _jsx(EmptyChart, { message: "Sin datos en los \u00FAltimos 6 meses" });
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-4 mb-3", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-zinc-500", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-sm bg-[#30D158]" }), "Ingresos"] }), _jsxs("div", { className: "flex items-center gap-1.5 text-xs text-zinc-500", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-sm bg-[#FF453A]" }), "Gastos"] })] }), _jsx("div", { className: "aspect-[4/3] sm:aspect-video", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data, barGap: 4, barCategoryGap: "20%", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border) / 0.3)", vertical: false }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" }, axisLine: { stroke: "hsl(var(--border) / 0.3)" }, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false, tickFormatter: (v) => `${(v / 1000).toFixed(0)}k` }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { fill: "hsl(var(--muted) / 0.2)" } }), _jsx(Bar, { dataKey: "income", name: "Ingresos", fill: "#30D158", radius: [4, 4, 0, 0], maxBarSize: 32 }), _jsx(Bar, { dataKey: "expense", name: "Gastos", fill: "#FF453A", radius: [4, 4, 0, 0], maxBarSize: 32 })] }) }) })] }));
};
export const CategorySpendChart = ({ data }) => {
    if (data.length === 0)
        return _jsx(EmptyChart, { message: "Sin gastos este mes" });
    const total = data.reduce((acc, d) => acc + d.value, 0);
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative w-full max-w-[260px] mx-auto aspect-square", children: [_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 86, paddingAngle: 2, dataKey: "value", strokeWidth: 0, children: data.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { content: _jsx(PieTooltip, {}) })] }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-bold text-zinc-900 dark:text-zinc-100", children: formatCurrency(total) }), _jsx("p", { className: "text-[10px] text-zinc-400 dark:text-zinc-500", children: "Total" })] }) })] }), _jsx("div", { className: "w-full space-y-1.5 mt-2", children: data.map((entry, index) => {
                    const pct = ((entry.value / total) * 100).toFixed(1);
                    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full shrink-0", style: { background: COLORS[index % COLORS.length] } }), _jsx("span", { className: "text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate", children: entry.name }), _jsxs("span", { className: "text-xs font-semibold text-zinc-900 dark:text-zinc-100", children: [pct, "%"] })] }, entry.name));
                }) })] }));
};
export const WalletDistributionChart = ({ data }) => {
    if (data.length === 0)
        return _jsx(EmptyChart, { message: "Sin billeteras" });
    const total = data.reduce((acc, d) => acc + d.value, 0);
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-full max-w-[260px] mx-auto aspect-square", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 55, outerRadius: 80, paddingAngle: 2, dataKey: "value", strokeWidth: 0, children: data.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { content: _jsx(PieTooltip, {}) })] }) }) }), _jsx("div", { className: "w-full space-y-1.5 mt-2", children: data.map((entry, index) => {
                    const pct = ((entry.value / total) * 100).toFixed(1);
                    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full shrink-0", style: { background: COLORS[index % COLORS.length] } }), _jsx("span", { className: "text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate", children: entry.name }), _jsxs("span", { className: "text-xs font-semibold text-zinc-900 dark:text-zinc-100", children: [pct, "%"] })] }, entry.name));
                }) })] }));
};
export const CashFlowTrendChart = ({ data }) => {
    if (data.length === 0)
        return _jsx(EmptyChart, { message: "Sin datos suficientes" });
    return (_jsx("div", { className: "aspect-[4/3] sm:aspect-video", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "cashflowGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#0A84FF", stopOpacity: 0.15 }), _jsx("stop", { offset: "95%", stopColor: "#0A84FF", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border) / 0.3)", vertical: false }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false, tickFormatter: (v) => `${(v / 1000).toFixed(0)}k` }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Area, { type: "monotone", dataKey: "balance", name: "Balance", stroke: "#0A84FF", fill: "url(#cashflowGrad)", strokeWidth: 2.5, dot: { fill: "#0A84FF", r: 3, strokeWidth: 2, stroke: "#fff" }, activeDot: { r: 5, fill: "#0A84FF", strokeWidth: 2, stroke: "#fff" } })] }) }) }));
};
export const DistributionBagChart = ({ data }) => {
    if (data.length === 0)
        return _jsx(EmptyChart, { message: "Sin bolsas de distribuci\u00F3n" });
    const chartData = data.map(d => ({ name: d.name, value: d.percentage }));
    const colorMap = {
        rose: "#FF453A", blue: "#0A84FF", amber: "#FF9F0A", green: "#30D158",
        violet: "#BF5AF2", orange: "#FF9F0A",
    };
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative w-full max-w-[220px] mx-auto aspect-square", children: [_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 75, paddingAngle: 2, dataKey: "value", strokeWidth: 0, children: chartData.map((entry, index) => (_jsx(Cell, { fill: colorMap[data[index]?.color] || COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => `${value}%`, contentStyle: { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card) / 0.9)", backdropFilter: "blur(20px)", fontSize: 12 } })] }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-lg font-bold text-zinc-900 dark:text-zinc-100", children: [data.reduce((s, b) => s + b.percentage, 0), "%"] }), _jsx("p", { className: "text-[10px] text-zinc-400 dark:text-zinc-500", children: "Distribuido" })] }) })] }), _jsx("div", { className: "w-full grid grid-cols-2 gap-1.5 mt-2", children: data.map((entry, index) => {
                    const bgColor = colorMap[entry.color] || COLORS[index % COLORS.length];
                    return (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("div", { className: "w-2 h-2 rounded-full shrink-0", style: { background: bgColor } }), _jsx("span", { className: "text-zinc-500 dark:text-zinc-400 truncate", children: entry.name }), _jsxs("span", { className: "font-semibold text-zinc-900 dark:text-zinc-100 ml-auto", children: [entry.percentage, "%"] })] }, entry.name));
                }) })] }));
};
export { TrendIndicator, formatCurrency };
