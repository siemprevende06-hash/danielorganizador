import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass, Activity } from "lucide-react";
import { QuickDaySummary } from "@/components/today/QuickDaySummary";
import { DayProgressHeader } from "@/components/today/DayProgressHeader";
import { WheelOfLife } from "@/components/WheelOfLife";
import { HombreTopWheel } from "@/components/HombreTopWheel";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { WeekContext } from "@/components/today/WeekContext";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { TaskPoolPanel } from "@/components/today/TaskPoolPanel";
import { RoutineConfigBar } from "@/components/today/RoutineConfigBar";
import { CurrentBlockCard } from "@/components/today/CurrentBlockCard";
import { usePillarProgress } from "@/hooks/usePillarProgress";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useRoutineConfig } from "@/hooks/useRoutineConfig";
import { useRoutineBlocks, ROUTINES } from "@/hooks/useRoutineBlocks";
import { GoalPredictions } from "@/components/dashboard/GoalPredictions";
import { WeekComparisonCard } from "@/components/dashboard/WeekComparisonCard";
import { ProductivityPatterns } from "@/components/dashboard/ProductivityPatterns";
import { AchievementsDisplay } from "@/components/dashboard/AchievementsDisplay";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { RealStatsDashboard } from "@/components/dashboard/RealStatsDashboard";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
import { SostenSection } from "@/components/dashboard/SostenSection";
import { MiniHabitsSection } from "@/components/dashboard/MiniHabitsSection";
import { FocusIndicatorsSection } from "@/components/today/FocusIndicatorsSection";
import { useNotifications } from "@/hooks/useNotifications";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useHombreTopScores } from "@/hooks/useHombreTopScores";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import NotionCalendar from "@/components/calendar/NotionCalendar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
const ROUTINE_STYLES = {
    disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
    normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
    super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
    descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};
function ClockWidget() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    const formattedDate = format(time, "EEEE, d 'de' MMMM", { locale: es });
    const formattedTime = format(time, "h:mm a");
    return (_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl sm:text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tight", children: "INICIO" }), _jsx("p", { className: "text-sm sm:text-lg text-muted-foreground capitalize mt-0.5 sm:mt-1", children: formattedDate }), _jsx("p", { className: "text-base sm:text-2xl font-light text-muted-foreground/70 mt-0.5 tabular-nums", children: formattedTime })] }));
}
export default function HoyDashboard({ headerExtra }) {
    const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress();
    const { requestPermission } = useNotifications();
    const { timeframe, view } = useTimeframe();
    const { scores: areaScores, averages, loading: areaLoading } = useAreaScores(timeframe, view);
    const { scores: hommeScores, average: hommeAvg, esfuerzoAverage, resultadosAverage, loading: hommeLoading, } = useHombreTopScores(timeframe, view);
    const { blocks: rawBlocks, blocksLoaded, tasksByBlock, unassignedTasks, assignTaskToBlock, removeTaskFromBlock, refreshTasks, toggleBlockComplete, isBlockCompleted, completedBlocks, completedTasks, dayScore, tasks, planRoutineType, } = useDailyPlanData(new Date());
    const { adjustedBlocks, wakeTime, setWakeTime, focusBlock, setFocusBlock, sleepTime, setSleepTime, lateWake, setLateWake, musicInstrument, setMusicInstrument, presetName, } = useRoutineConfig();
    const { getCurrentBlock, getBlockProgress, updateBlockFocus } = useRoutineBlocksDB();
    const currentBlock = getCurrentBlock();
    const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;
    const { blocks: routineBlocks, isLoaded: routineLoaded, routineType, setRoutineType, updateBlockFocus: updateRoutineBlockFocus } = useRoutineBlocks();
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            requestPermission();
        }
    }, [requestPermission]);
    // Apply plan's routine type when a plan exists for today
    useEffect(() => {
        if (planRoutineType) {
            setRoutineType(planRoutineType);
        }
    }, [planRoutineType, setRoutineType]);
    const wheelValues = areaScores.map((s) => Math.round(s.esfuerzo / 10));
    const wheelValues2 = areaScores.map((s) => Math.round(s.resultados / 10));
    const wheelAvg = Math.round(averages.esfuerzo / 10);
    const wheelAvg2 = Math.round(averages.resultados / 10);
    const hommeValues = hommeScores.map((s) => s.esfuerzo);
    const hommeValues2 = hommeScores.map((s) => s.resultados);
    return (_jsx("div", { className: "min-h-screen bg-background p-3 sm:p-4 md:p-6 pt-16 sm:pt-20 pb-24", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-4 sm:space-y-6", children: [headerExtra, _jsx(ClockWidget, {}), _jsx(TimeframeSelector, {}), _jsx(DayProgressHeader, { blocksTotal: adjustedBlocks.length, blocksCompleted: completedBlocks.length, tasksTotal: tasks.length, tasksCompleted: completedTasks.length, dayScore: dayScore, currentBlockName: currentBlock?.title, currentBlockProgress: currentProgress, loading: !blocksLoaded }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4", children: [_jsxs(Card, { className: "p-3 md:p-4", children: [_jsx("h2", { className: "text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide text-center mb-2", children: "RUEDA DE LA VIDA \u2014 10 \u00C1REAS" }), _jsx(WheelOfLife, { values: wheelValues, values2: wheelValues2, average: wheelAvg, average2: wheelAvg2, view: view, loading: areaLoading })] }), _jsxs(Card, { className: "p-3 md:p-4", children: [_jsx("h2", { className: "text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide text-center mb-2", children: "HOMBRE TOP" }), _jsx("p", { className: "text-[9px] sm:text-xs text-muted-foreground text-center mb-3", children: "Lo que una mujer busca en un hombre" }), _jsx(HombreTopWheel, { values: hommeValues, values2: hommeValues2, average: esfuerzoAverage, average2: resultadosAverage, view: view, loading: hommeLoading })] })] }), _jsx(QuickDaySummary, {}), _jsx(RealStatsDashboard, { timeframe: "today" }), _jsx(FocusIndicatorsSection, {}), _jsx(MySystemsSection, {}), _jsx(SostenSection, {}), _jsx(MiniHabitsSection, {}), _jsx(Separator, {}), _jsx("div", { className: "flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                        const style = ROUTINE_STYLES[r.type];
                        const isActive = routineType === r.type;
                        return (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-2 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2 transition-all duration-300 min-w-[80px] sm:min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: "text-xl leading-none transition-transform duration-300", children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                    }) }), _jsx(RoutineConfigBar, { wakeTime: wakeTime, onWakeChange: setWakeTime, focusBlock: focusBlock, onFocusChange: setFocusBlock, sleepTime: sleepTime, onSleepChange: setSleepTime, lateWake: lateWake, onLateWakeChange: setLateWake, musicInstrument: musicInstrument, onMusicInstrumentChange: setMusicInstrument, presetName: presetName }), _jsx(CurrentBlockCard, { currentBlock: currentBlock, blockProgress: currentProgress, tasksByBlock: tasksByBlock }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [_jsx(DailyTimelinePlanner, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock: tasksByBlock, onToggleBlock: toggleBlockComplete, isBlockCompleted: isBlockCompleted, onDropTask: assignTaskToBlock, onRemoveTask: removeTaskFromBlock, onUpdateFocus: updateRoutineBlockFocus }), _jsx("div", { className: "lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-280px)]", children: _jsx(TaskPoolPanel, { unassignedTasks: unassignedTasks, onTaskCreated: refreshTasks }) })] }), _jsx(Separator, {}), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(PillarProgressGrid, { pillars: pillars, overallScore: overallScore, loading: pillarsLoading }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(SecondaryGoalsProgress, { goals: secondaryGoals, loading: pillarsLoading }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(GoalPredictions, {}), _jsx(WeekComparisonCard, {})] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(ProductivityPatterns, {}), _jsx(AchievementsDisplay, {})] }), _jsx(WeeklySummaryCard, {}), _jsx(WeekContext, {}), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("h2", { className: "text-xs font-bold uppercase tracking-wide", children: "CALENDARIO MENSUAL" }), _jsx(Link, { to: "/monthly", className: "text-[9px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2", children: "Ver detalle \u2192" })] }), _jsx(NotionCalendar, {})] }), _jsx(DailyMotivation, {}), _jsxs("div", { className: "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3", children: [_jsx(Link, { to: "/focus", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(Focus, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Focus Mode" })] }) }), _jsx(Link, { to: "/day-planner", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(CalendarPlus, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Planificar" })] }) }), _jsx(Link, { to: "/self-review", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(ClipboardCheck, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Autocr\u00EDtica" })] }) }), _jsx(Link, { to: "/confidence-steps", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(Compass, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Escalones" })] }) }), _jsx(Link, { to: "/vida-daniel", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(BarChart3, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Estad\u00EDsticas" })] }) }), _jsx(Link, { to: "/punto-partida", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors", children: [_jsx(Activity, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: "Punto Partida" })] }) })] })] }) }));
}
