import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ProgressRing } from '@/components/monthly-planning/ProgressRing';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Calendar, Trash2, Repeat, Plus, Flag, Trophy, X } from 'lucide-react';
const RING_COLORS = ['indigo', 'emerald', 'amber', 'blue', 'rose', 'purple'];
const statusLabels = {
    active: { label: 'Activa', className: 'bg-success/10 text-success border-success/20' },
    completed: { label: 'Completada', className: 'bg-success/10 text-success border-success/20' },
    paused: { label: 'En pausa', className: 'bg-warning/10 text-warning border-warning/20' },
    abandoned: { label: 'Abandonada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};
export function DestinoGoalCard({ goal, tasks, colorIndex, onToggleTask, onAddTask, onDeleteTask, onUpdateSystem, onDeleteGoal, }) {
    const [planOpen, setPlanOpen] = useState(false);
    const [systemOpen, setSystemOpen] = useState(!goal.daily_system);
    const [systemValue, setSystemValue] = useState(goal.daily_system || '');
    const [newItem, setNewItem] = useState('');
    const [deleting, setDeleting] = useState(false);
    const parsedWhy = goal.description?.match(/💡 ¿Por qué\?: (.*?)(?:\n|$)/)?.[1] || '';
    const systemText = goal.daily_system ||
        goal.description?.match(/🔄 Sistema diario: (.*?)(?:\n|$)/)?.[1] ||
        '';
    const completed = tasks.filter(t => t.completed).length;
    const progress = Math.min(goal.progress_percentage || 0, 100);
    const status = statusLabels[goal.status || 'active'];
    const handleSaveSystem = async () => {
        await onUpdateSystem(systemValue.trim());
        setSystemOpen(false);
    };
    const handleAddItem = async () => {
        const title = newItem.trim();
        if (!title)
            return;
        setNewItem('');
        await onAddTask(title);
    };
    const handleDeleteGoal = async () => {
        if (deleting)
            return;
        setDeleting(true);
        await onDeleteGoal();
    };
    return (_jsx(Card, { className: "overflow-hidden border-l-4 border-l-primary/40", children: _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold leading-snug", children: goal.title }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-1.5", children: [status && _jsx(Badge, { variant: "outline", className: status.className, children: status.label }), goal.target_date && (_jsxs(Badge, { variant: "outline", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })] })), tasks.length > 0 && (_jsxs(Badge, { variant: "outline", children: [_jsx(Flag, { className: "h-3 w-3 mr-1" }), completed, "/", tasks.length] }))] })] }), _jsx(ProgressRing, { progress: progress, size: 56, strokeWidth: 5, strokeColor: RING_COLORS[colorIndex % RING_COLORS.length], children: _jsxs("span", { className: "text-xs font-bold", children: [progress, "%"] }) })] }), _jsxs("div", { className: cn('p-3 rounded-lg border', systemText ? 'bg-success/5 border-success/20' : 'bg-muted/40 border-border/40'), children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("p", { className: "text-xs font-semibold text-success flex items-center gap-1", children: [_jsx(Repeat, { className: "h-3.5 w-3.5" }), "SISTEMA DIARIO"] }), systemText && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: () => { setSystemValue(systemText); setSystemOpen(true); }, children: "Editar" }))] }), systemOpen ? (_jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(Input, { value: systemValue, onChange: (e) => setSystemValue(e.target.value), placeholder: "Ej: 30 minutos diarios de pr\u00E1ctica", className: "h-8 text-sm", autoFocus: true, onKeyDown: (e) => { if (e.key === 'Enter')
                                        handleSaveSystem(); } }), _jsx(Button, { size: "sm", className: "h-8", onClick: handleSaveSystem, children: "Guardar" })] })) : systemText ? (_jsx("p", { className: "text-sm mt-1", children: systemText })) : (_jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 mt-1 px-2 text-xs text-muted-foreground", onClick: () => setSystemOpen(true), children: [_jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }), "Definir sistema diario"] }))] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsxs("span", { className: "font-medium flex items-center gap-1", children: [_jsx(Trophy, { className: "h-3.5 w-3.5" }), "Avance de la meta"] }), _jsxs("span", { children: [progress, "%"] })] }), _jsx(Progress, { value: progress, className: "h-2.5" })] }), parsedWhy && (_jsxs("p", { className: "text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5", children: [_jsx("span", { className: "font-medium text-foreground/80", children: "\uD83D\uDCA1 \u00BFPor qu\u00E9?: " }), parsedWhy] })), _jsxs("div", { className: "border rounded-lg overflow-hidden", children: [_jsxs("button", { onClick: () => setPlanOpen(v => !v), className: "w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/50 transition-colors", children: [planOpen ? _jsx(ChevronDown, { className: "h-4 w-4 shrink-0" }) : _jsx(ChevronRight, { className: "h-4 w-4 shrink-0" }), _jsx("span", { className: "text-sm font-medium flex-1", children: "Plan desglosado" }), tasks.length > 0 && (_jsxs(Badge, { variant: "secondary", className: cn(completed === tasks.length && 'bg-success/15 text-success'), children: [completed, "/", tasks.length] }))] }), planOpen && (_jsxs("div", { className: "border-t p-2.5 space-y-2", children: [tasks.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-1", children: "A\u00FAn no hay items en el plan" })), tasks.map(task => (_jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx(Checkbox, { checked: !!task.completed, onCheckedChange: () => onToggleTask(task), className: "data-[state=checked]:bg-success data-[state=checked]:border-success" }), _jsx("span", { className: cn('text-sm flex-1', task.completed && 'line-through text-muted-foreground'), children: task.title }), task.due_date && (_jsx("span", { className: "text-xs text-muted-foreground shrink-0", children: format(new Date(task.due_date), 'dd/MM') })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", onClick: () => onDeleteTask(task), children: _jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground" }) })] }, task.id))), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx(Input, { value: newItem, onChange: (e) => setNewItem(e.target.value), placeholder: "A\u00F1adir item al plan...", className: "h-8 text-sm", onKeyDown: (e) => { if (e.key === 'Enter')
                                                handleAddItem(); } }), _jsx(Button, { size: "sm", className: "h-8 shrink-0", onClick: handleAddItem, children: _jsx(Plus, { className: "h-4 w-4" }) })] })] }))] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-destructive", onClick: handleDeleteGoal, children: _jsx(Trash2, { className: "h-4 w-4" }) }) })] }) }));
}
