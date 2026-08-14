import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
const SECTION_CONFIG = [
    {
        key: "cimientos",
        title: "ÁREAS ESTRUCTURALES",
        subtitle: "Cimientos de tu vida",
        color: "from-blue-500/20 to-blue-500/5",
    },
    {
        key: "construccion",
        title: "ÁREAS CENTRALES",
        subtitle: "Construcción activa",
        color: "from-amber-500/20 to-amber-500/5",
    },
    {
        key: "recompensas",
        title: "ÁREAS DE RECOMPENSA",
        subtitle: "Resultado de tu esfuerzo",
        color: "from-emerald-500/20 to-emerald-500/5",
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
export function LifeAreaScoresPanel({ periodType }) {
    const { view } = useTimeframe();
    const { scores, averages, loading } = useAreaScores(periodType, view);
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BarChart3, { className: "h-4 w-4 text-primary" }), _jsx("span", { className: "text-sm font-semibold", children: "\u00C1reas de Vida" })] }), _jsx("div", { className: "grid gap-3 md:grid-cols-2", children: Array.from({ length: 6 }).map((_, i) => (_jsx(Skeleton, { className: "h-24 rounded-xl" }, i))) })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BarChart3, { className: "h-4 w-4 text-primary" }), _jsx("span", { className: "text-sm font-semibold", children: "\u00C1reas de Vida" })] }), _jsxs("div", { className: "flex items-center gap-3 text-[11px] text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: ["Esfuerzo: ", _jsxs("strong", { className: cn("font-bold tabular-nums", getScoreColor(averages.esfuerzo)), children: [averages.esfuerzo, "%"] })] }), _jsxs("span", { className: "flex items-center gap-1", children: ["Resultados: ", _jsxs("strong", { className: cn("font-bold tabular-nums", getScoreColor(averages.resultados)), children: [averages.resultados, "%"] })] })] })] }), SECTION_CONFIG.map((section) => {
                const sectionAreas = scores.filter((s) => s.group === section.key);
                if (sectionAreas.length === 0)
                    return null;
                return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r", section.color), children: [_jsx("span", { className: "text-xs font-bold tracking-wider text-muted-foreground", children: section.title }), _jsx("span", { className: "text-[10px] text-muted-foreground/60", children: section.subtitle })] }), _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: sectionAreas.map((area) => (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-xl overflow-hidden", children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: area.icon }), _jsx("span", { className: "text-xs font-semibold truncate", children: area.label })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[10px] text-muted-foreground shrink-0", children: "Esfuerzo" }), _jsx("div", { className: "flex-1 h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", getScoreBg(area.esfuerzo)), style: { width: `${area.esfuerzo}%` } }) }), _jsxs("span", { className: cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", getScoreColor(area.esfuerzo)), children: [area.esfuerzo, "%"] })] }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[10px] text-muted-foreground shrink-0", children: "Resultados" }), _jsx("div", { className: "flex-1 h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", getScoreBg(area.resultados)), style: { width: `${area.resultados}%` } }) }), _jsxs("span", { className: cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", getScoreColor(area.resultados)), children: [area.resultados, "%"] })] })] })] }) }, area.id))) })] }, section.key));
            })] }));
}
