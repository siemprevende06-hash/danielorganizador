import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { habits as allHabits } from "@/lib/data";
import { formatISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
export default function HabitTracker({ habitHistory, setHabitHistory, todayTasks }) {
    const { toast } = useToast();
    const [timers, setTimers] = useState({});
    const toggleHabit = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        const newHistory = { ...habitHistory };
        if (!newHistory[habitId]) {
            newHistory[habitId] = { completedDates: [], currentStreak: 0, longestStreak: 0 };
        }
        const todayIndex = newHistory[habitId].completedDates.findIndex((d) => d.date === todayStr);
        if (todayIndex > -1) {
            newHistory[habitId].completedDates.splice(todayIndex, 1);
            newHistory[habitId].currentStreak = Math.max(0, newHistory[habitId].currentStreak - 1);
        }
        else {
            newHistory[habitId].completedDates.push({
                date: todayStr,
                status: "completed",
                duration: timers[habitId] || 0,
            });
            newHistory[habitId].currentStreak += 1;
            newHistory[habitId].longestStreak = Math.max(newHistory[habitId].longestStreak, newHistory[habitId].currentStreak);
            toast({
                title: "¡Hábito completado! 🎉",
                description: `Racha: ${newHistory[habitId].currentStreak} días`,
            });
        }
        setHabitHistory(newHistory);
    };
    const isHabitCompleted = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        return habitHistory[habitId]?.completedDates?.some((d) => d.date === todayStr && d.status === "completed");
    };
    return (_jsx("div", { className: "space-y-4", children: allHabits.map((habit) => {
            const completed = isHabitCompleted(habit.id);
            const streak = habitHistory[habit.id]?.currentStreak || 0;
            return (_jsx(Card, { className: cn(completed && "bg-muted/50"), children: _jsxs(CardContent, { className: "flex items-center justify-between p-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Checkbox, { checked: completed, onCheckedChange: () => toggleHabit(habit.id), className: "h-6 w-6" }), _jsxs("div", { children: [_jsx("div", { className: cn("font-semibold", completed && "line-through text-muted-foreground"), children: habit.title }), streak > 0 && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Flame, { className: "h-4 w-4 text-orange-500" }), _jsxs("span", { children: [streak, " d\u00EDas"] })] }))] })] }), completed && _jsx(Badge, { variant: "default", children: "Completado" })] }) }, habit.id));
        }) }));
}
