import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckSquare, Blocks, Zap } from "lucide-react";
export function ProductivityMetrics({ routineBlocks = [], tasks = [] }) {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    // Calculate metrics
    const completedBlocksToday = routineBlocks.filter(b => b.weeklyCompletion[dayIndex]).length;
    const totalBlocksToday = routineBlocks.length || 10;
    const blocksPercentage = Math.round((completedBlocksToday / totalBlocksToday) * 100);
    // Estimate deep work hours (assume 1.5h per completed block)
    const deepWorkHours = (completedBlocksToday * 1.5).toFixed(1);
    const targetDeepWorkHours = 8;
    const deepWorkPercentage = Math.min(100, Math.round((parseFloat(deepWorkHours) / targetDeepWorkHours) * 100));
    // Task stats
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length || 1;
    const taskPercentage = Math.round((completedTasks / totalTasks) * 100);
    // Energy score based on effort levels
    const maxEffortBlocks = routineBlocks.filter(b => b.effortLevel === 'maximum').length;
    const normalEffortBlocks = routineBlocks.filter(b => b.effortLevel === 'normal').length;
    const energyScore = Math.min(100, (maxEffortBlocks * 15 + normalEffortBlocks * 10 + completedBlocksToday * 5));
    const metrics = [
        {
            icon: Clock,
            label: "Trabajo Profundo",
            value: `${deepWorkHours}h`,
            target: `${targetDeepWorkHours}h`,
            percentage: deepWorkPercentage,
            color: "text-blue-500",
            bgColor: "bg-blue-500",
        },
        {
            icon: Blocks,
            label: "Bloques Completados",
            value: completedBlocksToday.toString(),
            target: totalBlocksToday.toString(),
            percentage: blocksPercentage,
            color: "text-green-500",
            bgColor: "bg-green-500",
        },
        {
            icon: CheckSquare,
            label: "Tareas del Día",
            value: completedTasks.toString(),
            target: totalTasks.toString(),
            percentage: taskPercentage,
            color: "text-purple-500",
            bgColor: "bg-purple-500",
        },
        {
            icon: Zap,
            label: "Energía",
            value: `${energyScore}`,
            target: "100",
            percentage: energyScore,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500",
        },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg", children: "M\u00E9tricas de Productividad" }) }), _jsx(CardContent, { className: "space-y-4", children: metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: `h-4 w-4 ${metric.color}` }), _jsx("span", { className: "text-sm", children: metric.label })] }), _jsxs("span", { className: "text-sm font-medium", children: [metric.value, "/", metric.target] })] }), _jsx(Progress, { value: metric.percentage, className: "h-2", style: {
                                    // @ts-ignore - custom property for indicator color
                                    "--progress-foreground": metric.bgColor.replace("bg-", ""),
                                } })] }, metric.label));
                }) })] }));
}
