import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from '@/components/ui/collapsible';
import { AddDestinoGoalDialog } from '@/components/destino/AddDestinoGoalDialog';
import { DestinoGoalCard } from '@/components/destino/DestinoGoalCard';
import { lifeAreas } from '@/lib/data';
import { getAllSubAreaIds } from '@/lib/utils';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { cn } from '@/lib/utils';
import { MapPin, ChevronDown, ChevronRight, Flag } from 'lucide-react';
const AREA_ACCENT = {
    universidad: 'border-l-blue-500',
    emprendimiento: 'border-l-purple-500',
    proyectos: 'border-l-amber-500',
    gym: 'border-l-red-500',
    idiomas: 'border-l-emerald-500',
    ajedrez: 'border-l-zinc-400',
    lectura: 'border-l-cyan-500',
    piano: 'border-l-pink-500',
    guitarra: 'border-l-orange-500',
    apariencia: 'border-l-violet-500',
    finanzas: 'border-l-green-500',
    mental: 'border-l-indigo-500',
};
export default function DestinoALlegar() {
    const { goals, loading, fetchGoals, fetchGoalTasks, createGoal, updateDailySystem, addGoalTask, toggleGoalTask, deleteGoal, deleteGoalTask, } = useGoalProgress();
    const [goalTasks, setGoalTasks] = useState(new Map());
    const [expandedAreas, setExpandedAreas] = useState(new Set());
    useEffect(() => {
        if (goals.length > 0) {
            goals.forEach(async (goal) => {
                const tasks = await fetchGoalTasks(goal.id);
                setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
            });
        }
    }, [goals, fetchGoalTasks]);
    const refreshTasks = async (goalId) => {
        const tasks = await fetchGoalTasks(goalId);
        setGoalTasks(prev => new Map(prev).set(goalId, tasks));
    };
    const grouped = useMemo(() => {
        return lifeAreas.map(area => {
            const areaIds = new Set(getAllSubAreaIds(area));
            return {
                area,
                goals: goals.filter(g => g.area_id && areaIds.has(g.area_id)),
            };
        });
    }, [goals]);
    const orphanGoals = useMemo(() => {
        const knownIds = new Set(grouped.flatMap(g => g.goals.map(x => x.id)));
        return goals.filter(g => !knownIds.has(g.id));
    }, [goals, grouped]);
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    const completedGoals = goals.filter(g => g.status === 'completed');
    const avgProgress = activeGoals.length
        ? Math.round(activeGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / activeGoals.length)
        : 0;
    const toggleArea = (areaId) => {
        setExpandedAreas(prev => {
            const next = new Set(prev);
            if (next.has(areaId))
                next.delete(areaId);
            else
                next.add(areaId);
            return next;
        });
    };
    const handleCreate = async (data) => {
        const goalId = await createGoal({
            title: data.title,
            daily_system: data.dailySystem,
            area_id: data.areaId,
            target_date: data.targetDate || null,
        });
        for (const item of data.planItems) {
            await addGoalTask(goalId, item);
        }
        await refreshTasks(goalId);
    };
    const handleToggleTask = async (task) => {
        await toggleGoalTask(task);
        await refreshTasks(task.goal_id);
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-8 pt-24 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [_jsx(Skeleton, { className: "h-10 w-64" }), _jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-64 w-full" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-8 pt-24 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-bold flex items-center gap-2", children: [_jsx(MapPin, { className: "h-7 w-7 text-primary" }), "Destino a Llegar"] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Todas tus metas, el sistema que te lleva y el plan desglosado para alcanzarlas" })] }), _jsx(AddDestinoGoalDialog, { onCreate: handleCreate })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold", children: activeGoals.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Metas activas" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsxs("p", { className: "text-3xl font-bold", children: [avgProgress, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Avance promedio" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold text-success", children: completedGoals.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Completadas" })] }) })] }), goals.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "py-14 text-center space-y-3", children: [_jsx(Flag, { className: "h-12 w-12 text-muted-foreground mx-auto" }), _jsx("p", { className: "text-lg font-medium", children: "A\u00FAn no hay metas de destino" }), _jsx("p", { className: "text-sm text-muted-foreground max-w-md mx-auto", children: "Crea tu primera meta: piensa en un destino (ej: aprender 10 canciones de piano), define el sistema diario que te lleva all\u00ED (ej: 30 min de pr\u00E1ctica) y el plan desglosado (las canciones, los pasos, las tareas)." }), _jsx("div", { className: "pt-2", children: _jsx(AddDestinoGoalDialog, { onCreate: handleCreate }) })] }) })) : (_jsxs("div", { className: "space-y-4", children: [grouped.map(({ area, goals: areaGoals }, index) => {
                            const Icon = area.icon;
                            const expanded = expandedAreas.has(area.id);
                            const areaAvg = areaGoals.length
                                ? Math.round(areaGoals.reduce((a, g) => a + (g.progress_percentage || 0), 0) / areaGoals.length)
                                : 0;
                            return (_jsx(Collapsible, { open: expanded, onOpenChange: () => toggleArea(area.id), children: _jsxs(Card, { className: cn('overflow-hidden border-l-4', AREA_ACCENT[area.id] || 'border-l-primary/40'), children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs("button", { className: "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors", children: [expanded ? _jsx(ChevronDown, { className: "h-5 w-5 shrink-0 text-muted-foreground" }) : _jsx(ChevronRight, { className: "h-5 w-5 shrink-0 text-muted-foreground" }), _jsx(Icon, { className: "h-5 w-5 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold", children: area.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: areaGoals.length > 0
                                                                    ? `${areaGoals.length} ${areaGoals.length === 1 ? 'meta' : 'metas'} · ${areaAvg}% promedio`
                                                                    : 'Sin metas aún' })] }), areaGoals.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Progress, { value: areaAvg, className: "w-20 h-2 hidden sm:block" }), _jsxs(Badge, { variant: "secondary", className: "shrink-0", children: [areaAvg, "%"] })] }))] }) }), _jsx(CollapsibleContent, { children: _jsx(CardContent, { className: "border-t pt-4 pb-4 space-y-3", children: areaGoals.length === 0 ? (_jsxs("div", { className: "flex items-center justify-between gap-3 py-2", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Define una meta para esta \u00E1rea" }), _jsx(AddDestinoGoalDialog, { defaultAreaId: area.id, onCreate: handleCreate })] })) : (_jsxs(_Fragment, { children: [areaGoals.map((goal, gi) => (_jsx(DestinoGoalCard, { goal: goal, tasks: goalTasks.get(goal.id) || [], colorIndex: index + gi, onToggleTask: handleToggleTask, onAddTask: async (title) => {
                                                                await addGoalTask(goal.id, title);
                                                                await refreshTasks(goal.id);
                                                            }, onDeleteTask: async (task) => {
                                                                await deleteGoalTask(task);
                                                                await refreshTasks(goal.id);
                                                            }, onUpdateSystem: async (system) => {
                                                                await updateDailySystem(goal.id, system);
                                                            }, onDeleteGoal: async () => {
                                                                await deleteGoal(goal.id);
                                                            } }, goal.id))), _jsx(AddDestinoGoalDialog, { defaultAreaId: area.id, onCreate: handleCreate })] })) }) })] }) }, area.id));
                        }), orphanGoals.length > 0 && (_jsx(Collapsible, { open: expandedAreas.has('__orphan'), onOpenChange: () => toggleArea('__orphan'), children: _jsxs(Card, { className: "overflow-hidden border-l-4 border-l-muted-foreground/30", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs("button", { className: "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors", children: [expandedAreas.has('__orphan') ? _jsx(ChevronDown, { className: "h-5 w-5 shrink-0 text-muted-foreground" }) : _jsx(ChevronRight, { className: "h-5 w-5 shrink-0 text-muted-foreground" }), _jsx(Flag, { className: "h-5 w-5 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold", children: "Sin \u00E1rea" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [orphanGoals.length, " metas"] })] })] }) }), _jsx(CollapsibleContent, { children: _jsx(CardContent, { className: "border-t pt-4 pb-4 space-y-3", children: orphanGoals.map((goal, gi) => (_jsx(DestinoGoalCard, { goal: goal, tasks: goalTasks.get(goal.id) || [], colorIndex: gi, onToggleTask: handleToggleTask, onAddTask: async (title) => {
                                                    await addGoalTask(goal.id, title);
                                                    await refreshTasks(goal.id);
                                                }, onDeleteTask: async (task) => {
                                                    await deleteGoalTask(task);
                                                    await refreshTasks(goal.id);
                                                }, onUpdateSystem: async (system) => {
                                                    await updateDailySystem(goal.id, system);
                                                }, onDeleteGoal: async () => {
                                                    await deleteGoal(goal.id);
                                                } }, goal.id))) }) })] }) }))] }))] }) }));
}
