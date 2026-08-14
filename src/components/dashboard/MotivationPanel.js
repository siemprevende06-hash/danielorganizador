import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Target, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
export default function MotivationPanel({ habitHistory, productivityData }) {
    const stats = useMemo(() => {
        const totalStreaks = Object.values(habitHistory).reduce((sum, habit) => sum + (habit.currentStreak || 0), 0);
        const longestStreak = Math.max(...Object.values(habitHistory).map((h) => h.longestStreak || 0), 0);
        const score = productivityData?.average?.score || 0;
        return { totalStreaks, longestStreak, score };
    }, [habitHistory, productivityData]);
    const motivationalMessage = useMemo(() => {
        if (stats.score >= 80) {
            return {
                title: "¡Imparable! 🔥",
                message: "Estás en tu mejor momento. Sigue así, campeón.",
                color: "text-emerald-500",
            };
        }
        if (stats.score >= 60) {
            return {
                title: "¡Buen ritmo! 💪",
                message: "Vas por el camino correcto. No bajes la guardia.",
                color: "text-green-500",
            };
        }
        if (stats.score >= 40) {
            return {
                title: "Empujando fuerte ⚡",
                message: "Hay margen de mejora. Cada esfuerzo cuenta.",
                color: "text-yellow-500",
            };
        }
        return {
            title: "Un paso a la vez 🎯",
            message: "Mañana es una nueva oportunidad. No te rindas.",
            color: "text-orange-500",
        };
    }, [stats.score]);
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "h-5 w-5" }), "Panel de Motivaci\u00F3n"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "text-center space-y-2 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10", children: [_jsx("h3", { className: cn("text-2xl font-bold", motivationalMessage.color), children: motivationalMessage.title }), _jsx("p", { className: "text-muted-foreground italic", children: motivationalMessage.message })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center p-4 rounded-lg bg-muted", children: [_jsx(Flame, { className: "h-6 w-6 mx-auto mb-2 text-orange-500" }), _jsx("div", { className: "text-2xl font-bold", children: stats.totalStreaks }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Rachas Totales" })] }), _jsxs("div", { className: "text-center p-4 rounded-lg bg-muted", children: [_jsx(Target, { className: "h-6 w-6 mx-auto mb-2 text-primary" }), _jsx("div", { className: "text-2xl font-bold", children: stats.longestStreak }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Racha M\u00E1s Larga" })] }), _jsxs("div", { className: "text-center p-4 rounded-lg bg-muted", children: [_jsx(TrendingUp, { className: "h-6 w-6 mx-auto mb-2 text-success" }), _jsxs("div", { className: "text-2xl font-bold", children: [Math.round(stats.score), "%"] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Score Hoy" })] })] })] })] }));
}
