import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, startOfMonth, startOfQuarter, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';
import { getDayGoalEffective, getWeekGoalEffective, getMonthGoal, getQuarterGoal, getWeekId } from '@/lib/hierarchy';
import { AlertTriangle, ArrowLeft, FolderKanban, Clock, Flame, GraduationCap, Target, TrendingUp, Trophy, Activity, CheckCircle2 } from 'lucide-react';
const FOCUS_AREAS = [
    { id: 'universidad', label: 'Universidad', icon: GraduationCap, color: 'text-blue-500', gradient: 'from-blue-500 to-indigo-400', ring: 'blue', dailyTarget: 120, min: 60, max: 180 },
    { id: 'emprendimiento', label: 'Emprendimiento', icon: FolderKanban, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-400', ring: 'amber', dailyTarget: 60, min: 30, max: 120 },
    { id: 'proyectos', label: 'Proyectos', icon: FolderKanban, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400', ring: 'emerald', dailyTarget: 60, min: 30, max: 120 },
];
const AREA_LABELS = {
    universidad: 'Universidad', emprendimiento: 'Emprendimiento', proyectos: 'Proyectos',
};
const PERIODS = [
    { id: 'dia', label: 'Día', days: 1, span: (d) => format(d, 'yyyy-MM-dd') },
    { id: 'semana', label: 'Semana', days: 7, span: (d) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd') },
    { id: 'mes', label: 'Mes', days: 30, span: (d) => format(startOfMonth(d), 'yyyy-MM-dd') },
    { id: 'trimestre', label: 'Trimestre', days: 90, span: (d) => format(startOfQuarter(d), 'yyyy-MM-dd') },
];
const STATE_INFO = {
    fuera: {
        label: 'Fuera de control',
        desc: 'Hay días fuera de los límites o rachas largas de un lado. Eso indica causas especiales: algo extraordinario pasó. Se requiere acción para investigar y corregir.',
        text: 'text-red-500',
        card: 'border-red-500/30 bg-red-500/5',
        icon: AlertTriangle,
    },
    control: {
        label: 'En control',
        desc: 'Todos los días están dentro de los límites. El proceso solo presenta causas comunes de variación: es estable y predecible.',
        text: 'text-blue-500',
        card: 'border-blue-500/30 bg-blue-500/5',
        icon: Activity,
    },
    mejora: {
        label: 'Mejora del proceso',
        desc: 'La variación de los últimos días es menor que la del inicio. Se ha vuelto más consistente y capaz.',
        text: 'text-green-500',
        card: 'border-green-500/30 bg-green-500/5',
        icon: TrendingUp,
    },
};
function getQuarter(date) {
    return { quarter: Math.ceil((date.getMonth() + 1) / 3), year: date.getFullYear() };
}
function getPlannedMinutes(area, period, date) {
    if (period.id === 'dia')
        return getDayGoalEffective(date, area);
    if (period.id === 'semana')
        return getWeekGoalEffective(startOfWeek(date, { weekStartsOn: 1 }), area);
    const { quarter, year } = getQuarter(date);
    const monthKey = `month${date.getMonth() - (quarter - 1) * 3 + 1}`;
    if (period.id === 'mes')
        return getMonthGoal(quarter, year, monthKey, area) || 0;
    return getQuarterGoal(quarter, year, area) || 0;
}
function computeSpc(values) {
    const n = values.length;
    if (n < 3)
        return null;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const mrs = [];
    for (let i = 1; i < n; i++)
        mrs.push(Math.abs(values[i] - values[i - 1]));
    const mrBar = mrs.reduce((a, b) => a + b, 0) / mrs.length;
    const sigma = mrBar / 1.128;
    const ucl = mean + 2.66 * mrBar;
    const lcl = Math.max(0, mean - 2.66 * mrBar);
    const outPoints = [];
    values.forEach((v, i) => {
        if (v > ucl || v < lcl)
            outPoints.push(i);
    });
    let runAbove = 0;
    let runBelow = 0;
    for (let i = 0; i < n; i++) {
        if (values[i] >= mean) {
            runAbove++;
            runBelow = 0;
        }
        else {
            runBelow++;
            runAbove = 0;
        }
        if ((runAbove >= 7 || runBelow >= 7) && !outPoints.includes(i))
            outPoints.push(i);
    }
    const outOfControl = outPoints.length > 0;
    const third = Math.max(1, Math.floor(n / 3));
    const first = values.slice(0, third);
    const recent = values.slice(n - third);
    const std = (arr) => {
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
    };
    const firstStd = std(first);
    const recentStd = std(recent);
    const firstMean = first.reduce((a, b) => a + b, 0) / first.length;
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const reducedVariation = firstStd > 0 && recentStd < firstStd * 0.7;
    const meanImproved = !outOfControl && firstMean > 0 && recentMean > firstMean * 1.15;
    let state = 'control';
    if (outOfControl)
        state = 'fuera';
    else if (reducedVariation || meanImproved)
        state = 'mejora';
    return { mean, mrBar, ucl, lcl, sigma, outPoints, state };
}
function getFocusMinutes(row, area) {
    const td = row?.time_data || {};
    return Number(td[area]) || 0;
}
export function FocusProcessPanel({ todayMinutes, anchorDate, children }) {
    const [selected, setSelected] = useState(null);
    const anchor = anchorDate ?? new Date();
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(AreaSelector, { selected: selected, onSelect: setSelected }), selected ? (_jsx(AreaDetail, { area: selected, todayMinutes: todayMinutes, anchor: anchor, onBack: () => setSelected(null) })) : (children)] }));
}
function AreaSelector({ selected, onSelect }) {
    return (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-3", children: _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: FOCUS_AREAS.map((area) => {
                    const Icon = area.icon;
                    const isActive = selected === area.id;
                    return (_jsxs("button", { onClick: () => onSelect(isActive ? null : area.id), className: cn("flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[110px]", isActive
                            ? cn("bg-gradient-to-br scale-[1.03] text-white shadow-lg", area.gradient)
                            : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"), children: [_jsx(Icon, { className: cn("h-5 w-5", isActive ? "text-white" : area.color) }), _jsx("span", { className: cn("text-xs font-semibold whitespace-nowrap", isActive ? "text-white" : "text-foreground"), children: area.label }), _jsxs("span", { className: cn("text-[9px] font-mono", isActive ? "text-white/80" : "text-muted-foreground"), children: [area.min, "\u2013", area.max, " min"] })] }, area.id));
                }) }) }) }));
}
function AreaDetail({ area, todayMinutes, anchor, onBack }) {
    const meta = FOCUS_AREAS.find((a) => a.id === area);
    const anchorStr = format(anchor, 'yyyy-MM-dd');
    const isTodayAnchor = anchorStr === format(new Date(), 'yyyy-MM-dd');
    const [history, setHistory] = useState(null);
    useEffect(() => {
        let active = true;
        const start = format(subDays(anchor, 119), 'yyyy-MM-dd');
        const fetchData = async () => {
            const [tracking, stats] = await Promise.allSettled([
                supabase.from('daily_systems_tracking').select('tracking_date, time_data').gte('tracking_date', start).order('tracking_date', { ascending: true }),
                supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', start),
            ]);
            if (!active)
                return;
            setHistory(tracking.status === 'fulfilled' ? tracking.value.data || [] : []);
            setAreaStats(stats.status === 'fulfilled' ? stats.value.data || [] : []);
        };
        fetchData();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anchorStr]);
    const [areaStats, setAreaStats] = useState(null);
    const series = useMemo(() => {
        if (!history)
            return null;
        const map = new Map();
        history.forEach((row) => map.set(row.tracking_date, getFocusMinutes(row, area)));
        if (areaStats) {
            areaStats.forEach((r) => {
                if (r.area_id === area)
                    map.set(r.stat_date, Math.max(map.get(r.stat_date) || 0, Number(r.time_spent_minutes) || 0));
            });
        }
        if (isTodayAnchor)
            map.set(anchorStr, Math.max(map.get(anchorStr) || 0, todayMinutes?.[area] || 0));
        const arr = [];
        for (let i = 119; i >= 0; i--) {
            const d = subDays(anchor, i);
            const key = format(d, 'yyyy-MM-dd');
            arr.push({ date: key, minutes: map.get(key) || 0 });
        }
        return arr;
    }, [history, areaStats, area, todayMinutes, anchorStr, anchor, isTodayAnchor]);
    const periodStats = useMemo(() => {
        if (!series)
            return null;
        return PERIODS.map((p) => {
            const from = p.id === 'dia' ? anchorStr : format(p.id === 'semana' ? startOfWeek(anchor, { weekStartsOn: 1 }) : p.id === 'mes' ? startOfMonth(anchor) : startOfQuarter(anchor), 'yyyy-MM-dd');
            const done = series.filter(s => s.date >= from && s.date <= anchorStr).reduce((a, b) => a + b.minutes, 0);
            const planned = getPlannedMinutes(area, p, anchor);
            const goal = planned > 0 ? planned : Math.round(meta.dailyTarget * p.days);
            return { ...p, from, done, goal, pct: goal > 0 ? Math.round((done / goal) * 100) : 0, pctUncapped: goal > 0 ? Math.round((done / goal) * 100) : 0 };
        });
    }, [series, area, meta.dailyTarget, anchor, anchorStr]);
    const controlData = useMemo(() => (series ? series.slice(-30) : null), [series]);
    const spc = useMemo(() => (controlData ? computeSpc(controlData.map((d) => d.minutes)) : null), [controlData]);
    const todayMin = todayMinutes?.[area] || 0;
    const todayExtra = Math.max(0, todayMin - meta.max);
    const stateInfo = spc ? STATE_INFO[spc.state] : null;
    const StateIcon = stateInfo?.icon || Activity;
    const trend30 = useMemo(() => {
        if (!series)
            return null;
        return series.slice(-30).map((d) => ({ ...d, target: meta.dailyTarget, min: meta.min, max: meta.max }));
    }, [series, meta]);
    const weekly = useMemo(() => {
        if (!series)
            return null;
        const weeks = [];
        for (let w = 7; w >= 0; w--) {
            const end = subDays(anchor, w * 7);
            const start = subDays(end, 6);
            const sKey = format(start, 'yyyy-MM-dd');
            const eKey = format(end, 'yyyy-MM-dd');
            const total = series.filter((s) => s.date >= sKey && s.date <= eKey).reduce((a, b) => a + b.minutes, 0);
            weeks.push({
                label: getWeekId(start),
                total,
                goal: getPlannedMinutes(area, PERIODS[1], start),
            });
        }
        return weeks;
    }, [series, area, anchor]);
    const consistency = useMemo(() => {
        if (!series)
            return null;
        const last30 = series.slice(-30);
        const met = last30.filter((d) => d.minutes >= meta.min).length;
        const best = Math.max(0, ...last30.map((d) => d.minutes));
        const avg = last30.reduce((a, b) => a + b.minutes, 0) / last30.length;
        let streak = 0;
        for (let i = series.length - 1; i >= 0; i--) {
            if (series[i].minutes >= meta.min)
                streak++;
            else
                break;
        }
        return { met, best, avg, streak };
    }, [series, meta.min]);
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs("button", { onClick: onBack, className: "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors", children: [_jsx(ArrowLeft, { className: "h-3.5 w-3.5" }), " Volver"] }) }), _jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", meta.gradient), children: _jsx(meta.icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-base font-bold flex items-center gap-2", children: [meta.label, todayExtra > 0 && (_jsxs(Badge, { className: "text-[9px] gap-1 bg-amber-500/20 text-amber-600 border-amber-500/40", children: [_jsx(Clock, { className: "h-2.5 w-2.5" }), " +", todayExtra, " min extra"] }))] }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Zona objetivo: ", meta.min, "\u2013", meta.max, " min \u00B7 Control de proceso"] })] })] }), _jsxs(Badge, { variant: "outline", className: cn("text-[10px] font-mono", todayMin >= meta.max ? "text-amber-600" : ""), children: ["hoy: ", todayMin, " min"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: periodStats?.map((p) => {
                                const extraZone = p.id === 'dia' && todayExtra > 0;
                                return (_jsxs("div", { className: "rounded-xl bg-muted/30 p-3 flex flex-col items-center gap-1.5", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: p.label }), _jsx(ProgressRing, { progress: Math.min(100, p.pct), size: 72, strokeWidth: 6, strokeColor: p.pct >= 100 ? 'emerald' : p.pct >= 60 ? meta.ring : 'amber', children: _jsxs("span", { className: "text-xs font-bold tabular-nums", children: [p.pctUncapped >= 100 ? `+${p.pctUncapped - 100}` : p.pctUncapped, _jsx("span", { className: "text-[9px] text-muted-foreground", children: "%" })] }) }), _jsxs("p", { className: "text-xs font-bold tabular-nums", children: [p.done, _jsxs("span", { className: "text-[10px] text-muted-foreground font-normal", children: [" / ", p.goal, " min"] })] }), extraZone ? (_jsxs("p", { className: "text-[9px] font-semibold text-amber-600", children: ["+", todayExtra, " extra"] })) : (_jsxs("p", { className: cn("text-[9px] font-medium", p.pct >= 100 ? "text-green-500" : p.pct >= 60 ? "text-primary" : "text-amber-500"), children: [p.pct, "% del objetivo"] }))] }, p.id));
                            }) }), spc && stateInfo && (_jsxs("div", { className: cn("mt-3 rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-2", stateInfo.card), children: [_jsxs("div", { className: "flex items-center gap-2 md:w-52 shrink-0", children: [_jsx(StateIcon, { className: cn("h-5 w-5 shrink-0", stateInfo.text) }), _jsxs("div", { children: [_jsx("p", { className: cn("text-sm font-bold", stateInfo.text), children: stateInfo.label }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Estado del proceso" })] })] }), _jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: stateInfo.desc })] })), _jsx("div", { className: "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground italic items-center justify-between", children: _jsx("span", { children: "Lo que no se mide no se controla. Lo que no se controla, no se mejora." }) })] }) }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-primary" }), "Resultados reales de ", AREA_LABELS[area]] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [_jsx(AreaResult, { icon: Clock, label: "Hoy", value: `${todayMin} min`, color: meta.color }), _jsx(AreaResult, { icon: Flame, label: "D\u00EDas activos semana", value: activeDays(series, startOfWeek(anchor, { weekStartsOn: 1 }), anchorStr), color: meta.color }), _jsx(AreaResult, { icon: Flame, label: "D\u00EDas activos mes", value: activeDays(series, startOfMonth(anchor), anchorStr), color: meta.color }), _jsx(AreaResult, { icon: Trophy, label: "D\u00EDas activos trimestre", value: activeDays(series, startOfQuarter(anchor), anchorStr), color: "text-emerald-500" })] }) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [_jsx(StatCard, { icon: Flame, label: "Racha actual", value: `${consistency?.streak ?? 0} días`, color: "text-orange-500" }), _jsx(StatCard, { icon: CheckCircle2, label: "D\u00EDas en zona (30d)", value: `${consistency?.met ?? 0}/30`, color: "text-green-500" }), _jsx(StatCard, { icon: TrendingUp, label: "Media diaria (30d)", value: `${Math.round(consistency?.avg ?? 0)} min`, color: "text-primary" }), _jsx(StatCard, { icon: Trophy, label: "Mejor d\u00EDa (30d)", value: `${consistency?.best ?? 0} min`, color: "text-purple-500" })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Activity, { className: "h-4 w-4 text-primary" }), "Carta de Control (XmR) \u2014 \u00FAltimos 30 d\u00EDas"] }), spc && (_jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-mono", children: [_jsxs("span", { children: ["Media (X\u0304): ", _jsx("b", { className: "text-emerald-600", children: Math.round(spc.mean) })] }), _jsxs("span", { children: ["\u03C3: ", Math.round(spc.sigma * 10) / 10] }), _jsxs("span", { children: ["LCS: ", _jsx("b", { className: "text-red-500", children: Math.round(spc.ucl) })] }), _jsxs("span", { children: ["LCI: ", _jsx("b", { className: "text-red-500", children: Math.round(spc.lcl) })] }), spc.outPoints.length > 0 && _jsxs("span", { className: "text-red-500 font-semibold", children: ["Puntos fuera: ", spc.outPoints.length] }), todayExtra > 0 && _jsxs("span", { className: "text-amber-600 font-semibold", children: ["Extra: \u00B1", todayExtra, " min"] })] }))] }), _jsx(CardContent, { children: controlData && spc ? (_jsxs(_Fragment, { children: [_jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(LineChart, { data: controlData, margin: { top: 8, right: 8, bottom: 0, left: -18 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(128,128,128,0.15)" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 8, fill: 'currentColor' }, interval: 5, tickFormatter: (v) => format(new Date(v), 'dd/MM'), axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 9, fill: 'currentColor' }, axisLine: false, tickLine: false }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                                    if (!active || !payload?.length)
                                                        return null;
                                                    const d = payload[0].payload;
                                                    const extra = Math.max(0, d.minutes - meta.max);
                                                    return (_jsxs("div", { className: "bg-background border rounded-lg px-2.5 py-1.5 shadow-lg text-xs space-y-0.5", children: [_jsx("p", { className: "font-mono text-muted-foreground", children: format(new Date(d.date), 'EEEE dd/MM', { locale: es }) }), _jsxs("p", { className: "font-bold", children: [d.minutes, " min", extra > 0 && _jsxs("span", { className: "text-amber-600", children: [" \u00B7 +", extra, " extra"] })] }), _jsx("p", { className: cn("text-[9px]", d.minutes >= meta.max ? "text-amber-600" : d.minutes >= meta.min ? "text-green-500" : "text-red-500"), children: d.minutes >= meta.max ? 'Extra (zona +)' : d.minutes >= meta.min ? 'En zona objetivo' : 'Bajo el mínimo' })] }));
                                                } }), _jsx(ReferenceArea, { y1: meta.min, y2: meta.max, fill: "#10b981", fillOpacity: 0.08 }), _jsx(ReferenceLine, { y: meta.min, stroke: "#10b981", strokeDasharray: "4 4", strokeOpacity: 0.5, label: { value: 'Mín', position: 'insideBottomRight', fontSize: 8, fill: '#10b981' } }), _jsx(ReferenceLine, { y: meta.max, stroke: "#f59e0b", strokeDasharray: "4 4", strokeOpacity: 0.7, label: { value: 'Máx (extra)', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' } }), _jsx(ReferenceLine, { y: spc.ucl, stroke: "#ef4444", strokeDasharray: "6 3", label: { value: 'LCS', position: 'insideTopLeft', fontSize: 8, fill: '#ef4444' } }), _jsx(ReferenceLine, { y: spc.lcl, stroke: "#ef4444", strokeDasharray: "6 3", label: { value: 'LCI', position: 'insideBottomLeft', fontSize: 8, fill: '#ef4444' } }), _jsx(ReferenceLine, { y: spc.mean, stroke: "#22c55e", strokeDasharray: "4 4", label: { value: 'Media', position: 'insideTopLeft', fontSize: 8, fill: '#22c55e' } }), _jsx(Line, { type: "monotone", dataKey: "minutes", stroke: "#6366f1", strokeWidth: 2, dot: (props) => {
                                                    const { cx, cy, index, payload } = props;
                                                    if (cx == null || cy == null)
                                                        return null;
                                                    const out = spc.outPoints.includes(index);
                                                    const extra = payload.minutes > meta.max;
                                                    const below = payload.minutes < meta.min;
                                                    const inZone = payload.minutes >= meta.min && payload.minutes <= meta.max;
                                                    let fill = '#6366f1';
                                                    if (out)
                                                        fill = '#ef4444';
                                                    else if (below)
                                                        fill = '#f59e0b';
                                                    else if (inZone)
                                                        fill = '#10b981';
                                                    else if (extra)
                                                        fill = '#f59e0b';
                                                    return _jsx("circle", { cx: cx, cy: cy, r: out ? 5 : 3, fill: fill, stroke: out ? '#ffffff' : 'transparent', strokeWidth: out ? 1.5 : 0 });
                                                }, activeDot: { r: 5 } })] }) }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground mt-1 pt-2 border-t border-border", children: [_jsxs("span", { children: [_jsx("b", { className: "text-red-500", children: "LCS / LCI" }), " \u2014 l\u00EDmites de control (l\u00EDmites del proceso normal)"] }), _jsxs("span", { children: [_jsx("b", { className: "text-green-600", children: "Media" }), " \u2014 promedio de tus 30 d\u00EDas"] }), _jsxs("span", { children: [_jsx("b", { className: "text-emerald-600", children: "Zona verde" }), " \u2014 m\u00EDnimo/m\u00E1ximo del objetivo del plan"] }), _jsxs("span", { children: [_jsx("b", { className: "text-amber-600", children: "Dorado" }), " \u2014 fuera de zona / esfuerzo extra"] }), _jsxs("span", { children: [_jsx("b", { className: "text-red-500", children: "Punto rojo" }), " \u2014 d\u00EDa fuera de control"] })] })] })) : (_jsx("p", { className: "text-xs text-muted-foreground text-center py-10", children: "Se necesitan al menos 3 d\u00EDas de datos para calcular los l\u00EDmites de control." })) })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }), "Tendencia diaria \u2014 \u00FAltimos 30 d\u00EDas"] }) }), _jsx(CardContent, { children: trend30 ? (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(AreaChart, { data: trend30, margin: { top: 8, right: 8, bottom: 0, left: -18 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "gradFocus", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#6366f1", stopOpacity: 0.4 }), _jsx("stop", { offset: "100%", stopColor: "#6366f1", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(128,128,128,0.15)" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 8, fill: 'currentColor' }, interval: 5, tickFormatter: (v) => format(new Date(v), 'dd/MM'), axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 9, fill: 'currentColor' }, axisLine: false, tickLine: false }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (!active || !payload?.length)
                                                return null;
                                            const d = payload[0].payload;
                                            return (_jsxs("div", { className: "bg-card border rounded-lg px-2.5 py-1.5 shadow-1g text-xs space-y-0.5", children: [_jsx("p", { className: "font-mono text-muted-foreground", children: format(new Date(d.date), 'EEEE dd/MM', { locale: es }) }), _jsxs("p", { className: "font-bold", children: [d.minutes, " min"] })] }));
                                        } }), _jsx(ReferenceArea, { y1: meta.min, y2: meta.max, fill: "#10b981", fillOpacity: 0.06 }), _jsx(ReferenceLine, { y: meta.max, stroke: "#f59e0b", strokeDasharray: "6 3", strokeOpacity: 0.6, label: { value: 'Máx', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' } }), _jsx(ReferenceLine, { y: meta.min, stroke: "#10b981", strokeDasharray: "6 3", strokeOpacity: 0.5, label: { value: 'Mín', position: 'insideBottomRight', fontSize: 8, fill: '#10b981' } }), _jsx(Area, { type: "monotone", dataKey: "minutes", stroke: "#6366f1", strokeWidth: 2, fill: "url(#gradFocus)" })] }) })) : null })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-emerald-500" }), "Tendencia semanal vs objetivo del plan"] }) }), _jsx(CardContent, { children: weekly ? (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: weekly, margin: { top: 8, right: 8, bottom: 0, left: -18 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(128,128,128,0.15)" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 8, fill: 'currentColor' }, axisLine: false, tickLine: false, tickFormatter: (v) => v.slice(-2) }), _jsx(YAxis, { tick: { fontSize: 9, fill: 'currentColor' }, axisLine: false, tickLine: false }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (!active || !payload?.length)
                                                return null;
                                            const d = payload[0].payload;
                                            return (_jsxs("div", { className: "bg-background border rounded-lg px-2.5 py-1.5 shadow-xs text-xs space-y-0.5", children: [_jsxs("p", { className: "font-mono text-muted-foreground", children: ["Semana ", d.label.slice(-2)] }), _jsxs("p", { className: "font-bold", children: [d.total, " min"] }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: ["Objetivo: ", d.goal, " min"] }), d.goal > 0 && _jsxs("p", { className: cn("text-[9px] font-semibold", d.total >= d.goal ? "text-green-500" : "text-amber-500"), children: [Math.round((d.total / d.goal) * 100), "% del objetivo"] })] }));
                                        } }), _jsx(ReferenceLine, { y: weekly[0]?.goal || meta.max * 7, stroke: "#10b981", strokeDasharray: "6 3", strokeOpacity: 0.5, label: { value: 'Obj. semanal', position: 'insideTopRight', fontSize: 8, fill: '#10b981' } }), _jsx(Bar, { dataKey: "total", radius: [6, 6, 0, 0], children: weekly.map((w, i) => (_jsx(Cell, { fill: w.total >= w.goal && w.goal > 0 ? '#10b981' : w.total >= (w.goal || 0) * 0.6 ? '#f59e0b' : '#ef4444' }, i))) })] }) })) : (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: "A\u00FAn no hay datos para calcular la tendencia semanal." })) })] })] }));
}
function activeDays(series, from, to) {
    if (!series)
        return 0;
    const f = format(from, 'yyyy-MM-dd');
    return new Set(series.filter((s) => s.date >= f && s.date <= to && s.minutes > 0).map((s) => s.date)).size;
}
function AreaResult({ icon: Icon, label, value, color = "text-primary" }) {
    return (_jsxs("div", { className: "rounded-xl bg-muted/30 p-3 flex items-center gap-2", children: [_jsx(Icon, { className: cn("h-4 w-4 shrink-0", color) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider truncate", children: label }), _jsx("p", { className: "text-sm font-bold truncate", children: value })] })] }));
}
function StatCard({ icon: Icon, label, value, color }) {
    return (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-2.5", children: [_jsx(Icon, { className: cn("h-5 w-5 shrink-0", color) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-bold truncate", children: value }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider truncate", children: label })] })] }) }));
}
