import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Zap, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
export function DayProgressHeader({ blocksTotal, blocksCompleted, tasksTotal, tasksCompleted, dayScore, currentBlockName, currentBlockProgress = 0, loading, }) {
    const totalItems = blocksTotal + tasksTotal;
    const completedItems = blocksCompleted + tasksCompleted;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const scoreColor = dayScore >= 80 ? 'text-green-500' : dayScore >= 60 ? 'text-yellow-500' : dayScore >= 40 ? 'text-orange-500' : 'text-red-500';
    const scoreEmoji = dayScore >= 80 ? '🔥' : dayScore >= 60 ? '💪' : dayScore >= 40 ? '📈' : '⚡';
    if (loading) {
        return (_jsx(Card, { className: "p-4", children: _jsx("div", { className: "animate-pulse flex items-center justify-center h-16", children: _jsx("div", { className: "animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" }) }) }));
    }
    return (_jsx(Card, { className: "overflow-hidden", children: _jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: cn("text-2xl font-bold", scoreColor), children: [dayScore, " ", _jsx("span", { className: "text-lg", children: scoreEmoji })] }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Score del d\u00EDa" })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs(Badge, { variant: "outline", className: "gap-1 text-xs", children: [_jsx(Clock, { className: "h-3 w-3" }), blocksCompleted, "/", blocksTotal, " bloques"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 text-xs", children: [_jsx(ListTodo, { className: "h-3 w-3" }), tasksCompleted, "/", tasksTotal, " tareas"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 text-xs", children: [_jsx(Target, { className: "h-3 w-3" }), overallProgress, "%"] })] })] }), _jsx(Progress, { value: overallProgress, className: "h-2" }), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: [completedItems, " de ", totalItems, " completado"] }), currentBlockName && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Zap, { className: "h-3 w-3 text-primary" }), "Ahora: ", currentBlockName] }))] })] }) }));
}
