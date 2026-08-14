import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
const AREA_COLORS = {
    universidad: 'border-blue-500/30 bg-blue-500/5',
    emprendimiento: 'border-purple-500/30 bg-purple-500/5',
    proyectos: 'border-cyan-500/30 bg-cyan-500/5',
};
const AREA_ICONS = {
    universidad: '🎓',
    emprendimiento: '💼',
    proyectos: '🚀',
};
export function FocoObjectiveCard({ objective, onUpdate }) {
    const progress = objective.target_value > 0
        ? Math.min(100, Math.round((objective.current_value / objective.target_value) * 100))
        : 0;
    const isCompleted = objective.status === 'completed';
    const areaColor = AREA_COLORS[objective.area] || 'border-muted bg-muted/10';
    return (_jsxs(Card, { className: cn("p-4 border-2 transition-all", areaColor, isCompleted && "opacity-60"), children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: AREA_ICONS[objective.area] || '🎯' }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-sm", children: objective.title }), _jsx("p", { className: "text-[10px] text-muted-foreground capitalize", children: objective.area })] })] }), _jsx(Badge, { variant: isCompleted ? "default" : "outline", className: "text-[10px]", children: isCompleted ? 'Completado ✓' : `${objective.current_value}/${objective.target_value} ${objective.unit}` })] }), _jsx(Progress, { value: progress, className: "h-2.5" }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("span", { className: cn("text-xs font-medium", progress >= 100 ? "text-green-600" : "text-muted-foreground"), children: [progress, "% completo"] }), !isCompleted && onUpdate && (_jsx("div", { className: "flex gap-1", children: [25, 50, 75, 100].map(pct => {
                            const val = Math.round((objective.target_value * pct) / 100);
                            return (_jsxs(Button, { size: "sm", variant: "ghost", className: cn("h-6 px-1.5 text-[10px]", objective.current_value >= val && "text-primary font-bold"), onClick: () => onUpdate({ current_value: val, status: pct >= 100 ? 'completed' : 'in_progress' }), children: [pct, "%"] }, pct));
                        }) })), isCompleted && _jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" })] }), objective.description && (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: objective.description }))] }));
}
