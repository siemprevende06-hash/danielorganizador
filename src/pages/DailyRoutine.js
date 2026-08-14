import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { RoutineStreakCard } from "@/components/routine/RoutineStreakCard";
import { DailyPlanChecklist } from "@/components/routine/DailyPlanChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useRoutineBlocks, ROUTINES } from "@/hooks/useRoutineBlocks";
const ROUTINE_STREAK_KEY = "routineStreakData";
const DAILY_PLAN_KEY = "dailyPlanTasks";
const ROUTINE_STYLES = {
    disciplina: {
        active: "bg-orange-500/20 border-orange-500/60 text-orange-500 shadow-lg shadow-orange-500/10",
        inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40 hover:text-orange-400/80",
        glow: "shadow-orange-500/20",
    },
    normal: {
        active: "bg-blue-500/20 border-blue-500/60 text-blue-500 shadow-lg shadow-blue-500/10",
        inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40 hover:text-blue-400/80",
        glow: "shadow-blue-500/20",
    },
    super: {
        active: "bg-purple-500/20 border-purple-500/60 text-purple-500 shadow-lg shadow-purple-500/10",
        inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40 hover:text-purple-400/80",
        glow: "shadow-purple-500/20",
    },
    descanso: {
        active: "bg-green-500/20 border-green-500/60 text-green-500 shadow-lg shadow-green-500/10",
        inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40 hover:text-green-400/80",
        glow: "shadow-green-500/20",
    },
};
const DailyRoutine = () => {
    const { blocks: rawBlocks, isLoaded, routineType, setRoutineType, updateBlock: updateHookBlock, } = useRoutineBlocks();
    const [blocks, setBlocks] = useState([]);
    const [routineStreak, setRoutineStreak] = useState({
        currentStreak: 0,
        maxStreak: 0,
        totalDaysCompleted: 0,
        lastCompletedDate: "",
        weeklyCompletion: [false, false, false, false, false, false, false],
    });
    const [dailyTasks, setDailyTasks] = useState([]);
    const [completedTaskIds, setCompletedTaskIds] = useState(new Set());
    const [planDate, setPlanDate] = useState("today");
    const currentRoutine = ROUTINES.find(r => r.type === routineType) || ROUTINES[0];
    useEffect(() => {
        if (isLoaded && rawBlocks.length > 0) {
            const storageKey = `dailyRoutineBlocks_${routineType}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const merged = rawBlocks.map(block => {
                        const savedBlock = parsed.find((b) => b.id === block.id);
                        if (savedBlock) {
                            return {
                                ...block,
                                currentStreak: savedBlock.currentStreak || 0,
                                maxStreak: savedBlock.maxStreak || 0,
                                weeklyCompletion: savedBlock.weeklyCompletion || [false, false, false, false, false, false, false],
                            };
                        }
                        return block;
                    });
                    setBlocks(merged);
                    return;
                }
                catch { }
            }
            setBlocks(rawBlocks);
        }
    }, [isLoaded, rawBlocks, routineType]);
    useEffect(() => {
        const stored = localStorage.getItem(ROUTINE_STREAK_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const today = new Date().toDateString();
                const lastDate = parsed.lastCompletedDate ? new Date(parsed.lastCompletedDate).toDateString() : "";
                if (lastDate && lastDate !== today) {
                    const lastDateObj = new Date(parsed.lastCompletedDate);
                    const todayObj = new Date();
                    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 1)
                        parsed.currentStreak = 0;
                }
                const dayOfWeek = new Date().getDay();
                if (dayOfWeek === 1 && lastDate !== today) {
                    parsed.weeklyCompletion = [false, false, false, false, false, false, false];
                }
                setRoutineStreak(parsed);
            }
            catch { }
        }
    }, []);
    useEffect(() => {
        const dateKey = planDate === "today"
            ? new Date().toISOString().split('T')[0]
            : new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const stored = localStorage.getItem(`${DAILY_PLAN_KEY}_${dateKey}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setDailyTasks(parsed.tasks || []);
                setCompletedTaskIds(new Set(parsed.completedIds || []));
            }
            catch {
                setDailyTasks([]);
                setCompletedTaskIds(new Set());
            }
        }
        else {
            setDailyTasks([]);
            setCompletedTaskIds(new Set());
        }
    }, [planDate]);
    useEffect(() => {
        if (dailyTasks.length > 0 || completedTaskIds.size > 0) {
            const dateKey = planDate === "today"
                ? new Date().toISOString().split('T')[0]
                : new Date(Date.now() + 86400000).toISOString().split('T')[0];
            localStorage.setItem(`${DAILY_PLAN_KEY}_${dateKey}`, JSON.stringify({
                tasks: dailyTasks,
                completedIds: Array.from(completedTaskIds),
            }));
        }
    }, [dailyTasks, completedTaskIds, planDate]);
    useEffect(() => {
        localStorage.setItem(ROUTINE_STREAK_KEY, JSON.stringify(routineStreak));
    }, [routineStreak]);
    useEffect(() => {
        if (blocks.length > 0) {
            const storageKey = `dailyRoutineBlocks_${routineType}`;
            localStorage.setItem(storageKey, JSON.stringify(blocks));
        }
    }, [blocks, routineType]);
    const updateBlock = (updatedBlock) => {
        setBlocks(blocks.map(block => block.id === updatedBlock.id ? updatedBlock : block));
        updateHookBlock(updatedBlock);
    };
    const completeBlock = (blockId) => {
        setBlocks(blocks.map(block => {
            if (block.id === blockId) {
                const today = new Date().getDay();
                const dayIndex = today === 0 ? 6 : today - 1;
                const newWeekly = [...block.weeklyCompletion];
                newWeekly[dayIndex] = true;
                const newStreak = block.currentStreak + 1;
                return {
                    ...block,
                    currentStreak: newStreak,
                    maxStreak: Math.max(block.maxStreak, newStreak),
                    weeklyCompletion: newWeekly,
                };
            }
            return block;
        }));
    };
    const checkAndUpdateRoutineStreak = () => {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const allBlocksComplete = blocks.every(b => b.weeklyCompletion[dayIndex]);
        if (allBlocksComplete && blocks.length > 0) {
            const todayStr = new Date().toISOString();
            if (routineStreak.lastCompletedDate !== new Date().toDateString()) {
                const newWeeklyCompletion = [...routineStreak.weeklyCompletion];
                newWeeklyCompletion[dayIndex] = true;
                setRoutineStreak(prev => ({
                    currentStreak: prev.currentStreak + 1,
                    maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
                    totalDaysCompleted: prev.totalDaysCompleted + 1,
                    lastCompletedDate: todayStr,
                    weeklyCompletion: newWeeklyCompletion,
                }));
            }
        }
    };
    useEffect(() => {
        checkAndUpdateRoutineStreak();
    }, [blocks]);
    const handleTasksChange = (tasks) => setDailyTasks(tasks);
    const handleToggleComplete = (taskId) => {
        setCompletedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId))
                newSet.delete(taskId);
            else
                newSet.add(taskId);
            return newSet;
        });
    };
    const handleRemoveTask = (taskId) => {
        setDailyTasks(prev => prev.filter(t => t.id !== taskId));
        setCompletedTaskIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
        });
    };
    const handleAssignTasksToBlock = (blockId, taskIds) => {
        setDailyTasks(prev => prev.map(task => {
            if (taskIds.includes(task.id))
                return { ...task, routine_block_id: blockId };
            else if (task.routine_block_id === blockId)
                return { ...task, routine_block_id: undefined };
            return task;
        }));
    };
    const tasksWithCompletion = dailyTasks.map(task => ({
        ...task,
        completed: completedTaskIds.has(task.id),
    }));
    const completedBlocks = blocks.filter(b => {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        return b.weeklyCompletion[dayIndex];
    }).length;
    const progressPercentage = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;
    if (!isLoaded) {
        return (_jsx("div", { className: "container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-[60vh]", children: _jsx("p", { className: "text-muted-foreground", children: "Cargando rutina..." }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 pt-20 pb-8 space-y-6", style: { paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }, children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Rutina Diaria" }), _jsxs("p", { className: "text-muted-foreground mt-1", children: [currentRoutine.totalBlocks, " bloques \u00B7 ", currentRoutine.wakeTime, " \u2014 ", currentRoutine.sleepTime] })] }), _jsx(Link, { to: "/routine-day", children: _jsxs("button", { className: "text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent/50", children: [_jsx(Settings2, { className: "h-3.5 w-3.5" }), "Editar"] }) })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                            const style = ROUTINE_STYLES[r.type];
                            const isActive = routineType === r.type;
                            return (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: cn("text-xl leading-none transition-transform duration-300", isActive && "scale-110"), children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap transition-all", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight transition-all", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                        }) })] }), _jsx(RoutineStreakCard, { currentStreak: routineStreak.currentStreak, maxStreak: routineStreak.maxStreak, totalDaysCompleted: routineStreak.totalDaysCompleted, weeklyCompletion: routineStreak.weeklyCompletion }), _jsx(DailyPlanChecklist, { tasks: dailyTasks, completedTaskIds: completedTaskIds, onTasksChange: handleTasksChange, onToggleComplete: handleToggleComplete, onRemoveTask: handleRemoveTask, planDate: planDate, onPlanDateChange: setPlanDate }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsx("span", { children: "Progreso del D\u00EDa" }), _jsxs(Badge, { variant: "outline", className: "text-lg", children: [completedBlocks, "/", blocks.length] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Progress, { value: progressPercentage, className: "h-3" }), _jsxs("p", { className: "text-sm text-muted-foreground text-right", children: [Math.round(progressPercentage), "% completado"] })] }) })] }), _jsx("div", { className: "grid gap-6", children: blocks.map(block => (_jsx(RoutineBlockCard, { block: block, onUpdate: updateBlock, onComplete: () => completeBlock(block.id), dailyTasks: tasksWithCompletion, onAssignTasks: handleAssignTasksToBlock, onToggleTaskComplete: handleToggleComplete }, block.id))) }), progressPercentage === 100 && (_jsx(Card, { className: "border-2 border-green-500", children: _jsxs(CardContent, { className: "pt-6 text-center", children: [_jsx(CheckCircle2, { className: "h-12 w-12 text-green-500 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-bold mb-2", children: "\u00A1D\u00EDa Completado Perfectamente!" }), _jsx("p", { className: "text-muted-foreground", children: "Has completado todos los bloques. Tu disciplina es inquebrantable." })] }) }))] }));
};
export default DailyRoutine;
