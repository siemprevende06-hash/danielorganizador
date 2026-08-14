import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWeek } from "date-fns";
export function GoalDistanceIndicator({ goals }) {
    const now = new Date();
    const currentWeek = getWeek(now, { weekStartsOn: 1 });
    const weekInQuarter = ((currentWeek - 1) % 12) + 1;
    const expectedProgress = Math.round((weekInQuarter / 12) * 100);
    // Analyze each goal's status
    const goalAnalysis = goals.map(goal => {
        const progress = goal.progress_percentage || 0;
        const difference = progress - expectedProgress;
        const isAhead = difference > 5;
        const isBehind = difference < -10;
        const isOnTrack = !isAhead && !isBehind;
        return {
            id: goal.id,
            title: goal.title,
            category: goal.category,
            progress,
            expectedProgress,
            difference,
            status: isAhead ? 'ahead' : isBehind ? 'behind' : 'on-track',
        };
    });
    // Summary stats
    const aheadCount = goalAnalysis.filter(g => g.status === 'ahead').length;
    const behindCount = goalAnalysis.filter(g => g.status === 'behind').length;
    const onTrackCount = goalAnalysis.filter(g => g.status === 'on-track').length;
    // Overall status
    const overallProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length)
        : 0;
    const overallDifference = overallProgress - expectedProgress;
    const overallStatus = overallDifference > 5 ? 'ahead' : overallDifference < -10 ? 'behind' : 'on-track';
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), "\u00BFTe Acercas o Alejas?"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: cn("p-4 rounded-lg flex items-center gap-4", overallStatus === 'ahead' && "bg-green-500/10", overallStatus === 'behind' && "bg-red-500/10", overallStatus === 'on-track' && "bg-yellow-500/10"), children: [_jsxs("div", { className: cn("p-3 rounded-full", overallStatus === 'ahead' && "bg-green-500/20", overallStatus === 'behind' && "bg-red-500/20", overallStatus === 'on-track' && "bg-yellow-500/20"), children: [overallStatus === 'ahead' && _jsx(ArrowUp, { className: "h-6 w-6 text-green-500" }), overallStatus === 'behind' && _jsx(ArrowDown, { className: "h-6 w-6 text-red-500" }), overallStatus === 'on-track' && _jsx(CheckCircle2, { className: "h-6 w-6 text-yellow-500" })] }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "font-semibold", children: [overallStatus === 'ahead' && "¡Vas adelantado!", overallStatus === 'behind' && "Vas atrasado", overallStatus === 'on-track' && "Vas en camino"] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Progreso: ", overallProgress, "% | Esperado: ", expectedProgress, "%"] })] }), _jsxs("div", { className: cn("text-2xl font-bold", overallStatus === 'ahead' && "text-green-500", overallStatus === 'behind' && "text-red-500", overallStatus === 'on-track' && "text-yellow-500"), children: [overallDifference > 0 ? "+" : "", overallDifference, "%"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "p-2 rounded-lg bg-green-500/10", children: [_jsx("div", { className: "text-lg font-bold text-green-500", children: aheadCount }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Adelantadas" })] }), _jsxs("div", { className: "p-2 rounded-lg bg-yellow-500/10", children: [_jsx("div", { className: "text-lg font-bold text-yellow-500", children: onTrackCount }), _jsx("div", { className: "text-xs text-muted-foreground", children: "En camino" })] }), _jsxs("div", { className: "p-2 rounded-lg bg-red-500/10", children: [_jsx("div", { className: "text-lg font-bold text-red-500", children: behindCount }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Atrasadas" })] })] }), goalAnalysis.filter(g => g.status === 'behind').slice(0, 3).map(goal => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-lg bg-muted/50", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-red-500 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: goal.title }), _jsx(Progress, { value: goal.progress, className: "h-1.5 mt-1" })] }), _jsxs("div", { className: "text-xs text-red-500 font-medium", children: [goal.difference, "%"] })] }, goal.id)))] })] }));
}
