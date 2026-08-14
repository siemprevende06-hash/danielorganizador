import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, Target, CheckCircle2, Circle, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MonthlyAreaGoalDialog } from './MonthlyAreaGoalDialog';
import { useToast } from '@/hooks/use-toast';
const AREA_INFO = {
    universidad: { name: 'Universidad', icon: '🎓', color: 'bg-blue-500' },
    emprendimiento: { name: 'Emprendimiento', icon: '💼', color: 'bg-purple-500' },
    proyectos: { name: 'Proyectos', icon: '🚀', color: 'bg-orange-500' },
    gym: { name: 'Gimnasio', icon: '💪', color: 'bg-green-500' },
    idiomas: { name: 'Idiomas', icon: '🗣️', color: 'bg-cyan-500' },
    lectura: { name: 'Lectura', icon: '📚', color: 'bg-amber-500' },
    musica: { name: 'Música', icon: '🎵', color: 'bg-pink-500' },
    general: { name: 'General', icon: '📋', color: 'bg-slate-500' },
};
export function MonthlyAreaGoals({ currentMonth }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState();
    const [selectedAreaId, setSelectedAreaId] = useState();
    const { toast } = useToast();
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
        try {
            const { data, error } = await supabase
                .from('monthly_area_goals')
                .select('*')
                .gte('month_start', monthStartStr)
                .lte('month_end', monthEndStr)
                .order('area_id')
                .order('priority', { ascending: false })
                .order('created_at');
            if (error)
                throw error;
            setGoals((data || []));
        }
        catch (error) {
            console.error('Error loading monthly goals:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddGoal = (areaId) => {
        setSelectedAreaId(areaId);
        setEditingGoal(undefined);
        setDialogOpen(true);
    };
    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setSelectedAreaId(goal.area_id);
        setDialogOpen(true);
    };
    const handleDeleteGoal = async (goalId) => {
        if (!confirm('¿Estás seguro de eliminar este objetivo?'))
            return;
        try {
            const { error } = await supabase
                .from('monthly_area_goals')
                .delete()
                .eq('id', goalId);
            if (error)
                throw error;
            toast({ title: 'Objetivo eliminado' });
            await loadMonthlyGoals();
        }
        catch (error) {
            console.error('Error deleting goal:', error);
            toast({ title: 'Error', description: 'No se pudo eliminar el objetivo', variant: 'destructive' });
        }
    };
    const handleUpdateProgress = async (goal, newValue) => {
        try {
            const { error } = await supabase
                .from('monthly_area_goals')
                .update({ current_value: newValue })
                .eq('id', goal.id);
            if (error)
                throw error;
            await loadMonthlyGoals();
        }
        catch (error) {
            console.error('Error updating progress:', error);
        }
    };
    const groupedGoals = Object.entries(goals.reduce((acc, goal) => {
        if (!acc[goal.area_id])
            acc[goal.area_id] = [];
        acc[goal.area_id].push(goal);
        return acc;
    }, {})).map(([areaId, areaGoals]) => {
        const areaInfo = AREA_INFO[areaId] || AREA_INFO.general;
        const totalProgress = areaGoals.length > 0
            ? areaGoals.reduce((sum, g) => sum + (g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0), 0) / areaGoals.length
            : 0;
        return { areaId, areaName: areaInfo.name, areaIcon: areaInfo.icon, goals: areaGoals, totalProgress: Math.min(100, totalProgress) };
    });
    const getPriorityColor = (p) => p === 'high' ? 'border-red-500 text-red-600' : p === 'medium' ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600';
    const getPriorityLabel = (p) => p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja';
    if (loading) {
        return _jsx(Card, { children: _jsx(CardContent, { className: "py-8", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-20 bg-muted rounded" })] }) }) });
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg font-semibold capitalize flex items-center gap-2", children: [_jsx(Target, { className: "w-5 h-5 text-primary" }), "Objetivos Mensuales por \u00C1rea - ", monthName] }), _jsxs(Button, { onClick: () => handleAddGoal(), size: "sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nuevo Objetivo"] })] }) }), _jsx(CardContent, { className: "space-y-6", children: groupedGoals.length > 0 ? (_jsx(_Fragment, { children: groupedGoals.map((areaGroup) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: areaGroup.areaIcon }), _jsx("span", { className: "font-medium text-base", children: areaGroup.areaName }), _jsxs(Badge, { variant: "outline", className: cn('ml-2', areaGroup.totalProgress >= 80 && 'border-green-500 text-green-600', areaGroup.totalProgress >= 50 && areaGroup.totalProgress < 80 && 'border-amber-500 text-amber-600'), children: [Math.round(areaGroup.totalProgress), "%"] })] }), _jsx(Button, { onClick: () => handleAddGoal(areaGroup.areaId), variant: "ghost", size: "sm", children: _jsx(Plus, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "space-y-3 pl-9", children: areaGroup.goals.map((goal) => {
                                            const progress = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
                                            return (_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 border border-border space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-2 flex-1", children: [goal.completed ? _jsx(CheckCircle2, { className: "w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" }) : _jsx(Circle, { className: "w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "font-medium text-sm", children: goal.title }), _jsx(Badge, { variant: "outline", className: cn('text-xs', getPriorityColor(goal.priority)), children: getPriorityLabel(goal.priority) })] }), goal.description && _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: goal.description })] })] }), _jsxs("div", { className: "flex items-center gap-1 ml-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => handleEditGoal(goal), children: _jsx(Pencil, { className: "w-3 h-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive", onClick: () => handleDeleteGoal(goal.id), children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-muted-foreground", children: [goal.current_value, " / ", goal.target_value, " ", goal.unit || ''] }), _jsxs("span", { className: "font-medium", children: [Math.round(progress), "%"] })] }), _jsx(Progress, { value: progress, className: "h-2" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-xs", onClick: () => handleUpdateProgress(goal, Math.max(0, goal.current_value - 1)), disabled: goal.current_value <= 0, children: "-1" }), _jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-xs", onClick: () => handleUpdateProgress(goal, goal.current_value + 1), children: "+1" }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs flex-1", onClick: () => handleUpdateProgress(goal, goal.target_value), disabled: goal.completed, children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "Completar"] })] })] }, goal.id));
                                        }) })] }, areaGroup.areaId))) })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Target, { className: "w-12 h-12 mx-auto text-muted-foreground/50 mb-3" }), _jsx("p", { className: "text-muted-foreground mb-2", children: "No hay objetivos mensuales definidos" }), _jsxs(Button, { onClick: () => handleAddGoal(), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Crear Primer Objetivo"] })] })) })] }), _jsx(MonthlyAreaGoalDialog, { open: dialogOpen, onOpenChange: setDialogOpen, goal: editingGoal, selectedAreaId: selectedAreaId, monthStart: monthStartStr, monthEnd: monthEndStr, onSuccess: loadMonthlyGoals })] }));
}
