import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Plus, Dumbbell } from 'lucide-react';
export const ExerciseProgressCard = ({ progress, onLogClick }) => {
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up':
                return _jsx(TrendingUp, { className: "h-4 w-4 text-green-500" });
            case 'down':
                return _jsx(TrendingDown, { className: "h-4 w-4 text-red-500" });
            default:
                return _jsx(Minus, { className: "h-4 w-4 text-muted-foreground" });
        }
    };
    const getTrendColor = (trend) => {
        switch (trend) {
            case 'up':
                return 'text-green-500';
            case 'down':
                return 'text-red-500';
            default:
                return 'text-muted-foreground';
        }
    };
    if (progress.length === 0) {
        return (_jsx(Card, { className: "border-dashed border-2 border-muted-foreground/30", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-8 gap-4", children: [_jsx(TrendingUp, { className: "h-12 w-12 text-muted-foreground/50" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Sin registros de progreso" }), _jsx("p", { className: "text-sm text-muted-foreground/70", children: "Registra tus entrenamientos para ver tu evoluci\u00F3n" })] }), _jsxs(Button, { onClick: onLogClick, className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Registrar Entrenamiento"] })] }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-green-500" }), "Progreso de Fuerza"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: onLogClick, className: "gap-1", children: [_jsx(Plus, { className: "h-3 w-3" }), "Registrar"] })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-3", children: progress.slice(0, 6).map((p) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Dumbbell, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: p.exercise.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: p.exercise.muscle_group || 'Sin grupo' })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: [p.initialWeight, "kg"] }), _jsx("span", { className: "mx-1", children: "\u2192" }), _jsxs("span", { className: "font-medium", children: [p.currentWeight, "kg"] })] }), _jsxs("p", { className: `text-xs ${getTrendColor(p.trend)}`, children: [p.changePercent > 0 ? '+' : '', p.changePercent, "%"] })] }), getTrendIcon(p.trend)] })] }, p.exercise.id))) }), progress.length > 6 && (_jsxs("p", { className: "text-xs text-muted-foreground text-center mt-3", children: ["Y ", progress.length - 6, " ejercicios m\u00E1s..."] }))] })] }));
};
