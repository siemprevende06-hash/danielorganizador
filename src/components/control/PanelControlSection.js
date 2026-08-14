import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import { getDayGoalEffective } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
export const DEFAULT_GOALS = {
    universidad: 120,
    emprendimiento: 60,
    proyectos: 90,
    idiomas: 60,
    gym: 60,
    lectura: 30,
    musica: 30,
    ajedrez: 15,
    game: 15,
};
export const PRIORITIES = [
    { id: 'universidad', label: 'Universidad', color: '#3b82f6' },
    { id: 'emprendimiento', label: 'Emprendimiento', color: '#a855f7' },
    { id: 'proyectos', label: 'Proyectos', color: '#f59e0b' },
    { id: 'idiomas', label: 'Idiomas', color: '#10b981' },
    { id: 'gym', label: 'Gym', color: '#f97316' },
];
export const HOBBY_ITEMS = [
    { id: 'lectura', label: 'Lectura', color: '#8b5cf6' },
    { id: 'ajedrez', label: 'Ajedrez', color: '#14b8a6' },
    { id: 'game', label: 'Game', color: '#eab308' },
    { id: 'musica', label: 'Música', color: '#ec4899' },
];
export const SOSTEN_ITEMS = [
    { id: 'rutina-activacion', label: 'Rutina de Activación', color: '#3b82f6' },
    { id: 'alistamiento-desayuno', label: 'Alistamiento y Desayuno', color: '#10b981' },
    { id: 'rutina-desactivacion', label: 'Rutina de Desactivación', color: '#8b5cf6' },
    { id: 'horario-regular', label: 'Horario de Sueño', color: '#06b6d4' },
];
export const ALL_TIMER_ITEMS = [...PRIORITIES, ...HOBBY_ITEMS];
/** Máximos/mínimos diarios fijos de los hábitos acumulativos (no derivados de la jerarquía de metas) */
export const HOBBY_RANGES = {
    lectura: { min: 15, max: 30 },
    musica: { min: 15, max: 30 },
    ajedrez: { min: 10, max: 20 },
    game: { min: 10, max: 20 },
};
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}
export function minutesOfToday(timeData, workoutDuration, id) {
    if (id === 'gym')
        return workoutDuration || 0;
    if (id === 'idiomas')
        return (timeData.italiano || 0) + (timeData.ingles || 0);
    return timeData[id] || 0;
}
export function goalOfToday(today, id) {
    if (id === 'idiomas') {
        const g = getDayGoalEffective(today, 'italiano') + getDayGoalEffective(today, 'ingles');
        return g > 0 ? g : (DEFAULT_GOALS.idiomas || 0);
    }
    const g = getDayGoalEffective(today, id);
    return g > 0 ? g : (DEFAULT_GOALS[id] || 30);
}
export function computePanelSummary(timeData, workoutDuration, today = new Date()) {
    const minutes = ALL_TIMER_ITEMS.reduce((s, it) => s + minutesOfToday(timeData, workoutDuration, it.id), 0);
    const goal = ALL_TIMER_ITEMS.reduce((s, it) => s + goalOfToday(today, it.id), 0);
    return { minutes, goal, pct: goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0 };
}
export function GlowRing({ pct, color, size = 68, children }) {
    const capped = Math.min(100, Math.max(0, pct));
    const r = 26;
    const c = 2 * Math.PI * r;
    const glowAlpha = 0.15 + (capped / 100) * 0.65;
    return (_jsxs("div", { className: "relative inline-flex items-center justify-center", style: { width: size, height: size }, children: [_jsxs("svg", { width: size, height: size, viewBox: "0 0 64 64", className: "-rotate-90", children: [_jsx("circle", { cx: "32", cy: "32", r: r, fill: "none", stroke: "rgba(0,0,0,0.1)", strokeWidth: "6", className: "dark:opacity-40" }), _jsx("circle", { cx: "32", cy: "32", r: r, fill: "none", stroke: color, strokeWidth: "6", strokeLinecap: "round", strokeDasharray: c, strokeDashoffset: c * (1 - capped / 100), style: {
                            filter: `drop-shadow(0 0 ${3 + (capped / 100) * 9}px rgb(${hexToRgb(color)} / ${glowAlpha}))`,
                            transition: 'stroke-dashoffset .6s ease, filter .6s ease',
                        } })] }), _jsx("span", { className: "absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1.5 rounded-full bg-black/40 dark:bg-white/40" }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center", children: children })] }));
}
function TimerRingCard({ item, minutes, min, max }) {
    const pct = max > 0 ? Math.round((minutes / max) * 100) : 0;
    const over = minutes - max;
    const color = minutes <= 0 ? '#ef4444' : minutes >= max ? '#10b981' : '#3b82f6';
    return (_jsxs("div", { className: "rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40 p-3 flex flex-col items-center gap-1.5", children: [_jsx(GlowRing, { pct: pct, color: color, children: _jsxs("span", { className: "text-sm font-bold tabular-nums", children: [minutes, _jsx("span", { className: "text-[9px] text-muted-foreground ml-0.5", children: "min" })] }) }), _jsxs("div", { className: "text-center leading-tight", children: [_jsx("p", { className: "text-[10px] font-semibold", children: item.label }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: ["m\u00E1x ", max, " min", over > 0 && _jsxs("span", { className: "text-amber-500 font-semibold", children: [" \u00B7 +", over] })] })] })] }));
}
function SostenRing({ item, completed }) {
    return (_jsxs("div", { className: cn("rounded-2xl shadow-sm border p-3 flex flex-col items-center gap-1.5 transition-all", completed
            ? "bg-white/80 dark:bg-zinc-950/80 border-border/40"
            : "bg-muted/30 border-dashed border-border/60"), children: [_jsx(GlowRing, { pct: completed ? 100 : 0, color: item.color, children: _jsx("span", { className: "text-sm font-bold", children: completed ? '✓' : '—' }) }), _jsxs("div", { className: "text-center leading-tight", children: [_jsx("p", { className: "text-[10px] font-semibold", children: item.label }), _jsx("p", { className: completed ? "text-[9px] text-emerald-500 font-medium" : "text-[9px] text-muted-foreground/60", children: completed ? 'Completado' : 'Pendiente' })] })] }));
}
export function PanelControlSection({ timeData = {}, completions = {}, workoutDuration = 0, date }) {
    const today = date || new Date();
    const dateKey = format(today, 'yyyy-MM-dd');
    const [areaMinutes, setAreaMinutes] = useState({});
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from('daily_area_stats')
                    .select('area_id, time_spent_minutes')
                    .eq('stat_date', dateKey);
                const m = {};
                (data || []).forEach(r => { m[r.area_id] = r.time_spent_minutes || 0; });
                if (alive) setAreaMinutes(m);
            } catch { }
        })();
        return () => { alive = false; };
    }, [dateKey]);
    const mergedMinutes = (id) => {
        const base = minutesOfToday(timeData, workoutDuration, id);
        if (id === 'gym') return Math.max(base, areaMinutes['gym'] || 0);
        if (id === 'idiomas') return Math.max(base, (areaMinutes['italiano'] || 0) + (areaMinutes['ingles'] || 0));
        return Math.max(base, areaMinutes[id] || 0);
    };
    const summary = useMemo(() => {
        const minutes = ALL_TIMER_ITEMS.reduce((s, it) => s + mergedMinutes(it.id), 0);
        const goal = ALL_TIMER_ITEMS.reduce((s, it) => s + goalOfToday(today, it.id), 0);
        return { minutes, goal, pct: goal > 0 ? Math.min(100, Math.round((minutes / goal) * 100)) : 0 };
    }, [timeData, workoutDuration, areaMinutes, today]); // eslint-disable-line react-hooks/exhaustive-deps
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [_jsx(GlowRing, { pct: summary.pct, color: "#6366f1", size: 60, children: _jsxs("span", { className: "text-xs font-bold tabular-nums", children: [summary.pct, "%"] }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-xs font-semibold flex items-center gap-1.5", children: [_jsx(Gauge, { className: "h-3.5 w-3.5 text-indigo-500" }), " Panel de control"] }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [summary.minutes, " min invertidos \u00B7 objetivo ", summary.goal, " min"] })] })] }) }), _jsxs("div", { className: "space-y-2.5", children: [_jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground px-1", children: "Prioridades" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2", children: PRIORITIES.map(it => {
                            const g = goalOfToday(today, it.id);
                            return (_jsx(TimerRingCard, { item: it, minutes: mergedMinutes(it.id), min: Math.round(g / 2), max: g }, it.id));
                        }) })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground px-1", children: "Acumulativos" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: HOBBY_ITEMS.map(it => {
                            const range = HOBBY_RANGES[it.id] || { min: 10, max: 30 };
                            return (_jsx(TimerRingCard, { item: it, minutes: mergedMinutes(it.id), min: range.min, max: range.max }, it.id));
                        }) })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground px-1", children: "Sost\u00E9n" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: SOSTEN_ITEMS.map(it => (_jsx(SostenRing, { item: it, completed: !!completions[it.id] }, it.id))) })] })] }));
}
