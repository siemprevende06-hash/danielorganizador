import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes } from "date-fns";
import { Zap, Target, Coffee, Brain, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { useRoutineBlocks } from "@/hooks/useRoutineBlocks";
export function ProductivityMeter() {
    const [stats, setStats] = useState({
        energyLevel: 70,
        energyLabel: "Alta",
        productivity: 0,
        productivityGrade: "B",
        criticalTasks: 0,
        nextBreakMinutes: 45,
        focusScore: 0,
        blocksCompleted: 0,
        blocksTotal: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const { blocks } = useRoutineBlocks();
    useEffect(() => {
        loadProductivityStats();
    }, [blocks]);
    const loadProductivityStats = async () => {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const today = format(now, "yyyy-MM-dd");
            // Calculate energy based on time of day
            let energyLevel;
            let energyLabel;
            if (currentHour >= 5 && currentHour < 10) {
                energyLevel = 95;
                energyLabel = "Máxima";
            }
            else if (currentHour >= 10 && currentHour < 14) {
                energyLevel = 80;
                energyLabel = "Alta";
            }
            else if (currentHour >= 14 && currentHour < 16) {
                energyLevel = 55;
                energyLabel = "Media";
            }
            else if (currentHour >= 16 && currentHour < 19) {
                energyLevel = 70;
                energyLabel = "Media-Alta";
            }
            else {
                energyLevel = 40;
                energyLabel = "Baja";
            }
            // Get today's tasks stats
            const { data: todayTasks } = await supabase
                .from("tasks")
                .select("completed, priority")
                .gte("due_date", `${today}T00:00:00`)
                .lt("due_date", `${today}T23:59:59`);
            const completedCount = (todayTasks || []).filter(t => t.completed).length;
            const totalCount = (todayTasks || []).length;
            const criticalTasks = (todayTasks || []).filter(t => t.priority === "high" && !t.completed).length;
            // Calculate productivity percentage
            const productivity = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            // Calculate productivity grade
            let productivityGrade;
            if (productivity >= 90)
                productivityGrade = "A+";
            else if (productivity >= 80)
                productivityGrade = "A";
            else if (productivity >= 70)
                productivityGrade = "B";
            else if (productivity >= 60)
                productivityGrade = "C";
            else if (productivity >= 50)
                productivityGrade = "D";
            else
                productivityGrade = "F";
            // Calculate next break time
            const currentTimeStr = format(now, "HH:mm");
            const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
            let nextBreakMinutes = 45; // Default
            for (let i = 0; i < sortedBlocks.length; i++) {
                const block = sortedBlocks[i];
                if (currentTimeStr >= block.startTime && currentTimeStr < block.endTime) {
                    // We're in this block, calculate time until it ends
                    const [endH, endM] = block.endTime.split(':').map(Number);
                    const endDate = new Date(now);
                    endDate.setHours(endH, endM, 0);
                    nextBreakMinutes = Math.max(0, differenceInMinutes(endDate, now));
                    break;
                }
            }
            // Calculate blocks completed today
            const { count: blocksCompletedCount } = await supabase
                .from("routine_completions")
                .select("*", { count: "exact", head: true })
                .eq("completion_date", today)
                .eq("routine_type", "block");
            // Calculate focus score based on deep work blocks completed
            const deepWorkBlocks = blocks.filter(b => b.title.toLowerCase().includes("deep work") ||
                b.title.toLowerCase().includes("focus"));
            const focusScore = deepWorkBlocks.length > 0
                ? Math.round(((blocksCompletedCount || 0) / deepWorkBlocks.length) * 100)
                : 0;
            setStats({
                energyLevel,
                energyLabel,
                productivity,
                productivityGrade,
                criticalTasks,
                nextBreakMinutes,
                focusScore: Math.min(focusScore, 100),
                blocksCompleted: blocksCompletedCount || 0,
                blocksTotal: blocks.length,
            });
        }
        catch (error) {
            console.error("Error loading productivity stats:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const getEnergyIcon = () => {
        if (stats.energyLevel >= 80)
            return _jsx(BatteryFull, { className: "w-5 h-5 text-green-500" });
        if (stats.energyLevel >= 50)
            return _jsx(BatteryMedium, { className: "w-5 h-5 text-yellow-500" });
        return _jsx(BatteryLow, { className: "w-5 h-5 text-red-500" });
    };
    const getEnergyColor = () => {
        if (stats.energyLevel >= 80)
            return "bg-green-500";
        if (stats.energyLevel >= 50)
            return "bg-yellow-500";
        return "bg-red-500";
    };
    if (isLoading) {
        return (_jsx(Card, { className: "animate-pulse", children: _jsx(CardContent, { className: "h-32 p-4" }) }));
    }
    return (_jsx(Card, { className: "bg-gradient-to-br from-background to-muted/30", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [getEnergyIcon(), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Energ\u00EDa" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-baseline gap-1", children: [_jsxs("span", { className: "text-2xl font-bold", children: [stats.energyLevel, "%"] }), _jsx("span", { className: "text-xs text-muted-foreground", children: stats.energyLabel })] }), _jsx(Progress, { value: stats.energyLevel, className: `h-1.5 ${getEnergyColor()}` })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Productividad" })] }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("span", { className: "text-2xl font-bold", children: stats.productivityGrade }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["(", stats.productivity, "%)"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-5 h-5 text-destructive" }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Cr\u00EDticas" })] }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-2xl font-bold", children: stats.criticalTasks }), _jsx("span", { className: "text-xs text-muted-foreground", children: "pendientes" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Coffee, { className: "w-5 h-5 text-orange-500" }), _jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Pr\u00F3x. Pausa" })] }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-2xl font-bold", children: stats.nextBreakMinutes }), _jsx("span", { className: "text-xs text-muted-foreground", children: "min" })] })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-border/50", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-yellow-500" }), _jsx("span", { className: "text-xs font-medium", children: "Focus Score" })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [stats.blocksCompleted, "/", stats.blocksTotal, " bloques"] })] }), _jsx(Progress, { value: stats.focusScore, className: "h-2" })] })] }) }));
}
