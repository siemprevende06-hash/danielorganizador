import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
export function PointBMetricCard({ metric, onEdit }) {
    const progress = metric.target_value > 0
        ? Math.min(100, Math.round((metric.current_value / metric.target_value) * 100))
        : 0;
    const getColor = (pct) => {
        if (pct >= 80)
            return 'text-green-500';
        if (pct >= 40)
            return 'text-amber-500';
        return 'text-red-500';
    };
    const getBarColor = (pct) => {
        if (pct >= 80)
            return 'bg-green-500';
        if (pct >= 40)
            return 'bg-amber-500';
        return 'bg-red-500';
    };
    return (_jsxs(Card, { className: "p-4 border-2 border-primary/10 hover:border-primary/30 transition-all", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: metric.icon || '🎯' }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-sm capitalize", children: metric.area }), _jsx("p", { className: "text-xs text-muted-foreground", children: metric.metric_name })] })] }), onEdit && (_jsx(Button, { size: "sm", variant: "ghost", className: "h-7 w-7 p-0", onClick: onEdit, children: _jsx(Pencil, { className: "h-3 w-3" }) }))] }), _jsxs("div", { className: "flex items-baseline justify-center gap-2 my-3", children: [_jsx("span", { className: cn("text-3xl font-bold", getColor(progress)), children: metric.current_value }), _jsxs("span", { className: "text-lg text-muted-foreground", children: ["/ ", metric.target_value] }), _jsx("span", { className: "text-xs text-muted-foreground", children: metric.unit })] }), _jsx("div", { className: "h-3 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full transition-all duration-700 rounded-full", getBarColor(progress)), style: { width: `${progress}%` } }) }), _jsxs("p", { className: cn("text-right text-xs mt-1 font-medium", getColor(progress)), children: [progress, "% \u2014 ", progress >= 100 ? 'Meta alcanzada 🎉' : progress >= 80 ? 'Cerca de la meta' : progress >= 40 ? 'Avanzando' : 'Empezando'] })] }));
}
