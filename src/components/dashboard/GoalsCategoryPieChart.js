import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Target } from "lucide-react";
const COLORS = {
    universidad: "hsl(217 91% 60%)",
    emprendimiento: "hsl(142 76% 36%)",
    gym: "hsl(25 95% 53%)",
    idiomas: "hsl(280 73% 60%)",
    proyectos: "hsl(340 82% 60%)",
};
export function GoalsCategoryPieChart({ goals }) {
    // Group and calculate completion by category
    const categoryData = Object.entries(goals.reduce((acc, goal) => {
        const cat = goal.category.toLowerCase();
        if (!acc[cat]) {
            acc[cat] = { total: 0, completed: 0 };
        }
        acc[cat].total++;
        if (goal.status === 'completed')
            acc[cat].completed++;
        return acc;
    }, {})).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: data.total,
        completed: data.completed,
        percentage: Math.round((data.completed / data.total) * 100) || 0,
    }));
    // If no goals, show placeholder data
    const chartData = categoryData.length > 0 ? categoryData : [
        { name: "Universidad", value: 3, completed: 1, percentage: 33 },
        { name: "Emprendimiento", value: 2, completed: 0, percentage: 0 },
        { name: "Gym", value: 2, completed: 1, percentage: 50 },
        { name: "Idiomas", value: 1, completed: 0, percentage: 0 },
        { name: "Proyectos", value: 4, completed: 2, percentage: 50 },
    ];
    const chartConfig = chartData.reduce((acc, item) => {
        acc[item.name.toLowerCase()] = {
            label: item.name,
            color: COLORS[item.name.toLowerCase()] || "hsl(var(--primary))",
        };
        return acc;
    }, {});
    const totalGoals = chartData.reduce((sum, d) => sum + d.value, 0);
    const completedGoals = chartData.reduce((sum, d) => sum + d.completed, 0);
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center justify-between text-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), _jsx("span", { children: "Metas por Categor\u00EDa" })] }), _jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [completedGoals, "/", totalGoals, " completadas"] })] }) }), _jsxs(CardContent, { children: [_jsx(ChartContainer, { config: chartConfig, className: "h-[200px] w-full", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 80, paddingAngle: 2, dataKey: "value", children: chartData.map((entry, index) => (_jsx(Cell, { fill: COLORS[entry.name.toLowerCase()] || `hsl(${index * 60}, 70%, 50%)` }, `cell-${index}`))) }), _jsx(ChartTooltip, { content: ({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (_jsxs("div", { className: "bg-background border rounded-lg p-2 shadow-lg", children: [_jsx("p", { className: "font-medium", children: data.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [data.completed, "/", data.value, " metas (", data.percentage, "%)"] })] }));
                                        }
                                        return null;
                                    } })] }) }), _jsx("div", { className: "flex flex-wrap justify-center gap-3 mt-2", children: chartData.map((entry) => (_jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: COLORS[entry.name.toLowerCase()] } }), _jsx("span", { children: entry.name })] }, entry.name))) })] })] }));
}
