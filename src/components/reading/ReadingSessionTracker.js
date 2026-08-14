import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Flame, Minus, Save, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import { useReadingSessions, } from '@/hooks/useReadingSessions';
// ============================================================
// Panel completo: registro + estadísticas (se usa en la página Daily)
// ============================================================
export function ReadingTrackingPanel({ minutes, onMinChange }) {
    const reading = useReadingSessions();
    const library = useReadingLibrary();
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(ReadingTracker, { minutes: minutes, onMinChange: onMinChange, sessions: reading.sessions, saveSession: reading.saveSession, books: library.books, updateBookProgress: library.updateProgress, getCurrentlyReading: library.getCurrentlyReading, onSaved: reading.refetch }), _jsx(ReadingPagesStats, { stats: reading.stats, sessions: reading.sessions })] }));
}
export function ReadingTracker({ minutes, onMinChange, sessions, saveSession, books, updateBookProgress, getCurrentlyReading, onSaved }) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const current = getCurrentlyReading();
    const lastToday = useMemo(() => sessions.filter((s) => s.session_date === todayStr).sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(-1)[0], [sessions, todayStr]);
    const [draftMin, setDraftMin] = useState(minutes);
    const [pageStart, setPageStart] = useState(lastToday?.page_end ?? current?.pages_read ?? 0);
    const [pageEnd, setPageEnd] = useState(lastToday?.page_end ?? current?.pages_read ?? 0);
    useEffect(() => setDraftMin(minutes), [minutes]);
    useEffect(() => {
        const base = lastToday?.page_end ?? current?.pages_read ?? 0;
        setPageStart((p) => (p === 0 ? base : p));
        setPageEnd((p) => (p === 0 ? base : p));
    }, [current?.id, lastToday?.page_end]);
    const pages = Math.max(0, (Number(pageEnd) || 0) - (Number(pageStart) || 0));
    const handleSave = async () => {
        if (draftMin <= 0 && pages <= 0) {
            toast.info('Ingresa minutos o página inicio/fin');
            return;
        }
        const start = Number(pageStart) || 0;
        const end = Number(pageEnd) || 0;
        const bookId = current?.id || null;
        const saved = await saveSession({
            minutes: draftMin || 0,
            bookId,
            pageStart: end >= start && end > 0 ? start : null,
            pageEnd: end >= start && end > 0 ? end : null,
        });
        if (!saved)
            return;
        // Sumar páginas al libro activo en la biblioteca
        if (bookId && pages > 0) {
            await updateBookProgress(bookId, (Number(current?.pages_read) || 0) + pages);
        }
        if (draftMin > 0) {
            onMinChange(draftMin);
        }
        if (end > start && end > 0) {
            setPageStart(end);
            setPageEnd(end);
        }
        onSaved?.();
    };
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-purple-500 to-fuchsia-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-purple-500/15", children: _jsx(BookOpen, { className: "h-4 w-4 text-purple-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold", children: "Sesi\u00F3n de Lectura" }), _jsx("p", { className: "text-[10px] text-muted-foreground truncate max-w-[200px]", children: current ? current.title : 'sin libro activo' })] })] }), current && (_jsxs(Badge, { variant: "outline", className: "text-[10px] font-mono", children: [current.pages_read, "/", current.pages_total || '?', " p\u00E1g"] }))] }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "rounded-xl bg-muted/40 p-2 space-y-1", children: [_jsxs("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1", children: [_jsx(Clock, { className: "h-2.5 w-2.5" }), " Tiempo"] }), _jsx(Input, { type: "number", min: 0, value: draftMin || '', onChange: (e) => setDraftMin(parseInt(e.target.value) || 0), placeholder: "min", className: "h-8 text-sm font-bold text-center" })] }), _jsxs("div", { className: "rounded-xl bg-muted/40 p-2 space-y-1", children: [_jsxs("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1", children: [_jsx(FileText, { className: "h-2.5 w-2.5" }), " Inici\u00E9 en"] }), _jsx(Input, { type: "number", min: 0, value: pageStart || '', onChange: (e) => setPageStart(parseInt(e.target.value) || 0), placeholder: "p\u00E1g", className: "h-8 text-sm font-bold text-center" })] }), _jsxs("div", { className: "rounded-xl border-2 border-purple-500/30 p-2 space-y-1 bg-muted/40", children: [_jsxs("p", { className: "text-[9px] text-purple-500 uppercase tracking-wider flex items-center gap-1", children: [_jsx(TrendingUp, { className: "h-2.5 w-2.5" }), " Termin\u00E9 en"] }), _jsx(Input, { type: "number", min: 0, value: pageEnd || '', onChange: (e) => setPageEnd(parseInt(e.target.value) || 0), placeholder: "p\u00E1gina", className: "h-8 text-sm font-bold text-center" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1 rounded-xl bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 p-2.5 text-center", children: [_jsx("p", { className: "text-2xl font-extrabold tabular-nums text-purple-600 dark:text-purple-400", children: pages }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "p\u00E1ginas hoy" })] }), _jsxs(Button, { size: "sm", onClick: handleSave, className: "h-10 px-4", children: [_jsx(Save, { className: "h-3.5 w-3.5 mr-1.5" }), " Guardar"] }), _jsx("button", { onClick: () => { setPageStart(0); setPageEnd(0); setDraftMin(0); }, className: "h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors", title: "Limpiar", children: _jsx(Minus, { className: "h-4 w-4" }) })] })] })] }));
}
// ============================================================
// Estadísticas de páginas leídas: día · semana · mes · trimestre
// ============================================================
export function ReadingPagesStats({ stats, sessions }) {
    const chartData = useMemo(() => stats.days.slice(-30).map((d) => ({ ...d, label: format(new Date(d.date), 'd MMM', { locale: es }) })), [stats.days]);
    const tiles = [
        { label: 'Hoy', value: stats.today, sub: sessions.filter((s) => s.session_date === format(new Date(), 'yyyy-MM-dd')).length > 0 ? 'con sesión' : 'sin sesión', color: 'text-purple-500', bg: 'bg-purple-500/15' },
        { label: 'Semana', value: stats.week, sub: 'páginas', color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
        { label: 'Mes', value: stats.month, sub: 'páginas', color: 'text-blue-500', bg: 'bg-blue-500/15' },
        { label: 'Trimestre', value: stats.quarter, sub: 'páginas', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
    ];
    const totalTodayMinutes = sessions
        .filter((s) => s.session_date === format(new Date(), 'yyyy-MM-dd'))
        .reduce((a, s) => a + (s.minutes || 0), 0);
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-4 w-4 text-primary" }), _jsx("p", { className: "text-sm font-bold", children: "P\u00E1ginas le\u00EDdas" }), _jsxs(Badge, { variant: "outline", className: "text-[10px] font-mono ml-auto", children: [_jsx(Clock, { className: "h-2.5 w-2.5 mr-1" }), " ", totalTodayMinutes, " min hoy"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: tiles.map((t) => (_jsxs("div", { className: "rounded-xl bg-muted/40 p-3 text-center", children: [_jsx("div", { className: cn('w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1', t.bg), children: _jsx(Flame, { className: cn('h-3.5 w-3.5', t.color) }) }), _jsx("p", { className: "text-xl font-extrabold tabular-nums", children: t.value }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: t.label }), t.sub && _jsx("p", { className: "text-[8px] text-muted-foreground/60", children: t.sub })] }, t.label))) }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5", children: "\u00DAltimos 30 d\u00EDas" }), _jsx(ResponsiveContainer, { width: "100%", height: 150, children: _jsxs(AreaChart, { data: chartData, margin: { top: 4, right: 4, bottom: 0, left: -22 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "readingPages", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#6366f1", stopOpacity: 0.45 }), _jsx("stop", { offset: "100%", stopColor: "#6366f1", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(128,128,128,0.14)" }), _jsx(XAxis, { dataKey: "label", tick: { fontSize: 7, fill: 'currentColor' }, interval: 4, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fontSize: 8, fill: 'currentColor' }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: { fontSize: 11 }, formatter: (v) => [`${v} páginas`], labelFormatter: (label) => String(label) }), _jsx(ReferenceLine, { y: 20, stroke: "#10b981", strokeDasharray: "5 4", strokeOpacity: 0.5 }), _jsx(Area, { type: "monotone", dataKey: "pages", stroke: "#6366f1", strokeWidth: 2, fill: "url(#readingPages)" })] }) })] })] })] }));
}
