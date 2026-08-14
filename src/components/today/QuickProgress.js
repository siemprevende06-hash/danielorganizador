import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Target } from "lucide-react";
import { Link } from "react-router-dom";
export function QuickProgress() {
    const [physicalGoal, setPhysicalGoal] = useState(null);
    const [topGoal, setTopGoal] = useState(null);
    useEffect(() => {
        loadProgress();
    }, []);
    const loadProgress = async () => {
        // Load physical goal
        const { data: goal } = await supabase
            .from('physical_goals')
            .select('start_weight, target_weight')
            .eq('is_active', true)
            .maybeSingle();
        const { data: latestMeasurement } = await supabase
            .from('physical_tracking')
            .select('weight')
            .order('measurement_date', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (goal) {
            setPhysicalGoal({
                startWeight: Number(goal.start_weight),
                targetWeight: Number(goal.target_weight),
                currentWeight: latestMeasurement ? Number(latestMeasurement.weight) : Number(goal.start_weight)
            });
        }
        // Load top quarter goal
        const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
        const { data: goals } = await supabase
            .from('twelve_week_goals')
            .select('title, progress_percentage, category')
            .eq('quarter', currentQuarter)
            .eq('year', 2026)
            .eq('status', 'active')
            .order('progress_percentage', { ascending: false })
            .limit(1);
        if (goals && goals.length > 0) {
            setTopGoal({
                title: goals[0].title,
                progress: goals[0].progress_percentage || 0,
                category: goals[0].category
            });
        }
    };
    const calculatePhysicalProgress = () => {
        if (!physicalGoal)
            return 0;
        const { startWeight, targetWeight, currentWeight } = physicalGoal;
        const totalChange = targetWeight - startWeight;
        const currentChange = currentWeight - startWeight;
        return Math.max(0, Math.min(100, (currentChange / totalChange) * 100));
    };
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Link, { to: "/vida-daniel", className: "block p-4 bg-card rounded-lg border border-border hover:border-foreground transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Dumbbell, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Transformaci\u00F3n F\u00EDsica" })] }), physicalGoal ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "font-mono text-lg", children: [physicalGoal.currentWeight, "kg"] }), _jsx("span", { className: "text-muted-foreground", children: "\u2192" }), _jsxs("span", { className: "font-mono text-lg font-bold", children: [physicalGoal.targetWeight, "kg"] })] }), _jsx(Progress, { value: calculatePhysicalProgress(), className: "h-2" }), _jsx("p", { className: "text-xs text-muted-foreground mt-2 text-center", children: physicalGoal.targetWeight - physicalGoal.currentWeight > 0
                                    ? `Faltan ${(physicalGoal.targetWeight - physicalGoal.currentWeight).toFixed(1)}kg`
                                    : '¡Meta alcanzada!' })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Configura tu meta f\u00EDsica" }))] }), _jsxs(Link, { to: "/12-week-year", className: "block p-4 bg-card rounded-lg border border-border hover:border-foreground transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Target, { className: "w-4 h-4 text-muted-foreground" }), _jsxs("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: ["Meta Principal Q", Math.ceil((new Date().getMonth() + 1) / 3)] })] }), topGoal ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-medium text-foreground mb-2 truncate", children: topGoal.title }), _jsx(Progress, { value: topGoal.progress, className: "h-2" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-2 text-center", children: [topGoal.progress, "% completado"] })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Sin metas activas" }))] })] }));
}
