import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, Briefcase, Trophy } from "lucide-react";
export default function EmbeddedVisionBoard() {
    const visionGoals = [
        {
            icon: Trophy,
            title: "Excelencia Académica",
            description: "Graduarse con honores",
            color: "text-yellow-500",
        },
        {
            icon: Briefcase,
            title: "Carrera Profesional",
            description: "Construir proyectos impactantes",
            color: "text-primary",
        },
        {
            icon: Heart,
            title: "Bienestar Integral",
            description: "Cuerpo fuerte, mente clara",
            color: "text-success",
        },
        {
            icon: Eye,
            title: "Versión Superior",
            description: "Disciplina inquebrantable",
            color: "text-purple-500",
        },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Tablero de Visi\u00F3n" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: visionGoals.map((goal) => {
                        const Icon = goal.icon;
                        return (_jsxs("div", { className: "p-4 rounded-lg border bg-gradient-to-br from-background to-muted hover:shadow-md transition-all cursor-pointer", children: [_jsx(Icon, { className: `h-8 w-8 mb-3 ${goal.color}` }), _jsx("h4", { className: "font-semibold text-sm mb-1", children: goal.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: goal.description })] }, goal.title));
                    }) }) })] }));
}
