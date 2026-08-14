import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { WheelOfLife } from "@/components/WheelOfLife";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SubAreaCard } from "@/components/areas/SubAreaCard";
import { cn } from "@/lib/utils";
import { Anchor, Target, Sparkles, LayoutDashboard, } from "lucide-react";
const SECTION_CONFIG = [
    {
        key: "cimientos",
        title: "ÁREAS ESTRUCTURALES",
        subtitle: "Cimientos de tu vida — la base sobre la que construyes todo",
        icon: Anchor,
        color: "from-blue-500/20 to-blue-500/5",
        border: "border-blue-500/20",
        badgeColor: "bg-blue-500/10 text-blue-600",
        progressColor: "bg-blue-500",
    },
    {
        key: "construccion",
        title: "ÁREAS CENTRALES",
        subtitle: "Construcción activa — donde pones tu energía para crecer",
        icon: Target,
        color: "from-amber-500/20 to-amber-500/5",
        border: "border-amber-500/20",
        badgeColor: "bg-amber-500/10 text-amber-600",
        progressColor: "bg-amber-500",
    },
    {
        key: "recompensas",
        title: "ÁREAS DE RECOMPENSA",
        subtitle: "El resultado de tu esfuerzo — lo que disfrutas al construir",
        icon: Sparkles,
        color: "from-emerald-500/20 to-emerald-500/5",
        border: "border-emerald-500/20",
        badgeColor: "bg-emerald-500/10 text-emerald-600",
        progressColor: "bg-emerald-500",
    },
];
function getScoreColor(score) {
    if (score >= 70)
        return "text-green-500";
    if (score >= 40)
        return "text-amber-500";
    return "text-red-500";
}
function getScoreBg(score) {
    if (score >= 70)
        return "bg-green-500";
    if (score >= 40)
        return "bg-amber-500";
    return "bg-red-500";
}
function AreaCardSkeleton() {
    return (_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(Skeleton, { className: "h-6 w-48" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-4 w-full" }), _jsx(Skeleton, { className: "h-4 w-full" }), _jsx(Skeleton, { className: "h-8 w-32" })] })] }));
}
export default function AreasDeVida() {
    const { timeframe, view } = useTimeframe();
    const { scores, averages, loading } = useAreaScores(timeframe, view);
    const wheelValues = scores.map((s) => Math.round(s.esfuerzo / 10));
    const wheelValues2 = scores.map((s) => Math.round(s.resultados / 10));
    if (loading) {
        return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-8", children: [_jsx(Skeleton, { className: "h-12 w-64 mx-auto" }), _jsx(Skeleton, { className: "h-64 w-full max-w-md mx-auto" }), [1, 2, 3].map((section) => (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsx(AreaCardSkeleton, {}), _jsx(AreaCardSkeleton, {}), _jsx(AreaCardSkeleton, {})] })] }, section)))] }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-10", children: [_jsxs("header", { className: "text-center space-y-3", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full", children: [_jsx(LayoutDashboard, { className: "h-5 w-5 text-primary" }), _jsx("span", { className: "font-semibold text-primary", children: "RUEDA DE LA VIDA" })] }), _jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent", children: "\u00C1reas de Vida" }), _jsx("p", { className: "text-muted-foreground max-w-lg mx-auto", children: "Las 10 \u00E1reas que definen tu vida. Visualiza tu esfuerzo y resultados en cada una." }), !loading && scores.length > 0 && (_jsxs("div", { className: "flex items-center justify-center gap-4 text-sm", children: [_jsxs(Badge, { variant: "outline", className: "gap-1.5 px-3 py-1", children: [_jsx("span", { className: "text-muted-foreground", children: "Esfuerzo:" }), _jsxs("span", { className: cn("font-bold", getScoreColor(averages.esfuerzo)), children: [averages.esfuerzo, "%"] })] }), _jsxs(Badge, { variant: "outline", className: "gap-1.5 px-3 py-1", children: [_jsx("span", { className: "text-muted-foreground", children: "Resultados:" }), _jsxs("span", { className: cn("font-bold", getScoreColor(averages.resultados)), children: [averages.resultados, "%"] })] })] }))] }), _jsx(TimeframeSelector, {}), _jsx("div", { className: "max-w-md mx-auto", children: _jsx(WheelOfLife, { values: wheelValues, values2: wheelValues2, average: Math.round(averages.esfuerzo / 10), average2: Math.round(averages.resultados / 10), view: view }) }), SECTION_CONFIG.map((section) => {
                const sectionAreas = scores.filter((s) => s.group === section.key);
                if (sectionAreas.length === 0)
                    return null;
                const Icon = section.icon;
                return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: cn("flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r", section.color, section.border), children: [_jsx("div", { className: cn("p-2 rounded-full", section.badgeColor), children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold tracking-wide", children: section.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: section.subtitle })] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: sectionAreas.map((area) => (_jsx(AreaCard, { area: area, progressColor: section.progressColor, borderColor: section.border }, area.id))) })] }, section.key));
            })] }));
}
function AreaCard({ area, progressColor, borderColor, }) {
    const hasNested = area.sub.some(s => s.children && s.children.length > 0);
    return (_jsxs(Card, { className: cn("overflow-hidden transition-all hover:shadow-md", borderColor), children: [_jsx(CardHeader, { className: cn("pb-3 border-b", borderColor), children: _jsxs(CardTitle, { className: "flex items-center gap-3 text-lg", children: [_jsx("span", { className: "text-2xl", children: area.icon }), _jsx("span", { children: area.label })] }) }), _jsxs(CardContent, { className: "pt-4 space-y-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Esfuerzo" }), _jsxs("span", { className: cn("font-bold tabular-nums", getScoreColor(area.esfuerzo)), children: [area.esfuerzo, "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", getScoreBg(area.esfuerzo)), style: { width: `${area.esfuerzo}%` } }) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Resultados" }), _jsxs("span", { className: cn("font-bold tabular-nums", getScoreColor(area.resultados)), children: [area.resultados, "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", getScoreBg(area.resultados)), style: { width: `${area.resultados}%` } }) })] }), _jsx("div", { className: cn("space-y-2", hasNested ? "" : "grid grid-cols-2 gap-2"), children: area.sub.map(sub => (_jsx(SubAreaCard, { data: sub }, sub.id))) })] })] }));
}
