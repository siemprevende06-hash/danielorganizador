import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TrendingUp, Droplets, Clock, CheckCircle2, Dumbbell, Moon, Flame, Trophy } from "lucide-react";
export function SystemsStatsPanel({ completions, waterData, timeData, totalHabits, blockCompletions, workoutDuration, wakeTime, sleepTime, currentStreak, longestStreak, }) {
    const completedCount = Object.values(completions).filter(Boolean).length;
    const waterCount = Object.values(waterData).filter(Boolean).length;
    const totalMinutes = Object.values(timeData).reduce((a, b) => a + b, 0);
    const overallPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    const blocksCompleted = Object.values(blockCompletions).filter(Boolean).length;
    const totalBlocks = 16;
    const blocksPercent = Math.round((blocksCompleted / totalBlocks) * 100);
    const getStabilityLevel = (pct) => {
        if (pct >= 90)
            return { label: "Excelente", color: "text-green-500", emoji: "🟢" };
        if (pct >= 70)
            return { label: "Estable", color: "text-blue-500", emoji: "🔵" };
        if (pct >= 50)
            return { label: "Regular", color: "text-amber-500", emoji: "🟡" };
        return { label: "Inestable", color: "text-red-500", emoji: "🔴" };
    };
    const combinedPercent = Math.round((overallPercent + blocksPercent) / 2);
    const stability = getStabilityLevel(combinedPercent);
    const getSleepHours = () => {
        if (!wakeTime || !sleepTime)
            return null;
        const [wh, wm] = wakeTime.split(":").map(Number);
        const [sh, sm] = sleepTime.split(":").map(Number);
        let wake = wh * 60 + wm;
        let sleep = sh * 60 + sm;
        if (wake > sleep) {
            return ((24 * 60 - sleep) + wake) / 60;
        }
        return (wake - sleep + 24 * 60) / 60;
    };
    const showStreak = currentStreak !== undefined && longestStreak !== undefined;
    return (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs(Card, { className: "p-3 text-center", children: [_jsx("p", { className: "text-2xl mb-0.5", children: stability.emoji }), _jsx("p", { className: cn("text-base font-bold", stability.color), children: stability.label }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Estabilidad" }), _jsx(Progress, { value: combinedPercent, className: "h-1.5 mt-1" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-green-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-xl font-bold", children: [completedCount, "/", totalHabits] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "H\u00E1bitos" }), _jsx(Progress, { value: overallPercent, className: "h-1.5 mt-1" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(Clock, { className: "h-5 w-5 text-primary mx-auto mb-0.5" }), _jsx("p", { className: "text-xl font-bold", children: totalMinutes + workoutDuration }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Min totales" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(Droplets, { className: "h-5 w-5 text-blue-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-xl font-bold", children: [waterCount * 300, "ml"] }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [waterCount, "/7 vasos"] })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-emerald-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-xl font-bold", children: [blocksCompleted, "/", totalBlocks] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Bloques" }), _jsx(Progress, { value: blocksPercent, className: "h-1.5 mt-1" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(Dumbbell, { className: "h-5 w-5 text-orange-500 mx-auto mb-0.5" }), _jsxs("p", { className: "text-xl font-bold", children: [workoutDuration || 0, "m"] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Entreno" })] }), _jsxs(Card, { className: "p-3 text-center", children: [_jsx(Moon, { className: "h-5 w-5 text-indigo-500 mx-auto mb-0.5" }), _jsx("p", { className: "text-xl font-bold", children: wakeTime || "--:--" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Despert\u00E9" })] }), _jsxs(Card, { className: "p-3 text-center col-span-1", children: [_jsxs("p", { className: "text-2xl font-bold text-primary", children: [combinedPercent, "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Puntuaci\u00F3n Total" })] }), showStreak && (_jsxs(Card, { className: "p-3 text-center col-span-1", children: [_jsx(Flame, { className: "h-5 w-5 text-orange-500 mx-auto mb-0.5" }), _jsx("p", { className: "text-xl font-bold", children: currentStreak }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Racha actual" })] })), showStreak && (_jsxs(Card, { className: "p-3 text-center col-span-1", children: [_jsx(Trophy, { className: "h-5 w-5 text-yellow-600 mx-auto mb-0.5" }), _jsx("p", { className: "text-xl font-bold", children: longestStreak }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Mejor racha" })] }))] }));
}
