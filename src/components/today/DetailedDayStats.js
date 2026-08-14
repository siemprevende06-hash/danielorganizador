import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Target, Flame, Clock, TrendingUp, Calendar } from "lucide-react";
export function DetailedDayStats() {
    const [stats, setStats] = useState({
        quarterlyGoals: [],
        gymStreak: 0,
        studyHoursToday: 0,
        currentWeek: 1,
        daysInQuarter: 84,
        daysRemainingInQuarter: 84,
    });
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadDetailedStats();
    }, []);
    const loadDetailedStats = async () => {
        try {
            // Get current quarter info
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentQuarter = Math.floor(currentMonth / 3) + 1;
            const quarterStartMonth = (currentQuarter - 1) * 3;
            const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
            const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
            const daysInQuarter = 84; // 12 weeks
            const daysSinceStart = differenceInDays(now, quarterStart);
            const currentWeek = Math.min(12, Math.ceil((daysSinceStart + 1) / 7));
            const daysRemainingInQuarter = Math.max(0, daysInQuarter - daysSinceStart);
            // Get quarterly goals
            const { data: goals } = await supabase
                .from("twelve_week_goals")
                .select("*")
                .eq("quarter", currentQuarter)
                .eq("year", now.getFullYear())
                .eq("status", "active");
            const quarterlyGoals = (goals || []).map(goal => {
                // Use quarter end date since target_value is a text metric, not a date
                const targetDate = quarterEnd;
                return {
                    id: goal.id,
                    title: goal.title,
                    category: goal.category,
                    progress: goal.progress_percentage || 0,
                    targetDate: format(targetDate, "d MMM", { locale: es }),
                    daysRemaining: differenceInDays(targetDate, now),
                };
            });
            // Calculate gym streak
            let gymStreak = 0;
            const { data: habitHistory } = await supabase
                .from("habit_history")
                .select("completed_dates")
                .eq("habit_id", "gym");
            if (habitHistory && habitHistory[0]?.completed_dates) {
                const dates = habitHistory[0].completed_dates
                    .map(d => d.date)
                    .sort((a, b) => b.localeCompare(a));
                const today = format(now, "yyyy-MM-dd");
                let checkDate = today;
                for (const date of dates) {
                    if (date === checkDate) {
                        gymStreak++;
                        // Move to previous day
                        const prevDate = new Date(checkDate);
                        prevDate.setDate(prevDate.getDate() - 1);
                        checkDate = format(prevDate, "yyyy-MM-dd");
                    }
                    else {
                        break;
                    }
                }
            }
            setStats({
                quarterlyGoals,
                gymStreak,
                studyHoursToday: 0, // Could be calculated from habit tracking
                currentWeek,
                daysInQuarter,
                daysRemainingInQuarter,
            });
        }
        catch (error) {
            console.error("Error loading detailed stats:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const getCategoryColor = (category) => {
        const colors = {
            universidad: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            emprendimiento: "bg-purple-500/10 text-purple-600 border-purple-500/20",
            gym: "bg-green-500/10 text-green-600 border-green-500/20",
            idiomas: "bg-orange-500/10 text-orange-600 border-orange-500/20",
            proyectos: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        };
        return colors[category] || "bg-muted text-muted-foreground";
    };
    if (isLoading) {
        return (_jsx(Card, { className: "animate-pulse", children: _jsx(CardContent, { className: "h-48 p-4" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "Progreso del Trimestre" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Semana ", stats.currentWeek, "/12"] })] })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "space-y-1 mb-4", children: [_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { children: "D\u00EDas transcurridos" }), _jsxs("span", { className: "font-medium", children: [stats.daysInQuarter - stats.daysRemainingInQuarter, "/", stats.daysInQuarter] })] }), _jsx(Progress, { value: ((stats.daysInQuarter - stats.daysRemainingInQuarter) / stats.daysInQuarter) * 100, className: "h-2" })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-muted-foreground", children: "Quedan:" }), _jsxs("span", { className: "font-medium", children: [stats.daysRemainingInQuarter, " d\u00EDas"] })] }), stats.gymStreak > 0 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Flame, { className: "w-4 h-4 text-orange-500" }), _jsx("span", { className: "text-muted-foreground", children: "Gym:" }), _jsxs("span", { className: "font-medium", children: [stats.gymStreak, " d\u00EDas"] })] }))] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4 text-primary" }), _jsx(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "Metas Trimestrales" })] }) }), _jsx(CardContent, { className: "space-y-4", children: stats.quarterlyGoals.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: "Sin metas activas para este trimestre" })) : (stats.quarterlyGoals.map((goal) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Badge, { variant: "outline", className: `text-[10px] px-1.5 py-0 ${getCategoryColor(goal.category)}`, children: goal.category }), goal.daysRemaining !== undefined && goal.daysRemaining <= 7 && (_jsxs(Badge, { variant: "destructive", className: "text-[10px] px-1.5 py-0", children: [goal.daysRemaining, "d"] }))] }), _jsx("p", { className: "text-sm font-medium truncate", children: goal.title })] }), _jsx("div", { className: "text-right", children: _jsxs("span", { className: "text-lg font-bold", children: [goal.progress, "%"] }) })] }), _jsx(Progress, { value: goal.progress, className: "h-2" }), _jsxs("div", { className: "flex justify-between text-[10px] text-muted-foreground", children: [_jsxs("span", { children: ["Meta: ", goal.targetDate] }), goal.progress < 100 && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), goal.daysRemaining !== undefined && goal.daysRemaining > 0
                                                    ? `${Math.ceil((100 - goal.progress) / goal.daysRemaining)}%/día necesario`
                                                    : "Fecha límite alcanzada"] }))] })] }, goal.id)))) })] })] }));
}
