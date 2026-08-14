import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Book, Music, Languages, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, differenceInDays, endOfMonth } from 'date-fns';
export function LearningToday() {
    const [currentBook, setCurrentBook] = useState(null);
    const [currentSong, setCurrentSong] = useState(null);
    const [languageSettings, setLanguageSettings] = useState(null);
    const [todaySession, setTodaySession] = useState(null);
    const [loading, setLoading] = useState(true);
    const { blocks } = useRoutineBlocksDB();
    useEffect(() => {
        loadLearningData();
    }, []);
    const loadLearningData = async () => {
        try {
            // Load current book (status = 'reading')
            const { data: bookData } = await supabase
                .from('reading_library')
                .select('*')
                .eq('status', 'reading')
                .limit(1)
                .single();
            if (bookData)
                setCurrentBook(bookData);
            // Load current song (status = 'learning')
            const { data: songData } = await supabase
                .from('music_repertoire')
                .select('*')
                .eq('status', 'learning')
                .limit(1)
                .single();
            if (songData)
                setCurrentSong(songData);
            // Load language settings
            const { data: langSettings } = await supabase
                .from('language_settings')
                .select('*')
                .limit(1)
                .single();
            if (langSettings)
                setLanguageSettings(langSettings);
            // Load today's language session
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: sessionData } = await supabase
                .from('language_sessions')
                .select('*')
                .eq('session_date', today)
                .limit(1)
                .single();
            if (sessionData)
                setTodaySession(sessionData);
        }
        catch (error) {
            console.error('Error loading learning data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleLanguageTask = async (task, currentValue) => {
        if (!todaySession) {
            // Create new session for today
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: newSession, error } = await supabase
                .from('language_sessions')
                .insert({
                session_date: today,
                language: languageSettings?.current_language || 'english',
                block_type: 'morning',
                [`${task}_completed`]: true,
            })
                .select()
                .single();
            if (newSession && !error) {
                setTodaySession(newSession);
            }
        }
        else {
            const { error } = await supabase
                .from('language_sessions')
                .update({ [`${task}_completed`]: !currentValue })
                .eq('id', todaySession.id);
            if (!error) {
                setTodaySession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
            }
        }
    };
    // Find relevant blocks
    const findBlockByKeyword = (keywords) => {
        return blocks.find(block => keywords.some(kw => block.title.toLowerCase().includes(kw.toLowerCase())));
    };
    const readingBlock = findBlockByKeyword(['lectura', 'reading', 'idiomas']);
    const musicBlock = findBlockByKeyword(['piano', 'guitarra', 'música', 'music']);
    const languageBlock = findBlockByKeyword(['idiomas', 'language', 'inglés', 'italiano']);
    // Calculate pages to read today
    const calculatePagesToday = () => {
        if (!currentBook?.pages_total || !currentBook?.pages_read)
            return null;
        const remaining = currentBook.pages_total - (currentBook.pages_read || 0);
        const daysInMonth = differenceInDays(endOfMonth(new Date()), new Date()) + 1;
        const pagesPerDay = Math.ceil(remaining / Math.max(daysInMonth, 1));
        return {
            from: currentBook.pages_read + 1,
            to: Math.min(currentBook.pages_read + pagesPerDay, currentBook.pages_total),
            count: pagesPerDay,
            progress: ((currentBook.pages_read || 0) / currentBook.pages_total) * 100
        };
    };
    const pagesToday = calculatePagesToday();
    const languageTasks = [
        { key: 'vocabulary', label: 'Vocabulario', duration: 10, time: '5:30 PM' },
        { key: 'grammar', label: 'Gramática/Duolingo', duration: 20, time: '5:40 PM' },
        { key: 'speaking', label: 'Habla con IA', duration: 10, time: '6:00 PM' },
        { key: 'reading', label: 'Lectura', duration: 20, time: '6:10 PM' },
        { key: 'listening', label: 'Escucha', duration: 30, time: '6:30 PM' },
    ];
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" }) }) }) }));
    }
    const hasContent = currentBook || currentSong || languageSettings;
    if (!hasContent) {
        return null;
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Book, { className: "h-4 w-4" }), "Lo que estoy aprendiendo hoy"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [currentBook && (_jsxs("div", { className: "p-4 rounded-lg border bg-card/50 space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-amber-500/10", children: _jsx(Book, { className: "h-5 w-5 text-amber-500" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold text-foreground truncate", children: currentBook.title }), currentBook.author && (_jsx("p", { className: "text-sm text-muted-foreground", children: currentBook.author }))] })] }), pagesToday && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "P\u00E1ginas para hoy:" }), _jsxs("span", { className: "font-semibold", children: [pagesToday.from, " \u2192 ", pagesToday.to, " (", pagesToday.count, " p\u00E1ginas)"] })] }), readingBlock && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsxs("span", { children: ["30 min en bloque ", readingBlock.title] }), _jsx(Badge, { variant: "outline", className: "ml-auto", children: formatTimeDisplay(readingBlock.startTime) })] })), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { children: "Progreso total" }), _jsxs("span", { children: [Math.round(pagesToday.progress), "%"] })] }), _jsx(Progress, { value: pagesToday.progress, className: "h-2" })] })] }))] })), currentSong && (_jsxs("div", { className: "p-4 rounded-lg border bg-card/50 space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-purple-500/10", children: _jsx(Music, { className: "h-5 w-5 text-purple-500" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-semibold text-foreground truncate", children: currentSong.title }), _jsxs(Badge, { variant: "secondary", className: "text-xs", children: [currentSong.instrument === 'piano' ? '🎹' : '🎸', " ", currentSong.instrument] })] }), currentSong.artist && (_jsx("p", { className: "text-sm text-muted-foreground", children: currentSong.artist }))] })] }), currentSong.notes && (_jsxs("div", { className: "p-3 rounded-md bg-muted/50", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Acordes/notas a repasar:" }), _jsx("p", { className: "text-sm font-mono", children: currentSong.notes })] })), _jsxs("div", { className: "flex items-center justify-between", children: [currentSong.difficulty && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Dificultad: ", currentSong.difficulty] })), musicBlock && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsx("span", { children: "30 min" }), _jsx(Badge, { variant: "outline", children: formatTimeDisplay(musicBlock.startTime) })] }))] })] })), languageSettings && (_jsxs("div", { className: "p-4 rounded-lg border bg-card/50 space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-blue-500/10", children: _jsx(Languages, { className: "h-5 w-5 text-blue-500" }) }), _jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("h4", { className: "font-semibold text-foreground", children: ["Idioma del d\u00EDa: ", languageSettings.current_language === 'english' ? 'Inglés' : 'Italiano'] }), languageSettings.current_language === 'english' && languageSettings.english_level && (_jsx(Badge, { variant: "secondary", children: languageSettings.english_level })), languageSettings.current_language === 'italian' && languageSettings.italian_level && (_jsx(Badge, { variant: "secondary", children: languageSettings.italian_level }))] }) })] }), _jsx("div", { className: "space-y-2", children: languageTasks.map((task) => {
                                    const isCompleted = todaySession?.[`${task.key}_completed`] || false;
                                    return (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-md transition-colors ${isCompleted ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-muted/50'}`, children: [_jsx(Checkbox, { checked: isCompleted, onCheckedChange: () => toggleLanguageTask(task.key, isCompleted) }), _jsxs("span", { className: `flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`, children: [task.label, " (", task.duration, " min)"] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: task.time })] }, task.key));
                                }) }), languageBlock && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsxs("span", { children: ["Bloque: ", languageBlock.title, " (", formatTimeDisplay(languageBlock.startTime), " - ", formatTimeDisplay(languageBlock.endTime), ")"] })] }))] }))] })] }));
}
