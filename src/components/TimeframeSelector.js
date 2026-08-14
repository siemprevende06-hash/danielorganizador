import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useSprints } from "@/hooks/useSprints";
const TIME_OPTIONS = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mes" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Año" },
];
const VIEW_OPTIONS = [
    { value: "esfuerzo", label: "Esfuerzo", icon: "🔨" },
    { value: "resultados", label: "Resultados", icon: "📊" },
    { value: "ambos", label: "Ambos", icon: "👁️" },
];
export function TimeframeSelector() {
    const { timeframe, setTimeframe, view, setView } = useTimeframe();
    const { activeSprint } = useSprints();
    const timeOptions = activeSprint
        ? [...TIME_OPTIONS, { value: "sprint", label: activeSprint.name }]
        : TIME_OPTIONS;
    return (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "flex items-center justify-center gap-1", children: timeOptions.map((opt) => (_jsx("button", { onClick: () => setTimeframe(opt.value), className: `px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-all ${timeframe === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`, children: opt.label }, opt.value))) }), _jsx("div", { className: "flex items-center justify-center gap-1", children: VIEW_OPTIONS.map((opt) => (_jsxs("button", { onClick: () => setView(opt.value), className: `px-3 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all ${view === opt.value
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`, children: [opt.icon, " ", opt.label] }, opt.value))) })] }));
}
