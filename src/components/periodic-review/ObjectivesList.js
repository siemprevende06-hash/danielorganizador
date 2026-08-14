import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Target, Flame } from 'lucide-react';
const AREAS = [
    { id: 'universidad', label: 'Universidad' },
    { id: 'gym', label: 'Gimnasio' },
    { id: 'idiomas', label: 'Idiomas' },
    { id: 'musica', label: 'Música' },
    { id: 'lectura', label: 'Lectura' },
    { id: 'emprendimiento', label: 'Emprendimiento' },
    { id: 'proyectos', label: 'Proyectos' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'salud', label: 'Salud' },
    { id: 'general', label: 'General' },
];
export function ObjectivesList({ type, objectives, onAdd, onUpdate, onRemove }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newArea, setNewArea] = useState('general');
    const [newTarget, setNewTarget] = useState('');
    const isEffort = type === 'effort';
    const icon = isEffort ? _jsx(Flame, { className: "h-5 w-5 text-orange-500" }) : _jsx(Target, { className: "h-5 w-5 text-primary" });
    const title = isEffort ? 'Objetivos de Esfuerzo' : 'Objetivos de Resultados';
    const subtitle = isEffort ? 'Consistencia y hábitos' : 'Metas y logros concretos';
    const avgScore = objectives.length > 0
        ? Math.round(objectives.reduce((s, o) => s + o.score, 0) / objectives.length)
        : 0;
    const handleAdd = () => {
        if (!newTitle.trim() || !newTarget.trim())
            return;
        onAdd({
            area: newArea,
            title: newTitle,
            target: newTarget,
            actual: '',
            score: 0,
        });
        setNewTitle('');
        setNewArea('general');
        setNewTarget('');
        setDialogOpen(false);
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [icon, title] }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: subtitle })] }), _jsxs("div", { className: "flex items-center gap-2", children: [objectives.length > 0 && (_jsxs(Badge, { variant: avgScore >= 70 ? 'default' : avgScore >= 40 ? 'secondary' : 'destructive', children: [avgScore, "%"] })), _jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(PlusCircle, { className: "h-3.5 w-3.5 mr-1" }), "Agregar"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: isEffort ? 'Nuevo Objetivo de Esfuerzo' : 'Nuevo Objetivo de Resultados' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "\u00C1rea" }), _jsxs(Select, { value: newArea, onValueChange: setNewArea, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: AREAS.map(a => _jsx(SelectItem, { value: a.id, children: a.label }, a.id)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: isEffort ? 'Ej: Ir al gimnasio 5 días' : 'Ej: Aprobar parcial de Cálculo' }), _jsx(Input, { value: newTitle, onChange: e => setNewTitle(e.target.value), placeholder: isEffort ? 'Estudiar 3h diarias' : 'Sacar 80+ en examen' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Meta espec\u00EDfica" }), _jsx(Input, { value: newTarget, onChange: e => setNewTarget(e.target.value), placeholder: isEffort ? '5/7 días' : 'Nota ≥ 80' })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleAdd, children: "Agregar" }) })] })] })] })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [objectives.map(obj => (_jsxs("div", { className: "p-3 rounded-lg border bg-accent/30 space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(Badge, { variant: "outline", className: "text-[10px]", children: AREAS.find(a => a.id === obj.area)?.label || obj.area }), _jsx("span", { className: "text-sm font-medium", children: obj.title })] }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: ["Meta: ", obj.target] })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 shrink-0", onClick: () => onRemove(obj.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[10px] text-muted-foreground", children: "Resultado real" }), _jsx(Input, { value: obj.actual, onChange: e => onUpdate(obj.id, { actual: e.target.value }), className: "h-7 text-xs", placeholder: "Ej: 4/7 d\u00EDas" })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-[10px] text-muted-foreground", children: ["Cumplimiento: ", obj.score, "%"] }), _jsx(Slider, { value: [obj.score], onValueChange: ([v]) => onUpdate(obj.id, { score: v }), max: 100, step: 5, className: "mt-2" })] })] }), _jsx(Progress, { value: obj.score, className: `h-1 ${obj.score >= 80 ? '[&>div]:bg-green-500' :
                                    obj.score >= 50 ? '[&>div]:bg-yellow-500' :
                                        '[&>div]:bg-destructive'}` })] }, obj.id))), objectives.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: isEffort
                            ? 'Agrega objetivos de esfuerzo: constancia, hábitos, disciplina'
                            : 'Agrega objetivos de resultados: notas, logros, métricas concretas' }))] })] }));
}
