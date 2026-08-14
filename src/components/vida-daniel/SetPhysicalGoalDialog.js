import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Settings, Target } from 'lucide-react';
import { toast } from 'sonner';
export const SetPhysicalGoalDialog = ({ onSave, currentGoal }) => {
    const [open, setOpen] = useState(false);
    const [startWeight, setStartWeight] = useState(currentGoal?.start_weight?.toString() || '50');
    const [targetWeight, setTargetWeight] = useState(currentGoal?.target_weight?.toString() || '70');
    const [gymDaysTarget, setGymDaysTarget] = useState(currentGoal?.gym_days_target?.toString() || '16');
    const [targetDate, setTargetDate] = useState(currentGoal?.target_date || '');
    const [isSaving, setIsSaving] = useState(false);
    const handleSave = async () => {
        const start = parseFloat(startWeight);
        const target = parseFloat(targetWeight);
        const gymDays = parseInt(gymDaysTarget);
        if (isNaN(start) || isNaN(target) || isNaN(gymDays)) {
            toast.error('Por favor ingresa valores válidos');
            return;
        }
        if (target <= start) {
            toast.error('El peso objetivo debe ser mayor al peso inicial');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                start_weight: start,
                target_weight: target,
                gym_days_target: gymDays,
                target_date: targetDate || undefined
            });
            toast.success('Meta física guardada');
            setOpen(false);
        }
        catch (error) {
            toast.error('Error al guardar la meta');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [currentGoal ? _jsx(Settings, { className: "h-4 w-4" }) : _jsx(Target, { className: "h-4 w-4" }), currentGoal ? 'Editar Meta' : 'Configurar Meta'] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), "Configurar Meta F\u00EDsica"] }) }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "startWeight", children: "Peso Inicial (kg)" }), _jsx(Input, { id: "startWeight", type: "number", step: "0.1", value: startWeight, onChange: (e) => setStartWeight(e.target.value), placeholder: "50" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "targetWeight", children: "Peso Objetivo (kg)" }), _jsx(Input, { id: "targetWeight", type: "number", step: "0.1", value: targetWeight, onChange: (e) => setTargetWeight(e.target.value), placeholder: "70" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "gymDays", children: "D\u00EDas de Gym por Mes" }), _jsx(Input, { id: "gymDays", type: "number", value: gymDaysTarget, onChange: (e) => setGymDaysTarget(e.target.value), placeholder: "16" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Objetivo de d\u00EDas de entrenamiento mensuales" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "targetDate", children: "Fecha Meta (opcional)" }), _jsx(Input, { id: "targetDate", type: "date", value: targetDate, onChange: (e) => setTargetDate(e.target.value) })] }), _jsx("div", { className: "bg-muted/50 p-3 rounded-lg", children: _jsxs("p", { className: "text-sm text-center", children: ["Meta: ", _jsxs("span", { className: "font-bold text-primary", children: ["+", (parseFloat(targetWeight) - parseFloat(startWeight)).toFixed(1), "kg"] }), " de m\u00FAsculo"] }) }), _jsx(Button, { onClick: handleSave, className: "w-full", disabled: isSaving, children: isSaving ? 'Guardando...' : 'Guardar Meta' })] })] })] }));
};
