import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfidenceSteps, LEVEL_NAMES, AREAS } from '@/hooks/useConfidenceSteps';
import { Plus, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function ConfidenceSteps() {
    const navigate = useNavigate();
    const { steps, loading, addStep, updateStep, toggleComplete, deleteStep, getStepsByArea, getStepsByViewType, getCurrentLevel, getProgressToNextLevel, } = useConfidenceSteps();
    const [viewType, setViewType] = useState('weekly');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newStep, setNewStep] = useState({
        area: '',
        title: '',
        description: '',
        target_date: '',
        view_type: 'weekly',
    });
    const currentLevel = getCurrentLevel();
    const progressToNext = getProgressToNextLevel();
    const filteredSteps = getStepsByViewType(viewType);
    const handleAddStep = async () => {
        if (!newStep.area || !newStep.title)
            return;
        await addStep({
            area: newStep.area,
            title: newStep.title,
            description: newStep.description || null,
            target_date: newStep.target_date || null,
            view_type: newStep.view_type,
            level: currentLevel,
            target_level: currentLevel + 1,
        });
        setNewStep({ area: '', title: '', description: '', target_date: '', view_type: 'weekly' });
        setDialogOpen(false);
    };
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-8 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-64 bg-muted rounded" })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold flex items-center justify-center gap-2", children: "\uD83E\uDE9C Escalones de Confianza" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "\"Cada paso te acerca a tu mejor versi\u00F3n\"" })] }), _jsx(Card, { className: "bg-gradient-to-br from-primary/5 to-background border-primary/20", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsxs(Badge, { className: "mb-2 text-lg px-4 py-1", children: ["\u2605 Nivel ", currentLevel, ": ", LEVEL_NAMES[currentLevel]] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Progreso al siguiente nivel: ", progressToNext, "%"] }), _jsx(Progress, { value: progressToNext, className: "h-3 mt-2 max-w-md mx-auto" })] }), _jsx("div", { className: "flex justify-center items-end gap-2 h-40 mt-4", children: [1, 2, 3, 4, 5].map((level) => (_jsxs("div", { className: cn("flex flex-col items-center justify-end transition-all duration-300", level <= currentLevel ? "opacity-100" : "opacity-30"), style: { height: `${level * 20 + 20}%` }, children: [_jsx("div", { className: cn("w-12 md:w-16 rounded-t-lg flex items-center justify-center text-white font-bold text-sm", level === currentLevel && "ring-2 ring-primary ring-offset-2", level < currentLevel ? "bg-green-500" : level === currentLevel ? "bg-primary" : "bg-muted"), style: { height: '100%' }, children: level === currentLevel ? '← TÚ' : level }), _jsx("span", { className: "text-xs mt-1 text-center", children: LEVEL_NAMES[level]?.split(' ')[0] })] }, level))) })] }) }), _jsxs(Tabs, { value: viewType, onValueChange: (v) => setViewType(v), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "daily", children: "D\u00EDa" }), _jsx(TabsTrigger, { value: "weekly", children: "Semana" }), _jsx(TabsTrigger, { value: "monthly", children: "Mes" })] }), _jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nuevo Escal\u00F3n"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Agregar Escal\u00F3n de Confianza" }) }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "\u00C1rea" }), _jsxs(Select, { value: newStep.area, onValueChange: (v) => setNewStep(prev => ({ ...prev, area: v })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Selecciona \u00E1rea" }) }), _jsx(SelectContent, { children: AREAS.map(area => (_jsxs(SelectItem, { value: area.id, children: [area.icon, " ", area.label] }, area.id))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Objetivo" }), _jsx(Input, { placeholder: "Ej: Aprobar segundo parcial de F\u00EDsica", value: newStep.title, onChange: (e) => setNewStep(prev => ({ ...prev, title: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Descripci\u00F3n (opcional)" }), _jsx(Textarea, { placeholder: "Describe los pasos para lograrlo...", value: newStep.description, onChange: (e) => setNewStep(prev => ({ ...prev, description: e.target.value })), className: "mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Vista" }), _jsxs(Select, { value: newStep.view_type, onValueChange: (v) => setNewStep(prev => ({ ...prev, view_type: v })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "daily", children: "Diario" }), _jsx(SelectItem, { value: "weekly", children: "Semanal" }), _jsx(SelectItem, { value: "monthly", children: "Mensual" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Fecha l\u00EDmite" }), _jsx(Input, { type: "date", value: newStep.target_date, onChange: (e) => setNewStep(prev => ({ ...prev, target_date: e.target.value })), className: "mt-1" })] })] }), _jsx(Button, { onClick: handleAddStep, className: "w-full", children: "Agregar Escal\u00F3n" })] })] })] })] }), _jsxs(TabsContent, { value: viewType, className: "mt-4 space-y-4", children: [_jsxs("h3", { className: "font-medium", children: ["\uD83D\uDCCB Objetivos para subir al Nivel ", currentLevel + 1, ": ", LEVEL_NAMES[currentLevel + 1] || 'Maestro'] }), AREAS.map(area => {
                                const areaSteps = filteredSteps.filter(s => s.area === area.id);
                                if (areaSteps.length === 0)
                                    return null;
                                return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx("span", { children: area.icon }), _jsx("span", { children: area.label.toUpperCase() })] }) }), _jsx(CardContent, { className: "space-y-3", children: areaSteps.map(step => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Checkbox, { checked: step.completed, onCheckedChange: () => toggleComplete(step.id), className: "mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: cn("text-sm", step.completed && "line-through text-muted-foreground"), children: step.title }), step.completed && (_jsx(Badge, { variant: "default", className: "text-xs", children: "\u2705 Completado" }))] }), step.description && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: step.description })), step.progress_percentage > 0 && step.progress_percentage < 100 && (_jsxs("div", { className: "mt-2", children: [_jsx(Progress, { value: step.progress_percentage, className: "h-1.5" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [step.progress_percentage, "%"] })] }))] })] }), step.subtasks && step.subtasks.length > 0 && (_jsx("div", { className: "pl-8 space-y-1 border-l-2 border-muted ml-2", children: step.subtasks.map(sub => (_jsxs("div", { className: "flex items-center gap-2 py-1", children: [_jsx(Checkbox, { checked: sub.completed, onCheckedChange: () => toggleComplete(sub.id), className: "h-3.5 w-3.5" }), _jsx("span", { className: cn("text-xs", sub.completed && "line-through text-muted-foreground"), children: sub.title }), sub.progress_percentage > 0 && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["[", sub.progress_percentage, "%]"] }))] }, sub.id))) }))] }, step.id))) })] }, area.id));
                            }), filteredSteps.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(Target, { className: "w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" }), _jsx("p", { className: "text-muted-foreground", children: "No hay escalones para esta vista." }), _jsx("p", { className: "text-sm text-muted-foreground", children: "\u00A1Agrega objetivos para subir de nivel!" })] }) }))] })] })] }));
}
