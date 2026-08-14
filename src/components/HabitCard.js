import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Flame, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatISO } from "date-fns";
import { WeekdayCircle } from "./habits/WeekdayCircle";
import { getWeekDates, getTodayCompletion, getTodayDuration } from "@/lib/habitUtils";
export const HabitCard = ({ habit, habitHistory, onUpdateStatus, onClick, }) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    const history = habitHistory[habit.id] || {
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
    };
    const todayEntry = getTodayCompletion(history, todayStr);
    const todayStatus = todayEntry?.status;
    const todayDuration = getTodayDuration(history, todayStr);
    const Icon = habit.icon;
    const weekDates = getWeekDates();
    return (_jsxs(Card, { className: "cursor-pointer hover:shadow-lg transition-all overflow-hidden", onClick: onClick, children: [_jsx("div", { className: "h-32 bg-gradient-to-br from-primary to-primary/50 rounded-t-lg" }), _jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: "h-5 w-5" }), _jsx("h3", { className: "font-semibold text-lg", children: habit.title })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Flame, { className: "h-4 w-4 text-orange-500" }), _jsx("span", { className: "font-medium", children: history.currentStreak })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Award, { className: "h-4 w-4 text-yellow-500" }), _jsx("span", { className: "font-medium", children: history.longestStreak })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-4 w-4 text-blue-500" }), _jsxs("span", { className: "font-medium", children: [todayDuration, " min"] })] })] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex justify-between gap-1", children: weekDates.map((date) => {
                            const dateStr = formatISO(date, { representation: "date" });
                            const entry = history.completedDates.find((e) => e.date === dateStr);
                            const status = entry?.status === 'skipped' ? undefined : entry?.status;
                            return _jsx(WeekdayCircle, { date: date, status: status }, dateStr);
                        }) }), _jsxs("div", { className: "flex gap-2", onClick: (e) => e.stopPropagation(), children: [_jsxs(Button, { variant: todayStatus === "completed" ? "default" : "outline", className: cn("flex-1", todayStatus === "completed" && "bg-green-500 hover:bg-green-600"), onClick: () => onUpdateStatus(habit.id, "completed"), children: [_jsx(Check, { className: "h-4 w-4 mr-1" }), "Completado"] }), _jsxs(Button, { variant: todayStatus === "failed" ? "default" : "outline", className: cn("flex-1", todayStatus === "failed" && "bg-destructive hover:bg-destructive/90"), onClick: () => onUpdateStatus(habit.id, "failed"), children: [_jsx(X, { className: "h-4 w-4 mr-1" }), "Fallado"] })] })] })] }));
};
