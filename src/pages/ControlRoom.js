import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isToday, parseISO, format, formatISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { VisionGoalsBoard } from '@/components/VisionGoalsBoard';
import { lifeAreas, centralAreas, socialAreas, habits, quarterlyGoals as initialQuarterlyGoals } from '@/lib/data';
import { flattenAreas, findAreaById, getAllSubAreaIds, getEffortLevel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Repeat, Zap, Sparkles, Compass, ExternalLink } from 'lucide-react';
import { ProductivityMeter } from '@/components/dashboard/ProductivityMeter';
import { Progress } from '@/components/ui/progress';
import CurrentRoutineBlock from '@/components/dashboard/CurrentRoutineBlock';
import MotivationPanel from '@/components/dashboard/MotivationPanel';
import VisionActivationGrid from '@/components/dashboard/VisionActivationGrid';
import AttractionPillar from '@/components/dashboard/AttractionPillar';
const PERSONAL_CARE_HISTORY_KEY = 'personalCareHistory';
const SKIN_CARE_HISTORY_KEY = 'skinCareHistory';
const IconIndicator = ({ area, score, goalProgress, habitHistory }) => {
    const { progressColor, finalEffortRing, barColorClass, displayProgress, isHighPriorityIncomplete } = useMemo(() => {
        let scoreToUse = score;
        const habitForArea = habits.find(h => h.areaId === area.id);
        let effort = null;
        if (habitForArea) {
            const todayStr = formatISO(new Date(), { representation: 'date' });
            const todayEntry = habitHistory[habitForArea.id]?.completedDates?.find(d => d && d.date === todayStr);
            const todayDuration = todayEntry?.duration || 0;
            if (habitForArea.effortLevels && todayDuration > 0) {
                effort = getEffortLevel(habitForArea, todayDuration);
            }
        }
        if (score === -1 && goalProgress !== undefined && goalProgress > -1) {
            scoreToUse = goalProgress;
        }
        const getBarColorClass = (progress) => {
            if (progress === -1)
                return 'bg-muted';
            if (progress >= 100)
                return 'bg-emerald-400';
            if (progress >= 75)
                return 'bg-green-500';
            if (progress > 0)
                return 'bg-amber-500';
            return 'bg-red-500';
        };
        const getProgressColor = (s) => {
            if (s === -1)
                return 'text-muted-foreground';
            if (s >= 100)
                return 'text-emerald-400';
            if (s >= 75)
                return 'text-green-500';
            if (s > 0)
                return 'text-amber-500';
            return 'text-red-500';
        };
        const isCompleted = scoreToUse >= 100;
        let finalEffort = effort;
        if (!finalEffort && isCompleted) {
            const habitForArea = habits.find(h => h.areaId === area.id);
            if (habitForArea && !habitForArea.effortLevels) {
                finalEffort = { name: 'Esmeralda', ring: 'ring-emerald-400', border: 'border-emerald-400' };
            }
        }
        const effectiveProgress = goalProgress !== undefined && goalProgress > -1 ? goalProgress : scoreToUse;
        const highPriorityHabits = ['entrenamiento', 'universidad', 'proyectos-personales'];
        const isHighPriorityIncomplete = highPriorityHabits.includes(area.id) && scoreToUse < 100 && !effort;
        return {
            progressColor: getProgressColor(effectiveProgress),
            barColorClass: getBarColorClass(effectiveProgress),
            displayProgress: effectiveProgress,
            finalEffortRing: finalEffort,
            isHighPriorityIncomplete,
        };
    }, [score, goalProgress, area.id, habitHistory]);
    const Icon = area.icon;
    return (_jsxs("div", { className: "p-2 rounded-md hover:bg-accent cursor-pointer flex flex-col items-center gap-2 relative", children: [_jsx("div", { className: cn("p-3 rounded-lg border-2 border-transparent transition-all", finalEffortRing && `ring-2 ring-offset-2 ring-offset-background ${finalEffortRing.ring} ${finalEffortRing.border}`), children: _jsx(Icon, { className: cn("h-12 w-12", progressColor) }) }), _jsx("div", { className: "w-12 h-2 bg-muted rounded-full overflow-hidden", children: displayProgress >= 0 && _jsx("div", { className: cn("h-full rounded-full", barColorClass), style: { width: `${displayProgress}%` } }) })] }));
};
const AreaColumn = ({ title, parentAreas, productivityData, habitHistory }) => {
    const allAppAreas = useMemo(() => flattenAreas([...lifeAreas, ...centralAreas, ...socialAreas]), []);
    const columnAverage = useMemo(() => {
        const areaIdsInColumn = parentAreas.flatMap(area => getAllSubAreaIds(area, allAppAreas));
        const scores = areaIdsInColumn
            .map(id => {
            const data = productivityData[id];
            if (!data)
                return undefined;
            return data.goalProgress !== undefined && data.goalProgress > -1 ? data.goalProgress : data.score;
        })
            .filter(score => score !== undefined && score !== -1);
        if (scores.length === 0)
            return -1;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }, [parentAreas, productivityData, allAppAreas]);
    const renderArea = (area) => {
        const specialLayoutAreas = ['profesional', 'desarrollo-personal', 'mental', 'apariencia', 'finanzas', 'salud'];
        const allSubAreaIds = getAllSubAreaIds(area, allAppAreas);
        const subAreaScores = allSubAreaIds
            .map(id => {
            const data = productivityData[id];
            if (!data)
                return undefined;
            return data.goalProgress !== undefined && data.goalProgress > -1 ? data.goalProgress : data.score;
        })
            .filter(score => score !== undefined && score !== -1);
        const areaAverage = subAreaScores.length > 0
            ? subAreaScores.reduce((sum, score) => sum + score, 0) / subAreaScores.length
            : -1;
        const areaData = productivityData[area.id];
        const hasTrackedItems = areaData !== undefined;
        const score = hasTrackedItems ? areaData.score : -1;
        const goalProgress = hasTrackedItems ? areaData.goalProgress : undefined;
        if (specialLayoutAreas.includes(area.id)) {
            const AreaIcon = area.icon;
            if (area.id === 'mental') {
                const routines = ['rutina-activacion', 'rutina-desactivacion'];
                const dopamineDetox = ['no-fap', 'no-videojuegos', 'redes-sociales'];
                const atomicHabits = ['ducha-fria', 'planificacion', 'autocritica'];
                const renderGroup = (groupTitle, icon, habitIds) => {
                    const habitsToShow = (area.subAreas || [])
                        .map(sub => allAppAreas.find(a => a.id === sub.id))
                        .filter((a) => !!a && habitIds.includes(a.id));
                    if (habitsToShow.length === 0)
                        return null;
                    return (_jsxs("div", { className: "w-full space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-primary/80 text-sm", children: [React.createElement(icon, { className: 'h-4 w-4' }), _jsx("h5", { children: groupTitle })] }), _jsx("div", { className: "flex items-center flex-wrap gap-x-1", children: habitsToShow.map(habitArea => {
                                    const habitAreaData = productivityData[habitArea.id];
                                    const habitScore = habitAreaData?.score ?? -1;
                                    const habitGoalProgress = habitAreaData?.goalProgress;
                                    return _jsx(IconIndicator, { area: habitArea, score: habitScore, goalProgress: habitGoalProgress, habitHistory: habitHistory }, habitArea.id);
                                }) })] }));
                };
                return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-primary/90", children: [_jsx(AreaIcon, { className: "h-5 w-5" }), _jsx("h4", { children: area.name })] }), areaAverage >= 0 && (_jsx("div", { className: "pl-7", children: _jsx(Progress, { value: areaAverage, className: "h-1.5" }) })), _jsxs("div", { className: "pl-7 flex flex-col gap-3", children: [renderGroup("Rutinas", Repeat, routines), renderGroup("Detox Dopamínico", Zap, dopamineDetox), renderGroup("Hábitos Atómicos", Sparkles, atomicHabits)] })] }, area.id));
            }
            return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 font-semibold text-primary/90", children: [_jsx(AreaIcon, { className: "h-5 w-5" }), _jsx("h4", { children: area.name })] }), areaAverage >= 0 && (_jsx("div", { className: "pl-7", children: _jsx(Progress, { value: areaAverage, className: "h-1.5" }) })), _jsx("div", { className: "pl-7 flex items-center flex-wrap gap-x-1", children: (area.subAreas || []).map(sub => {
                            const subArea = allAppAreas.find(a => a.id === sub.id);
                            if (!subArea)
                                return null;
                            const subAreaData = productivityData[subArea.id];
                            const subAreaScore = subAreaData?.score ?? -1;
                            const subAreaGoalProgress = subAreaData?.goalProgress;
                            return _jsx(IconIndicator, { area: subArea, score: subAreaScore, goalProgress: subAreaGoalProgress, habitHistory: habitHistory }, subArea.id);
                        }) })] }, area.id));
        }
        return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconIndicator, { area: area, score: score, goalProgress: goalProgress, habitHistory: habitHistory }), _jsx("span", { className: "font-medium text-sm truncate", children: area.name })] }, area.id));
    };
    return (_jsxs("div", { className: "flex-1 flex flex-col gap-6", children: [_jsxs("div", { className: 'text-center space-y-2', children: [_jsx("h3", { className: "text-lg font-semibold text-muted-foreground", children: title }), columnAverage >= 0 && _jsx(Progress, { value: columnAverage, className: "h-1.5" })] }), _jsx("div", { className: "w-full space-y-4", children: parentAreas.map(area => renderArea(area)) })] }));
};
const EffortVerdict = ({ score }) => {
    const { title, message, borderColor } = useMemo(() => {
        if (score >= 80) {
            return {
                title: "Veredicto: Has Honrado tu Palabra.",
                message: "Hoy has invertido en tu futuro yo. Cada acción, cada esfuerzo, te ha acercado a la persona que quieres ser. Duerme tranquilo, estás exactamente donde debes estar. El camino se construye con días como este.",
                borderColor: "border-emerald-500/80"
            };
        }
        if (score >= 50) {
            return {
                title: "Veredicto: Has Ganado Terreno.",
                message: "Has luchado y has avanzado. No todos los días son perfectos, pero el esfuerzo de hoy cuenta y suma. La consistencia no se trata de perfección, se trata de persistencia. Sigue adelante.",
                borderColor: "border-blue-500/80"
            };
        }
        return {
            title: "Veredicto: Un Día para Reflexionar.",
            message: "Hoy no fue tu día más fuerte, y está bien reconocerlo. Lo importante no es este resultado, sino tu respuesta mañana. Usa esto no como una derrota, sino como la tensión necesaria para un impulso mayor. Mañana es una página en blanco.",
            borderColor: "border-amber-500/80"
        };
    }, [score]);
    return (_jsxs(Card, { className: cn("border-2", borderColor), children: [_jsx(CardHeader, { className: "text-center", children: _jsxs(CardTitle, { className: "text-xl flex items-center justify-center gap-3", children: [_jsx(Compass, { className: "h-6 w-6 text-primary" }), "La Br\u00FAjula del Presente: Veredicto del Esfuerzo"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center space-y-2", children: [_jsx("h4", { className: "font-semibold text-primary", children: title }), _jsx("p", { className: "text-muted-foreground italic text-sm", children: message })] }) })] }));
};
export default function ControlRoom() {
    const [allTasks, setAllTasks] = useState([]);
    const [habitHistory, setHabitHistory] = useState({});
    const [personalCareHistory, setPersonalCareHistory] = useState({});
    const [skinCareHistory, setSkinCareHistory] = useState({});
    const [monthlyGoals, setMonthlyGoals] = useState({});
    const [quarterlyGoals, setQuarterlyGoals] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const currentMonthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);
    const mainAreas = useMemo(() => [...lifeAreas, ...centralAreas], []);
    const allAppAreas = useMemo(() => flattenAreas([...lifeAreas, ...centralAreas, ...socialAreas]), []);
    useEffect(() => {
        setIsClient(true);
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            setAllTasks(JSON.parse(storedTasks, (key, value) => (key === 'dueDate' || key === 'startDate') && value ? new Date(value) : value) || []);
        }
        const storedHabits = localStorage.getItem('habitHistory');
        if (storedHabits) {
            setHabitHistory(JSON.parse(storedHabits) || {});
        }
        const storedPersonalCare = localStorage.getItem(PERSONAL_CARE_HISTORY_KEY);
        if (storedPersonalCare) {
            setPersonalCareHistory(JSON.parse(storedPersonalCare));
        }
        const storedSkinCare = localStorage.getItem(SKIN_CARE_HISTORY_KEY);
        if (storedSkinCare) {
            setSkinCareHistory(JSON.parse(storedSkinCare));
        }
        const storedMonthlyGoals = localStorage.getItem('monthlyGoals');
        if (storedMonthlyGoals) {
            try {
                const allParsedGoals = JSON.parse(storedMonthlyGoals, (key, value) => {
                    if ((key === 'startDate' || key === 'dueDate') && value) {
                        return new Date(value);
                    }
                    return value;
                });
                setMonthlyGoals(allParsedGoals[currentMonthKey] || {});
            }
            catch (error) {
                setMonthlyGoals({});
            }
        }
        const storedQuarterlyGoals = localStorage.getItem('quarterlyGoals');
        setQuarterlyGoals(storedQuarterlyGoals ? JSON.parse(storedQuarterlyGoals) : initialQuarterlyGoals);
    }, [currentMonthKey]);
    const augmentedHabitHistory = useMemo(() => {
        if (!isClient)
            return habitHistory;
        const todayStr = formatISO(new Date(), { representation: 'date' });
        const todayPersonalCare = personalCareHistory[todayStr] || { cleanClothes: false, hairDone: false, perfume: false };
        const todaySkinCare = skinCareHistory[todayStr] || { morning: false, night: false };
        const augmentedHistory = JSON.parse(JSON.stringify(habitHistory));
        const updateHabit = (habitId, isCompleted) => {
            if (!augmentedHistory[habitId]) {
                augmentedHistory[habitId] = { completedDates: [], currentStreak: 0, longestStreak: 0 };
            }
            let completedDates = augmentedHistory[habitId].completedDates || [];
            const entryIndex = completedDates.findIndex((d) => d.date === todayStr);
            if (entryIndex > -1) {
                if (isCompleted) {
                    completedDates[entryIndex].status = 'completed';
                }
                else {
                    if (completedDates[entryIndex].status === 'completed') {
                        completedDates.splice(entryIndex, 1);
                    }
                }
            }
            else if (isCompleted) {
                completedDates.push({ date: todayStr, status: 'completed' });
            }
            augmentedHistory[habitId].completedDates = completedDates;
        };
        updateHabit('habit-cuidado-personal', todayPersonalCare.cleanClothes && todayPersonalCare.hairDone && todayPersonalCare.perfume);
        updateHabit('habit-skincare', todaySkinCare.morning && todaySkinCare.night);
        return augmentedHistory;
    }, [isClient, habitHistory, personalCareHistory, skinCareHistory]);
    const productivityData = useMemo(() => {
        if (!isClient)
            return { average: { completedHabits: 0, totalHabits: 0, completedTasks: 0, totalTasks: 0, score: 0 } };
        const todayTasks = allTasks.filter(task => task.dueDate && isToday(new Date(task.dueDate)));
        const areaScores = {};
        allAppAreas.forEach(area => {
            const areaHabits = habits.filter(h => h.areaId === area.id);
            const areaTasks = todayTasks.filter(t => t.areaId === area.id);
            let score = null;
            if (area.id === 'proyectos-personales') {
                if (areaTasks.length > 0) {
                    const completed = areaTasks.filter(t => t.status === 'completada').length;
                    score = (completed / areaTasks.length) * 100;
                }
                else {
                    score = -1;
                }
            }
            else {
                const completedHabitsCount = areaHabits.filter(h => {
                    const todayEntry = augmentedHabitHistory[h.id]?.completedDates?.find(d => d && isToday(parseISO(d.date)));
                    return todayEntry?.status === 'completed';
                }).length;
                const completedTasksCount = areaTasks.filter(t => t.status === 'completada').length;
                const totalItems = areaHabits.length + areaTasks.length;
                const completedItems = completedHabitsCount + completedTasksCount;
                if (totalItems > 0) {
                    score = (completedItems / totalItems) * 100;
                }
            }
            if (score !== null) {
                areaScores[area.id] = { score, area };
            }
            else if (socialAreas.some(sa => sa.id === area.id)) {
                const socialAreaTasks = todayTasks.filter(t => t.areaId === area.id);
                if (socialAreaTasks.length > 0) {
                    const completed = socialAreaTasks.filter(t => t.status === 'completada').length;
                    areaScores[area.id] = { score: (completed / socialAreaTasks.length) * 100, area };
                }
                else {
                    areaScores[area.id] = { score: -1, area };
                }
            }
            const monthlyGoalForArea = monthlyGoals[area.id];
            if (monthlyGoalForArea && monthlyGoalForArea.tasks.length > 0) {
                const completedMonthlyTasks = monthlyGoalForArea.tasks.filter(t => t.completed).length;
                const goalProgress = (completedMonthlyTasks / monthlyGoalForArea.tasks.length) * 100;
                if (areaScores[area.id]) {
                    areaScores[area.id].goalProgress = goalProgress;
                }
                else {
                    areaScores[area.id] = { score: -1, area, goalProgress: goalProgress };
                }
            }
        });
        socialAreas.forEach(area => {
            if (!areaScores[area.id]) {
                areaScores[area.id] = { score: -1, area };
            }
        });
        const totalHabits = habits.length;
        const totalTasks = todayTasks.length;
        const totalCompletedHabits = Object.values(augmentedHabitHistory).filter(h => (h.completedDates || []).some(d => d && d.date && isToday(parseISO(d.date)) && d.status === 'completed')).length;
        const totalCompletedTasks = todayTasks.filter(t => t.status === 'completada').length;
        const professionalArea = mainAreas.find(a => a.id === 'profesional');
        const personalArea = mainAreas.find(a => a.id === 'desarrollo-personal');
        const healthArea = centralAreas.find(a => a.id === 'salud');
        const financeArea = mainAreas.find(a => a.id === 'finanzas');
        const mentalArea = mainAreas.find(a => a.id === 'mental');
        const appearanceArea = mainAreas.find(a => a.id === 'apariencia');
        const getMetricsForArea = (areaIds) => {
            const areaHabits = habits.filter(h => areaIds.includes(h.areaId));
            const areaTasks = todayTasks.filter(t => areaIds.includes(t.areaId || ''));
            const completedHabitsCount = areaHabits.filter(h => {
                return (augmentedHabitHistory[h.id]?.completedDates || []).some(d => d && d.date && isToday(parseISO(d.date)) && d.status === 'completed');
            }).length;
            const completedTasksCount = areaTasks.filter(t => t.status === 'completada').length;
            return {
                completedHabits: completedHabitsCount,
                totalHabits: areaHabits.length,
                completedTasks: completedTasksCount,
                totalTasks: areaTasks.length,
            };
        };
        const overallScore = (totalHabits + totalTasks) > 0 ? ((totalCompletedHabits + totalCompletedTasks) / (totalHabits + totalTasks)) * 100 : 100;
        areaScores.average = {
            score: overallScore,
            area: { id: 'average', name: 'Promedio', description: '', icon: () => null },
            data: {
                completedHabits: totalCompletedHabits,
                totalHabits: totalHabits,
                completedTasks: totalCompletedTasks,
                totalTasks: totalTasks,
            },
            professional: getMetricsForArea(professionalArea ? getAllSubAreaIds(professionalArea, allAppAreas) : []),
            personal: getMetricsForArea(personalArea ? getAllSubAreaIds(personalArea, allAppAreas) : []),
            health: getMetricsForArea(healthArea ? getAllSubAreaIds(healthArea, allAppAreas) : []),
            finance: getMetricsForArea(financeArea ? getAllSubAreaIds(financeArea, allAppAreas) : []),
            mental: getMetricsForArea(mentalArea ? getAllSubAreaIds(mentalArea, allAppAreas) : []),
            appearance: getMetricsForArea(appearanceArea ? getAllSubAreaIds(appearanceArea, allAppAreas) : []),
        };
        return areaScores;
    }, [allTasks, augmentedHabitHistory, monthlyGoals, isClient, mainAreas, allAppAreas]);
    const { borderColorClass } = useMemo(() => {
        const scores = Object.values(productivityData)
            .map((data) => data.score)
            .filter(score => score !== -1 && score !== undefined);
        if (scores.length === 0) {
            return { overallScore: -1, borderColorClass: 'border-border' };
        }
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        let colorClass = 'border-border';
        if (averageScore >= 100)
            colorClass = 'border-emerald-400';
        else if (averageScore >= 75)
            colorClass = 'border-green-500';
        else if (averageScore >= 40)
            colorClass = 'border-amber-500';
        else if (averageScore > 0)
            colorClass = 'border-red-500';
        return { overallScore: averageScore, borderColorClass: colorClass };
    }, [productivityData]);
    const projectsByMainArea = useMemo(() => {
        if (!monthlyGoals)
            return [];
        const monthlyProjects = Object.entries(monthlyGoals)
            .map(([areaId, goalData]) => {
            if (!goalData.quarterlyGoalId || !goalData.tasks || goalData.tasks.length === 0)
                return null;
            const area = findAreaById(allAppAreas, areaId);
            const quarterlyGoal = quarterlyGoals.find(qg => qg.id === goalData.quarterlyGoalId);
            if (!area || !quarterlyGoal)
                return null;
            const completedTasks = goalData.tasks.filter(t => t.completed).length;
            const progress = (completedTasks / goalData.tasks.length) * 100;
            return {
                area,
                quarterlyGoal,
                progress,
                completedTasks,
                totalTasks: goalData.tasks.length,
            };
        })
            .filter((p) => p !== null);
        const grouped = {};
        const areasToShow = ['profesional', 'desarrollo-personal'];
        monthlyProjects.forEach(project => {
            let mainArea;
            let parentArea = project.area;
            while (parentArea) {
                const foundMain = [...lifeAreas, ...centralAreas].find(m => m.id === parentArea.id);
                if (foundMain) {
                    mainArea = foundMain;
                    break;
                }
                const parentId = allAppAreas.find(a => a.subAreas?.some(sa => sa.id === parentArea.id))?.id;
                parentArea = parentId ? findAreaById(allAppAreas, parentId) : undefined;
            }
            if (mainArea && areasToShow.includes(mainArea.id)) {
                if (!grouped[mainArea.id]) {
                    grouped[mainArea.id] = { mainArea, projects: [] };
                }
                grouped[mainArea.id].projects.push(project);
            }
        });
        return Object.values(grouped);
    }, [monthlyGoals, quarterlyGoals, allAppAreas]);
    if (!isClient) {
        return null;
    }
    const averageData = productivityData.average;
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-8", children: [_jsxs("header", { className: 'flex justify-between items-center', children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold gradient-primary bg-clip-text text-transparent", children: "Sala de Control" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Un vistazo r\u00E1pido al estado de todos los sistemas de tu vida" })] }), averageData?.data && (_jsxs("div", { className: 'flex flex-nowrap gap-1 justify-end', children: [_jsx(ProductivityMeter, { title: "Promedio del D\u00EDa", ...averageData.data, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Saludable", ...averageData.health, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Mental", ...averageData.mental, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Apariencia", ...averageData.appearance, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Profesional", ...averageData.professional, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Personal", ...averageData.personal, showCard: false }), _jsx(ProductivityMeter, { title: "D\u00EDa Financiero", ...averageData.finance, showCard: false })] }))] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Rutina Diaria" }) }), _jsx(CardContent, { className: 'p-0', children: isClient && _jsx(CurrentRoutineBlock, {}) })] }), _jsx("div", { className: cn("p-4 rounded-lg border-2", borderColorClass), children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(AreaColumn, { title: "\u00C1reas Centrales", parentAreas: centralAreas, productivityData: productivityData, habitHistory: augmentedHabitHistory }), _jsx(AreaColumn, { title: "\u00C1reas Clave", parentAreas: lifeAreas, productivityData: productivityData, habitHistory: augmentedHabitHistory }), _jsx(AreaColumn, { title: "\u00C1reas Sociales", parentAreas: socialAreas, productivityData: productivityData, habitHistory: augmentedHabitHistory })] }) }), _jsx(Separator, {}), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Tablero de Visi\u00F3n" }), _jsx(CardDescription, { children: "Define tus metas y marca tu nivel de logro: M\u00EDnimo, Normal o M\u00E1ximo" })] }), _jsx(CardContent, { children: _jsx(VisionGoalsBoard, {}) })] }), _jsx(Separator, {}), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(VisionActivationGrid, { habitHistory: augmentedHabitHistory }), _jsx(AttractionPillar, { habitHistory: augmentedHabitHistory })] }), _jsx(EffortVerdict, { score: averageData.score }), _jsx(Separator, {}), projectsByMainArea.length > 0 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Proyectos del Mes" }), projectsByMainArea.map(({ mainArea, projects }) => {
                        const AreaIcon = mainArea.icon;
                        return (_jsxs("div", { children: [_jsxs("h3", { className: "text-xl font-semibold mb-4 flex items-center gap-3", children: [_jsx(AreaIcon, { className: "h-6 w-6 text-primary" }), mainArea.name] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-9", children: projects.map((project) => (_jsxs(Card, { className: "h-full", children: [_jsxs(CardHeader, { className: "pb-4", children: [_jsx(Link, { to: `/goals/${project.quarterlyGoal.id}`, className: "hover:underline", children: _jsxs(CardTitle, { className: "text-base font-semibold flex items-center gap-2", children: [project.quarterlyGoal.title, _jsx(ExternalLink, { className: "h-3 w-3 flex-shrink-0" })] }) }), _jsx(CardDescription, { className: 'text-xs pt-1', children: project.area.name })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx(Progress, { value: project.progress, className: 'h-2' }), _jsxs("div", { className: "text-xs text-muted-foreground font-medium", children: [project.completedTasks, " de ", project.totalTasks, " subtareas"] })] }) })] }, project.quarterlyGoal.id))) })] }, mainArea.id));
                    })] })), _jsx(Separator, {}), isClient && _jsx(MotivationPanel, { habitHistory: augmentedHabitHistory, productivityData: productivityData })] }));
}
