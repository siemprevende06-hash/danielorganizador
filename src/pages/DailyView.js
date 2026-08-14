import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyGuide } from '@/components/today/DailyGuide';
import { TaskAccordion } from '@/components/today/TaskAccordion';
import { TodayWorkout } from '@/components/today/TodayWorkout';
import { SystemHabitGroup } from '@/components/systems/SystemHabitGroup';
import { EnfoqueSection } from '@/components/today/EnfoqueSection';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { HobbyCards } from '@/components/systems/HobbyCards';
import { LanguageSkillCards } from '@/components/systems/LanguageSkillCards';
import { WorkoutVisual } from '@/components/systems/WorkoutVisual';
import { MySystemsSection } from '@/components/dashboard/MySystemsSection';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { FocusProcessPanel } from '@/components/focus/FocusProcessPanel';
import { ReadingTrackingPanel } from '@/components/reading/ReadingSessionTracker';
import { HealthSection } from '@/components/dashboard/HealthSection';
import { Input } from '@/components/ui/input';
import { RoutineConfigBar } from '@/components/today/RoutineConfigBar';
import { CurrentBlockCard } from '@/components/today/CurrentBlockCard';
import { DailyTimelinePlanner } from '@/components/today/DailyTimelinePlanner';
import { TaskPoolPanel } from '@/components/today/TaskPoolPanel';
import { TaskChecklist } from '@/components/today/TaskChecklist';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { PanelControlSection } from '@/components/control/PanelControlSection';
import { EsfuerzoResultadosToggle } from '@/components/control/EsfuerzoResultadosToggle';
import { ResultadosDia } from '@/components/resultados/ResultadosDia';
import { AutocriticaSection } from '@/components/autocritica/AutocriticaSection';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useRoutineConfig } from '@/hooks/useRoutineConfig';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useRoutineBlocks, ROUTINES } from '@/hooks/useRoutineBlocks';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Zap, Shield, TrendingUp, BookOpen, LayoutGrid, Sparkles, Utensils, Focus, GraduationCap, Briefcase, FolderKanban, Globe, ListTodo, Clock, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, subDays } from 'date-fns';
const SOSTEN_GROUPS = [
    {
        id: "estructural",
        name: "Hábitos Estructurales",
        icon: LayoutGrid,
        color: "bg-blue-500/20 text-blue-500",
        habits: [
            { id: "rutina-activacion", name: "Rutina de Activación", linkTo: "/activation-routine" },
            { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno" },
            { id: "horario-regular", name: "Horario Regular", isSleepSchedule: true },
            { id: "rutina-desactivacion", name: "Rutina de Desactivación", linkTo: "/deactivation-routine" },
        ],
    },
    {
        id: "apariencia",
        name: "Apariencia",
        icon: Sparkles,
        color: "bg-pink-500/20 text-pink-500",
        habits: [
            { id: "skincare-manana", name: "Skin Care Mañana" },
            { id: "skincare-noche", name: "Skin Care Noche" },
            { id: "banarme-vestirme", name: "Bañarme y Vestirme" },
        ],
    },
    {
        id: "alimentacion",
        name: "Alimentación y Agua",
        icon: Utensils,
        color: "bg-amber-500/20 text-amber-500",
        habits: [
            { id: "pre-entreno", name: "Pre-entreno", hasWater: true, hasMealPhoto: true },
            { id: "desayuno", name: "Desayuno", hasWater: true, hasMealPhoto: true },
            { id: "merienda-1", name: "Merienda 1", hasWater: true, hasMealPhoto: true },
            { id: "almuerzo", name: "Almuerzo", hasWater: true, hasMealPhoto: true },
            { id: "merienda-2", name: "Merienda 2", hasWater: true, hasMealPhoto: true },
            { id: "comida", name: "Comida", hasWater: true, hasMealPhoto: true },
            { id: "antes-dormir", name: "Antes de Dormir", hasWater: true, hasMealPhoto: true },
            { id: "suplementos", name: "Suplementos" },
        ],
    },
];
const MEJORA_GROUPS = [
    {
        id: "hobbys",
        name: "Mejora Hobbys",
        icon: BookOpen,
        color: "bg-purple-500/20 text-purple-500",
        habits: [
            { id: "lectura", name: "Lectura", hasTime: true },
            { id: "musica", name: "Música", hasTime: true },
            { id: "ajedrez", name: "Ajedrez", hasTime: true, hasCount: true, countLabel: "partidas" },
        ],
    },
];
const ALL_GROUPS = [...SOSTEN_GROUPS, ...MEJORA_GROUPS];
const ROUTINE_STYLES = {
    disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
    normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
    super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
    descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};
export default function DailyView() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('esfuerzo');
    const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });
    const dayOfYear = Math.ceil((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / 86400000);
    const yearProgress = Math.round((dayOfYear / 365) * 100);
    const { data, loading, toggleCompletion, setTimeValue, setCountValue, toggleWater, setWorkAssignment, setMealPhoto, update, toggleSkip, toggleActiveFocusArea } = useSystemsTracking(selectedDate);
    const dailyPlanData = useDailyPlanData(selectedDate);
    const { blocks: rawBlocks, blocksLoaded, tasksByBlock, unassignedTasks, assignTaskToBlock, removeTaskFromBlock, refreshTasks, toggleTaskDone, toggleBlockComplete, isBlockCompleted, completedBlocks, completedTasks, dayScore, tasks, planRoutineType, planLanguage, } = dailyPlanData;
    const planAssignments = dailyPlanData.planAssignments ?? null;
    const [todayEvents, setTodayEvents] = useState([]);
    useEffect(() => {
        supabase.from('calendar_events').select('*').eq('event_date', format(selectedDate, 'yyyy-MM-dd')).order('event_date').then(({ data }) => { if (data)
            setTodayEvents(data); });
    }, [selectedDate]);
    const plannedTaskIds = useMemo(() => {
        if (!planAssignments)
            return new Set();
        return new Set(Object.values(planAssignments).flat());
    }, [planAssignments]);
    const plannedTasks = useMemo(() => tasks.filter(t => plannedTaskIds.has(t.id) && !t.completed), [tasks, plannedTaskIds]);
    const groupedTasks = useMemo(() => {
        const groups = {};
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        for (const task of plannedTasks) {
            const key = task.source === 'entrepreneurship' ? 'emprendimiento' : task.source || 'general';
            if (!groups[key])
                groups[key] = [];
            groups[key].push(task);
        }
        for (const key of Object.keys(groups)) {
            groups[key].sort((a, b) => (priorityOrder[a.priority || 'medium'] ?? 1) - (priorityOrder[b.priority || 'medium'] ?? 1));
        }
        return groups;
    }, [plannedTasks]);
    const SOURCE_CONFIG = {
        universidad: { label: 'Universidad', icon: _jsx(GraduationCap, { className: "h-3.5 w-3.5" }), color: 'text-blue-500' },
        emprendimiento: { label: 'Emprendimiento', icon: _jsx(Briefcase, { className: "h-3.5 w-3.5" }), color: 'text-purple-500' },
        proyectos: { label: 'Proyectos', icon: _jsx(FolderKanban, { className: "h-3.5 w-3.5" }), color: 'text-amber-500' },
        idiomas: { label: 'Idiomas', icon: _jsx(Globe, { className: "h-3.5 w-3.5" }), color: 'text-emerald-500' },
        general: { label: 'General', icon: _jsx(ListTodo, { className: "h-3.5 w-3.5" }), color: 'text-muted-foreground' },
    };
    const { adjustedBlocks, wakeTime, setWakeTime, focusBlock, setFocusBlock, sleepTime, setSleepTime, lateWake, setLateWake, musicInstrument, setMusicInstrument, presetName, } = useRoutineConfig();
    const { getCurrentBlock, getBlockProgress, updateBlockFocus } = useRoutineBlocksDB();
    const currentBlock = getCurrentBlock();
    const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;
    const { blocks: routineBlocks, isLoaded: routineLoaded, routineType, setRoutineType, updateBlockFocus: updateRoutineBlockFocus } = useRoutineBlocks();
    // Apply plan's routine type when a plan exists for today
    useEffect(() => {
        if (planRoutineType) {
            setRoutineType(planRoutineType);
        }
    }, [planRoutineType, setRoutineType]);
    const [activeSection, setActiveSection] = useState('tasks');
    const completedHabitsAll = ALL_GROUPS.reduce((sum, g) => sum + g.habits.filter(h => data.completions?.[h.id]).length, 0);
    const totalHabitsAll = ALL_GROUPS.reduce((sum, g) => sum + g.habits.length, 0);
    const mejoraMinutes = (data.timeData?.lectura || 0) + (data.timeData?.musica || 0) + (data.timeData?.ajedrez || 0) + (data.workoutDuration || 0);
    const sostenMinutes = Object.entries(data.timeData || {}).filter(([k]) => !['lectura', 'musica', 'ajedrez'].includes(k)).reduce((s, [, v]) => s + v, 0);
    const todayMinutes = {
        lectura: data.timeData?.lectura || 0,
        musica: data.timeData?.musica || 0,
        ajedrez: data.timeData?.ajedrez || 0,
        idiomas: (data.timeData?.italiano || 0) + (data.timeData?.ingles || 0),
        game: data.timeData?.game || 0,
        gym: data.workoutDuration || 0,
    };
    const focusTodayMinutes = {
        universidad: data.timeData?.universidad || 0,
        emprendimiento: data.timeData?.emprendimiento || 0,
        proyectos: data.timeData?.proyectos || 0,
    };
    const SECTIONS = [
        { id: 'tasks', label: 'Tareas y Horario', icon: _jsx(ListTodo, { className: "h-4 w-4" }), pct: plannedTasks.length > 0 ? Math.round(plannedTasks.filter(t => t.completed).length / plannedTasks.length * 100) : 0, time: data.workoutDuration || 0 },
        { id: 'enfoque', label: 'Enfoque', icon: _jsx(Focus, { className: "h-4 w-4" }), pct: plannedTasks.length > 0 ? Math.round(plannedTasks.filter(t => t.completed).length / plannedTasks.length * 100) : 0, time: 0 },
        { id: 'mejora', label: 'Mejora', icon: _jsx(TrendingUp, { className: "h-4 w-4" }), pct: totalHabitsAll > 0 ? Math.round((completedHabitsAll / totalHabitsAll) * 100) : 0, time: mejoraMinutes },
        { id: 'sosten', label: 'Sostén', icon: _jsx(Shield, { className: "h-4 w-4" }), pct: totalHabitsAll > 0 ? Math.round((completedHabitsAll / totalHabitsAll) * 100) : 0, time: sostenMinutes },
    ];
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center pt-24", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background p-3 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2", children: [_jsx(Zap, { className: "w-6 h-6 text-primary" }), "Mi D\u00EDa"] }), _jsxs("p", { className: "text-sm text-muted-foreground capitalize mt-0.5 flex items-center gap-2", children: [_jsx(CalendarDays, { className: "w-3.5 h-3.5" }), formattedDate] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setSelectedDate(d => subDays(d, 1)), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", className: "h-8 text-xs rounded-full", onClick: () => setSelectedDate(new Date()), children: "Hoy" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setSelectedDate(d => addDays(d, 1)), children: _jsx(ChevronRight, { className: "w-4 h-4" }) }), _jsxs(Badge, { variant: "outline", className: "text-xs font-mono", children: ["D\u00EDa ", dayOfYear, " \u00B7 ", yearProgress, "% del a\u00F1o"] })] })] }), viewMode === 'plan' ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                                const style = ROUTINE_STYLES[r.type];
                                const isActive = routineType === r.type;
                                return (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: "text-xl leading-none transition-transform duration-300", children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                            }) }), _jsx(RoutineConfigBar, { wakeTime: wakeTime, onWakeChange: setWakeTime, focusBlock: focusBlock, onFocusChange: setFocusBlock, sleepTime: sleepTime, onSleepChange: setSleepTime, lateWake: lateWake, onLateWakeChange: setLateWake, musicInstrument: musicInstrument, onMusicInstrumentChange: setMusicInstrument, presetName: presetName }), _jsx(CurrentBlockCard, { currentBlock: currentBlock, blockProgress: currentProgress, tasksByBlock: tasksByBlock }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [_jsx(DailyTimelinePlanner, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock: tasksByBlock, onToggleBlock: toggleBlockComplete, isBlockCompleted: isBlockCompleted, onDropTask: assignTaskToBlock, onRemoveTask: removeTaskFromBlock, onUpdateFocus: updateRoutineBlockFocus, events: todayEvents, musicInstrument: musicInstrument, languageChoice: planLanguage || undefined }), _jsx("div", { className: "lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]", children: _jsx(TaskPoolPanel, { unassignedTasks: unassignedTasks, onTaskCreated: refreshTasks }) })] }), _jsx(TaskChecklist, { tasks: tasks, onToggle: toggleTaskDone })] })) : viewMode === 'esfuerzo' ? (_jsxs(_Fragment, { children: [_jsx(PanelControlSection, { timeData: data.timeData, completions: data.completions, workoutDuration: data.workoutDuration, date: selectedDate }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: SECTIONS.map(s => {
                                const isActive = activeSection === s.id;
                                return (_jsxs("button", { onClick: () => setActiveSection(s.id), className: cn("relative rounded-2xl p-3 text-left transition-all border-0 backdrop-blur-xl overflow-hidden", isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("span", { className: cn("text-lg", isActive ? "text-primary-foreground" : "text-primary"), children: s.icon }), (s.pct > 0 || s.time > 0) && (_jsxs("div", { className: "relative w-8 h-8", children: [_jsxs("svg", { className: "w-8 h-8 -rotate-90", viewBox: "0 0 32 32", children: [_jsx("circle", { cx: "16", cy: "16", r: "12", fill: "none", stroke: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)", strokeWidth: "3" }), _jsx("circle", { cx: "16", cy: "16", r: "12", fill: "none", stroke: isActive ? "rgba(255,255,255,0.8)" : "currentColor", strokeWidth: "3", strokeDasharray: `${2 * Math.PI * 12}`, strokeDashoffset: `${2 * Math.PI * 12 * (1 - Math.min(s.pct, 100) / 100)}`, className: cn(isActive ? "" : "text-primary") })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums", children: [s.pct, "%"] })] }))] }), _jsx("div", { className: "text-xs font-semibold leading-tight", children: s.label }), s.time > 0 && (_jsxs("div", { className: cn("text-[9px] mt-0.5 flex items-center gap-1", isActive ? "text-primary-foreground/70" : "text-muted-foreground"), children: [_jsx(Clock, { className: "h-2.5 w-2.5" }), s.time, " min"] }))] }, s.id));
                            }) }), activeSection === 'tasks' && (_jsxs(_Fragment, { children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [_jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [_jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [_jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }), _jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "currentColor", className: "text-indigo-500", strokeWidth: "3", strokeDasharray: `${2 * Math.PI * 16}`, strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[0].pct, 100) / 100)}` })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [SECTIONS[0].pct, "%"] })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold", children: "Progreso del D\u00EDa" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [plannedTasks.length, " tareas \u00B7 ", data.workoutDuration || 0, " min ejercicio"] })] })] }) }), _jsx(DailyGuide, {}), Object.keys(groupedTasks).length > 0 && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-4 w-4 text-indigo-500" }), _jsx("h2", { className: "text-sm font-semibold", children: "Tareas del D\u00EDa" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [plannedTasks.length, " pendientes"] })] }), _jsx("div", { className: "space-y-2.5", children: Object.entries(groupedTasks).map(([source, sourceTasks]) => {
                                                        const cfg = SOURCE_CONFIG[source] || { label: source, icon: _jsx(ListTodo, { className: "h-3.5 w-3.5" }), color: 'text-muted-foreground' };
                                                        return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: [_jsx("span", { className: cfg.color, children: cfg.icon }), _jsx("span", { children: cfg.label }), _jsxs("span", { className: "text-[9px] text-muted-foreground/60", children: ["(", sourceTasks.length, ")"] })] }), _jsx("div", { className: "space-y-0.5", children: sourceTasks.map(task => {
                                                                        const priorityColors = { high: 'border-l-red-400 bg-red-50/30', medium: 'border-l-amber-300 bg-amber-50/20', low: 'border-l-gray-200' };
                                                                        const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Baja' };
                                                                        return (_jsxs("div", { className: cn("flex items-center gap-2 py-1 px-2 rounded-lg border-l-2 text-xs", priorityColors[task.priority || 'medium']), children: [_jsx("span", { className: "flex-1 truncate", children: task.title }), task.priority && task.priority !== 'low' && (_jsx("span", { className: cn("text-[9px] font-medium shrink-0", task.priority === 'high' ? 'text-red-500' : 'text-amber-500'), children: priorityLabel[task.priority] }))] }, task.id));
                                                                    }) })] }, source));
                                                    }) })] })] })), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                                        const style = ROUTINE_STYLES[r.type];
                                        const isActive = routineType === r.type;
                                        return (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: "text-xl leading-none transition-transform duration-300", children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                                    }) }), _jsx(RoutineConfigBar, { wakeTime: wakeTime, onWakeChange: setWakeTime, focusBlock: focusBlock, onFocusChange: setFocusBlock, sleepTime: sleepTime, onSleepChange: setSleepTime, lateWake: lateWake, onLateWakeChange: setLateWake, musicInstrument: musicInstrument, onMusicInstrumentChange: setMusicInstrument, presetName: presetName }), _jsx(CurrentBlockCard, { currentBlock: currentBlock, blockProgress: currentProgress, tasksByBlock: tasksByBlock }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [_jsx(DailyTimelinePlanner, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock: tasksByBlock, onToggleBlock: toggleBlockComplete, isBlockCompleted: isBlockCompleted, onDropTask: assignTaskToBlock, onRemoveTask: removeTaskFromBlock, onUpdateFocus: updateRoutineBlockFocus, events: todayEvents, musicInstrument: musicInstrument, languageChoice: planLanguage || undefined }), _jsx("div", { className: "lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]", children: _jsx(TaskPoolPanel, { unassignedTasks: unassignedTasks, onTaskCreated: refreshTasks }) })] }), _jsx(TodayWorkout, {}), _jsx(TaskAccordion, {})] })), activeSection === 'sosten' && (_jsxs(_Fragment, { children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [_jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [_jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [_jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }), _jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "currentColor", className: "text-blue-500", strokeWidth: "3", strokeDasharray: `${2 * Math.PI * 16}`, strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[3].pct, 100) / 100)}` })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [SECTIONS[3].pct, "%"] })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold", children: "Hoy" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [completedHabitsAll, "/", totalHabitsAll, " h\u00E1bitos \u00B7 ", sostenMinutes, " min"] })] })] }) }), _jsx(HealthSection, {}), _jsxs(Card, { className: "border-blue-500/20", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Shield, { className: "h-4 w-4 text-blue-500" }), "Sost\u00E9n"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Lo que te mantiene de pie" })] }), _jsx(CardContent, { className: "space-y-3", children: SOSTEN_GROUPS.map(group => (_jsx(SystemHabitGroup, { group: group, completions: data.completions, timeData: data.timeData, countData: data.countData, waterData: data.waterData, onToggle: toggleCompletion, onTimeChange: setTimeValue, onCountChange: setCountValue, onWaterToggle: toggleWater, workoutDuration: data.workoutDuration, workoutIntensity: data.workoutIntensity, onWorkoutDurationChange: v => update("workoutDuration", v), onWorkoutIntensityChange: v => update("workoutIntensity", v), wakeTime: data.wakeTime, sleepTime: data.sleepTime, onWakeTimeChange: v => update("wakeTime", v), onSleepTimeChange: v => update("sleepTime", v), mealPhotos: data.mealPhotos, onMealPhotoUpload: setMealPhoto, skipped: data.skipped, onSkipToggle: toggleSkip }, group.id))) })] })] })), activeSection === 'mejora' && (_jsxs(_Fragment, { children: [_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [_jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [_jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [_jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }), _jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "currentColor", className: "text-purple-500", strokeWidth: "3", strokeDasharray: `${2 * Math.PI * 16}`, strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[2].pct, 100) / 100)}` })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [SECTIONS[2].pct, "%"] })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold", children: "Hoy" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [completedHabitsAll, "/", totalHabitsAll, " h\u00E1bitos \u00B7 ", mejoraMinutes, " min invertidos"] })] })] }) }), _jsxs(MejoraProcessPanel, { todayMinutes: todayMinutes, children: [_jsx(MySystemsSection, {}), _jsxs(Card, { className: "border-purple-500/20", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }), "Mejora"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Lo que te transforma" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Mejora F\u00EDsica" }), _jsx(WorkoutVisual, { duration: data.workoutDuration, intensity: data.workoutIntensity, onDurationChange: (v) => update("workoutDuration", v), onIntensityChange: (v) => update("workoutIntensity", v), completed: !!data.completions["entrenamiento-fisico"], onToggleCompleted: () => toggleCompletion("entrenamiento-fisico"), skipped: !!data.skipped["entrenamiento-fisico"], onSkip: () => toggleSkip("entrenamiento-fisico") })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Mejora Hobbys" }), _jsx(HobbyCards, { todayMinutes: { lectura: data.timeData["lectura"] || 0, musica: data.timeData["musica"] || 0, ajedrez: data.timeData["ajedrez"] || 0 }, countData: { ajedrez: data.countData["ajedrez"] || 0 }, onTimeChange: setTimeValue, onCountChange: setCountValue, skipped: data.skipped, onSkipToggle: toggleSkip })] }), _jsx(ReadingTrackingPanel, { minutes: data.timeData["lectura"] || 0, onMinChange: (v) => setTimeValue("lectura", v) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Gaming" }), _jsxs(Card, { className: "p-3 ring-2 ring-purple-500/30", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Gamepad2, { className: "h-4 w-4 text-purple-500" }), _jsx("span", { className: "text-sm font-semibold", children: "Game (Seducci\u00F3n)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { type: "number", min: 0, value: data.timeData["game"] || "", onChange: e => setTimeValue("game", parseInt(e.target.value) || 0), placeholder: "min", className: "w-16 h-7 text-xs text-center" }), _jsx("button", { onClick: () => toggleSkip("game"), className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", data.skipped?.["game"] ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), children: data.skipped?.["game"] ? "Saltado" : "No hice" })] })] }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: "Tiempo diario para aprender seducci\u00F3n" })] })] }), _jsx("div", { children: _jsx(LanguageSkillCards, { completions: data.completions, onToggle: toggleCompletion, italianoTime: data.timeData?.italiano || 0, inglesTime: data.timeData?.ingles || 0, onItalianoTimeChange: (m) => setTimeValue('italiano', m), onInglesTimeChange: (m) => setTimeValue('ingles', m), skipped: data.skipped, onSkipToggle: toggleSkip }) })] })] })] })] })), activeSection === 'enfoque' && (_jsxs(FocusProcessPanel, { todayMinutes: focusTodayMinutes, children: [_jsx(EnfoqueSection, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock: tasksByBlock, onRemoveTask: removeTaskFromBlock, tasks: tasks, activeFocusAreas: data.activeFocusAreas, onToggleActiveFocusArea: toggleActiveFocusArea, skipped: data.skipped, onSkipToggle: toggleSkip }), _jsxs("div", { children: [_jsx("div", { className: "flex items-center gap-2 mb-3", children: _jsx("h2", { className: "text-xs font-bold uppercase tracking-wide", children: "CALENDARIO MENSUAL" }) }), _jsx(NotionCalendar, {})] })] }))] })) : viewMode === 'resultados' ? (_jsx(ResultadosDia, { date: selectedDate })) : (_jsx(AutocriticaSection, { start: selectedDate, end: selectedDate, scope: 'day' }))] }) }));
}
