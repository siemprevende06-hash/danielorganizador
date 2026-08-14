import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, Music, Globe, Gamepad2, Zap, Sword, GraduationCap, Briefcase, FolderKanban, DollarSign, ListTodo, TrendingUp, Activity, } from "lucide-react";
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area } from "recharts";
const MONTH_KEYS = ["month1", "month2", "month3"];
function getQuarterDates(quarter, year) {
    const startMonth = (quarter - 1) * 3;
    return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0) };
}
function loadPlanForQuarter(quarter, year) {
    try {
        const raw = localStorage.getItem(`trimestral_plan_Q${quarter}_${year}`);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function formatMinutes(m) {
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}
export const CENTRAL_AREAS = [
    {
        id: 'desarrollo', label: 'Desarrollo Personal',
        icon: _jsx(BookOpen, { className: "h-4 w-4" }), gradient: 'from-emerald-500 to-teal-400',
        subAreas: [
            { id: 'lectura', label: 'Lectura', icon: _jsx(BookOpen, { className: "h-3 w-3" }), color: 'emerald', trackingSource: 'area_stats', trackingId: 'lectura', timeGoalKey: 'lectura' },
            { id: 'musica', label: 'Música', icon: _jsx(Music, { className: "h-3 w-3" }), color: 'rose', trackingSource: 'time_data', trackingId: 'musica', timeGoalKey: 'musica' },
            { id: 'idiomas', label: 'Idiomas', icon: _jsx(Globe, { className: "h-3 w-3" }), color: 'sky', trackingSource: 'time_data', trackingId: ['italiano', 'ingles'], timeGoalKey: 'italiano' },
            { id: 'ajedrez', label: 'Ajedrez', icon: _jsx(Gamepad2, { className: "h-3 w-3" }), color: 'teal', trackingSource: 'both', trackingId: 'ajedrez', timeGoalKey: 'ajedrez' },
            { id: 'gym', label: 'Gimnasio', icon: _jsx(Zap, { className: "h-3 w-3" }), color: 'orange', trackingSource: 'area_stats', trackingId: 'gym', timeGoalKey: 'gym' },
            { id: 'game', label: 'Game', icon: _jsx(Sword, { className: "h-3 w-3" }), color: 'pink', trackingSource: 'time_data', trackingId: 'game', timeGoalKey: 'game' },
        ],
    },
    {
        id: 'profesional', label: 'Profesional/Académico',
        icon: _jsx(GraduationCap, { className: "h-4 w-4" }), gradient: 'from-sky-500 to-blue-400',
        subAreas: [
            { id: 'universidad', label: 'Universidad', icon: _jsx(GraduationCap, { className: "h-3 w-3" }), color: 'blue', trackingSource: 'area_stats', trackingId: 'universidad', timeGoalKey: 'universidad' },
            { id: 'emprendimiento', label: 'Emprendimiento', icon: _jsx(Briefcase, { className: "h-3 w-3" }), color: 'purple', trackingSource: 'area_stats', trackingId: 'emprendimiento', timeGoalKey: 'emprendimiento' },
            { id: 'proyectos', label: 'Proyectos', icon: _jsx(FolderKanban, { className: "h-3 w-3" }), color: 'amber', trackingSource: 'area_stats', trackingId: 'proyectos', timeGoalKey: 'proyectos' },
            { id: 'tareas', label: 'Tareas Grales', icon: _jsx(ListTodo, { className: "h-3 w-3" }), color: 'slate', trackingSource: 'none', trackingId: '', timeGoalKey: '' },
        ],
    },
    {
        id: 'finanzas', label: 'Finanzas',
        icon: _jsx(DollarSign, { className: "h-4 w-4" }), gradient: 'from-green-500 to-emerald-400',
        subAreas: [],
    },
];
function StatsRow({ stats }) {
    return (_jsx("div", { className: "grid grid-cols-3 sm:grid-cols-6 gap-2", children: stats.map((s, i) => (_jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: s.label }), _jsx("p", { className: "text-xs font-bold", style: { color: s.color }, children: s.value }), s.sub && _jsx("p", { className: "text-[9px] text-muted-foreground", children: s.sub })] }, i))) }));
}
export function CentralAreasSection({ selectedQuarter, activeCentral: activeCentralProp, activeSub: activeSubProp, onCentralChange: onCentralChangeProp, onSubChange: onSubChangeProp, year, start, end, getGoal, }) {
    const [internalCentral, setInternalCentral] = useState(activeCentralProp ?? CENTRAL_AREAS[0].id);
    const [internalSub, setInternalSub] = useState(activeSubProp ?? CENTRAL_AREAS[0].subAreas[0]?.id ?? '');
    const activeCentral = activeCentralProp ?? internalCentral;
    const activeSub = activeSubProp ?? internalSub;
    const onCentralChange = onCentralChangeProp ?? setInternalCentral;
    const onSubChange = onSubChangeProp ?? setInternalSub;
    const periodYear = year ?? new Date().getFullYear();
    const qDates = useMemo(() => (start && end ? { start, end } : getQuarterDates(selectedQuarter, periodYear)), [selectedQuarter, start, end, periodYear]);
    const plan = useMemo(() => loadPlanForQuarter(selectedQuarter, periodYear), [selectedQuarter, periodYear]);
    const activeDef = CENTRAL_AREAS.find(a => a.id === activeCentral);
    const activeSubDef = activeDef?.subAreas?.find(s => s.id === activeSub);
    const startStr = format(qDates.start, 'yyyy-MM-dd');
    const endStr = format(qDates.end, 'yyyy-MM-dd');
    const { data: areaStats } = useQuery({
        queryKey: ['qc-area', startStr, endStr],
        queryFn: async () => {
            const { data } = await supabase.from('daily_area_stats')
                .select('area_id, stat_date, time_spent_minutes')
                .gte('stat_date', startStr).lte('stat_date', endStr);
            return data || [];
        },
    });
    const { data: systems } = useQuery({
        queryKey: ['qc-sys', startStr, endStr],
        queryFn: async () => {
            const { data } = await supabase.from('daily_systems_tracking')
                .select('tracking_date, time_data')
                .gte('tracking_date', startStr).lte('tracking_date', endStr);
            return data || [];
        },
    });
    const handleCentral = (id) => {
        onCentralChange(id);
        const def = CENTRAL_AREAS.find(a => a.id === id);
        if (def?.subAreas?.length)
            onSubChange(def.subAreas[0].id);
    };
    const stats = useMemo(() => {
        if (!activeSubDef)
            return null;
        const areaRows = areaStats || [];
        const sysRows = systems || [];
        const timeByDay = {};
        const ids = Array.isArray(activeSubDef.trackingId) ? activeSubDef.trackingId : [activeSubDef.trackingId];
        if (activeSubDef.trackingSource !== 'time_data') {
            areaRows.filter((r) => ids.includes(r.area_id)).forEach((r) => {
                timeByDay[r.stat_date] = (timeByDay[r.stat_date] || 0) + (r.time_spent_minutes || 0);
            });
        }
        if (activeSubDef.trackingSource === 'time_data' || activeSubDef.trackingSource === 'both') {
            sysRows.forEach((row) => {
                const td = row.time_data || {};
                let sum = 0;
                ids.forEach((id) => { sum += Number(td[id]) || 0; });
                if (sum > 0)
                    timeByDay[row.tracking_date] = (timeByDay[row.tracking_date] || 0) + sum;
            });
        }
        const allDates = eachDayOfInterval({ start: qDates.start, end: qDates.end }).map(d => format(d, 'yyyy-MM-dd'));
        const totalDays = allDates.length;
        const activeDays = Object.values(timeByDay).filter(v => v > 0).length;
        const totalMinutes = Object.values(timeByDay).reduce((s, v) => s + v, 0);
        const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
        let streak = 0;
        for (let i = allDates.length - 1; i >= 0; i--) {
            if ((timeByDay[allDates[i]] || 0) > 0)
                streak++;
            else
                break;
        }
        let quarterlyGoal = 0;
        if (getGoal) {
            quarterlyGoal = getGoal(activeSubDef.timeGoalKey || activeSubDef.id) || 0;
        }
        else {
            MONTH_KEYS.forEach(mk => {
                if (!plan)
                    return;
                const g = plan.timeGoals?.[mk]?.[activeSubDef.timeGoalKey || activeSubDef.id] || plan.areaTimeGoals?.[mk]?.[activeSubDef.timeGoalKey || activeSubDef.id] || 0;
                quarterlyGoal += g;
            });
        }
        const goalPct = quarterlyGoal > 0 ? Math.round((totalMinutes / quarterlyGoal) * 100) : 0;
        const consistency = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
        return {
            statBoxes: [
                { label: "DÍAS ACTIVOS", value: `${activeDays}/${totalDays}`, sub: `${Math.round((activeDays / Math.max(totalDays, 1)) * 100)}%`, color: "#10b981" },
                { label: "RACHA", value: `${streak} días`, color: streak >= 7 ? '#10b981' : streak >= 3 ? '#f59e0b' : '#6366f1' },
                { label: "TOTAL", value: formatMinutes(totalMinutes), color: "#6366f1" },
                { label: "PROMEDIO", value: `${avgMinutes}min/día`, color: "#6366f1" },
                { label: "VS META", value: quarterlyGoal > 0 ? `${goalPct}%` : '—', sub: quarterlyGoal > 0 ? `${formatMinutes(totalMinutes)} / ${formatMinutes(quarterlyGoal)}` : undefined, color: goalPct >= 100 ? '#10b981' : goalPct >= 50 ? '#f59e0b' : '#6366f1' },
                { label: "CONSISTENCIA", value: `${consistency}%`, color: consistency >= 70 ? '#10b981' : consistency >= 40 ? '#f59e0b' : '#ef4444' },
            ],
            timeByDay, totalMinutes, quarterlyGoal, goalPct,
        };
    }, [activeSubDef, areaStats, systems, plan, qDates, getGoal]);
    // Weekly chart data
    const chartData = useMemo(() => {
        if (!stats || !activeSubDef)
            return [];
        const weeks = [];
        for (let d = new Date(qDates.start); d <= qDates.end; d.setDate(d.getDate() + 7)) {
            const ws = new Date(d);
            const we = new Date(d);
            we.setDate(we.getDate() + 6);
            if (we > qDates.end)
                break;
            let total = 0;
            for (let day = new Date(ws); day <= we; day.setDate(day.getDate() + 1)) {
                total += stats.timeByDay[format(day, 'yyyy-MM-dd')] || 0;
            }
            weeks.push({ label: `S${weeks.length + 1}`, min: total, trend: 0 });
        }
        for (let i = 2; i < weeks.length - 1; i++) {
            weeks[i].trend = Math.round((weeks[i - 2].min + weeks[i - 1].min + weeks[i].min + weeks[i + 1].min) / 4);
        }
        return weeks;
    }, [stats, activeSubDef, qDates]);
    const loading = !areaStats || !systems;
    const grad = activeDef?.gradient || 'from-primary to-primary/60';
    const colorMap = { emerald: "#10b981", rose: "#f43f5e", teal: "#14b8a6", sky: "#0ea5e9", orange: "#f97316", blue: "#3b82f6", purple: "#a855f7", amber: "#f59e0b" };
    const chartColor = (activeSubDef && colorMap[activeSubDef.color]) || "#6366f1";
    const maxMin = chartData.length > 0 ? Math.max(...chartData.map(d => d.min), 1) : 1;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-4 w-4 text-primary" }), _jsx("h2", { className: "text-sm font-semibold", children: "\u00C1reas Centrales" }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [format(qDates.start, 'd MMM', { locale: es }), " \u2013 ", format(qDates.end, 'd MMM yyyy', { locale: es })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: CENTRAL_AREAS.map(area => (_jsx("button", { onClick: () => handleCentral(area.id), className: cn("relative rounded-xl p-3 text-left transition-all border-0", activeCentral === area.id ? `bg-gradient-to-r ${area.gradient} text-white shadow-lg shadow-black/10 scale-[1.02]` : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md border border-border/40"), children: _jsxs("div", { className: "flex items-center gap-2", children: [area.icon, _jsx("span", { className: "text-xs font-semibold", children: area.label })] }) }, area.id))) }), activeCentral !== 'finanzas' && activeDef && activeDef.subAreas.length > 0 && (_jsx("div", { className: "flex gap-1.5 flex-wrap", children: activeDef.subAreas.map(sub => (_jsxs("button", { onClick: () => onSubChange(sub.id), className: cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border", activeSub === sub.id ? `bg-gradient-to-r ${grad} text-white shadow-sm border-transparent` : "bg-white/70 dark:bg-zinc-950/70 border-border/40 hover:border-foreground/20 text-muted-foreground"), children: [sub.icon, sub.label] }, sub.id))) })), activeCentral === 'finanzas' ? (_jsx(FinanceSummaryCard, {})) : loading ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-8 text-center text-muted-foreground", children: "Cargando datos..." }) })) : stats ? (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-1 bg-gradient-to-r", grad) }), _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-muted", children: activeSubDef?.icon }), _jsx("span", { className: "text-sm font-semibold", children: activeSubDef?.label })] }), _jsx(StatsRow, { stats: stats.statBoxes }), chartData.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx(TrendingUp, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider", children: "Minutos por semana" })] }), _jsx("div", { className: "h-40", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(ComposedChart, { data: chartData, margin: { top: 4, right: 4, bottom: 0, left: -16 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 9 }, stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false }), _jsx(YAxis, { tick: { fontSize: 9 }, stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false, tickFormatter: (v) => `${Math.round(v / (v >= 60 ? 60 : 1))}${v >= 60 ? 'h' : 'm'}` }), _jsx(Tooltip, { contentStyle: { fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }, formatter: (value) => [formatMinutes(value), 'Tiempo'] }), _jsx("defs", { children: _jsxs("linearGradient", { id: `cg-${activeSubDef?.id || 'a'}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: chartColor, stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: chartColor, stopOpacity: 0.05 })] }) }), _jsx(Area, { type: "monotone", dataKey: "trend", stroke: chartColor, fill: `url(#cg-${activeSubDef?.id || 'a'})`, strokeWidth: 2, dot: false }), _jsx(Bar, { dataKey: "min", fill: chartColor, radius: [3, 3, 0, 0], opacity: 0.7, maxBarSize: 20 })] }) }) }), _jsxs("div", { className: "flex gap-3 mt-1 text-[9px] text-muted-foreground/60 justify-center", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-3 h-1 rounded opacity-70", style: { backgroundColor: chartColor } }), " Minutos por semana"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-3 h-0.5 rounded", style: { backgroundColor: chartColor } }), " Tendencia"] })] })] })), stats.quarterlyGoal > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground", children: [_jsx("span", { children: "Progreso vs meta del per\u00EDodo" }), _jsxs("span", { children: [stats.goalPct, "%"] })] }), _jsx(Progress, { value: Math.min(stats.goalPct, 100), className: "h-1.5" })] }))] })] })) : null] }));
}
function FinanceSummaryCard() {
    const today = useMemo(() => new Date(), []);
    const { data: wallets } = useQuery({
        queryKey: ['fin-w'], queryFn: async () => { const { data } = await supabase.from('wallets').select('*'); return data || []; }, retry: 1, staleTime: 60000,
    });
    const { data: txs } = useQuery({
        queryKey: ['fin-t'], queryFn: async () => { const { data } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false }); return data || []; }, retry: 1, staleTime: 60000,
    });
    const stats = useMemo(() => {
        const totalBalance = Math.round((wallets || []).reduce((s, w) => s + (w.balance || 0), 0));
        const list = (txs || []).map((t) => ({ ...t, date: new Date(t.transaction_date), type: t.transaction_type, categoryId: t.category_id }));
        const thisMonth = list.filter((t) => { const d = t.date; return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); });
        const income = Math.round(thisMonth.filter((t) => t.type === 'income' && t.categoryId !== 'cat-transfer').reduce((s, t) => s + t.amount, 0));
        const expenses = Math.round(thisMonth.filter((t) => t.type === 'expense' && t.categoryId !== 'cat-transfer').reduce((s, t) => s + t.amount, 0));
        const balance = income - expenses;
        const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
        return { totalBalance, income, expenses, balance, savingsRate };
    }, [wallets, txs, today]);
    if (!wallets || !txs) {
        return (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-8 text-center text-muted-foreground", children: "Cargando finanzas..." }) }));
    }
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-green-500 to-emerald-400" }), _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "h-4 w-4 text-green-500" }), _jsx("span", { className: "text-sm font-semibold", children: "Resumen Financiero" }), _jsx("span", { className: "text-[10px] text-muted-foreground ml-auto", children: format(today, "MMMM yyyy", { locale: es }) })] }), _jsx(StatsRow, { stats: [
                            { label: "BALANCE TOTAL", value: `$${stats.totalBalance}`, color: "#10b981" },
                            { label: "INGRESOS", value: `$${stats.income}`, color: "#3b82f6" },
                            { label: "GASTOS", value: `$${stats.expenses}`, color: stats.expenses > stats.income ? '#ef4444' : '#f59e0b' },
                            { label: "AHORRO", value: stats.savingsRate >= 0 ? `${stats.savingsRate}%` : '—', color: stats.savingsRate >= 20 ? '#10b981' : stats.savingsRate >= 10 ? '#f59e0b' : '#ef4444' },
                        ] })] })] }));
}
