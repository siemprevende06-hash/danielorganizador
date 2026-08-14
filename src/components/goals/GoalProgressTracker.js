import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { useGoalProgress } from "@/hooks/useGoalProgress";
export function GoalProgressTracker() {
    const { goals, loading, fetchGoalBlocks, fetchGoalTasks } = useGoalProgress();
    const [activeGoals, setActiveGoals] = useState([]);
    const [goalDetails, setGoalDetails] = useState(new Map());
    useEffect(() => {
        const active = goals.filter(g => g.status === 'active');
        setActiveGoals(active);
        // Fetch details for each goal
        active.forEach(async (goal) => {
            const blocks = await fetchGoalBlocks(goal.id);
            const tasks = await fetchGoalTasks(goal.id);
            const completedTasks = tasks.filter(t => t.completed).length;
            setGoalDetails(prev => new Map(prev).set(goal.id, {
                blocks,
                totalTasks: tasks.length,
                completedTasks,
            }));
        });
    }, [goals]);
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardHeader, { children: _jsx(CardTitle, { children: "Cargando metas..." }) }) }));
    }
    if (activeGoals.length === 0) {
        return (_jsx(Card, { children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5" }), "Metas Activas"] }), _jsx(CardDescription, { children: "No tienes metas activas. Crea una meta para comenzar a trabajar en ella." })] }) }));
    }
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5" }), "\uD83C\uDFAF Metas Activas Hoy"] }), _jsx(CardDescription, { children: "Progreso de tus metas y bloques conectados" })] }), _jsx(CardContent, { className: "space-y-4", children: activeGoals.map((goal) => {
                    const details = goalDetails.get(goal.id);
                    const totalMinutes = details?.blocks.reduce((sum, b) => {
                        const duration = parseInt(b.block_name.match(/\d+/)?.[0] || '0');
                        return sum + duration;
                    }, 0) || 0;
                    return (_jsxs("div", { className: "space-y-3 p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h4", { className: "font-semibold flex items-center gap-2", children: [goal.title, _jsxs(Badge, { variant: "secondary", children: [goal.progress_percentage, "%"] })] }), goal.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: goal.description }))] }), goal.target_date && (_jsxs(Badge, { variant: "outline", className: "ml-2", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), new Date(goal.target_date).toLocaleDateString()] }))] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-2" }), details && (_jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }), _jsxs("span", { className: "text-muted-foreground", children: ["Tareas: ", details.completedTasks, "/", details.totalTasks] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-blue-500" }), _jsxs("span", { className: "text-muted-foreground", children: [totalMinutes, " min/d\u00EDa en bloques"] })] })] })), details && details.blocks.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1 pt-2 border-t", children: [_jsx("span", { className: "text-xs text-muted-foreground mr-1", children: "Bloques:" }), details.blocks.map((block) => (_jsx(Badge, { variant: "outline", className: "text-xs", children: block.block_name }, block.id)))] }))] }, goal.id));
                }) })] }));
}
