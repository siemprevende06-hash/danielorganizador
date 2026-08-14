import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
export function GoalContributions() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadGoalContributions();
    }, []);
    const loadGoalContributions = async () => {
        const today = new Date().toISOString().split('T')[0];
        const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
        // Load active goals
        const { data: goalsData } = await supabase
            .from('twelve_week_goals')
            .select('id, title, category, progress_percentage')
            .eq('quarter', quarter)
            .eq('year', 2026)
            .eq('status', 'active')
            .order('progress_percentage', { ascending: false })
            .limit(4);
        if (!goalsData) {
            setLoading(false);
            return;
        }
        // For each goal, count today's related tasks
        const goalsWithTasks = [];
        for (const goal of goalsData) {
            // Count tasks by category/area that match this goal
            const areaMapping = {
                'Universidad': 'university',
                'Emprendimiento': 'entrepreneurship',
                'Proyectos': 'projects',
                'Gym': 'gym',
                'Piano': 'piano',
                'Guitarra': 'guitar',
                'Lectura': 'reading'
            };
            const areaId = areaMapping[goal.category] || goal.category.toLowerCase();
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, completed')
                .eq('area_id', areaId)
                .gte('due_date', `${today}T00:00:00`)
                .lte('due_date', `${today}T23:59:59`);
            const todayTasks = tasks?.length || 0;
            const completedTodayTasks = tasks?.filter(t => t.completed).length || 0;
            if (todayTasks > 0 || goal.progress_percentage > 0) {
                goalsWithTasks.push({
                    id: goal.id,
                    title: goal.title,
                    category: goal.category,
                    progress: goal.progress_percentage || 0,
                    todayTasks,
                    completedTodayTasks
                });
            }
        }
        setGoals(goalsWithTasks);
        setLoading(false);
    };
    if (loading) {
        return _jsx("div", { className: "animate-pulse h-32 bg-muted rounded" });
    }
    if (goals.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: "bg-card rounded-lg border border-border p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "Contribuci\u00F3n a Metas" })] }), _jsxs(Link, { to: "/12-week-year", className: "text-xs text-muted-foreground hover:text-foreground flex items-center gap-1", children: ["Ver todas ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), _jsx("div", { className: "space-y-4", children: goals.map((goal) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: goal.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: goal.category })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [goal.todayTasks > 0 && (_jsxs("span", { className: "text-xs px-2 py-0.5 bg-success/20 text-success rounded", children: [goal.completedTodayTasks, "/", goal.todayTasks, " hoy"] })), _jsxs("span", { className: "text-sm font-mono font-medium", children: [goal.progress, "%"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: goal.progress, className: "h-1.5 flex-1" }), goal.progress > 50 && (_jsx(TrendingUp, { className: "w-3 h-3 text-success" }))] })] }, goal.id))) }), _jsx("div", { className: "mt-4 pt-3 border-t border-border text-center", children: _jsx("p", { className: "text-xs text-muted-foreground", children: "Cada tarea completada te acerca a tus metas trimestrales" }) })] }));
}
