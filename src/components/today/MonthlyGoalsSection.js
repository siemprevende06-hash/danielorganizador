import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Book, Target, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
export function MonthlyGoalsSection() {
    const [goals, setGoals] = useState({
        books: { target: 2, current: [], completed: 0 },
        piano: { target: 1, current: [], completed: 0 },
        guitar: { target: 1, current: [], completed: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
    const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });
    useEffect(() => {
        loadMonthlyGoals();
    }, [currentMonth]);
    const loadMonthlyGoals = async () => {
        setLoading(true);
        // Load books being read or completed this month
        const { data: booksData } = await supabase
            .from('reading_library')
            .select('*')
            .or(`status.eq.reading,and(status.eq.read,finish_date.gte.${monthStartStr},finish_date.lte.${monthEndStr})`);
        // Load songs being learned or mastered this month
        const { data: songsData } = await supabase
            .from('music_repertoire')
            .select('*');
        const books = booksData || [];
        const songs = songsData || [];
        // Filter books for this month
        const currentBooks = books.filter(b => b.status === 'reading');
        const completedBooks = books.filter(b => b.status === 'read' &&
            b.finish_date &&
            b.finish_date >= monthStartStr &&
            b.finish_date <= monthEndStr);
        // Filter songs by instrument
        const pianoSongs = songs.filter(s => s.instrument === 'piano');
        const guitarSongs = songs.filter(s => s.instrument === 'guitar');
        const currentPiano = pianoSongs.filter(s => s.status === 'learning');
        const completedPiano = pianoSongs.filter(s => s.status === 'mastered');
        const currentGuitar = guitarSongs.filter(s => s.status === 'learning');
        const completedGuitar = guitarSongs.filter(s => s.status === 'mastered');
        setGoals({
            books: {
                target: 2,
                current: [...currentBooks, ...completedBooks],
                completed: completedBooks.length,
            },
            piano: {
                target: 1,
                current: [...currentPiano.slice(0, 1), ...completedPiano.slice(-1)],
                completed: completedPiano.length > 0 ? 1 : 0,
            },
            guitar: {
                target: 1,
                current: [...currentGuitar.slice(0, 1), ...completedGuitar.slice(-1)],
                completed: completedGuitar.length > 0 ? 1 : 0,
            },
        });
        setLoading(false);
    };
    const getProgress = (completed, target) => {
        return Math.min(100, (completed / target) * 100);
    };
    const getStatusBadge = (status) => {
        if (status === 'reading' || status === 'learning') {
            return _jsx(Badge, { variant: "secondary", className: "text-xs", children: "En progreso" });
        }
        if (status === 'read' || status === 'mastered') {
            return _jsx(Badge, { className: "text-xs bg-green-500", children: "Completado" });
        }
        return _jsx(Badge, { variant: "outline", className: "text-xs", children: "Pendiente" });
    };
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-20 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs(CardTitle, { className: "text-lg font-semibold capitalize flex items-center gap-2", children: [_jsx(Target, { className: "w-5 h-5 text-primary" }), "Metas de ", monthName] }) }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Book, { className: "w-5 h-5 text-amber-500" }), _jsx("span", { className: "font-medium", children: "Libros" })] }), _jsxs(Badge, { variant: goals.books.completed >= goals.books.target ? "default" : "outline", children: [goals.books.completed, "/", goals.books.target] })] }), _jsx(Progress, { value: getProgress(goals.books.completed, goals.books.target), className: "h-2" }), goals.books.current.length > 0 ? (_jsx("div", { className: "space-y-2", children: goals.books.current.map((book) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [book.status === 'read' ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" })) : (_jsx(Circle, { className: "w-4 h-4 text-muted-foreground" })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: book.title }), book.author && (_jsx("p", { className: "text-xs text-muted-foreground", children: book.author }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [book.pages_read && book.pages_total && (_jsxs("span", { className: "text-xs text-muted-foreground", children: [book.pages_read, "/", book.pages_total, " p\u00E1g"] })), getStatusBadge(book.status)] })] }, book.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: "No hay libros asignados este mes" })), goals.books.completed < goals.books.target && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded", children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), _jsxs("span", { children: ["Faltan ", goals.books.target - goals.books.completed, " libro(s) por completar"] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDFB9" }), _jsx("span", { className: "font-medium", children: "Piano" })] }), _jsxs(Badge, { variant: goals.piano.completed >= goals.piano.target ? "default" : "outline", children: [goals.piano.completed, "/", goals.piano.target] })] }), _jsx(Progress, { value: getProgress(goals.piano.completed, goals.piano.target), className: "h-2" }), goals.piano.current.length > 0 ? (_jsx("div", { className: "space-y-2", children: goals.piano.current.map((song) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [song.status === 'mastered' ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" })) : (_jsx(Circle, { className: "w-4 h-4 text-muted-foreground" })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: song.title }), song.artist && (_jsx("p", { className: "text-xs text-muted-foreground", children: song.artist }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [song.difficulty && (_jsx(Badge, { variant: "outline", className: "text-xs", children: song.difficulty })), getStatusBadge(song.status)] })] }, song.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: "No hay canci\u00F3n de piano asignada" }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDFB8" }), _jsx("span", { className: "font-medium", children: "Guitarra" })] }), _jsxs(Badge, { variant: goals.guitar.completed >= goals.guitar.target ? "default" : "outline", children: [goals.guitar.completed, "/", goals.guitar.target] })] }), _jsx(Progress, { value: getProgress(goals.guitar.completed, goals.guitar.target), className: "h-2" }), goals.guitar.current.length > 0 ? (_jsx("div", { className: "space-y-2", children: goals.guitar.current.map((song) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [song.status === 'mastered' ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-green-500" })) : (_jsx(Circle, { className: "w-4 h-4 text-muted-foreground" })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: song.title }), song.artist && (_jsx("p", { className: "text-xs text-muted-foreground", children: song.artist }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [song.difficulty && (_jsx(Badge, { variant: "outline", className: "text-xs", children: song.difficulty })), getStatusBadge(song.status)] })] }, song.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: "No hay canci\u00F3n de guitarra asignada" }))] }), _jsxs("div", { className: "pt-3 border-t flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso general del mes:" }), _jsxs("span", { className: "font-bold", children: [Math.round(((goals.books.completed / goals.books.target) * 33.3) +
                                        ((goals.piano.completed / goals.piano.target) * 33.3) +
                                        ((goals.guitar.completed / goals.guitar.target) * 33.3)), "%"] })] })] })] }));
}
