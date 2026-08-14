import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { useGoalPredictions } from "@/hooks/useGoalPredictions";
import { Skeleton } from "@/components/ui/skeleton";
export function GoalPredictions() {
    const { predictions, loading } = useGoalPredictions();
    if (loading)
        return _jsx(Skeleton, { className: "h-48 w-full" });
    if (!predictions.length)
        return null;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4 text-primary" }), "Predicci\u00F3n de Metas"] }) }), _jsx(CardContent, { className: "space-y-3", children: predictions.slice(0, 5).map(p => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-medium truncate max-w-[60%]", children: p.title }), _jsxs("div", { className: "flex items-center gap-1", children: [p.onTrack ? (_jsx(TrendingUp, { className: "w-3 h-3 text-green-500" })) : (_jsx(TrendingDown, { className: "w-3 h-3 text-red-500" })), _jsx("span", { className: p.onTrack ? 'text-green-500' : 'text-red-500', children: p.predictedDaysToComplete ? `${p.predictedDaysToComplete}d` : '∞' })] })] }), _jsx(Progress, { value: p.currentProgress, className: "h-1.5" }), _jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground", children: [_jsxs("span", { children: [p.currentProgress, "% \u00B7 ", p.dailyRate, "%/d\u00EDa"] }), _jsx("span", { children: p.predictedDate ? `Est: ${p.predictedDate}` : 'Sin ritmo' })] })] }, p.id))) })] }));
}
