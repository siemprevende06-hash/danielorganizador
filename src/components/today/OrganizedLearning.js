import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Book, Music, Languages, GraduationCap, Briefcase, FolderKanban, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, differenceInDays, endOfMonth } from 'date-fns';
export function OrganizedLearning() {
    const [activeTab, setActiveTab] = useState('reading');
    const [currentBook, setCurrentBook] = useState(null);
    const [pianoSong, setPianoSong] = useState(null);
    const [guitarSong, setGuitarSong] = useState(null);
    const [musicPreference, setMusicPreference] = useState('piano');
    const [languageSettings, setLanguageSettings] = useState(null);
    const [todaySession, setTodaySession] = useState(null);
    const [universityTasks, setUniversityTasks] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { blocks } = useRoutineBlocksDB();
    useEffect(() => {
        loadAllData();
    }, []);
    const loadAllData = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            // Load all data in parallel
            const [bookRes, pianoRes, guitarRes, langSettingsRes, langSessionRes, uniTasksRes, projTasksRes, entTasksRes,] = await Promise.all([
                supabase.from('reading_library').select('*').eq('status', 'reading').limit(1).single(),
                supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning').limit(1).single(),
                supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning').limit(1).single(),
                supabase.from('language_settings').select('*').limit(1).single(),
                supabase.from('language_sessions').select('*').eq('session_date', today).limit(1).single(),
                supabase.from('tasks').select('*')
                    .or(`source.eq.university,area_id.eq.universidad`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                supabase.from('tasks').select('*')
                    .or(`source.eq.project,area_id.eq.proyectos`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                supabase.from('entrepreneurship_tasks').select('*').eq('due_date', today),
            ]);
            if (bookRes.data)
                setCurrentBook(bookRes.data);
            if (pianoRes.data)
                setPianoSong(pianoRes.data);
            if (guitarRes.data)
                setGuitarSong(guitarRes.data);
            if (langSettingsRes.data)
                setLanguageSettings(langSettingsRes.data);
            if (langSessionRes.data)
                setTodaySession(langSessionRes.data);
            setUniversityTasks((uniTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority,
                routine_block_id: t.routine_block_id,
                source: 'university',
            })));
            setProjectTasks((projTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority,
                routine_block_id: t.routine_block_id,
                source: 'projects',
            })));
            setEntrepreneurshipTasks((entTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                source: 'entrepreneurship',
            })));
        }
        catch (error) {
            console.error('Error loading data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleTask = async (taskId, source, currentCompleted) => {
        const table = source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        await supabase.from(table).update({ completed: !currentCompleted }).eq('id', taskId);
        if (source === 'university') {
            setUniversityTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
        else if (source === 'projects') {
            setProjectTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
        else {
            setEntrepreneurshipTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
    };
    const toggleLanguageTask = async (task, currentValue) => {
        if (!todaySession) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: newSession } = await supabase
                .from('language_sessions')
                .insert({
                session_date: today,
                language: languageSettings?.current_language || 'english',
                block_type: 'morning',
                [`${task}_completed`]: true,
            })
                .select()
                .single();
            if (newSession)
                setTodaySession(newSession);
        }
        else {
            await supabase
                .from('language_sessions')
                .update({ [`${task}_completed`]: !currentValue })
                .eq('id', todaySession.id);
            setTodaySession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
        }
    };
    const findBlockByKeyword = (keywords) => {
        return blocks.find(block => keywords.some(kw => block.title.toLowerCase().includes(kw.toLowerCase())));
    };
    const getBlockTime = (blockId) => {
        if (!blockId)
            return null;
        const block = blocks.find(b => b.id === blockId);
        return block ? formatTimeDisplay(block.startTime) : null;
    };
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
    const readingBlock = findBlockByKeyword(['lectura', 'reading', 'idiomas']);
    const musicBlock = findBlockByKeyword(['piano', 'guitarra', 'música']);
    const languageBlock = findBlockByKeyword(['idiomas', 'language']);
    const deepWorkBlocks = blocks.filter(b => b.title.toLowerCase().includes('deep work'));
    const languageTasks = [
        { key: 'vocabulary', label: 'Vocabulario', duration: 10 },
        { key: 'grammar', label: 'Gramática/Duolingo', duration: 20 },
        { key: 'speaking', label: 'Habla con IA', duration: 10 },
        { key: 'reading', label: 'Lectura', duration: 20 },
        { key: 'listening', label: 'Escucha', duration: 30 },
    ];
    const currentSong = musicPreference === 'piano' ? pianoSong : guitarSong;
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4" }), "Organizaci\u00F3n del D\u00EDa por \u00C1rea"] }) }), _jsx(CardContent, { children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-6 mb-4", children: [_jsx(TabsTrigger, { value: "reading", className: "text-xs", children: "\uD83D\uDCD6" }), _jsx(TabsTrigger, { value: "music", className: "text-xs", children: "\uD83C\uDFB5" }), _jsx(TabsTrigger, { value: "languages", className: "text-xs", children: "\uD83C\uDF0D" }), _jsx(TabsTrigger, { value: "university", className: "text-xs", children: "\uD83C\uDF93" }), _jsx(TabsTrigger, { value: "projects", className: "text-xs", children: "\uD83D\uDE80" }), _jsx(TabsTrigger, { value: "entrepreneurship", className: "text-xs", children: "\uD83D\uDCBC" })] }), _jsx(TabsContent, { value: "reading", className: "space-y-4", children: currentBook ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-amber-500/10", children: _jsx(Book, { className: "h-5 w-5 text-amber-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold", children: currentBook.title }), currentBook.author && _jsx("p", { className: "text-sm text-muted-foreground", children: currentBook.author })] })] }), pagesToday && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/50 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "\uD83D\uDCC4 P\u00E1ginas para hoy:" }), _jsxs("span", { className: "font-bold", children: [pagesToday.from, " \u2192 ", pagesToday.to] })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "\u23F1\uFE0F Tiempo estimado:" }), _jsx("span", { children: "30 minutos" })] }), readingBlock && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "\uD83D\uDD50 Cu\u00E1ndo:" }), _jsx(Badge, { variant: "outline", children: formatTimeDisplay(readingBlock.startTime) })] }))] }), _jsx(Progress, { value: pagesToday.progress, className: "h-2" }), _jsxs("p", { className: "text-xs text-muted-foreground text-center", children: ["Progreso total: ", Math.round(pagesToday.progress), "%"] })] }))] })) : (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "No hay libro en lectura" })) }), _jsxs(TabsContent, { value: "music", className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsx(Button, { variant: musicPreference === 'piano' ? 'default' : 'outline', size: "sm", onClick: () => setMusicPreference('piano'), className: "flex-1", children: "\uD83C\uDFB9 Piano" }), _jsx(Button, { variant: musicPreference === 'guitar' ? 'default' : 'outline', size: "sm", onClick: () => setMusicPreference('guitar'), className: "flex-1", children: "\uD83C\uDFB8 Guitarra" })] }), currentSong ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-purple-500/10", children: _jsx(Music, { className: "h-5 w-5 text-purple-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold", children: currentSong.title }), currentSong.artist && _jsx("p", { className: "text-sm text-muted-foreground", children: currentSong.artist })] }), _jsx(Badge, { variant: "secondary", children: currentSong.difficulty || 'Normal' })] }), currentSong.notes && (_jsxs("div", { className: "p-3 rounded-lg bg-muted/50", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "\uD83C\uDFBC Acordes/notas a practicar:" }), _jsx("p", { className: "font-mono text-sm", children: currentSong.notes })] })), _jsxs("div", { className: "p-3 rounded-lg bg-muted/50 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "\u23F1\uFE0F Tiempo de pr\u00E1ctica:" }), _jsx("span", { children: "30 minutos" })] }), musicBlock && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "\uD83D\uDD50 Cu\u00E1ndo:" }), _jsx(Badge, { variant: "outline", children: formatTimeDisplay(musicBlock.startTime) })] }))] })] })) : (_jsxs("p", { className: "text-center text-muted-foreground py-4", children: ["No hay canci\u00F3n de ", musicPreference === 'piano' ? 'piano' : 'guitarra', " en aprendizaje"] }))] }), _jsx(TabsContent, { value: "languages", className: "space-y-4", children: languageSettings ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Languages, { className: "h-5 w-5 text-blue-500" }), _jsx("span", { className: "font-semibold", children: languageSettings.current_language === 'english' ? 'Inglés' : 'Italiano' }), languageSettings.english_level && (_jsx(Badge, { variant: "secondary", children: languageSettings.english_level }))] }), _jsx("div", { className: "space-y-2", children: languageTasks.map((task) => {
                                            const isCompleted = todaySession?.[`${task.key}_completed`] || false;
                                            return (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-md ${isCompleted ? 'bg-green-500/10' : 'hover:bg-muted/50'}`, children: [_jsx(Checkbox, { checked: isCompleted, onCheckedChange: () => toggleLanguageTask(task.key, isCompleted) }), _jsxs("span", { className: `flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`, children: [task.label, " (", task.duration, " min)"] })] }, task.key));
                                        }) }), languageBlock && (_jsxs("div", { className: "text-xs text-muted-foreground pt-2 border-t", children: [_jsx(Calendar, { className: "h-3 w-3 inline mr-1" }), "Bloque: ", languageBlock.title, " (", formatTimeDisplay(languageBlock.startTime), ")"] }))] })) : (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "Configura tu idioma" })) }), _jsxs(TabsContent, { value: "university", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(GraduationCap, { className: "h-5 w-5 text-blue-600" }), _jsx("span", { className: "font-semibold", children: "Universidad - Hoy" }), _jsxs(Badge, { variant: "outline", children: [universityTasks.filter(t => t.completed).length, "/", universityTasks.length] })] }), deepWorkBlocks.length > 0 && (_jsxs("div", { className: "p-2 rounded bg-blue-500/10 text-sm mb-3", children: [_jsx("span", { className: "font-medium", children: "\u23F1\uFE0F Bloques de estudio:" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: deepWorkBlocks.slice(0, 3).map(block => (_jsx(Badge, { variant: "secondary", className: "text-xs", children: formatTimeDisplay(block.startTime) }, block.id))) })] })), universityTasks.length > 0 ? (_jsx("div", { className: "space-y-2", children: universityTasks.map((task) => (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`, children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.source, task.completed) }), _jsx("span", { className: `flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`, children: task.title }), task.priority === 'high' && _jsx(Badge, { variant: "destructive", className: "text-xs", children: "Alta" }), task.routine_block_id && (_jsx(Badge, { variant: "outline", className: "text-xs", children: getBlockTime(task.routine_block_id) }))] }, task.id))) })) : (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "No hay tareas universitarias hoy" }))] }), _jsxs(TabsContent, { value: "projects", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(FolderKanban, { className: "h-5 w-5 text-emerald-600" }), _jsx("span", { className: "font-semibold", children: "Proyectos - Hoy" }), _jsxs(Badge, { variant: "outline", children: [projectTasks.filter(t => t.completed).length, "/", projectTasks.length] })] }), projectTasks.length > 0 ? (_jsx("div", { className: "space-y-2", children: projectTasks.map((task) => (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`, children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.source, task.completed) }), _jsx("span", { className: `flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`, children: task.title }), task.priority === 'high' && _jsx(Badge, { variant: "destructive", className: "text-xs", children: "Alta" }), task.routine_block_id && (_jsx(Badge, { variant: "outline", className: "text-xs", children: getBlockTime(task.routine_block_id) }))] }, task.id))) })) : (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "No hay tareas de proyectos hoy" }))] }), _jsxs(TabsContent, { value: "entrepreneurship", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Briefcase, { className: "h-5 w-5 text-purple-600" }), _jsx("span", { className: "font-semibold", children: "Emprendimiento - Hoy" }), _jsxs(Badge, { variant: "outline", children: [entrepreneurshipTasks.filter(t => t.completed).length, "/", entrepreneurshipTasks.length] })] }), entrepreneurshipTasks.length > 0 ? (_jsx("div", { className: "space-y-2", children: entrepreneurshipTasks.map((task) => (_jsxs("div", { className: `flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`, children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.source, task.completed) }), _jsx("span", { className: `flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`, children: task.title })] }, task.id))) })) : (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "No hay tareas de emprendimiento hoy" }))] })] }) })] }));
}
