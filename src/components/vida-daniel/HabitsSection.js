import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, CheckCircle2, XCircle, Flame, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react';
const TrendIcon = ({ trend }) => {
    switch (trend) {
        case 'up':
            return _jsx(TrendingUp, { className: "h-4 w-4 text-green-500" });
        case 'down':
            return _jsx(TrendingDown, { className: "h-4 w-4 text-red-500" });
        default:
            return _jsx(Minus, { className: "h-4 w-4 text-muted-foreground" });
    }
};
export const HabitsSection = ({ stats }) => {
    // Add routine habits
    const allHabits = [
        {
            id: 'rutina-activacion',
            name: '🌅 Rutina Activación',
            completedToday: stats.routines.activation.completedToday,
            currentStreak: stats.routines.activation.streak,
            monthlyCompletion: stats.routines.activation.monthlyCompletion,
            trend: stats.routines.activation.monthlyCompletion > 70 ? 'up' : 'stable'
        },
        {
            id: 'rutina-desactivacion',
            name: '🌙 Rutina Desactivación',
            completedToday: stats.routines.deactivation.completedToday,
            currentStreak: stats.routines.deactivation.streak,
            monthlyCompletion: stats.routines.deactivation.monthlyCompletion,
            trend: stats.routines.deactivation.monthlyCompletion > 70 ? 'up' : 'stable'
        },
        ...stats.habits
    ];
    const habitScore = allHabits.length > 0
        ? Math.round(allHabits.reduce((acc, h) => acc + h.monthlyCompletion, 0) / allHabits.length / 10) / 10 * 10
        : 0;
    const bestStreak = allHabits.reduce((best, h) => h.currentStreak > best.streak ? { name: h.name, streak: h.currentStreak } : best, { name: '', streak: 0 });
    const needsAttention = allHabits.filter(h => h.monthlyCompletion < 50);
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10", children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CheckSquare, { className: "h-5 w-5 text-yellow-500" }), "H\u00E1bitos Buenos"] }) }), _jsxs(CardContent, { className: "pt-6", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2 px-3 text-sm font-medium text-muted-foreground", children: "H\u00E1bito" }), _jsx("th", { className: "text-center py-2 px-3 text-sm font-medium text-muted-foreground", children: "Hoy" }), _jsx("th", { className: "text-center py-2 px-3 text-sm font-medium text-muted-foreground", children: "Racha" }), _jsx("th", { className: "text-center py-2 px-3 text-sm font-medium text-muted-foreground", children: "Este Mes" }), _jsx("th", { className: "text-center py-2 px-3 text-sm font-medium text-muted-foreground", children: "Tendencia" })] }) }), _jsx("tbody", { children: allHabits.map((habit) => (_jsxs("tr", { className: "border-b hover:bg-muted/50", children: [_jsx("td", { className: "py-3 px-3", children: _jsx("span", { className: "font-medium", children: habit.name }) }), _jsx("td", { className: "text-center py-3 px-3", children: habit.completedToday ? (_jsx(CheckCircle2, { className: "h-5 w-5 text-green-500 mx-auto" })) : (_jsx(XCircle, { className: "h-5 w-5 text-red-500 mx-auto" })) }), _jsx("td", { className: "text-center py-3 px-3", children: habit.currentStreak > 0 ? (_jsxs("div", { className: "flex items-center justify-center gap-1 text-orange-500", children: [_jsx(Flame, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: habit.currentStreak })] })) : (_jsx("span", { className: "text-muted-foreground", children: "0" })) }), _jsx("td", { className: "text-center py-3 px-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: habit.monthlyCompletion, className: "h-2 w-16" }), _jsxs("span", { className: "text-sm", children: [habit.monthlyCompletion, "%"] })] }) }), _jsx("td", { className: "text-center py-3 px-3", children: _jsx(TrendIcon, { trend: habit.trend }) })] }, habit.id))) })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t", children: [_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50", children: [_jsx("div", { className: "p-2 rounded-full bg-primary/10", children: _jsx(CheckSquare, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Puntuaci\u00F3n de H\u00E1bitos" }), _jsxs("p", { className: "text-xl font-bold", children: [habitScore.toFixed(1), "/10"] })] })] }), bestStreak.streak > 0 && (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50", children: [_jsx("div", { className: "p-2 rounded-full bg-yellow-500/10", children: _jsx(Trophy, { className: "h-5 w-5 text-yellow-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Mejor Racha" }), _jsx("p", { className: "text-sm font-medium", children: bestStreak.name }), _jsxs("p", { className: "text-lg font-bold text-orange-500", children: [bestStreak.streak, " d\u00EDas"] })] })] })), needsAttention.length > 0 && (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-red-500/10", children: [_jsx("div", { className: "p-2 rounded-full bg-red-500/20", children: _jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Necesita Atenci\u00F3n" }), _jsx("p", { className: "text-sm font-medium", children: needsAttention.map(h => h.name).join(', ') })] })] }))] })] })] }));
};
