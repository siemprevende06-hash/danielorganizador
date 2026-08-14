import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock } from "lucide-react";
import { useProductivityPatterns } from "@/hooks/useProductivityPatterns";
import { Skeleton } from "@/components/ui/skeleton";
export function ProductivityPatterns() {
    const { hourPatterns, bestBlock, bestHour, loading } = useProductivityPatterns();
    if (loading)
        return _jsx(Skeleton, { className: "h-36 w-full" });
    if (!hourPatterns.length)
        return null;
    const maxMins = Math.max(...hourPatterns.map(h => h.totalMinutes), 1);
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Brain, { className: "w-4 h-4 text-primary" }), "Patrones de Productividad"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex gap-4 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3 text-primary" }), _jsxs("span", { children: ["Mejor hora: ", _jsxs("strong", { children: [bestHour, ":00"] })] })] }), bestBlock && bestBlock !== 'sin-bloque' && (_jsx("div", { children: _jsxs("span", { children: ["Mejor bloque: ", _jsx("strong", { children: bestBlock })] }) }))] }), _jsx("div", { className: "flex gap-0.5 items-end h-12", children: Array.from({ length: 18 }, (_, i) => i + 5).map(hour => {
                            const hp = hourPatterns.find(h => h.hour === hour);
                            const height = hp ? Math.max(4, (hp.totalMinutes / maxMins) * 48) : 4;
                            return (_jsx("div", { className: "flex-1 rounded-t bg-primary/30 hover:bg-primary/60 transition-colors relative group", style: { height: `${height}px` }, children: _jsxs("div", { className: "absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100", children: [hour, "h"] }) }, hour));
                        }) }), _jsxs("div", { className: "flex justify-between text-[9px] text-muted-foreground", children: [_jsx("span", { children: "5:00" }), _jsx("span", { children: "12:00" }), _jsx("span", { children: "22:00" })] })] })] }));
}
