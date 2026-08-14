import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Shirt, Droplet } from "lucide-react";
import { formatISO } from "date-fns";
export default function AttractionPillar({ habitHistory }) {
    const appearanceHabits = [
        { id: "habit-cuidado-personal", name: "Cuidado Personal", icon: Shirt },
        { id: "habit-skincare", name: "Skincare", icon: Droplet },
    ];
    const getHabitProgress = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        const history = habitHistory[habitId];
        if (!history)
            return 0;
        const todayEntry = history.completedDates?.find((d) => d && d.date === todayStr && d.status === "completed");
        return todayEntry ? 100 : 0;
    };
    const totalProgress = appearanceHabits.reduce((sum, habit) => sum + getHabitProgress(habit.id), 0) /
        appearanceHabits.length;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "h-5 w-5 text-purple-500" }), "Pilar de Atracci\u00F3n"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsxs("div", { className: "text-4xl font-bold gradient-primary bg-clip-text text-transparent", children: [Math.round(totalProgress), "%"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Progreso de Apariencia" })] }), _jsx("div", { className: "space-y-3", children: appearanceHabits.map((habit) => {
                            const Icon = habit.icon;
                            const progress = getHabitProgress(habit.id);
                            return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: habit.name })] }), _jsxs("span", { className: "font-semibold", children: [Math.round(progress), "%"] })] }), _jsx(Progress, { value: progress, className: "h-2" })] }, habit.id));
                        }) })] })] }));
}
