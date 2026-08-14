import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
export function SecondaryGoalsProgress({ goals, loading }) {
    if (loading) {
        return (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-6 w-48" }), _jsx(Skeleton, { className: "h-16 w-full" })] }));
    }
    if (!goals || goals.length === 0) {
        return (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "\uD83C\uDFAF Metas Secundarias" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Sin metas secundarias configuradas." })] }));
    }
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "\uD83C\uDFAF Metas Secundarias" }), _jsx("div", { className: "space-y-2", children: goals.map((g) => (_jsxs("div", { className: "p-3 rounded-lg border bg-card", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: g.icon }), _jsx("span", { className: "text-sm font-medium", children: g.name })] }), _jsxs("span", { className: "text-xs font-bold", children: [g.percentage, "%"] })] }), _jsx(Progress, { value: g.percentage, className: "h-1.5" })] }, g.id))) })] }));
}
