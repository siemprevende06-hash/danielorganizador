import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Brain, Target, Dumbbell, BookOpen, Music, TrendingUp, BarChart3, Zap, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Mismas áreas que agrega la página Estadísticas de Esfuerzo
const AREA_ICONS = {
    universidad: _jsx(Brain, { className: "w-3.5 h-3.5" }),
    emprendimiento: _jsx(TrendingUp, { className: "w-3.5 h-3.5" }),
    proyectos: _jsx(Target, { className: "w-3.5 h-3.5" }),
    gym: _jsx(Dumbbell, { className: "w-3.5 h-3.5" }),
    idiomas: _jsx(BookOpen, { className: "w-3.5 h-3.5" }),
    lectura: _jsx(BookOpen, { className: "w-3.5 h-3.5" }),
    musica: _jsx(Music, { className: "w-3.5 h-3.5" }),
    ajedrez: _jsx(Gamepad2, { className: "w-3.5 h-3.5" }),
    game: _jsx(Gamepad2, { className: "w-3.5 h-3.5" }),
};
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
export function MonthlyTimeBreakdown({ currentMonth }) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);
    const daysInMonth = monthDays.length;
    const TOTAL_MONTH_HOURS = daysInMonth * 24;
    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');
    const { data: focusData } = useQuery({
        queryKey: ['monthlyFocusBreakdown', startStr],
        queryFn: async () => {
            const { data } = await supabase
                .from('focus_sessions')
                .select('*')
                .gte('start_time', `${startStr}T00:00:00`)
                .lte('start_time', `${endStr}T23:59:59`);
            return data || [];
        },
    });
    const { data: systemsData } = useQuery({
        queryKey: ['monthlySystemsTime', startStr],
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
        queryKey: ['monthlyAreaStatsTime', startStr],
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
        return monthDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const byArea = areaByDay[dayStr] || {};
            const totalMin = Object.values(byArea).reduce((s, v) => s + v, 0);
            return { day, totalMin, byArea };
        });
    }, [systemsData, areaStatsData, monthDays]);
    // Totales mensuales por área (mismo resultado que el agregado mensual de Esfuerzo)
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
    const focusPct = Math.round((totalFocusMinutes / (TOTAL_MONTH_HOURS * 60)) * 100);
    const maxDayMin = Math.max(...dayBreakdown.map(d => d.totalMin), 1);
    const { bestDay, bestMin } = useMemo(() => {
        const best = dayBreakdown.reduce((b, d) => d.totalMin > b.totalMin ? d : b, dayBreakdown[0] || { day: new Date(), totalMin: 0, byArea: {} });
        return { bestDay: best.day, bestMin: best.totalMin };
    }, [dayBreakdown]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-primary/10", children: _jsx(Clock, { className: "w-5 h-5 text-primary" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-base font-bold", children: ["Tienes ~", TOTAL_MONTH_HOURS, " horas este mes"] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Has registrado ", totalFocusHours, "h de esfuerzo total (", focusPct, "% del mes)"] })] })] }), _jsxs("div", { className: "relative h-6 rounded-full bg-muted overflow-hidden", children: [_jsx("div", { className: "absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all", style: { width: `${Math.min(focusPct, 100)}%` }, children: areaTotals.map(at => (_jsx("div", { className: cn("h-full", AREA_COLORS[at.area] || 'bg-primary'), style: { width: `${(at.minutes / totalFocusMinutes) * 100}%` } }, at.area))) }), _jsxs("div", { className: "absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium", children: [_jsx("span", { className: "text-muted-foreground/60", children: "0h" }), _jsxs("span", { className: cn("font-bold", focusPct > 10 ? "text-primary-foreground" : "text-muted-foreground"), children: [totalFocusHours, "h / ~", TOTAL_MONTH_HOURS, "h"] }), _jsxs("span", { className: "text-muted-foreground/60", children: [TOTAL_MONTH_HOURS, "h"] })] })] }), bestMin > 0 && (_jsxs("p", { className: "text-[10px] text-muted-foreground/60 mt-2 text-center", children: ["Mejor d\u00EDa: ", format(bestDay, 'd MMM', { locale: es }), " con ", bestMin, "m de esfuerzo"] })), areaTotals.length > 0 && (_jsx("div", { className: "flex gap-2.5 mt-2 flex-wrap justify-center text-[9px] text-muted-foreground/70", children: areaTotals.map(at => (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-primary') }), AREA_LABELS[at.area] || at.area, " \u00B7 ", at.hours, "h"] }, at.area))) }))] }) }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-blue-500 to-cyan-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-3.5 h-3.5" }), "Minutos de esfuerzo por d\u00EDa"] }), _jsx("div", { className: "space-y-1 max-h-80 overflow-y-auto pr-1", children: dayBreakdown.map((d, i) => {
                                    const barPct = Math.round((d.totalMin / maxDayMin) * 100);
                                    const daySegments = Object.entries(d.byArea);
                                    return (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: "w-20 text-[10px] text-muted-foreground shrink-0 text-right", children: format(d.day, 'EEE d MMM', { locale: es }) }), _jsxs("div", { className: "flex-1 h-5 bg-muted/50 rounded-full overflow-hidden relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all", style: { width: `${Math.max(barPct, d.totalMin > 0 ? 2 : 0)}%` }, children: daySegments.map(([area, min]) => (_jsx("div", { className: cn("h-full", AREA_COLORS[area] || 'bg-muted-foreground/40'), style: { width: `${(min / Math.max(d.totalMin, 1)) * 100}%` } }, area))) }), _jsx("span", { className: "absolute inset-0 flex items-center px-2 text-[9px] text-muted-foreground/60", children: d.totalMin > 0 ? `${d.totalMin}m` : '—' })] })] }, i));
                                }) }), areaTotals.length > 0 && (_jsx("div", { className: "flex gap-3 mt-3 text-[9px] text-muted-foreground/60 justify-center flex-wrap", children: areaTotals.map(at => (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-muted-foreground/40') }), AREA_LABELS[at.area] || at.area] }, at.area))) }))] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-purple-500 to-pink-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(Target, { className: "w-3.5 h-3.5" }), "Tiempo por \u00E1rea"] }), areaTotals.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: "Sin tiempo registrado este mes" })) : (_jsx("div", { className: "space-y-2", children: areaTotals.map(at => {
                                    const maxMin = areaTotals[0]?.minutes || 1;
                                    const pct = Math.round((at.minutes / maxMin) * 100);
                                    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("w-1.5 h-8 rounded-full shrink-0", AREA_COLORS[at.area] || 'bg-muted-foreground') }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [AREA_ICONS[at.area] || _jsx(Zap, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-xs font-medium capitalize truncate", children: AREA_LABELS[at.area] || at.area })] }), _jsxs("span", { className: "text-xs font-mono font-bold", children: [at.hours, "h"] })] }), _jsx(Progress, { value: pct, className: "h-1 mt-1" })] })] }, at.area));
                                }) }))] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-emerald-500 to-teal-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(Zap, { className: "w-3.5 h-3.5" }), "Sesiones de foco"] }), !focusData || focusData.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: "Sin sesiones de foco este mes" })) : (_jsx("div", { className: "space-y-1.5 max-h-60 overflow-y-auto", children: focusData.slice().reverse().slice(0, 50).map((session) => {
                                    const sessionDate = format(new Date(session.start_time), 'EEE d MMM', { locale: es });
                                    return (_jsxs("div", { className: "flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors", children: [_jsx("div", { className: cn("w-2 h-2 rounded-full shrink-0", session.completed ? "bg-green-500" : "bg-amber-500") }), _jsx("span", { className: "text-[9px] text-muted-foreground w-20 shrink-0", children: sessionDate }), _jsx("span", { className: "flex-1 truncate", children: session.task_title }), _jsxs(Badge, { variant: "outline", className: "text-[9px] font-mono shrink-0 rounded-full px-1.5", children: [session.duration_minutes || 0, "m"] })] }, session.id));
                                }) }))] })] })] }));
}
