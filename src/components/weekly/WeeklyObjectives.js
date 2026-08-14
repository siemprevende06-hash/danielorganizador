import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { Plus, Target, TrendingUp } from 'lucide-react';
const AREAS = [
    { id: 'universidad', label: 'Universidad', icon: '🎓' },
    { id: 'emprendimiento', label: 'Emprendimiento', icon: '💼' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'idiomas', label: 'Idiomas', icon: '🌍' },
    { id: 'proyectos', label: 'Proyectos', icon: '🚀' },
];
export const WeeklyObjectives = () => {
    const { objectives, loading, addObjective, incrementProgress, getOverallProgress, currentWeekStart } = useWeeklyObjectives();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newObjective, setNewObjective] = useState({
        area: '',
        title: '',
        target_value: '',
        unit: '',
    });
    const handleAdd = async () => {
        if (!newObjective.area || !newObjective.title)
            return;
        await addObjective({
            area: newObjective.area,
            title: newObjective.title,
            target_value: newObjective.target_value ? parseFloat(newObjective.target_value) : null,
            current_value: 0,
            unit: newObjective.unit || null,
            completed: false,
            week_start_date: currentWeekStart,
            description: null,
        });
        setNewObjective({ area: '', title: '', target_value: '', unit: '' });
        setDialogOpen(false);
    };
    const overallProgress = getOverallProgress();
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-8 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4" }), "\uD83C\uDFAF Objetivos de Esta Semana"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Badge, { variant: "outline", children: [overallProgress, "% completado"] }), _jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", children: _jsx(Plus, { className: "w-4 h-4" }) }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nuevo Objetivo Semanal" }) }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "\u00C1rea" }), _jsxs(Select, { value: newObjective.area, onValueChange: (v) => setNewObjective(prev => ({ ...prev, area: v })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Selecciona \u00E1rea" }) }), _jsx(SelectContent, { children: AREAS.map(area => (_jsxs(SelectItem, { value: area.id, children: [area.icon, " ", area.label] }, area.id))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Objetivo" }), _jsx(Input, { placeholder: "Ej: Completar 5 ejercicios de F\u00EDsica", value: newObjective.title, onChange: (e) => setNewObjective(prev => ({ ...prev, title: e.target.value })), className: "mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Meta (opcional)" }), _jsx(Input, { type: "number", placeholder: "5", value: newObjective.target_value, onChange: (e) => setNewObjective(prev => ({ ...prev, target_value: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Unidad" }), _jsx(Input, { placeholder: "ejercicios, horas, etc.", value: newObjective.unit, onChange: (e) => setNewObjective(prev => ({ ...prev, unit: e.target.value })), className: "mt-1" })] })] }), _jsx(Button, { onClick: handleAdd, className: "w-full", children: "Agregar Objetivo" })] })] })] })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [AREAS.map(area => {
                        const areaObjectives = objectives.filter(o => o.area === area.id);
                        if (areaObjectives.length === 0)
                            return null;
                        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [_jsx("span", { children: area.icon }), _jsx("span", { children: area.label })] }), _jsx("div", { className: "space-y-2 pl-6", children: areaObjectives.map(obj => {
                                        const progressPercent = obj.target_value
                                            ? Math.min(Math.round((obj.current_value / obj.target_value) * 100), 100)
                                            : obj.completed ? 100 : 0;
                                        return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: obj.completed ? 'line-through text-muted-foreground' : '', children: obj.title }), obj.target_value ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: ["[", obj.current_value, "/", obj.target_value, "]"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: () => incrementProgress(obj.id), children: _jsx(TrendingUp, { className: "w-3 h-3" }) })] })) : (obj.completed && _jsx(Badge, { variant: "default", className: "text-xs", children: "\u2705" }))] }), _jsx(Progress, { value: progressPercent, className: "h-1.5" })] }, obj.id));
                                    }) })] }, area.id));
                    }), objectives.length === 0 && (_jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground", children: [_jsx(Target, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No hay objetivos para esta semana." }), _jsx("p", { className: "text-xs", children: "\u00A1Agrega tus metas!" })] }))] })] }));
};
