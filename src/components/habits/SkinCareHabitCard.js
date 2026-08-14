import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatISO } from "date-fns";
import { WeekdayCircle } from "./WeekdayCircle";
import { getWeekDates, getTodayCompletion } from "@/lib/habitUtils";
import { Flame, Award } from "lucide-react";
export const SkinCareHabitCard = ({ habit, habitHistory, onToggleMorning, onToggleNight, onClick, }) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    const history = habitHistory[habit.id] || {
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
    };
    const todayEntry = getTodayCompletion(history, todayStr);
    const morningDone = todayEntry?.healthMetrics?.morningRoutine || false;
    const nightDone = todayEntry?.healthMetrics?.nightRoutine || false;
    const Icon = habit.icon;
    const weekDates = getWeekDates();
    return (_jsxs(Card, { className: "cursor-pointer hover:shadow-lg transition-all", onClick: onClick, children: [_jsx("div", { className: "h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-t-lg" }), _jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: "h-5 w-5" }), _jsx("h3", { className: "font-semibold text-lg", children: habit.title })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Flame, { className: "h-4 w-4 text-orange-500" }), _jsx("span", { className: "font-medium", children: history.currentStreak })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Award, { className: "h-4 w-4 text-yellow-500" }), _jsx("span", { className: "font-medium", children: history.longestStreak })] })] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex justify-between gap-1", children: weekDates.map((date) => {
                            const dateStr = formatISO(date, { representation: "date" });
                            const entry = history.completedDates.find((e) => e.date === dateStr);
                            const status = entry?.status === 'skipped' ? undefined : entry?.status;
                            return _jsx(WeekdayCircle, { date: date, status: status }, dateStr);
                        }) }), _jsxs("div", { className: "space-y-2", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { checked: morningDone, onCheckedChange: () => onToggleMorning(habit.id) }), _jsx("span", { className: "text-sm", children: "Rutina Ma\u00F1ana" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { checked: nightDone, onCheckedChange: () => onToggleNight(habit.id) }), _jsx("span", { className: "text-sm", children: "Rutina Noche" })] })] })] })] }));
};
