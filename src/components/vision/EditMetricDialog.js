import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POINT_B_AREAS } from '@/data/pointB2027';
const GROUP_LABELS = {
    cimientos: '🏗️ Cimientos',
    construccion: '🔨 Construcción',
    recompensas: '🎁 Recompensas',
};
const POINT_B_AREA_OPTIONS = POINT_B_AREAS.map(a => ({
    id: a.id,
    label: `${a.icon} ${a.label}`,
    group: a.group,
}));
export function EditMetricDialog({ open, onOpenChange, metric, onSave }) {
    const [area, setArea] = useState(metric?.area || POINT_B_AREA_OPTIONS[0]?.id || '');
    const [metricName, setMetricName] = useState(metric?.metric_name || '');
    const [currentValue, setCurrentValue] = useState(metric?.current_value?.toString() || '0');
    const [targetValue, setTargetValue] = useState(metric?.target_value?.toString() || '100');
    const [unit, setUnit] = useState(metric?.unit || 'puntos');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (metric) {
            setArea(metric.area);
            setMetricName(metric.metric_name);
            setCurrentValue(metric.current_value.toString());
            setTargetValue(metric.target_value.toString());
            setUnit(metric.unit);
        }
    }, [metric]);
    const handleSave = async () => {
        if (!metricName.trim())
            return;
        setSaving(true);
        try {
            await onSave({
                area,
                metric_name: metricName.trim(),
                current_value: parseFloat(currentValue) || 0,
                target_value: parseFloat(targetValue) || 1,
                unit,
                icon: null,
                sort_order: 0,
                point_b_area_id: area,
            });
            onOpenChange(false);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setSaving(false);
        }
    };
    const groups = ['cimientos', 'construccion', 'recompensas'];
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: metric ? 'Editar métrica' : 'Nueva métrica Point B' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u00C1rea de Point B" }), _jsxs(Select, { value: area, onValueChange: setArea, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: groups.map(group => (_jsxs("div", { children: [_jsx("div", { className: "px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider", children: GROUP_LABELS[group] }), POINT_B_AREA_OPTIONS
                                                        .filter(a => a.group === group)
                                                        .map(a => (_jsx(SelectItem, { value: a.id, children: a.label }, a.id)))] }, group))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Nombre de la m\u00E9trica" }), _jsx(Input, { value: metricName, onChange: e => setMetricName(e.target.value), placeholder: "Ej: Peso muerto" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Valor actual" }), _jsx(Input, { type: "number", value: currentValue, onChange: e => setCurrentValue(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Valor meta" }), _jsx(Input, { type: "number", value: targetValue, onChange: e => setTargetValue(e.target.value) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Unidad" }), _jsx(Input, { value: unit, onChange: e => setUnit(e.target.value), placeholder: "Ej: kg, $, nivel" })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: !metricName.trim() || saving, children: saving ? 'Guardando...' : 'Guardar' })] })] }) }));
}
