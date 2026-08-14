import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { habits } from '@/lib/data';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useCombinedFocusTime } from '@/hooks/useCombinedFocusTime';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useHabitHistory } from '@/hooks/useHabitHistory';
import { useFinance } from '@/hooks/useFinance';
import { formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
function ProgressBar({ value, color, showText = true }) {
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-bold", style: { color: '#1A2A3A' }, children: [value, "%"] }), _jsxs("div", { className: "flex-1 h-2.5 rounded-full bg-[#E5E9F0] relative overflow-hidden", children: [_jsx("div", { className: "h-full rounded-full", style: { width: `${Math.min(value, 100)}%`, background: color } }), showText && value > 25 && (_jsxs("span", { className: "absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-white leading-none", children: [value, "%"] }))] })] }));
}
function CardTitle({ children }) {
    return (_jsx("h3", { className: "text-sm font-semibold mb-4", style: { color: '#2D3E50' }, children: children }));
}
const EVENT_DOT_COLORS = {
    universidad: '#3B82F6',
    emprendimiento: '#8B5CF6',
    proyectos: '#F59E0B',
    lectura: '#06B6D4',
    musica: '#EC4899',
    gym: '#EF4444',
    salud: '#22C55E',
    idiomas: '#10B981',
    social: '#F97316',
    finanzas: '#EAB308',
    default: '#94A3B8',
};
const pad = (n) => String(n).padStart(2, '0');
const toHMS = (min) => {
    const safe = Math.max(0, Math.round(min));
    return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
};
const toHmm = (min) => {
    const safe = Math.max(0, Math.round(min));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
};
const toHours1 = (min) => `${(Math.max(0, min) / 60).toFixed(1)}h`;
export default function Inicio2() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    // Real data hooks
    const { blocks, tasks, completedBlocks, completedTasks, dayScore, isBlockCompleted } = useDailyPlanData();
    const { areas } = useCombinedFocusTime();
    const focus = useFocusSessions();
    const { habitHistory } = useHabitHistory();
    const finance = useFinance();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        initials: 'US',
    });
    const [dayTotals, setDayTotals] = useState({ spent: 0, goal: 0 });
    const [monthly, setMonthly] = useState({
        current: 0,
        previous: 0,
        curName: '',
        prevName: '',
    });
    const [todayEvents, setTodayEvents] = useState([]);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const user = data?.user;
            const email = user?.email || '';
            const rawName = user?.user_metadata?.name || email.split('@')[0] || '';
            const name = rawName
                .split(/[\s.]+/)
                .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
                .join(' ');
            const initials = (rawName || 'Usuario').slice(0, 2).toUpperCase();
            setProfile({ name, email, initials });
        });
        // Totales del día (todas las áreas) y estadísticas mensuales de focus
        const now = new Date();
        const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        Promise.all([
            supabase
                .from('daily_area_stats')
                .select('time_spent_minutes, time_goal_minutes')
                .eq('stat_date', todayStr),
            supabase
                .from('focus_sessions')
                .select('duration_minutes, created_at')
                .gte('created_at', curStart.toISOString())
                .lt('created_at', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()),
            supabase
                .from('focus_sessions')
                .select('duration_minutes, created_at')
                .gte('created_at', prevStart.toISOString())
                .lt('created_at', curStart.toISOString()),
            supabase.from('calendar_events').select('*').eq('event_date', todayStr),
        ]).then(([statsRes, curRes, prevRes, eventsRes]) => {
            const rows = statsRes.data || [];
            setDayTotals({
                spent: rows.reduce((s, r) => s + (r.time_spent_minutes || 0), 0),
                goal: rows.reduce((s, r) => s + (r.time_goal_minutes || 0), 0),
            });
            setMonthly({
                current: (curRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0),
                previous: (prevRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0),
                curName: now.toLocaleDateString('es-ES', { month: 'long' }),
                prevName: prevStart.toLocaleDateString('es-ES', { month: 'long' }),
            });
            setTodayEvents((eventsRes.data || []).map((e) => ({
                id: e.id,
                title: e.title,
                category: e.category || 'default',
            })));
        });
    }, [todayStr]);
    const todayDate = new Date();
    // --- Tiempo por área (3 áreas principales) ---
    const effortBars = useMemo(() => areas.map(a => a.progress), [areas]);
    const timeBars = useMemo(() => {
        const max = Math.max(...areas.map(a => a.totalMinutes), 1);
        return areas.map(a => (a.totalMinutes > 0 ? Math.round((a.totalMinutes / max) * 100) : 0));
    }, [areas]);
    // --- Resultados del día ---
    const taskPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const blockPct = blocks.length > 0 ? Math.round((completedBlocks.length / blocks.length) * 100) : 0;
    // --- Hábitos de hoy ---
    const habitStates = useMemo(() => {
        return habits.map(h => {
            const entry = habitHistory[h.id]?.completedDates?.find(e => e.date === todayStr);
            if (!entry || entry.status === 'skipped')
                return 0; // sin dato
            return entry.status === 'completed' ? 1 : 2;
        });
    }, [habitHistory, todayStr]);
    const doneCount = habitStates.filter(s => s === 1).length;
    const failedCount = habitStates.filter(s => s === 2).length;
    const noneCount = habitStates.length - doneCount - failedCount;
    const donePct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
    const failedPct = habits.length ? Math.round((failedCount / habits.length) * 100) : 0;
    const nonePct = Math.max(0, 100 - donePct - failedPct);
    // --- Foco de hoy y progreso ---
    const focusToday = focus.getTodayStats().totalMinutes;
    const focusWeek = focus.getWeekStats().totalMinutes;
    const remaining = Math.max(0, dayTotals.goal - dayTotals.spent);
    // --- Cartera ---
    const walletTotal = (finance.wallets || []).reduce((s, w) => s + (w.balance || 0), 0);
    const walletDisplay = walletTotal >= 1000
        ? `$${(walletTotal / 1000).toFixed(1)}k`
        : `$${walletTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    // --- Rutina de hoy (bloques) ---
    const routineBlocks = blocks.slice(0, 4);
    // --- Tareas de hoy ---
    const todayTasks = tasks.slice(0, 5);
    const headerDate = todayDate.toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
    return (_jsx("div", { className: "min-h-screen p-4 md:p-6 pt-16 lg:pt-6", style: { background: '#F4F6F9' }, children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-bold", style: { color: '#1A2A3A' }, children: profile.name || 'Organizador' }), _jsxs("p", { className: "text-sm mt-0.5", style: { color: '#6B7A8F' }, children: ["Bienvenido \u00B7 ", headerDate] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: [_jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Esfuerzo por \u00E1rea" }), _jsxs("div", { className: "space-y-3", children: [_jsx(ProgressBar, { value: effortBars[0] || 0, color: "#3B82F6" }), _jsx(ProgressBar, { value: effortBars[1] || 0, color: "#3B82F6" }), _jsx(ProgressBar, { value: effortBars[2] || 0, color: "#3B82F6" })] })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Tiempo invertido" }), _jsxs("div", { className: "space-y-3", children: [_jsx(ProgressBar, { value: timeBars[0] || 0, color: "#3B82F6" }), _jsx(ProgressBar, { value: timeBars[1] || 0, color: "#3B82F6" }), _jsx(ProgressBar, { value: timeBars[2] || 0, color: "#3B82F6" })] })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Resultados del d\u00EDa" }), _jsxs("div", { className: "space-y-3", children: [_jsx(ProgressBar, { value: taskPct, color: "#60A5FA", showText: false }), _jsx(ProgressBar, { value: blockPct, color: "#60A5FA", showText: false }), _jsx(ProgressBar, { value: dayScore, color: "#60A5FA", showText: false })] })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Progreso del d\u00EDa" }), _jsx("p", { className: "text-[32px] font-bold leading-none", style: { color: '#1E3A5F' }, children: toHours1(dayTotals.spent) }), _jsx("p", { className: "text-xs mt-1", style: { color: '#6B7A8F' }, children: "Tiempo invertido hoy (todas las \u00E1reas)" }), _jsxs("p", { className: "text-[10px]", style: { color: '#94A3B8' }, children: ["Semana: ", toHmm(focusWeek), " de focus"] }), _jsx("p", { className: "text-sm font-semibold mt-3", style: { color: '#10B981' }, children: remaining > 0 ? `Meta restante: ${toHmm(remaining)}` : 'Meta superada ✓' })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Focus de hoy" }), _jsx("p", { className: "text-[28px] font-bold font-mono leading-none tabular-nums", style: { color: '#1E3A5F' }, children: toHMS(focusToday) }), _jsxs("p", { className: "text-xs mt-1", style: { color: '#6B7A8F' }, children: ["Sesiones de focus (", focus.getTodayStats().sessionsCount, ")"] })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "H\u00E1bitos de hoy" }), _jsxs("div", { className: "space-y-3", children: [_jsx(ProgressBar, { value: donePct, color: "#10B981" }), _jsx(ProgressBar, { value: failedPct, color: "#EF4444" }), _jsx(ProgressBar, { value: nonePct, color: "#94A3B8" })] }), _jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-[#E5E9F0]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs", style: { color: '#6B7A8F' }, children: "Completados hoy" }), _jsx("p", { className: "text-xs font-medium", style: { color: '#2D3E50' }, children: "Verde \u2713 \u00B7 Rojo \u2717 \u00B7 Gris sin dato" })] }), _jsxs("span", { className: "text-sm font-semibold", style: { color: '#1A2A3A' }, children: [doneCount, "/", habits.length] })] })] }), _jsx(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", style: { background: '#94A3B8' }, children: profile.initials }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-base font-bold truncate", style: { color: '#2D3E50' }, children: profile.name || 'Usuario' }), _jsx("p", { className: "text-xs", style: { color: '#6B7A8F' }, children: profile.email || 'Organizador' })] }), _jsx("span", { className: "text-sm font-bold shrink-0", style: { color: '#10B981' }, children: walletDisplay })] }) }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Focus del mes" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[#3B82F6]" }), _jsx("span", { className: "text-sm", style: { color: '#2D3E50' }, children: monthly.curName ? monthly.curName.charAt(0).toUpperCase() + monthly.curName.slice(1) : 'Este mes' })] }), _jsx("span", { className: "text-sm font-semibold", style: { color: '#1A2A3A' }, children: toHmm(monthly.current) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[#60A5FA]" }), _jsx("span", { className: "text-sm", style: { color: '#2D3E50' }, children: monthly.prevName ? monthly.prevName.charAt(0).toUpperCase() + monthly.prevName.slice(1) : 'Mes anterior' })] }), _jsx("span", { className: "text-sm font-semibold", style: { color: '#1A2A3A' }, children: toHmm(monthly.previous) })] })] })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Rutina de hoy" }), routineBlocks.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4", style: { color: '#94A3B8' } }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-bold truncate", style: { color: '#2D3E50' }, children: routineBlocks[0].title }), _jsxs("p", { className: "text-xs", style: { color: '#6B7A8F' }, children: [formatTimeDisplay(routineBlocks[0].startTime), " \u2014 ", formatTimeDisplay(routineBlocks[0].endTime)] })] })] }), _jsx("div", { className: "mt-4 flex items-center justify-between border-t border-[#E5E9F0] pt-3", children: routineBlocks.map((b) => (_jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full", style: { background: isBlockCompleted(b.id) ? '#10B981' : '#3B82F6' } }), _jsx("span", { className: "text-[9px]", style: { color: '#94A3B8' }, children: formatTimeDisplay(b.startTime) })] }, b.id))) })] })) : (_jsx("p", { className: "text-xs", style: { color: '#6B7A8F' }, children: "Sin bloques de rutina configurados." }))] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] lg:col-span-2", children: [_jsx(CardTitle, { children: "Eventos de hoy" }), _jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Calendar, { className: "h-4 w-4", style: { color: '#3B82F6' } }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-semibold", style: { color: '#3B82F6' }, children: ["Hoy \u00B7 ", todayEvents.length, " ", todayEvents.length === 1 ? 'evento' : 'eventos'] }), _jsx("p", { className: "text-xs", style: { color: '#6B7A8F' }, children: "Agenda del calendario" })] })] }), _jsx("div", { className: "divide-y divide-[#E5E9F0]", children: todayEvents.length > 0 ? (todayEvents.map((e) => (_jsxs("div", { className: "flex items-center gap-3 py-2.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: EVENT_DOT_COLORS[e.category] || EVENT_DOT_COLORS.default } }), _jsx("span", { className: "text-sm flex-1", style: { color: '#2D3E50' }, children: e.title })] }, e.id)))) : (_jsxs("div", { className: "flex items-center gap-3 py-2.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: EVENT_DOT_COLORS.default } }), _jsx("span", { className: "text-sm flex-1", style: { color: '#94A3B8' }, children: "No hay eventos programados para hoy" })] })) })] }), _jsxs(Card, { className: "rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]", children: [_jsx(CardTitle, { children: "Tareas de hoy" }), _jsx("div", { className: "divide-y divide-[#E5E9F0]", children: todayTasks.length > 0 ? (todayTasks.map((t) => (_jsxs("div", { className: "flex items-center gap-3 py-2.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: t.completed ? '#10B981' : '#3B82F6' } }), _jsx("span", { className: "text-sm flex-1 truncate", style: { color: t.completed ? '#94A3B8' : '#2D3E50' }, children: t.title }), t.completed ? (_jsx(CheckCircle2, { className: "h-3.5 w-3.5 shrink-0", style: { color: '#10B981' } })) : null] }, t.id)))) : (_jsxs("div", { className: "flex items-center gap-3 py-2.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: '#94A3B8' } }), _jsx("span", { className: "text-sm flex-1", style: { color: '#94A3B8' }, children: "Sin tareas de hoy" })] })) })] })] }), _jsxs("div", { className: "mt-6 text-[10px] flex items-center gap-1", style: { color: '#94A3B8' }, children: [_jsx(TrendingUp, { className: "h-3 w-3" }), "Dashboard Inicio 2.0 \u2014 datos en tiempo real"] })] }) }));
}
