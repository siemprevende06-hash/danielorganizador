import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Target, CheckSquare, Zap, Clock } from "lucide-react";
export function ObjectiveSummary({ blocksCompleted, blocksTotal, tasksCompleted, tasksTotal, habitsCompleted, habitsTotal, focusMinutes }) {
    const calculatePercentage = (completed, total) => {
        if (total === 0)
            return 0;
        return Math.round((completed / total) * 100);
    };
    const getPercentageColor = (percentage) => {
        if (percentage >= 80)
            return 'text-success';
        if (percentage >= 50)
            return 'text-foreground';
        return 'text-destructive';
    };
    const stats = [
        {
            icon: Target,
            label: 'Bloques completados',
            value: `${blocksCompleted}/${blocksTotal}`,
            percentage: calculatePercentage(blocksCompleted, blocksTotal)
        },
        {
            icon: CheckSquare,
            label: 'Tareas completadas',
            value: `${tasksCompleted}/${tasksTotal}`,
            percentage: calculatePercentage(tasksCompleted, tasksTotal)
        },
        {
            icon: Zap,
            label: 'Hábitos realizados',
            value: `${habitsCompleted}/${habitsTotal}`,
            percentage: calculatePercentage(habitsCompleted, habitsTotal)
        },
        {
            icon: Clock,
            label: 'Tiempo de foco',
            value: `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}min`,
            percentage: null
        }
    ];
    const overallPercentage = Math.round((calculatePercentage(blocksCompleted, blocksTotal) +
        calculatePercentage(tasksCompleted, tasksTotal) +
        calculatePercentage(habitsCompleted, habitsTotal)) / 3);
    return (_jsxs("div", { className: "bg-card rounded-lg border border-border p-6", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4", children: "Resumen Objetivo" }), _jsx("div", { className: "space-y-4", children: stats.map((stat, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-muted rounded", children: _jsx(stat.icon, { className: "w-4 h-4 text-muted-foreground" }) }), _jsx("span", { className: "text-foreground", children: stat.label })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono font-medium", children: stat.value }), stat.percentage !== null && (_jsxs("span", { className: `text-sm font-medium ${getPercentageColor(stat.percentage)}`, children: ["(", stat.percentage, "%)"] }))] })] }, index))) }), _jsx("div", { className: "mt-6 pt-4 border-t border-border", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Productividad General" }), _jsxs("span", { className: `text-2xl font-bold ${getPercentageColor(overallPercentage)}`, children: [overallPercentage, "%"] })] }) })] }));
}
