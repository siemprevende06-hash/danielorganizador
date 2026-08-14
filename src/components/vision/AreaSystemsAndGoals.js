import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
const HABITS_BY_PB_AREA = {
    salud: [
        { id: 'alistamiento-desayuno', name: 'Alistamiento y Desayuno' },
        { id: 'horario-regular', name: 'Horario Regular' },
        { id: 'pre-entreno', name: 'Pre-entreno' },
        { id: 'desayuno', name: 'Desayuno' },
        { id: 'entrenamiento-fisico', name: 'Ejercicio' },
        { id: 'almuerzo', name: 'Almuerzo' },
        { id: 'comida', name: 'Comida' },
        { id: 'antes-dormir', name: 'Antes de dormir' },
    ],
    'fuerza-mental': [
        { id: 'rutina-activacion', name: 'Rutina Activación' },
        { id: 'rutina-desactivacion', name: 'Rutina Desactivación' },
    ],
    apariencia: [
        { id: 'skincare-manana', name: 'Skin Care Mañana' },
        { id: 'skincare-noche', name: 'Skin Care Noche' },
        { id: 'banarme-vestirme', name: 'Bañarme y Vestirme' },
    ],
    desarrollo: [
        { id: 'lectura', name: 'Lectura', hasTime: true },
        { id: 'musica', name: 'Música', hasTime: true },
        { id: 'ajedrez', name: 'Ajedrez', hasTime: true, hasCount: true, countLabel: 'partidas' },
    ],
    profesional: [
        { id: 'universidad', name: 'Universidad', hasTime: true },
        { id: 'emprendimiento', name: 'Emprendimiento', hasTime: true },
        { id: 'proyectos', name: 'Proyectos', hasTime: true },
    ],
    amor: [
        { id: 'game', name: 'Game (Seducción)', hasTime: true },
    ],
};
const AREAS_WITH_GOALS = ['desarrollo', 'profesional'];
export function AreaSystemsAndGoals({ pbAreaId, areaName, areaIcon, completions, timeData, countData, metrics, onToggleCompletion, onSetTimeValue, onSetCountValue, onAddMetric, onEditMetric, onDeleteMetric, }) {
    const habits = HABITS_BY_PB_AREA[pbAreaId] || [];
    const hasGoals = AREAS_WITH_GOALS.includes(pbAreaId);
    const showSystems = habits.length > 0;
    if (!showSystems && !hasGoals)
        return null;
    return (_jsxs("div", { className: "space-y-2 pt-2", children: [_jsx("div", { className: "h-px bg-border/50" }), showSystems && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "flex items-center gap-1.5", children: _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "\u2699\uFE0F Sistema" }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-1", children: habits.map(habit => {
                            const done = completions[habit.id] || false;
                            const timeVal = timeData[habit.id] || 0;
                            const countVal = countData[habit.id] || 0;
                            return (_jsxs("div", { className: cn('group flex items-center gap-2 py-1 px-2 rounded-md transition-colors', done ? 'bg-green-500/5' : 'hover:bg-muted/30'), children: [_jsx("button", { onClick: () => onToggleCompletion(habit.id), className: cn('w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors', done ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30 hover:border-muted-foreground/60'), children: done && _jsx(Check, { className: "h-3 w-3" }) }), _jsx("span", { className: cn('text-xs flex-1 truncate', done && 'line-through text-muted-foreground/60'), children: habit.name }), habit.hasTime && (_jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx(Clock, { className: "h-3 w-3 text-muted-foreground/50" }), _jsx(Input, { type: "number", min: 0, value: timeVal || '', onChange: e => onSetTimeValue(habit.id, parseInt(e.target.value) || 0), placeholder: "min", className: "h-6 w-14 text-[10px] text-center px-1" })] })), habit.hasCount && (_jsx(Input, { type: "number", min: 0, value: countVal || '', onChange: e => onSetCountValue(habit.id, parseInt(e.target.value) || 0), placeholder: "0", className: "h-6 w-12 text-[10px] text-center px-1" }))] }, habit.id));
                        }) })] })), hasGoals && metrics.length > 0 && (_jsxs("div", { className: "space-y-1.5 pt-1", children: [_jsx("div", { className: "flex items-center gap-1.5", children: _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "\uD83D\uDCCA Metas" }) }), _jsx("div", { className: "space-y-1", children: metrics.map(metric => {
                            const pct = metric.target_value > 0
                                ? Math.min(100, Math.round((metric.current_value / metric.target_value) * 100))
                                : 0;
                            const getColor = (v) => v >= 80 ? 'text-green-500' : v >= 40 ? 'text-amber-500' : 'text-red-500';
                            const getBarColor = (v) => v >= 80 ? 'bg-green-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
                            return (_jsxs("div", { className: "group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-xs font-medium truncate", children: metric.metric_name }), _jsxs("span", { className: cn('text-xs font-bold shrink-0', getColor(pct)), children: [metric.current_value, "/", metric.target_value, _jsx("span", { className: "text-[10px] text-muted-foreground font-normal ml-0.5", children: metric.unit })] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden mt-1", children: _jsx("div", { className: cn('h-full rounded-full transition-all duration-500', getBarColor(pct)), style: { width: `${pct}%` } }) }), _jsxs("span", { className: cn('text-[10px] font-medium', getColor(pct)), children: [pct, "%"] })] }), _jsxs("div", { className: "flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => onEditMetric(metric), className: "h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded", children: _jsx(Pencil, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => onDeleteMetric(metric.id), className: "h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive rounded", children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }, metric.id));
                        }) })] })), hasGoals && (_jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground w-full", onClick: onAddMetric, children: [_jsx(Plus, { className: "h-3 w-3" }), " Agregar meta"] }))] }));
}
