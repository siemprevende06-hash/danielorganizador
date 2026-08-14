import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, BarChart3, Shield, TrendingUp, Dumbbell, BookOpen, Music, Gamepad2, Globe, Clock, GraduationCap, Briefcase, FolderKanban, ListTodo, Target, TrendingDown, TrendingUp as TrendingUpIcon, Minus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// ---------- Sostén ----------
const SOSTEN_GROUPS = [
    {
        label: 'Estructural', habits: [
            { id: 'rutina-activacion', label: 'Activación' },
            { id: 'alistamiento-desayuno', label: 'Alistamiento' },
            { id: 'horario-regular', label: 'Horario' },
            { id: 'rutina-desactivacion', label: 'Desactivación' },
        ],
    },
    {
        label: 'Apariencia', habits: [
            { id: 'skincare-manana', label: 'Skincare AM' },
            { id: 'skincare-noche', label: 'Skincare PM' },
            { id: 'banarme-vestirme', label: 'Bañarse' },
        ],
    },
    {
        label: 'Alimentación', habits: [
            { id: 'pre-entreno', label: 'Pre-entreno' },
            { id: 'desayuno', label: 'Desayuno' },
            { id: 'merienda-1', label: 'Merienda 1' },
            { id: 'almuerzo', label: 'Almuerzo' },
            { id: 'merienda-2', label: 'Merienda 2' },
            { id: 'comida', label: 'Comida' },
            { id: 'antes-dormir', label: 'Antes dormir' },
            { id: 'suplementos', label: 'Suplem.' },
        ],
    },
];
const ALL_SOSTEN_IDS = SOSTEN_GROUPS.flatMap(g => g.habits.map(h => h.id));
const DAILY_TARGETS = {
    lectura: 20, musica: 30, ajedrez: 15, idiomas: 30, game: 15, 'entrenamiento-fisico': 45,
};
// ---------- Mejora ----------
const MEJORA_HABITS = [
    { id: 'lectura', label: 'Lectura', icon: BookOpen, hasTime: true },
    { id: 'musica', label: 'Música', icon: Music, hasTime: true },
    { id: 'ajedrez', label: 'Ajedrez', icon: Gamepad2, hasTime: true, hasCount: true, countLabel: 'part.' },
    { id: 'idiomas', label: 'Idiomas', icon: Globe, hasTime: true },
    { id: 'game', label: 'Game (Seducción)', icon: Gamepad2, hasTime: true },
    { id: 'entrenamiento-fisico', label: 'Entreno', icon: Dumbbell, hasTime: true },
];
// ---------- Focus ----------
const FOCUS_AREAS = [
    { id: 'universidad', label: 'Universidad', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { id: 'emprendimiento', label: 'Emprendimiento', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { id: 'proyectos', label: 'Proyectos', icon: FolderKanban, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { id: 'tareas-generales', label: 'Tareas Grales.', icon: ListTodo, color: 'text-muted-foreground', bg: 'bg-muted/20' },
];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function getMejoraTime(td, habitId) {
    if (!td)
        return 0;
    if (habitId === 'idiomas')
        return (Number(td.italiano) || 0) + (Number(td.ingles) || 0);
    return Number(td[habitId]) || 0;
}
// ─── Utility: weekly buckets for trend analysis ───
function getWeekId(dateStr) {
    const d = parseISO(dateStr);
    const start = startOfWeek(d, { weekStartsOn: 1 });
    return format(start, 'yyyy-MM-dd');
}
export default function EstadisticasEsfuerzo() {
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
    const [systemsData, setSystemsData] = useState([]);
    const [areaStats, setAreaStats] = useState([]);
    const [taskCompletions, setTaskCompletions] = useState([]);
    // ─── Load all data ───
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            try {
                const results = await Promise.allSettled([
                    supabase.from('daily_systems_tracking').select('tracking_date, completions, time_data, count_data, block_completions, workout_duration, skipped, active_focus_areas').gte('tracking_date', startDate).lte('tracking_date', endDate).order('tracking_date', { ascending: true }),
                    supabase.from('daily_area_stats').select('area_id, stat_date, time_spent_minutes').gte('stat_date', startDate).lte('stat_date', endDate).order('stat_date', { ascending: true }),
                    supabase.from('tasks').select('id, completed, source, due_date, area_id').or(`due_date.gte.${startDate}`),
                ]);
                setSystemsData(results[0].status === 'fulfilled' ? results[0].value.data || [] : []);
                setAreaStats(results[1].status === 'fulfilled' ? results[1].value.data || [] : []);
                setTaskCompletions(results[2].status === 'fulfilled' ? results[2].value.data || [] : []);
            }
            catch (e) {
                console.error('[EstadisticasEsfuerzo] Error loading data:', e);
            }
            setLoading(false);
        };
        load();
    }, [year]);
    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    // ─── Filtered days for the selected month ───
    const monthDays = useMemo(() => {
        return systemsData.filter(r => r.tracking_date.startsWith(monthKey));
    }, [systemsData, monthKey]);
    // ─── Focus data per day ───
    const focusPerDay = useMemo(() => {
        const areaMap = {};
        areaStats.forEach(a => {
            if (!a.stat_date.startsWith(monthKey))
                return;
            if (!areaMap[a.stat_date])
                areaMap[a.stat_date] = { universidad: 0, emprendimiento: 0, proyectos: 0 };
            if (a.area_id === 'universidad' || a.area_id === 'emprendimiento' || a.area_id === 'proyectos') {
                areaMap[a.stat_date][a.area_id] = (areaMap[a.stat_date][a.area_id] || 0) + (a.time_spent_minutes || 0);
            }
        });
        // Task completions per day (general tasks)
        const taskMap = {};
        taskCompletions.forEach(t => {
            if (t.completed && t.due_date) {
                const d = t.due_date.slice(0, 10);
                if (d.startsWith(monthKey)) {
                    if (t.source === 'general' || (!t.source && !t.area_id)) {
                        taskMap[d] = (taskMap[d] || 0) + 1;
                    }
                }
            }
        });
        const sysByDate = {};
        monthDays.forEach(d => { sysByDate[d.tracking_date] = d; });
        const dates = monthDays.map(d => d.tracking_date);
        return dates.map(date => {
            const sys = sysByDate[date];
            const activeAreas = sys?.active_focus_areas;
            const skipped = sys?.skipped || {};
            return {
                date,
                universidad: areaMap[date]?.universidad || 0,
                emprendimiento: areaMap[date]?.emprendimiento || 0,
                proyectos: areaMap[date]?.proyectos || 0,
                tareasGenerales: taskMap[date] || 0,
                activeFocusAreas: activeAreas,
                skipped: skipped,
                noSystemsData: !sys,
            };
        });
    }, [monthDays, areaStats, taskCompletions, monthKey]);
    // ─── Weekly aggregated data for trends ───
    const weeklyTrends = useMemo(() => {
        const weeks = {};
        const allSystems = systemsData;
        const areaMapAll = {};
        areaStats.forEach(a => {
            if (!areaMapAll[a.stat_date])
                areaMapAll[a.stat_date] = { universidad: 0, emprendimiento: 0, proyectos: 0 };
            if (a.area_id === 'universidad' || a.area_id === 'emprendimiento' || a.area_id === 'proyectos') {
                areaMapAll[a.stat_date][a.area_id] = (areaMapAll[a.stat_date][a.area_id] || 0) + (a.time_spent_minutes || 0);
            }
        });
        taskCompletions.forEach(t => {
            if (!t.completed || !t.due_date)
                return;
            const d = t.due_date.slice(0, 10);
            if (d < `${year}-01-01` || d > `${year}-12-31`)
                return;
            if (t.source === 'general' || (!t.source && !t.area_id)) {
                const wid = getWeekId(d);
                if (!weeks[wid])
                    weeks[wid] = { days: 0, sosten: 0, sostenTotal: 0, mejoraMin: 0, focus: { universidad: 0, emprendimiento: 0, proyectos: 0 }, tareas: 0, habitCompletions: {}, habitMinutes: {} };
                weeks[wid].tareas++;
            }
        });
        allSystems.forEach(row => {
            const wid = getWeekId(row.tracking_date);
            if (!weeks[wid])
                weeks[wid] = { days: 0, sosten: 0, sostenTotal: 0, mejoraMin: 0, focus: { universidad: 0, emprendimiento: 0, proyectos: 0 }, tareas: 0, habitCompletions: {}, habitMinutes: {} };
            weeks[wid].days++;
            const c = row.completions || {};
            ALL_SOSTEN_IDS.forEach(h => {
                if (c[h])
                    weeks[wid].sosten++;
                if (c[h])
                    weeks[wid].habitCompletions[h] = (weeks[wid].habitCompletions[h] || 0) + 1;
            });
            weeks[wid].sostenTotal += ALL_SOSTEN_IDS.length;
            const td = row.time_data || {};
            MEJORA_HABITS.forEach(h => {
                const mins = getMejoraTime(td, h.id);
                weeks[wid].mejoraMin += mins;
                weeks[wid].habitMinutes[h.id] = (weeks[wid].habitMinutes[h.id] || 0) + mins;
            });
            weeks[wid].mejoraMin += (row.workout_duration || 0);
            weeks[wid].habitMinutes['entrenamiento-fisico'] = (weeks[wid].habitMinutes['entrenamiento-fisico'] || 0) + (row.workout_duration || 0);
            const f = areaMapAll[row.tracking_date];
            if (f) {
                weeks[wid].focus.universidad += f.universidad || 0;
                weeks[wid].focus.emprendimiento += f.emprendimiento || 0;
                weeks[wid].focus.proyectos += f.proyectos || 0;
            }
        });
        return Object.entries(weeks)
            .map(([weekId, data]) => {
            const daysCount = data.days || 1;
            const perHabitCompletions = {};
            ALL_SOSTEN_IDS.forEach(h => {
                perHabitCompletions[h] = Math.round(((data.habitCompletions[h] || 0) / daysCount) * 100);
            });
            return {
                weekId,
                label: `Sem ${weekId.slice(-5)}`,
                ...data,
                sostenPct: data.sostenTotal > 0 ? Math.round((data.sosten / data.sostenTotal) * 100) : 0,
                focusTotal: data.focus.universidad + data.focus.emprendimiento + data.focus.proyectos,
                perHabitCompletions,
            };
        })
            .sort((a, b) => a.weekId.localeCompare(b.weekId));
    }, [systemsData, areaStats, taskCompletions, year]);
    // ─── Stats for the current month ───
    const monthTotalSosten = ALL_SOSTEN_IDS.reduce((acc, h) => acc + monthDays.filter(d => d.completions?.[h]).length, 0);
    const monthMaxSosten = monthDays.length * ALL_SOSTEN_IDS.length;
    const monthSostenPct = monthMaxSosten > 0 ? Math.round((monthTotalSosten / monthMaxSosten) * 100) : 0;
    const monthMejoraMin = monthDays.reduce((s, d) => {
        const td = d.time_data || {};
        return s + MEJORA_HABITS.reduce((a, h) => a + getMejoraTime(td, h.id), 0) + (d.workout_duration || 0);
    }, 0);
    const monthFocusMin = focusPerDay.reduce((s, d) => s + d.universidad + d.emprendimiento + d.proyectos, 0);
    const monthTareas = focusPerDay.reduce((s, d) => s + d.tareasGenerales, 0);
    const bestDaySosten = monthDays.length > 0 ? Math.max(...monthDays.map(d => ALL_SOSTEN_IDS.filter(h => d.completions?.[h]).length)) : 0;
    const avgDaySosten = monthDays.length > 0 ? Math.round(monthTotalSosten / monthDays.length) : 0;
    const bestDayFocus = focusPerDay.length > 0 ? Math.max(...focusPerDay.map(d => d.universidad + d.emprendimiento + d.proyectos)) : 0;
    const avgDayFocus = focusPerDay.length > 0 ? Math.round(focusPerDay.reduce((s, d) => s + d.universidad + d.emprendimiento + d.proyectos, 0) / focusPerDay.length) : 0;
    // ─── Consistency: days with >= 80% sosten ───
    const consistentDays = monthDays.filter(d => ALL_SOSTEN_IDS.filter(h => d.completions?.[h]).length / ALL_SOSTEN_IDS.length >= 0.8).length;
    const consistencyPct = monthDays.length > 0 ? Math.round((consistentDays / monthDays.length) * 100) : 0;
    // ─── Top mejora habit ───
    const mejoraTotals = MEJORA_HABITS.map(h => ({
        ...h,
        total: monthDays.reduce((s, d) => s + getMejoraTime(d.time_data, h.id), 0),
    }));
    mejoraTotals.push({ id: 'entreno', label: 'Entreno', icon: Dumbbell, hasTime: true, total: monthDays.reduce((s, d) => s + (d.workout_duration || 0), 0) });
    const topMejora = [...mejoraTotals].sort((a, b) => b.total - a.total)[0];
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500", children: _jsx(BarChart3, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Estad\u00EDsticas de Esfuerzo" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Sost\u00E9n \u00B7 Mejora \u00B7 Enfoque" })] })] }), _jsxs("div", { className: "flex items-center gap-1 bg-muted/50 rounded-lg p-0.5", children: [_jsx("button", { onClick: () => setYear(y => y - 1), className: "h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors", children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx("span", { className: "text-sm font-semibold min-w-[60px] text-center", children: year }), _jsx("button", { onClick: () => setYear(y => Math.min(y + 1, new Date().getFullYear())), className: "h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors", children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }), _jsx("div", { className: "flex gap-1 overflow-x-auto pb-1", children: MONTHS.map((name, i) => (_jsx("button", { onClick: () => setMonthIdx(i), className: cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0", i === monthIdx ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"), children: name }, i))) }), loading ? (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Cargando..." })) : monthDays.length === 0 ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(BarChart3, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsxs("p", { className: "font-medium mb-1", children: ["Sin datos en ", MONTHS[monthIdx], " ", year] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Registra actividad desde la p\u00E1gina Hoy" })] }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [
                                { icon: CheckCircle2, label: 'Días registrados', value: monthDays.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                                { icon: Shield, label: 'Sostén prom./día', value: `${avgDaySosten}/${ALL_SOSTEN_IDS.length}`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                                { icon: TrendingUp, label: 'Total mejora', value: `${monthMejoraMin}min`, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
                                { icon: Target, label: 'Total enfoque', value: `${monthFocusMin}min`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                            ].map((s, i) => (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "p-3 text-center space-y-1", children: [_jsx("div", { className: cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto", s.bg), children: _jsx(s.icon, { className: cn("h-3.5 w-3.5", s.color) }) }), _jsx("div", { className: "text-lg font-bold tabular-nums", children: s.value }), _jsx("div", { className: "text-[9px] text-muted-foreground", children: s.label })] }) }, i))) }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-emerald-500 to-teal-400" }), _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "flex items-center gap-2 p-3 border-b border-border/30", children: [_jsx(Shield, { className: "h-4 w-4 text-emerald-500" }), _jsx("h2", { className: "text-sm font-bold", children: "Sost\u00E9n" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "\u2705 hecho \u00B7 \u274C no hice \u00B7 \u2014 sin dato" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-[10px]", style: { borderCollapse: 'collapse' }, children: [_jsxs("thead", { children: [_jsxs("tr", { className: "bg-muted/20", children: [_jsx("th", { className: "sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20", children: "D\u00EDa" }), SOSTEN_GROUPS.map(g => (_jsx("th", { colSpan: g.habits.length, className: "text-center px-1 py-1.5 font-medium text-muted-foreground/60 text-[9px] uppercase tracking-wider border border-border/20", children: g.label }, g.label)))] }), _jsxs("tr", { className: "bg-muted/10", children: [_jsx("th", { className: "sticky left-0 bg-muted/10 px-2 py-1 z-10 border border-border/20" }), SOSTEN_GROUPS.flatMap(g => g.habits).map(h => (_jsx("th", { className: "text-center px-1 py-1 font-medium text-muted-foreground/80 min-w-[40px] border border-border/20", children: h.label }, h.id)))] })] }), _jsxs("tbody", { children: [monthDays.map((day, idx) => (_jsxs("tr", { className: cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-950/50" : "bg-muted/5"), children: [_jsx("td", { className: "sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20", style: { background: 'inherit' }, children: format(parseISO(day.tracking_date), 'EEE d', { locale: es }) }), SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                                                                        const done = day.completions?.[h.id] === true;
                                                                        const skipped = day.skipped?.[h.id] === true;
                                                                        const noData = !done && !skipped;
                                                                        return (_jsx("td", { className: cn("text-center px-1 py-1 border border-border/20", done && "text-emerald-500", skipped && "text-red-400/80", noData && "text-muted-foreground/30"), children: done ? '✅' : skipped ? '✗' : '—' }, h.id));
                                                                    })] }, day.tracking_date))), _jsxs("tr", { className: "bg-muted/20 font-bold text-[9px]", children: [_jsx("td", { className: "sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20", children: "Completados" }), SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                                                                        const count = monthDays.filter(d => d.completions?.[h.id] === true).length;
                                                                        const pct = Math.round((count / Math.max(monthDays.length, 1)) * 100);
                                                                        return (_jsxs("td", { className: cn("text-center px-1 py-1.5 border border-border/20", pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-400"), children: [count, _jsxs("span", { className: "text-muted-foreground", children: ["/", monthDays.length] })] }, h.id));
                                                                    })] })] })] }) })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-purple-500 to-pink-400" }), _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "flex items-center gap-2 p-3 border-b border-border/30", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }), _jsx("h2", { className: "text-sm font-bold", children: "Mejora" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "minutos \u00B7 x = no hice \u00B7 \u2014 = sin dato" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-[10px]", style: { borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-muted/20", children: [_jsx("th", { className: "sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20", children: "D\u00EDa" }), MEJORA_HABITS.map(h => (_jsx("th", { className: "text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[50px] border border-border/20", children: _jsxs("div", { className: "flex items-center justify-center gap-1", children: [_jsx(h.icon, { className: "h-3 w-3" }), _jsx("span", { children: h.label })] }) }, h.id))), _jsx("th", { className: "text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[44px] border border-border/20", children: "Total" })] }) }), _jsxs("tbody", { children: [monthDays.map((day, idx) => {
                                                                const vals = MEJORA_HABITS.map(h => h.id === 'entrenamiento-fisico' ? (day.workout_duration || 0) : getMejoraTime(day.time_data, h.id));
                                                                const total = vals.reduce((s, v) => s + v, 0) + (day.workout_duration || 0);
                                                                return (_jsxs("tr", { className: cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-950/50" : "bg-muted/5"), children: [_jsx("td", { className: "sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20", style: { background: 'inherit' }, children: format(parseISO(day.tracking_date), 'EEE d', { locale: es }) }), MEJORA_HABITS.map((h, i) => {
                                                                            const v = vals[i];
                                                                            const skipped = h.id === 'entrenamiento-fisico'
                                                                                ? day.skipped?.['entrenamiento-fisico']
                                                                                : h.id === 'idiomas'
                                                                                    ? (day.skipped?.italiano || day.skipped?.ingles)
                                                                                    : day.skipped?.[h.id];
                                                                            const noData = v === 0 && !skipped;
                                                                            return (_jsxs("td", { className: "text-center px-2 py-1 border border-border/20", children: [_jsx("span", { className: cn("tabular-nums", h.hasTime && v >= (DAILY_TARGETS[h.id] || 30) && "text-emerald-500 font-medium", h.hasTime && v > 0 && v < (DAILY_TARGETS[h.id] || 30) && "text-red-500", skipped && "text-red-400/80", noData && "text-muted-foreground/30"), children: v > 0 ? `${v}'` : skipped ? 'x' : '—' }), h.hasCount && (day.count_data?.[h.id] || 0) > 0 && (_jsxs("span", { className: "text-[8px] text-muted-foreground ml-0.5", children: ["(", day.count_data[h.id], ")"] }))] }, h.id));
                                                                        }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums font-medium", children: total > 0 ? `${total}'` : '—' })] }, day.tracking_date));
                                                            }), _jsxs("tr", { className: "bg-muted/20 font-bold text-[9px]", children: [_jsx("td", { className: "sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20", children: "Total mes" }), MEJORA_HABITS.map(h => {
                                                                        const total = h.id === 'entrenamiento-fisico'
                                                                            ? monthDays.reduce((s, d) => s + (d.workout_duration || 0), 0)
                                                                            : monthDays.reduce((s, d) => s + getMejoraTime(d.time_data, h.id), 0);
                                                                        return (_jsx("td", { className: "text-center px-2 py-1.5 border border-border/20", children: total > 0 ? `${total}'` : '—' }, h.id));
                                                                    }), _jsxs("td", { className: "text-center px-2 py-1.5 border border-border/20 text-purple-600", children: [monthMejoraMin, "'"] })] })] })] }) })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-amber-500 to-orange-400" }), _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "flex items-center gap-2 p-3 border-b border-border/30", children: [_jsx(Target, { className: "h-4 w-4 text-amber-500" }), _jsx("h2", { className: "text-sm font-bold", children: "Enfoque" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "minutos \u00B7 x = no hice \u00B7 \u2014 = sin dato \u00B7 -- = no enfoque" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-[10px]", style: { borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-muted/20", children: [_jsx("th", { className: "sticky left-0 bg-muted/20 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[56px] z-10 border border-border/20", children: "D\u00EDa" }), FOCUS_AREAS.map(a => (_jsx("th", { className: "text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[60px] border border-border/20", children: _jsxs("div", { className: "flex items-center justify-center gap-1", children: [_jsx(a.icon, { className: cn("h-3 w-3", a.color) }), _jsx("span", { children: a.label })] }) }, a.id))), _jsx("th", { className: "text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[44px] border border-border/20", children: "Total" })] }) }), _jsxs("tbody", { children: [focusPerDay.map((d, idx) => {
                                                                const total = d.universidad + d.emprendimiento + d.proyectos;
                                                                const renderFocusCell = (areaId, value) => {
                                                                    const activeAreas = d.activeFocusAreas;
                                                                    const isActive = !activeAreas || activeAreas.includes(areaId);
                                                                    const isSkipped = d.skipped?.[areaId] === true;
                                                                    if (value > 0)
                                                                        return value;
                                                                    if (!isActive)
                                                                        return null; // No enfoque
                                                                    if (isSkipped)
                                                                        return 'x';
                                                                    return undefined; // sin datos
                                                                };
                                                                const u = renderFocusCell('universidad', d.universidad);
                                                                const e = renderFocusCell('emprendimiento', d.emprendimiento);
                                                                const p = renderFocusCell('proyectos', d.proyectos);
                                                                const renderUCell = (val) => {
                                                                    const c = typeof val === 'number' ? (val >= 60 ? "text-blue-500 font-medium" : "text-blue-400") : val === 'x' ? "text-red-400/80" : val === null ? "text-muted-foreground/50 italic" : "text-muted-foreground/30";
                                                                    const t = typeof val === 'number' ? `${val}'` : val === 'x' ? 'x' : val === null ? '--' : '—';
                                                                    return _jsx("span", { className: c, children: t });
                                                                };
                                                                const renderECell = (val) => {
                                                                    const c = typeof val === 'number' ? (val >= 30 ? "text-purple-500 font-medium" : "text-purple-400") : val === 'x' ? "text-red-400/80" : val === null ? "text-muted-foreground/50 italic" : "text-muted-foreground/30";
                                                                    const t = typeof val === 'number' ? `${val}'` : val === 'x' ? 'x' : val === null ? '--' : '—';
                                                                    return _jsx("span", { className: c, children: t });
                                                                };
                                                                const renderPCell = (val) => {
                                                                    const c = typeof val === 'number' ? (val >= 30 ? "text-amber-500 font-medium" : "text-amber-400") : val === 'x' ? "text-red-400/80" : val === null ? "text-muted-foreground/50 italic" : "text-muted-foreground/30";
                                                                    const t = typeof val === 'number' ? `${val}'` : val === 'x' ? 'x' : val === null ? '--' : '—';
                                                                    return _jsx("span", { className: c, children: t });
                                                                };
                                                                return (_jsxs("tr", { className: cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-950/50" : "bg-muted/5"), children: [_jsx("td", { className: "sticky left-0 z-10 px-2 py-1 font-medium whitespace-nowrap border border-border/20", style: { background: 'inherit' }, children: format(parseISO(d.date), 'EEE d', { locale: es }) }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: renderUCell(u) }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: renderECell(e) }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: renderPCell(p) }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: _jsx("span", { className: cn(d.tareasGenerales > 0 ? "text-foreground font-medium" : "text-muted-foreground/30"), children: d.tareasGenerales > 0 ? d.tareasGenerales : '—' }) }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums font-medium text-amber-600", children: total > 0 ? `${total}'` : '—' })] }, d.date));
                                                            }), _jsxs("tr", { className: "bg-muted/20 font-bold text-[9px]", children: [_jsx("td", { className: "sticky left-0 bg-muted/20 px-2 py-1.5 z-10 border border-border/20", children: "Total mes" }), FOCUS_AREAS.map(a => {
                                                                        const total = focusPerDay.reduce((s, d) => s + (a.id === 'tareas-generales' ? d.tareasGenerales : d[a.id]), 0);
                                                                        return (_jsxs("td", { className: cn("text-center px-2 py-1.5 border border-border/20", a.id === 'tareas-generales' ? "text-foreground" : "text-amber-600"), children: [total, a.id === 'tareas-generales' ? '' : "'"] }, a.id));
                                                                    }), _jsxs("td", { className: "text-center px-2 py-1.5 border border-border/20 text-amber-600", children: [monthFocusMin, "'"] })] })] })] }) })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" }), _jsxs(CardContent, { className: "p-4 space-y-5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUpIcon, { className: "h-4 w-4 text-indigo-500" }), _jsx("h2", { className: "text-sm font-bold", children: "An\u00E1lisis de Tendencias" })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2.5", children: [_jsxs("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-center", children: [_jsx("p", { className: "text-[9px] text-emerald-600 font-medium uppercase tracking-wider", children: "Consistencia" }), _jsxs("p", { className: "text-xl font-bold text-emerald-600", children: [consistencyPct, "%"] }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: [consistentDays, "/", monthDays.length, " d\u00EDas \u226580%"] })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 text-center", children: [_jsx("p", { className: "text-[9px] text-purple-600 font-medium uppercase tracking-wider", children: "Top Mejora" }), _jsxs("p", { className: "text-xl font-bold text-purple-600", children: [topMejora.total, "min"] }), _jsx("p", { className: "text-[9px] text-muted-foreground", children: topMejora.label })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-center", children: [_jsx("p", { className: "text-[9px] text-amber-600 font-medium uppercase tracking-wider", children: "Mejor d\u00EDa enfoque" }), _jsxs("p", { className: "text-xl font-bold text-amber-600", children: [bestDayFocus, "'"] }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: ["promedio: ", avgDayFocus, "'/d\u00EDa"] })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 text-center", children: [_jsx("p", { className: "text-[9px] text-blue-600 font-medium uppercase tracking-wider", children: "Mejor d\u00EDa sost\u00E9n" }), _jsxs("p", { className: "text-xl font-bold text-blue-600", children: [bestDaySosten, "/", ALL_SOSTEN_IDS.length] }), _jsxs("p", { className: "text-[9px] text-muted-foreground", children: ["promedio: ", avgDaySosten, "/", ALL_SOSTEN_IDS.length] })] })] }), weeklyTrends.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Evoluci\u00F3n semanal \u2014 Mejora (min)" })] }), _jsx("div", { className: "w-full h-48 bg-muted/10 rounded-lg p-2", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: weeklyTrends, margin: { top: 5, right: 8, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 10 }, interval: "preserveStartEnd" }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, { contentStyle: { fontSize: 11 }, formatter: (v) => [`${v} min`, 'Mejora'] }), _jsx(Line, { type: "monotone", dataKey: "mejoraMin", stroke: "#a855f7", strokeWidth: 2, dot: { r: 3 }, activeDot: { r: 5 } })] }) }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Evoluci\u00F3n semanal \u2014 Enfoque (min)" })] }), _jsx("div", { className: "w-full h-48 bg-muted/10 rounded-lg p-2", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: weeklyTrends, margin: { top: 5, right: 8, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 10 }, interval: "preserveStartEnd" }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, { contentStyle: { fontSize: 11 }, formatter: (v) => [`${v} min`, 'Enfoque'] }), _jsx(Line, { type: "monotone", dataKey: "focusTotal", stroke: "#f59e0b", strokeWidth: 2, dot: { r: 3 }, activeDot: { r: 5 } })] }) }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Shield, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Evoluci\u00F3n semanal \u2014 Consistencia Sost\u00E9n (%)" })] }), _jsx("div", { className: "w-full h-48 bg-muted/10 rounded-lg p-2", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: weeklyTrends, margin: { top: 5, right: 8, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 10 }, interval: "preserveStartEnd" }), _jsx(YAxis, { tick: { fontSize: 10 }, domain: [0, 100] }), _jsx(Tooltip, { contentStyle: { fontSize: 11 }, formatter: (v) => [`${v}%`, 'Sostén'] }), _jsx(Line, { type: "monotone", dataKey: "sostenPct", stroke: "#10b981", strokeWidth: 2, dot: { r: 3 }, activeDot: { r: 5 } })] }) }) })] }), _jsxs("div", { className: "pt-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Shield, { className: "h-3.5 w-3.5 text-emerald-500" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Tendencias Individuales \u2014 Sost\u00E9n (% cumplimiento semanal)" })] }), SOSTEN_GROUPS.map(group => (_jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-[10px] font-medium text-muted-foreground/70 mb-2 px-1", children: group.label }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4", children: group.habits.map(habit => {
                                                                        const habitSeries = weeklyTrends.map(w => ({ label: w.label, value: w.perHabitCompletions[habit.id] || 0 }));
                                                                        const lastVal = habitSeries.length > 0 ? habitSeries[habitSeries.length - 1].value : 0;
                                                                        return (_jsxs("div", { className: "bg-muted/10 rounded-lg p-3", children: [_jsx("p", { className: "text-xs font-medium mb-2 text-center", children: habit.label }), _jsx("div", { className: "h-40", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: habitSeries, margin: { top: 5, right: 8, left: 0, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "label", tick: { fontSize: 9 }, interval: "preserveStartEnd" }), _jsx(YAxis, { tick: { fontSize: 9 }, domain: [0, 100], tickFormatter: v => `${v}%` }), _jsx(Tooltip, { contentStyle: { fontSize: 10 }, formatter: (v) => [`${v}%`, habit.label] }), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#10b981", strokeWidth: 2, dot: { r: 2 }, activeDot: { r: 4 } })] }) }) }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center mt-1 tabular-nums font-medium", children: ["\u00DAlt: ", lastVal, "%"] })] }, habit.id));
                                                                    }) })] }, group.label)))] }), _jsxs("div", { className: "pt-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(TrendingUp, { className: "h-3.5 w-3.5 text-purple-500" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Tendencias Individuales \u2014 Mejora (min/semana)" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: MEJORA_HABITS.map(habit => {
                                                                const habitSeries = weeklyTrends.map(w => ({ label: w.label, value: w.habitMinutes[habit.id] || 0 }));
                                                                const lastVal = habitSeries.length > 0 ? habitSeries[habitSeries.length - 1].value : 0;
                                                                return (_jsxs("div", { className: "bg-muted/10 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-2 justify-center", children: [_jsx(habit.icon, { className: "h-4 w-4 text-purple-500" }), _jsx("p", { className: "text-xs font-medium", children: habit.label })] }), _jsx("div", { className: "h-40", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: habitSeries, margin: { top: 5, right: 8, left: 0, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "label", tick: { fontSize: 9 }, interval: "preserveStartEnd" }), _jsx(YAxis, { tick: { fontSize: 9 }, tickFormatter: v => `${v}'` }), _jsx(Tooltip, { contentStyle: { fontSize: 10 }, formatter: (v) => [`${v} min`, habit.label] }), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#a855f7", strokeWidth: 2, dot: { r: 2 }, activeDot: { r: 4 } })] }) }) }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center mt-1 tabular-nums font-medium", children: ["\u00DAlt: ", lastVal, "min"] })] }, habit.id));
                                                            }) })] }), _jsxs("div", { className: "pt-2 border-t border-border/20", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(BarChart3, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("h3", { className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", children: "Resumen semanal" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-[10px]", style: { borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-muted/20", children: [_jsx("th", { className: "text-left px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "Semana" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "D\u00EDas" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "Sost\u00E9n" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "Mejora" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "U" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "E" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "P" }), _jsx("th", { className: "text-center px-2 py-1 font-medium text-muted-foreground border border-border/20", children: "Tareas" })] }) }), _jsx("tbody", { children: weeklyTrends.map((w, idx) => (_jsxs("tr", { className: cn(idx % 2 === 0 ? "bg-white/50 dark:bg-zinc-950/50" : "bg-muted/5"), children: [_jsx("td", { className: "px-2 py-1 border border-border/20 font-medium", children: w.label }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20", children: w.days }), _jsxs("td", { className: cn("text-center px-2 py-1 border border-border/20 font-medium", w.sostenPct >= 80 ? "text-emerald-500" : w.sostenPct >= 50 ? "text-amber-500" : "text-red-400"), children: [w.sostenPct, "%"] }), _jsxs("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: [w.mejoraMin, "'"] }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: w.focus.universidad || '—' }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: w.focus.emprendimiento || '—' }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: w.focus.proyectos || '—' }), _jsx("td", { className: "text-center px-2 py-1 border border-border/20 tabular-nums", children: w.tareas || '—' })] }, w.weekId))) })] }) })] }), weeklyTrends.length >= 2 && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/20", children: ([
                                                        { label: 'Sostén', key: 'sostenPct', color: 'emerald', inverse: false },
                                                        { label: 'Mejora', key: 'mejoraMin', color: 'purple', inverse: false },
                                                        { label: 'Enfoque', key: 'focusTotal', color: 'amber', inverse: false },
                                                        { label: 'Tareas', key: 'tareas', color: 'blue', inverse: false },
                                                    ]).map(metric => {
                                                        const first = weeklyTrends[0][metric.key];
                                                        const last = weeklyTrends[weeklyTrends.length - 1][metric.key];
                                                        const mid = weeklyTrends[Math.floor(weeklyTrends.length / 2)][metric.key];
                                                        const trend = last - first;
                                                        const direction = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
                                                        const pctChange = first > 0 ? Math.round((trend / first) * 100) : 0;
                                                        return (_jsxs("div", { className: "p-2 rounded-lg bg-muted/20 text-center", children: [_jsx("p", { className: "text-[9px] text-muted-foreground", children: metric.label }), _jsxs("div", { className: "flex items-center justify-center gap-1 mt-0.5", children: [direction === 'up' && _jsx(TrendingUpIcon, { className: cn("h-3.5 w-3.5", `text-${metric.color}-500`) }), direction === 'down' && _jsx(TrendingDown, { className: cn("h-3.5 w-3.5", "text-red-400") }), direction === 'flat' && _jsx(Minus, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsxs("span", { className: cn("text-sm font-bold tabular-nums", direction === 'up' && `text-${metric.color}-500`, direction === 'down' && "text-red-400"), children: [pctChange > 0 ? '+' : '', pctChange, "%"] })] }), _jsxs("p", { className: "text-[8px] text-muted-foreground", children: [first, " \u2192 ", last] })] }, metric.label));
                                                    }) }))] }))] })] })] }))] }) }));
}
