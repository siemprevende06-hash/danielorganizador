import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Zap, TrendingUp } from "lucide-react";
export default function VisionActivationGrid({ habitHistory }) {
    const visionAreas = [
        {
            title: "Salud y Energía",
            icon: Zap,
            habits: ["habit-entrenamiento", "habit-sueño"],
            color: "text-success",
        },
        {
            title: "Maestría Profesional",
            icon: Target,
            habits: ["habit-universidad", "habit-proyectos-personales"],
            color: "text-primary",
        },
        {
            title: "Disciplina Mental",
            icon: TrendingUp,
            habits: ["habit-no-fap", "habit-planificacion"],
            color: "text-warning",
        },
    ];
    const getAreaProgress = (habitIds) => {
        const completed = habitIds.filter((id) => {
            const history = habitHistory[id];
            return history && history.currentStreak > 0;
        }).length;
        return (completed / habitIds.length) * 100;
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Activaci\u00F3n de Visi\u00F3n" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: visionAreas.map((area) => {
                        const progress = getAreaProgress(area.habits);
                        const Icon = area.icon;
                        return (_jsxs("div", { className: "p-4 rounded-lg border space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Icon, { className: `h-5 w-5 ${area.color}` }), _jsxs(Badge, { variant: progress >= 50 ? "default" : "secondary", children: [Math.round(progress), "%"] })] }), _jsx("h4", { className: "font-semibold text-sm", children: area.title }), _jsx(Progress, { value: progress, className: "h-2" })] }, area.title));
                    }) }) })] }));
}
