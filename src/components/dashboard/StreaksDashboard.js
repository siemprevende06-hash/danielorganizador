import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
export function StreaksDashboard({ routineBlocks = [] }) {
    // Calculate streaks from routine blocks
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    // Calculate weekly completion
    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const weeklyStatus = weekDays.map((_, idx) => {
        if (routineBlocks.length === 0)
            return idx <= dayIndex ? Math.random() > 0.3 : null;
        const completedBlocks = routineBlocks.filter(b => b.weeklyCompletion[idx]).length;
        const totalBlocks = routineBlocks.length;
        return completedBlocks >= totalBlocks * 0.7;
    });
    // Calculate current streak
    let currentStreak = 0;
    for (let i = dayIndex; i >= 0; i--) {
        if (weeklyStatus[i])
            currentStreak++;
        else
            break;
    }
    // Add previous weeks' streak (mock - in real app would come from DB)
    currentStreak += Math.floor(Math.random() * 10);
    // Best streak (mock data)
    const bestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 10);
    // Weekly completion count
    const daysCompletedThisWeek = weeklyStatus.filter(s => s === true).length;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Flame, { className: "h-5 w-5 text-orange-500" }), "Rachas"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20", children: [_jsx(Flame, { className: "h-5 w-5 mx-auto mb-1 text-orange-500" }), _jsx("div", { className: "text-2xl font-bold", children: currentStreak }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Racha actual" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20", children: [_jsx(Trophy, { className: "h-5 w-5 mx-auto mb-1 text-yellow-500" }), _jsx("div", { className: "text-2xl font-bold", children: bestStreak }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Mejor racha" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20", children: [_jsx(Calendar, { className: "h-5 w-5 mx-auto mb-1 text-green-500" }), _jsxs("div", { className: "text-2xl font-bold", children: [daysCompletedThisWeek, "/7"] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Esta semana" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-xs text-muted-foreground", children: "Semana actual" }), _jsx("div", { className: "flex justify-between gap-1", children: weekDays.map((day, idx) => (_jsx("div", { className: "flex-1 text-center", children: _jsx("div", { className: cn("w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all", weeklyStatus[idx] === true && "bg-green-500 text-white", weeklyStatus[idx] === false && idx <= dayIndex && "bg-red-500/20 text-red-500", weeklyStatus[idx] === null && "bg-muted text-muted-foreground"), children: weeklyStatus[idx] === true ? (_jsx(CheckCircle2, { className: "h-4 w-4" })) : (day) }) }, day))) })] })] })] }));
}
