import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
export const RoutineStreakCard = ({ currentStreak, maxStreak, totalDaysCompleted, weeklyCompletion, }) => {
    const getStreakColor = () => {
        if (currentStreak >= 30)
            return "text-yellow-500";
        if (currentStreak >= 14)
            return "text-orange-500";
        if (currentStreak >= 7)
            return "text-red-500";
        return "text-muted-foreground";
    };
    const getStreakMessage = () => {
        if (currentStreak >= 30)
            return "¡Racha legendaria! 🔥";
        if (currentStreak >= 14)
            return "¡Dos semanas de disciplina!";
        if (currentStreak >= 7)
            return "¡Una semana completa!";
        if (currentStreak >= 3)
            return "¡Construyendo el hábito!";
        if (currentStreak > 0)
            return "¡Sigue así!";
        return "¡Comienza tu racha hoy!";
    };
    return (_jsxs(Card, { className: "bg-gradient-to-br from-card to-muted/30", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Flame, { className: cn("h-5 w-5", getStreakColor()) }), "Racha de Rutina"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: cn("text-5xl font-bold", getStreakColor()), children: currentStreak }), _jsx("p", { className: "text-sm text-muted-foreground", children: "D\u00EDas consecutivos" })] }), _jsx("div", { className: "h-16 w-px bg-border" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Trophy, { className: "h-4 w-4 text-yellow-500" }), _jsxs("span", { className: "text-sm", children: ["M\u00E1ximo: ", maxStreak, " d\u00EDas"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-blue-500" }), _jsxs("span", { className: "text-sm", children: ["Total: ", totalDaysCompleted, " d\u00EDas"] })] })] })] }), _jsx("div", { className: "text-center", children: _jsxs(Badge, { variant: "secondary", className: "text-sm", children: [_jsx(TrendingUp, { className: "h-3 w-3 mr-1" }), getStreakMessage()] }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-center", children: "Esta Semana" }), _jsx("div", { className: "flex justify-center gap-2", children: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
                                    const today = new Date().getDay();
                                    const dayIndex = today === 0 ? 6 : today - 1;
                                    const isToday = index === dayIndex;
                                    return (_jsx("div", { className: cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all", weeklyCompletion[index]
                                            ? "bg-green-500 text-white"
                                            : index < dayIndex
                                                ? "bg-red-500/80 text-white"
                                                : "bg-muted text-muted-foreground", isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"), children: day }, day));
                                }) })] })] })] }));
};
