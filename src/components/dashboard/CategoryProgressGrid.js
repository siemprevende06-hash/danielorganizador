import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, GraduationCap, Briefcase, Dumbbell, Languages, FolderKanban } from "lucide-react";
const categoryConfig = {
    universidad: { icon: GraduationCap, color: "text-blue-500", label: "Universidad" },
    emprendimiento: { icon: Briefcase, color: "text-green-500", label: "Emprendimiento" },
    gym: { icon: Dumbbell, color: "text-orange-500", label: "Gym" },
    idiomas: { icon: Languages, color: "text-purple-500", label: "Idiomas" },
    proyectos: { icon: FolderKanban, color: "text-pink-500", label: "Proyectos" },
};
export function CategoryProgressGrid({ goals }) {
    // Group goals by category
    const categorizedGoals = goals.reduce((acc, goal) => {
        const cat = goal.category.toLowerCase();
        if (!acc[cat])
            acc[cat] = [];
        acc[cat].push(goal);
        return acc;
    }, {});
    // Calculate stats per category
    const categoryStats = Object.entries(categoryConfig).map(([key, config]) => {
        const catGoals = categorizedGoals[key] || [];
        const avgProgress = catGoals.length > 0
            ? Math.round(catGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / catGoals.length)
            : 0;
        // Mock trend - in real app would compare with previous week
        const trend = Math.floor(Math.random() * 20) - 5;
        return {
            ...config,
            key,
            goalCount: catGoals.length,
            avgProgress,
            trend,
            activeGoals: catGoals.filter(g => g.status === 'active').length,
        };
    });
    return (_jsx("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", children: categoryStats.map((cat) => {
            const Icon = cat.icon;
            const TrendIcon = cat.trend > 0 ? TrendingUp : cat.trend < 0 ? TrendingDown : Minus;
            const trendColor = cat.trend > 0 ? "text-green-500" : cat.trend < 0 ? "text-red-500" : "text-yellow-500";
            return (_jsxs(Card, { className: "relative overflow-hidden", children: [_jsx("div", { className: `absolute top-0 left-0 w-1 h-full ${cat.color.replace('text-', 'bg-')}` }), _jsx(CardHeader, { className: "pb-2 pl-5", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-sm", children: [_jsx(Icon, { className: `h-4 w-4 ${cat.color}` }), cat.label] }) }), _jsxs(CardContent, { className: "pl-5 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-2xl font-bold", children: [cat.avgProgress, "%"] }), _jsxs("div", { className: `flex items-center gap-1 text-xs ${trendColor}`, children: [_jsx(TrendIcon, { className: "h-3 w-3" }), _jsxs("span", { children: [cat.trend > 0 ? "+" : "", cat.trend, "%"] })] })] }), _jsx(Progress, { value: cat.avgProgress, className: "h-2" }), _jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: [cat.activeGoals, " activas"] }), _jsxs("span", { children: [cat.goalCount, " metas"] })] })] })] }, cat.key));
        }) }));
}
