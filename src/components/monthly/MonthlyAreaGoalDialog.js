import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
const AREAS = [
    { value: 'universidad', label: 'Universidad', icon: '🎓' },
    { value: 'emprendimiento', label: 'Emprendimiento', icon: '💼' },
    { value: 'proyectos', label: 'Proyectos', icon: '🚀' },
    { value: 'gym', label: 'Gimnasio', icon: '💪' },
    { value: 'idiomas', label: 'Idiomas', icon: '🗣️' },
    { value: 'lectura', label: 'Lectura', icon: '📚' },
    { value: 'musica', label: 'Música', icon: '🎵' },
    { value: 'general', label: 'General', icon: '📋' },
];
const PRIORITIES = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
];
export function MonthlyAreaGoalDialog({ open, onOpenChange, goal, selectedAreaId, monthStart, monthEnd, onSuccess, }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        area_id: selectedAreaId || 'general',
        title: '',
        description: '',
        target_value: '0',
        current_value: '0',
        unit: '',
        priority: 'medium',
    });
    const { toast } = useToast();
    useEffect(() => {
        if (goal) {
            setFormData({
                area_id: goal.area_id,
                title: goal.title,
                description: goal.description || '',
                target_value: goal.target_value.toString(),
                current_value: goal.current_value.toString(),
                unit: goal.unit || '',
                priority: goal.priority,
            });
        }
        else if (selectedAreaId) {
            setFormData((prev) => ({ ...prev, area_id: selectedAreaId }));
        }
    }, [goal, selectedAreaId]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                area_id: formData.area_id,
                title: formData.title,
                description: formData.description || null,
                target_value: parseFloat(formData.target_value),
                current_value: parseFloat(formData.current_value),
                unit: formData.unit || null,
                priority: formData.priority,
                month_start: monthStart,
                month_end: monthEnd,
            };
            if (goal) {
                const { error } = await supabase
                    .from('monthly_area_goals')
                    .update(dataToSave)
                    .eq('id', goal.id);
                if (error)
                    throw error;
                toast({ title: 'Objetivo actualizado' });
            }
            else {
                const { error } = await supabase
                    .from('monthly_area_goals')
                    .insert([dataToSave]);
                if (error)
                    throw error;
                toast({ title: 'Objetivo creado' });
            }
            onSuccess();
            onOpenChange(false);
            resetForm();
        }
        catch (error) {
            console.error('Error saving goal:', error);
            toast({ title: 'Error', description: 'No se pudo guardar el objetivo', variant: 'destructive' });
        }
        finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setFormData({
            area_id: selectedAreaId || 'general',
            title: '', description: '', target_value: '0', current_value: '0', unit: '', priority: 'medium',
        });
    };
    return (_jsx(Dialog, { open: open, onOpenChange: (v) => { onOpenChange(v); if (!v && !goal)
            resetForm(); }, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: goal ? 'Editar Objetivo Mensual' : 'Nuevo Objetivo Mensual' }), _jsx(DialogDescription, { children: "Define un objetivo espec\u00EDfico para alcanzar este mes." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u00C1rea" }), _jsxs(Select, { value: formData.area_id, onValueChange: (v) => setFormData({ ...formData, area_id: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona un \u00E1rea" }) }), _jsx(SelectContent, { children: AREAS.map((a) => (_jsx(SelectItem, { value: a.value, children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: a.icon }), _jsx("span", { children: a.label })] }) }, a.value))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "T\u00EDtulo *" }), _jsx(Input, { placeholder: "Ej: Completar 20 horas de estudio", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Descripci\u00F3n" }), _jsx(Textarea, { placeholder: "Detalles...", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 3 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Valor Meta *" }), _jsx(Input, { type: "number", min: "0", step: "0.1", value: formData.target_value, onChange: (e) => setFormData({ ...formData, target_value: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Unidad" }), _jsx(Input, { placeholder: "horas, p\u00E1ginas", value: formData.unit, onChange: (e) => setFormData({ ...formData, unit: e.target.value }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Progreso Actual" }), _jsx(Input, { type: "number", min: "0", step: "0.1", value: formData.current_value, onChange: (e) => setFormData({ ...formData, current_value: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Prioridad" }), _jsxs(Select, { value: formData.priority, onValueChange: (v) => setFormData({ ...formData, priority: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: PRIORITIES.map((p) => (_jsx(SelectItem, { value: p.value, children: p.label }, p.value))) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), disabled: loading, children: "Cancelar" }), _jsxs(Button, { type: "submit", disabled: loading, children: [loading && _jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), goal ? 'Actualizar' : 'Crear', " Objetivo"] })] })] })] }) }));
}
