import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Briefcase, GraduationCap, FolderKanban, Book, Music, Gamepad2, Dumbbell, Droplet, Wallet, Clock, Target, Play, ChevronDown, Flame, Globe, Palette, Box, Settings, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, isWeekend } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDailyAreaStats, AREA_IDS } from '@/hooks/useDailyAreaStats';
import { toast } from 'sonner';
export function OrganizedDayStructure() {
    const navigate = useNavigate();
    const today = format(new Date(), 'yyyy-MM-dd');
    const isWeekendDay = isWeekend(new Date());
    const { blocks } = useRoutineBlocksDB();
    const areaStats = useDailyAreaStats();
    // State
    const [loading, setLoading] = useState(true);
    const [universityTasks, setUniversityTasks] = useState([]);
    const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [trivialTasks, setTrivialTasks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [pianoSong, setPianoSong] = useState(null);
    const [guitarSong, setGuitarSong] = useState(null);
    const [currentBook, setCurrentBook] = useState(null);
    const [languageSettings, setLanguageSettings] = useState(null);
    const [languageSession, setLanguageSession] = useState(null);
    const [focusTime, setFocusTime] = useState({});
    const [expandedGroups, setExpandedGroups] = useState(['professional', 'development']);
    const [transactions, setTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [entrepreneurships, setEntrepreneurships] = useState([]);
    // Editing states
    const [editingGoal, setEditingGoal] = useState(null);
    const [tempGoalValue, setTempGoalValue] = useState(0);
    // Music preference toggle
    const [musicPreference, setMusicPreference] = useState('piano');
    useEffect(() => {
        loadAllData();
    }, [today]);
    const loadAllData = async () => {
        try {
            const [uniTasksRes, entTasksRes, entRes, projTasksRes, projRes, trivialRes, subjectsRes, pianoRes, guitarRes, bookRes, langSettingsRes, langSessionRes, focusRes, transRes, walletsRes,] = await Promise.all([
                // University tasks
                supabase.from('tasks').select('*')
                    .or(`source.eq.university,area_id.eq.universidad`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                // Entrepreneurship tasks for today
                supabase.from('entrepreneurship_tasks').select('*, entrepreneurship:entrepreneurships(name)')
                    .eq('due_date', today),
                // All entrepreneurships with task counts
                supabase.from('entrepreneurships').select('id, name'),
                // Project tasks
                supabase.from('tasks').select('*')
                    .or(`source.eq.project,area_id.eq.proyectos,area_id.eq.proyectos-personales`)
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                // Active projects
                supabase.from('projects').select('*').eq('status', 'active'),
                // Trivial tasks
                supabase.from('tasks').select('*')
                    .eq('priority', 'trivial')
                    .gte('due_date', `${today}T00:00:00`)
                    .lte('due_date', `${today}T23:59:59`),
                // University subjects
                supabase.from('university_subjects').select('*'),
                // Piano song
                supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning').limit(1).single(),
                // Guitar song
                supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning').limit(1).single(),
                // Current book
                supabase.from('reading_library').select('*').eq('status', 'reading').limit(1).single(),
                // Language settings
                supabase.from('language_settings').select('*').limit(1).single(),
                // Language session
                supabase.from('language_sessions').select('*').eq('session_date', today).limit(1).single(),
                // Focus sessions for today
                supabase.from('focus_sessions').select('*')
                    .gte('start_time', `${today}T00:00:00`)
                    .lte('start_time', `${today}T23:59:59`),
                // Today's transactions
                supabase.from('transactions').select('id, description, amount, transaction_type, wallet_id')
                    .gte('transaction_date', `${today}T00:00:00`)
                    .lte('transaction_date', `${today}T23:59:59`)
                    .order('created_at', { ascending: false }),
                // Wallets for names
                supabase.from('wallets').select('id, name'),
            ]);
            // Process university tasks with subject names
            const subjectMap = new Map((subjectsRes.data || []).map(s => [s.id, s.name]));
            setUniversityTasks((uniTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority,
                routine_block_id: t.routine_block_id,
                source: 'university',
                description: t.description,
                subject_name: t.source_id ? subjectMap.get(t.source_id) : undefined,
            })));
            setEntrepreneurshipTasks((entTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                source: 'entrepreneurship',
                routine_block_id: t.routine_block_id,
            })));
            // Process entrepreneurships with task counts
            const entTasksByEnt = (entTasksRes.data || []).reduce((acc, t) => {
                const entId = t.entrepreneurship_id;
                if (!acc[entId])
                    acc[entId] = { total: 0, completed: 0 };
                acc[entId].total++;
                if (t.completed)
                    acc[entId].completed++;
                return acc;
            }, {});
            setEntrepreneurships((entRes.data || []).map((e) => ({
                id: e.id,
                name: e.name,
                tasks_completed: entTasksByEnt[e.id]?.completed || 0,
                tasks_total: entTasksByEnt[e.id]?.total || 0,
            })));
            setProjectTasks((projTasksRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
                priority: t.priority,
                routine_block_id: t.routine_block_id,
                source: 'projects',
            })));
            // Process projects with task counts
            const projTasksByProj = (projTasksRes.data || []).reduce((acc, t) => {
                const projId = t.source_id;
                if (!acc[projId])
                    acc[projId] = { total: 0, completed: 0 };
                acc[projId].total++;
                if (t.completed)
                    acc[projId].completed++;
                return acc;
            }, {});
            setProjects((projRes.data || []).map((p) => ({
                id: p.id,
                title: p.title,
                status: p.status,
                tasks_completed: projTasksByProj[p.id]?.completed || 0,
                tasks_total: projTasksByProj[p.id]?.total || 0,
            })));
            setTrivialTasks((trivialRes.data || []).map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed || false,
            })));
            setSubjects(subjectsRes.data || []);
            if (pianoRes.data)
                setPianoSong(pianoRes.data);
            if (guitarRes.data)
                setGuitarSong(guitarRes.data);
            if (bookRes.data)
                setCurrentBook(bookRes.data);
            if (langSettingsRes.data)
                setLanguageSettings(langSettingsRes.data);
            if (langSessionRes.data)
                setLanguageSession(langSessionRes.data);
            // Calculate focus time per area
            const focusData = focusRes.data || [];
            const timeByArea = {};
            focusData.forEach((session) => {
                const area = session.task_area || 'general';
                const duration = session.duration_minutes || 0;
                timeByArea[area] = (timeByArea[area] || 0) + duration;
            });
            setFocusTime(timeByArea);
            // Process transactions
            const walletMap = new Map((walletsRes.data || []).map((w) => [w.id, w.name]));
            setTransactions((transRes.data || []).map((t) => ({
                id: t.id,
                description: t.description,
                amount: Number(t.amount),
                type: t.transaction_type,
                wallet_name: walletMap.get(t.wallet_id),
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
        else if (source === 'entrepreneurship') {
            setEntrepreneurshipTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
        }
    };
    const toggleTrivialTask = async (taskId, currentCompleted) => {
        await supabase.from('tasks').update({ completed: !currentCompleted }).eq('id', taskId);
        setTrivialTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    };
    const toggleLanguageTask = async (task, currentValue) => {
        if (!languageSession) {
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
                setLanguageSession(newSession);
        }
        else {
            await supabase
                .from('language_sessions')
                .update({ [`${task}_completed`]: !currentValue })
                .eq('id', languageSession.id);
            setLanguageSession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
        }
    };
    const changeLanguage = async (lang) => {
        if (languageSettings) {
            await supabase
                .from('language_settings')
                .update({ current_language: lang })
                .eq('id', languageSettings.id);
            setLanguageSettings(prev => prev ? { ...prev, current_language: lang } : null);
            toast.success(`Idioma cambiado a ${lang === 'english' ? 'Inglés' : 'Italiano'}`);
        }
        else {
            const { data } = await supabase
                .from('language_settings')
                .insert({ current_language: lang })
                .select()
                .single();
            if (data)
                setLanguageSettings(data);
        }
    };
    const goToFocus = (taskTitle, taskId, area) => {
        navigate('/focus', { state: { taskTitle, taskId, area } });
    };
    const getBlockTime = (blockId) => {
        if (!blockId)
            return null;
        const block = blocks.find(b => b.id === blockId);
        return block ? formatTimeDisplay(block.startTime) : null;
    };
    const saveGoalEdit = async (areaId) => {
        await areaStats.updateTimeGoal(areaId, tempGoalValue);
        setEditingGoal(null);
    };
    const languageTasks = [
        { key: 'vocabulary', label: 'Vocabulario', duration: 10 },
        { key: 'grammar', label: 'Gramática/Duolingo', duration: 20 },
        { key: 'speaking', label: 'Habla con IA', duration: 10 },
        { key: 'reading', label: 'Lectura', duration: 20 },
        { key: 'listening', label: 'Escucha', duration: 30 },
    ];
    const deepWorkBlocks = blocks.filter(b => b.title.toLowerCase().includes('deep work'));
    const currentSong = musicPreference === 'piano' ? pianoSong : guitarSong;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netFlow = totalIncome - totalExpense;
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsx("div", { className: "animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" }) }) }));
    }
    // Stat card component for consistent styling
    const AreaStatCard = ({ areaId, icon: Icon, title, iconColor, children, showTimeTracking = true, showCompletion = true, }) => {
        const stat = areaStats.stats[areaId];
        const streak = areaStats.getStreak(areaId);
        const isCompleted = areaStats.isCompleted(areaId);
        const timeSpent = focusTime[areaId] || stat?.time_spent_minutes || 0;
        const timeGoal = stat?.time_goal_minutes || 60;
        const progress = timeGoal > 0 ? Math.min(100, Math.round((timeSpent / timeGoal) * 100)) : 0;
        return (_jsxs("div", { className: cn("p-3 rounded-lg border transition-all", isCompleted ? "bg-green-500/10 border-green-500/30" : "bg-muted/30"), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: cn("h-4 w-4", iconColor) }), _jsx("span", { className: "font-medium", children: title })] }), _jsxs("div", { className: "flex items-center gap-2", children: [streak > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-xs gap-1", children: [_jsx(Flame, { className: "h-3 w-3 text-orange-500" }), streak] })), showCompletion && (_jsx(Checkbox, { checked: isCompleted, onCheckedChange: () => areaStats.toggleCompletion(areaId) }))] })] }), showTimeTracking && (_jsxs("div", { className: "space-y-2 mb-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-muted-foreground", children: ["Tiempo: ", timeSpent, " / ", timeGoal, " min"] }), editingGoal === areaId ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Input, { type: "number", value: tempGoalValue, onChange: (e) => setTempGoalValue(parseInt(e.target.value) || 0), className: "w-16 h-6 text-xs" }), _jsx(Button, { size: "sm", variant: "ghost", className: "h-6 px-2 text-xs", onClick: () => saveGoalEdit(areaId), children: "\u2713" })] })) : (_jsx(Button, { size: "sm", variant: "ghost", className: "h-5 px-1", onClick: () => {
                                        setEditingGoal(areaId);
                                        setTempGoalValue(timeGoal);
                                    }, children: _jsx(Settings, { className: "h-3 w-3" }) }))] }), _jsx(Progress, { value: progress, className: "h-2" }), _jsxs("p", { className: "text-xs text-right text-muted-foreground", children: [progress, "%"] })] })), children] }));
    };
    const renderTaskItem = (task, showFocusButton = true) => (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md transition-all", task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.source, task.completed) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: cn("text-sm block truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), task.subject_name && (_jsx("span", { className: "text-xs text-muted-foreground", children: task.subject_name }))] }), task.routine_block_id && (_jsxs(Badge, { variant: "outline", className: "text-xs shrink-0", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), getBlockTime(task.routine_block_id)] })), showFocusButton && !task.completed && (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 px-2 shrink-0", onClick: () => goToFocus(task.title, task.id, task.source), children: [_jsx(Play, { className: "w-3 h-3 mr-1" }), "Focus"] }))] }, task.id));
    return (_jsxs(Card, { className: "border-2 border-primary/10", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4" }), "Organizaci\u00F3n del D\u00EDa por \u00C1reas"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs(Accordion, { type: "multiple", value: expandedGroups, onValueChange: setExpandedGroups, children: [_jsxs(AccordionItem, { value: "professional", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Briefcase, { className: "h-5 w-5 text-blue-600" }), _jsx("span", { className: "font-semibold", children: "Profesional/Acad\u00E9mico" }), _jsxs(Badge, { variant: "secondary", className: "ml-2", children: [universityTasks.filter(t => t.completed).length + entrepreneurshipTasks.filter(t => t.completed).length + projectTasks.filter(t => t.completed).length, "/", universityTasks.length + entrepreneurshipTasks.length + projectTasks.length] })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-4", children: [_jsxs(AreaStatCard, { areaId: AREA_IDS.universidad, icon: GraduationCap, title: "Universidad", iconColor: "text-blue-600", children: [subjects.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "\uD83D\uDCDA Asignaturas:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: subjects.map(sub => (_jsx(Badge, { variant: "outline", className: "text-xs cursor-pointer hover:bg-muted", style: { borderColor: sub.color || undefined }, onClick: () => navigate(`/university?subject=${sub.id}`), children: sub.name }, sub.id))) })] })), deepWorkBlocks.length > 0 && (_jsxs("div", { className: "p-2 rounded bg-blue-500/5 text-sm mb-3", children: [_jsx("span", { className: "font-medium text-xs", children: "\u23F1\uFE0F Bloques de estudio:" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: deepWorkBlocks.slice(0, 4).map(block => (_jsx(Badge, { variant: "secondary", className: "text-xs", children: formatTimeDisplay(block.startTime) }, block.id))) })] })), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: universityTasks.length > 0 ? (universityTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] }), _jsxs(AreaStatCard, { areaId: AREA_IDS.emprendimiento, icon: Briefcase, title: "Emprendimiento", iconColor: "text-purple-600", children: [entrepreneurships.length > 0 && (_jsx("div", { className: "mb-3 space-y-2", children: entrepreneurships.map(ent => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-purple-500/5", children: [_jsx("span", { className: "text-sm font-medium", children: ent.name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: ent.tasks_total > 0 ? (ent.tasks_completed / ent.tasks_total) * 100 : 0, className: "w-16 h-2" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [ent.tasks_completed, "/", ent.tasks_total] })] })] }, ent.id))) })), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: entrepreneurshipTasks.length > 0 ? (entrepreneurshipTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] }), _jsxs(AreaStatCard, { areaId: AREA_IDS.proyectos, icon: FolderKanban, title: "Proyectos Personales", iconColor: "text-orange-600", children: [projects.length > 0 && (_jsx("div", { className: "mb-3 space-y-2", children: projects.map(proj => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded bg-orange-500/5", children: [_jsx("span", { className: "text-sm font-medium truncate max-w-[150px]", children: proj.title }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: proj.status }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [proj.tasks_completed, "/", proj.tasks_total] })] })] }, proj.id))) })), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: projectTasks.length > 0 ? (projectTasks.map(task => renderTaskItem(task))) : (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No hay tareas para hoy" })) })] })] })] }), _jsxs(AccordionItem, { value: "development", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Target, { className: "h-5 w-5 text-purple-600" }), _jsx("span", { className: "font-semibold", children: "Desarrollo Personal" })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-4", children: [_jsxs(Collapsible, { defaultOpen: true, children: [_jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-amber-500/5", children: [_jsx(Book, { className: "h-4 w-4 text-amber-600" }), _jsx("span", { className: "font-medium flex-1 text-left", children: "Hobbies Intelectuales" }), _jsx(ChevronDown, { className: "h-4 w-4" })] }), _jsxs(CollapsibleContent, { className: "pt-2 pl-4 space-y-4", children: [_jsx(AreaStatCard, { areaId: AREA_IDS.lectura, icon: Book, title: "Lectura", iconColor: "text-amber-600", children: currentBook ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold", children: currentBook.title }), currentBook.author && _jsx("p", { className: "text-xs text-muted-foreground", children: currentBook.author }), currentBook.pages_total && currentBook.pages_read !== null && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { children: ["P\u00E1ginas: ", currentBook.pages_read, "/", currentBook.pages_total] }), _jsxs("span", { className: "text-muted-foreground", children: ["Meta hoy: ~", Math.ceil((currentBook.pages_total - currentBook.pages_read) / 15), " p\u00E1gs"] })] }), _jsx(Progress, { value: (currentBook.pages_read / currentBook.pages_total) * 100, className: "h-2" })] }))] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No hay libro en lectura" })) }), _jsx(AreaStatCard, { areaId: AREA_IDS.ajedrez, icon: Gamepad2, title: "Ajedrez", iconColor: "text-slate-600", showTimeTracking: false, children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Marcar partida diaria como completada" }) }), _jsxs(AreaStatCard, { areaId: AREA_IDS.idiomas, icon: Globe, title: `Idiomas: ${languageSettings?.current_language === 'english' ? 'Inglés' : 'Italiano'}`, iconColor: "text-blue-600", children: [_jsxs("div", { className: "flex gap-2 mb-3", children: [_jsx(Button, { variant: languageSettings?.current_language === 'english' ? 'default' : 'outline', size: "sm", className: "flex-1", onClick: () => changeLanguage('english'), children: "\uD83C\uDDFA\uD83C\uDDF8 Ingl\u00E9s" }), _jsx(Button, { variant: languageSettings?.current_language === 'italian' ? 'default' : 'outline', size: "sm", className: "flex-1", onClick: () => changeLanguage('italian'), children: "\uD83C\uDDEE\uD83C\uDDF9 Italiano" })] }), _jsx("div", { className: "space-y-2", children: languageTasks.map(task => {
                                                                            const isCompleted = languageSession?.[`${task.key}_completed`] || false;
                                                                            return (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md", isCompleted ? 'bg-green-500/10' : 'hover:bg-muted/50'), children: [_jsx(Checkbox, { checked: isCompleted, onCheckedChange: () => toggleLanguageTask(task.key, isCompleted) }), _jsxs("span", { className: cn("flex-1 text-sm", isCompleted && "line-through text-muted-foreground"), children: [task.label, " (", task.duration, " min)"] })] }, task.key));
                                                                        }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full mt-2", onClick: () => toast.info('Día de curso de inglés añadido a la rutina'), children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), "A\u00F1adir d\u00EDa de curso"] })] })] })] }), _jsxs(Collapsible, { defaultOpen: true, children: [_jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-pink-500/5", children: [_jsx(Palette, { className: "h-4 w-4 text-pink-600" }), _jsx("span", { className: "font-medium flex-1 text-left", children: "Hobbies Art\u00EDsticos" }), _jsx(ChevronDown, { className: "h-4 w-4" })] }), _jsxs(CollapsibleContent, { className: "pt-2 pl-4 space-y-4", children: [_jsxs("div", { className: "flex gap-2 mb-3", children: [_jsx(Button, { variant: musicPreference === 'piano' ? 'default' : 'outline', size: "sm", onClick: () => setMusicPreference('piano'), className: "flex-1", children: "\uD83C\uDFB9 Piano" }), _jsx(Button, { variant: musicPreference === 'guitar' ? 'default' : 'outline', size: "sm", onClick: () => setMusicPreference('guitar'), className: "flex-1", children: "\uD83C\uDFB8 Guitarra" })] }), _jsx(AreaStatCard, { areaId: musicPreference === 'piano' ? AREA_IDS.piano : AREA_IDS.guitarra, icon: Music, title: musicPreference === 'piano' ? 'Piano' : 'Guitarra', iconColor: "text-purple-600", children: currentSong ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold", children: currentSong.title }), currentSong.artist && _jsx("p", { className: "text-xs text-muted-foreground", children: currentSong.artist }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: currentSong.difficulty || 'Normal' }), currentSong.notes && (_jsxs("div", { className: "mt-2 p-2 rounded bg-muted/50", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "\uD83C\uDFBC Acordes/notas a practicar:" }), _jsx("p", { className: "font-mono text-sm", children: currentSong.notes })] }))] })) : (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["No hay canci\u00F3n de ", musicPreference === 'piano' ? 'piano' : 'guitarra', " en aprendizaje"] })) }), isWeekendDay && (_jsxs(AreaStatCard, { areaId: AREA_IDS.dibujo, icon: Palette, title: "Dibujo", iconColor: "text-rose-600", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Solo fines de semana" }), _jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Pr\u00E1ctica de dibujo y sketching" })] })), !isWeekendDay && (_jsx("div", { className: "p-2 rounded bg-muted/50 text-xs text-muted-foreground", children: "\uD83C\uDFA8 Dibujo disponible solo los fines de semana" }))] })] }), _jsxs(Collapsible, { defaultOpen: true, children: [_jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-green-500/5", children: [_jsx(Dumbbell, { className: "h-4 w-4 text-green-600" }), _jsx("span", { className: "font-medium flex-1 text-left", children: "Hobbies F\u00EDsicos" }), _jsx(ChevronDown, { className: "h-4 w-4" })] }), _jsxs(CollapsibleContent, { className: "pt-2 pl-4 space-y-3", children: [_jsxs(AreaStatCard, { areaId: AREA_IDS.gym, icon: Dumbbell, title: "Gym", iconColor: "text-green-600", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Entrenamiento de fuerza" }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => navigate('/vida-daniel'), children: "Ver rutina" })] }), _jsx(AreaStatCard, { areaId: AREA_IDS.calistenia, icon: Box, title: "Calistenia", iconColor: "text-teal-600", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Ejercicios de peso corporal" }) }), isWeekendDay && (_jsxs(AreaStatCard, { areaId: AREA_IDS.boxeo, icon: Target, title: "Boxeo", iconColor: "text-red-600", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Solo fines de semana" }), _jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Entrenamiento de boxeo" })] })), !isWeekendDay && (_jsx("div", { className: "p-2 rounded bg-muted/50 text-xs text-muted-foreground", children: "\uD83E\uDD4A Boxeo disponible solo los fines de semana" }))] })] })] })] }), _jsxs(AccordionItem, { value: "appearance", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-pink-500/10 hover:bg-pink-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Droplet, { className: "h-5 w-5 text-pink-600" }), _jsx("span", { className: "font-semibold", children: "Apariencia" }), _jsx("div", { className: "flex items-center gap-1", children: areaStats.getStreak(AREA_IDS.skincare_am) > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-xs gap-1", children: [_jsx(Flame, { className: "h-3 w-3 text-orange-500" }), areaStats.getStreak(AREA_IDS.skincare_am)] })) })] }) }), _jsx(AccordionContent, { className: "px-4 py-3 space-y-3", children: _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx(AreaStatCard, { areaId: AREA_IDS.skincare_am, icon: Droplet, title: "Skincare Ma\u00F1ana", iconColor: "text-amber-600", showTimeTracking: false, children: _jsx("p", { className: "text-xs text-muted-foreground", children: "Limpieza, hidratante, protector solar" }) }), _jsx(AreaStatCard, { areaId: AREA_IDS.skincare_pm, icon: Droplet, title: "Skincare Noche", iconColor: "text-indigo-600", showTimeTracking: false, children: _jsx("p", { className: "text-xs text-muted-foreground", children: "Limpieza profunda, tratamiento, hidratante" }) })] }) })] }), _jsxs(AccordionItem, { value: "finances", className: "border rounded-lg mb-3 overflow-hidden", children: [_jsx(AccordionTrigger, { className: "px-4 py-3 bg-green-500/10 hover:bg-green-500/20", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Wallet, { className: "h-5 w-5 text-green-600" }), _jsx("span", { className: "font-semibold", children: "Finanzas" }), _jsxs(Badge, { variant: netFlow >= 0 ? "default" : "destructive", className: "text-xs", children: [netFlow >= 0 ? '+' : '', "$", netFlow.toLocaleString()] })] }) }), _jsxs(AccordionContent, { className: "px-4 py-3 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-green-500/10 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-green-500 mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Ingresos" })] }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: ["+$", totalIncome.toLocaleString()] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-red-500/10 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-red-500 mb-1", children: [_jsx(TrendingDown, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Gastos" })] }), _jsxs("p", { className: "text-lg font-bold text-red-600", children: ["-$", totalExpense.toLocaleString()] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/10 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-primary mb-1", children: [_jsx(Wallet, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Neto" })] }), _jsxs("p", { className: cn("text-lg font-bold", netFlow >= 0 ? 'text-green-600' : 'text-red-600'), children: [netFlow >= 0 ? '+' : '', "$", netFlow.toLocaleString()] })] })] }), transactions.length > 0 ? (_jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: transactions.slice(0, 5).map((t) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [t.type === 'income' ? (_jsx(ArrowUpRight, { className: "w-4 h-4 text-green-500" })) : (_jsx(ArrowDownRight, { className: "w-4 h-4 text-red-500" })), _jsx("span", { className: "text-sm truncate max-w-[150px]", children: t.description })] }), _jsxs("span", { className: cn("text-sm font-medium", t.type === 'income' ? 'text-green-600' : 'text-red-600'), children: [t.type === 'income' ? '+' : '-', "$", t.amount.toLocaleString()] })] }, t.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No hay movimientos hoy" })), _jsxs(Button, { variant: "outline", className: "w-full", onClick: () => navigate('/finance'), children: [_jsx(Wallet, { className: "h-4 w-4 mr-2" }), "Ver todas las finanzas"] })] })] })] }), trivialTasks.length > 0 && (_jsxs("div", { className: "mt-4 p-4 rounded-lg border bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDCCC" }), _jsx("span", { className: "font-medium", children: "Tareas Triviales" }), _jsx(Badge, { variant: "outline", className: "text-xs", children: "Necesarias pero no aportan a metas" })] }), _jsx("div", { className: "space-y-2", children: trivialTasks.map(task => (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md", task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTrivialTask(task.id, task.completed) }), _jsx("span", { className: cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground"), children: task.title })] }, task.id))) })] }))] })] }));
}
