import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, XAxis, YAxis, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
export function GoalsTrendChart({ goals }) {
    // Generate mock weekly data based on goals - in real app this would come from weekly_plans
    const weeklyData = Array.from({ length: 12 }, (_, i) => {
        const weekNum = i + 1;
        const baseProgress = goals.length > 0
            ? goals.reduce((acc, g) => acc + (g.progress_percentage || 0), 0) / goals.length
            : 0;
        // Simulate progression through weeks
        const weekProgress = Math.min(100, Math.round((baseProgress / 12) * weekNum + Math.random() * 10));
        return {
            week: `S${weekNum}`,
            progreso: weekProgress,
            objetivo: Math.round((100 / 12) * weekNum),
        };
    });
    // Calculate if trending up or down
    const lastWeekProgress = weeklyData[weeklyData.length - 1]?.progreso || 0;
    const prevWeekProgress = weeklyData[weeklyData.length - 2]?.progreso || 0;
    const trend = lastWeekProgress - prevWeekProgress;
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-yellow-500";
    const chartConfig = {
        progreso: {
            label: "Progreso Real",
            color: "hsl(var(--primary))",
        },
        objetivo: {
            label: "Objetivo",
            color: "hsl(var(--muted-foreground))",
        },
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center justify-between text-lg", children: [_jsx("span", { children: "Tendencia de Metas" }), _jsxs("div", { className: `flex items-center gap-1 text-sm ${trendColor}`, children: [_jsx(TrendIcon, { className: "h-4 w-4" }), _jsxs("span", { children: [trend > 0 ? "+" : "", trend, "%"] })] })] }) }), _jsx(CardContent, { children: _jsx(ChartContainer, { config: chartConfig, className: "h-[200px] w-full", children: _jsxs(AreaChart, { data: weeklyData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "progressGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "hsl(var(--primary))", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "hsl(var(--primary))", stopOpacity: 0 })] }) }), _jsx(XAxis, { dataKey: "week", tickLine: false, axisLine: false, fontSize: 10 }), _jsx(YAxis, { tickLine: false, axisLine: false, fontSize: 10, domain: [0, 100] }), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, {}) }), _jsx(Area, { type: "monotone", dataKey: "progreso", stroke: "hsl(var(--primary))", fill: "url(#progressGradient)", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "objetivo", stroke: "hsl(var(--muted-foreground))", strokeDasharray: "5 5", strokeWidth: 1, dot: false })] }) }) })] }));
}
