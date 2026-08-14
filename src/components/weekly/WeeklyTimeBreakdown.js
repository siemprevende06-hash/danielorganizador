import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
const TOTAL_WEEK_HOURS = 168;
const AREA_COLORS = {
    universidad: 'bg-blue-500',
    emprendimiento: 'bg-purple-500',
    proyectos: 'bg-amber-500',
    gym: 'bg-red-500',
    idiomas: 'bg-emerald-500',
    lectura: 'bg-cyan-500',
    musica: 'bg-pink-500',
    ajedrez: 'bg-teal-500',
    game: 'bg-rose-500',
};
const AREA_LABELS = {
    universidad: 'Universidad',
    emprendimiento: 'Emprendimiento',
    proyectos: 'Proyectos',
    gym: 'Gym',
    idiomas: 'Idiomas',
    lectura: 'Lectura',
    musica: 'Música',
    ajedrez: 'Ajedrez',
    game: 'Game',
};
const MEJORA_KEYS = ['lectura', 'musica', 'ajedrez', 'italiano', 'ingles', 'game'];
const FOCUS_AREA_IDS = ['universidad', 'emprendimiento', 'proyectos'];
export function WeeklyTimeBreakdown({ weekStart, weekEnd }) {
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');
    const { data: systemsData } = useQuery({
        queryKey: ['weeklySystemsTime', startStr],
        queryFn: async () => {
            const { data } = await supabase
                .from('daily_systems_tracking')
                .select('tracking_date, time_data, workout_duration')
                .gte('tracking_date', startStr)
                .lte('tracking_date', endStr);
            return data || [];
        },
    });
    const { data: areaStatsData } = useQuery({
        queryKey: ['weeklyAreaStatsTime', startStr],
        queryFn: async () => {
            const { data } = await supabase
                .from('daily_area_stats')
                .select('area_id, stat_date, time_spent_minutes')
                .gte('stat_date', startStr)
                .lte('stat_date', endStr);
            return data || [];
        },
    });
    // Distribución de minutos por día y por área — mismas fuentes que la página Esfuerzo
    const dayBreakdown = useMemo(() => {
        const areaByDay = {};
        const add = (date, area, min) => {
            if (!areaByDay[date])
                areaByDay[date] = {};
            areaByDay[date][area] = (areaByDay[date][area] || 0) + min;
        };
        (systemsData || []).forEach((row) => {
            const td = row.time_data || {};
            MEJORA_KEYS.forEach(k => {
                const v = Number(td[k]) || 0;
                if (v > 0)
                    add(row.tracking_date, k === 'italiano' || k === 'ingles' ? 'idiomas' : k, v);
            });
            const w = row.workout_duration || 0;
            if (w > 0)
                add(row.tracking_date, 'gym', w);
        });
        (areaStatsData || []).forEach((row) => {
            if (FOCUS_AREA_IDS.includes(row.area_id) && (row.time_spent_minutes || 0) > 0) {
                add(row.stat_date, row.area_id, row.time_spent_minutes);
            }
        });
        return weekDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const byArea = areaByDay[dayStr] || {};
            const totalMin = Object.values(byArea).reduce((s, v) => s + v, 0);
            return { day, totalMin, byArea };
        });
    }, [systemsData, areaStatsData, weekDays]);
    // Totales semanales por área (mismo resultado que el agregado mensual de Esfuerzo)
    const areaTotals = useMemo(() => {
        const totals = {};
        dayBreakdown.forEach(d => {
            Object.entries(d.byArea).forEach(([area, min]) => {
                totals[area] = (totals[area] || 0) + min;
            });
        });
        return Object.entries(totals)
            .map(([area, minutes]) => ({ area, minutes, hours: Math.round((minutes / 60) * 10) / 10 }))
            .filter(t => t.minutes > 0)
            .sort((a, b) => b.minutes - a.minutes);
    }, [dayBreakdown]);
    const totalFocusMinutes = dayBreakdown.reduce((s, d) => s + d.totalMin, 0);
    const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;
    const focusPct = Math.round((totalFocusMinutes / (TOTAL_WEEK_HOURS * 60)) * 100);
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-primary/10", children: _jsx(Clock, { className: "w-5 h-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold", children: "Tienes 168 horas esta semana" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Has registrado ", totalFocusHours, "h de esfuerzo total (", focusPct, "% de tu semana)"] })] })] }), _jsxs("div", { className: "relative h-6 rounded-full bg-muted overflow-hidden", children: [_jsx("div", { className: "absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all", style: { width: `${Math.min(focusPct, 100)}%` }, children: areaTotals.map(at => (_jsx("div", { className: cn("h-full", AREA_COLORS[at.area] || 'bg-primary'), style: { width: `${(at.minutes / totalFocusMinutes) * 100}%` } }, at.area))) }), _jsxs("div", { className: "absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium", children: [_jsx("span", { className: "text-muted-foreground/60", children: "0h" }), _jsxs("span", { className: cn("font-bold", focusPct > 15 ? "text-primary-foreground" : "text-muted-foreground"), children: [totalFocusHours, "h / 168h"] }), _jsx("span", { className: "text-muted-foreground/60", children: "168h" })] })] }), _jsx("p", { className: "text-[10px] text-muted-foreground/60 mt-2 text-center", children: "Cada color es el tiempo invertido en una de tus \u00E1reas. El resto se distribuye entre dormir (~56h), rutinas, ocio y otras actividades" }), areaTotals.length > 0 && (_jsx("div", { className: "flex gap-2.5 mt-2 flex-wrap justify-center text-[9px] text-muted-foreground/70", children: areaTotals.map(at => (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-primary') }), AREA_LABELS[at.area] || at.area, " \u00B7 ", at.hours, "h"] }, at.area))) }))] }) }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-blue-500 to-cyan-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-3.5 h-3.5" }), "Minutos de foco por d\u00EDa"] }), _jsx("div", { className: "space-y-2", children: dayBreakdown.map((d, i) => {
                                    const pct = totalFocusMinutes > 0 ? Math.round((d.totalMin / totalFocusMinutes) * 100) : 0;
                                    const daySegments = Object.entries(d.byArea);
                                    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "w-8 text-[10px] font-medium text-muted-foreground text-right", children: dayNames[i] }), _jsxs("div", { className: "flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all", style: { width: `${Math.max(pct, d.totalMin > 0 ? 3 : 0)}%` }, children: daySegments.map(([area, min]) => (_jsx("div", { className: cn("h-full", AREA_COLORS[area] || 'bg-muted-foreground/40'), style: { width: `${(min / Math.max(d.totalMin, 1)) * 100}%` } }, area))) }), _jsxs("div", { className: "absolute inset-0 flex items-center px-2", children: [_jsx("span", { className: "text-[10px] font-medium text-muted-foreground/80", children: format(d.day, 'd MMM', { locale: es }) }), _jsx("span", { className: "ml-auto text-[10px] font-mono font-bold", children: d.totalMin > 0 ? `${d.totalMin}m` : '—' })] })] }), _jsxs("span", { className: "w-6 text-[9px] text-muted-foreground/60", children: [pct, "%"] })] }, i));
                                }) }), areaTotals.length > 0 && (_jsx("div", { className: "flex gap-3 mt-3 text-[9px] text-muted-foreground/60 justify-center flex-wrap", children: areaTotals.map(at => (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-muted-foreground/40') }), AREA_LABELS[at.area] || at.area] }, at.area))) }))] })] })] }));
}
