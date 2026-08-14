import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
const PILLAR_ROUTES = {
    universidad: '/university',
    emprendimiento: '/entrepreneurship',
    proyectos: '/projects',
    gym: '/vida-daniel',
    idiomas: '/languages-dashboard',
};
export function PillarProgressGrid({ pillars, overallScore, loading, compact = false }) {
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Skeleton, { className: "h-6 w-48" }), _jsx(Skeleton, { className: "h-6 w-16" })] }), _jsx("div", { className: compact ? "grid grid-cols-5 gap-2" : "grid grid-cols-2 md:grid-cols-5 gap-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: compact ? "h-12" : "h-32" }, i))) })] }));
    }
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-500';
        if (score >= 60)
            return 'text-yellow-500';
        if (score >= 40)
            return 'text-orange-500';
        return 'text-red-500';
    };
    const getProgressColor = (percentage) => {
        if (percentage >= 80)
            return 'bg-green-500';
        if (percentage >= 50)
            return 'bg-yellow-500';
        if (percentage > 0)
            return 'bg-orange-500';
        return 'bg-muted';
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: "\u2B50 Progreso en mis 5 Pilares" }), _jsxs("span", { className: `text-lg font-bold ${getScoreColor(overallScore)}`, children: [overallScore, "%"] })] }), _jsx("div", { className: compact
                    ? "grid grid-cols-5 gap-2"
                    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3", children: pillars.map(pillar => {
                    const route = PILLAR_ROUTES[pillar.id] || '/';
                    return (_jsx(Link, { to: route, className: "block group", children: _jsx("div", { className: cn("relative p-3 rounded-xl border bg-card transition-all", "hover:shadow-lg hover:border-primary/40 hover:scale-[1.02]", "cursor-pointer", pillar.status === 'completed' && "border-green-500/50 bg-green-500/5"), children: compact ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: pillar.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-medium truncate", children: pillar.name }), _jsxs("span", { className: cn("text-xs font-bold", getScoreColor(pillar.percentage)), children: [pillar.percentage, "%"] })] }), _jsx(Progress, { value: pillar.percentage, className: "h-1 mt-1" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "text-center mb-2", children: [_jsx("span", { className: "text-2xl block mb-1", children: pillar.icon }), _jsx("span", { className: "font-semibold text-xs", children: pillar.name })] }), _jsxs("div", { className: cn("text-2xl font-bold text-center mb-2", getScoreColor(pillar.percentage)), children: [pillar.percentage, "%"] }), _jsx("div", { className: "relative h-1.5 bg-muted rounded-full overflow-hidden mb-2", children: _jsx("div", { className: cn("h-full transition-all duration-500", getProgressColor(pillar.percentage)), style: { width: `${pillar.percentage}%` } }) }), _jsxs("div", { className: "text-center text-xs text-muted-foreground", children: [_jsxs("span", { children: [pillar.tasksCompleted, "/", pillar.tasksTotal, " \u2713"] }), pillar.streak > 0 && (_jsxs("span", { className: "ml-2", children: ["\uD83D\uDD25 ", pillar.streak] }))] }), _jsx("div", { className: "absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all pointer-events-none" })] })) }) }, pillar.id));
                }) }), _jsxs("div", { className: "pt-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-1", children: [_jsx("span", { children: "Puntuaci\u00F3n Total" }), _jsxs("span", { className: "font-medium", children: [overallScore, "%"] })] }), _jsx(Progress, { value: overallScore, className: "h-2" })] })] }));
}
