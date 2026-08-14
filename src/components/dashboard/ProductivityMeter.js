import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
export const ProductivityMeter = ({ title, completedHabits, totalHabits, completedTasks, totalTasks, showCard = true, }) => {
    const totalItems = totalHabits + totalTasks;
    const completedItems = completedHabits + completedTasks;
    const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const getColor = (pct) => {
        if (pct >= 100)
            return "text-emerald-500";
        if (pct >= 75)
            return "text-green-500";
        if (pct >= 50)
            return "text-yellow-500";
        if (pct > 0)
            return "text-orange-500";
        return "text-red-500";
    };
    const content = (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: title }), _jsxs("span", { className: cn("text-xs font-bold", getColor(percentage)), children: [Math.round(percentage), "%"] })] }), _jsx(Progress, { value: percentage, className: "h-1.5" }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [completedItems, "/", totalItems] })] }));
    if (!showCard) {
        return _jsx("div", { className: "min-w-[120px]", children: content });
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: title }) }), _jsx(CardContent, { children: content })] }));
};
