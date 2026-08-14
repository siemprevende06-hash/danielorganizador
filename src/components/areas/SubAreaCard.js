import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
const COVER_GRADIENTS = [
    "from-blue-600/40 to-cyan-500/40",
    "from-purple-600/40 to-pink-500/40",
    "from-emerald-600/40 to-teal-500/40",
    "from-amber-600/40 to-orange-500/40",
    "from-rose-600/40 to-red-500/40",
    "from-indigo-600/40 to-violet-500/40",
    "from-lime-600/40 to-green-500/40",
    "from-sky-600/40 to-blue-500/40",
];
function hashId(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
    }
    return Math.abs(hash);
}
function getCoverGradient(id) {
    return COVER_GRADIENTS[hashId(id) % COVER_GRADIENTS.length];
}
function getScoreColor(score) {
    if (score >= 70)
        return "text-green-600 dark:text-green-400";
    if (score >= 40)
        return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
}
function getScoreBg(score) {
    if (score >= 70)
        return "bg-green-500";
    if (score >= 40)
        return "bg-amber-500";
    return "bg-red-500";
}
export function SubAreaCard({ data, depth = 0 }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = data.children && data.children.length > 0;
    const gradient = getCoverGradient(data.id);
    return (_jsxs(Card, { className: cn("overflow-hidden border-0 shadow-sm", depth > 0 && "ml-3"), children: [_jsx("div", { className: cn("h-14 bg-gradient-to-br flex items-center px-4", gradient), children: _jsx("span", { className: "text-sm font-bold text-white drop-shadow-sm truncate", children: data.label }) }), _jsxs("div", { className: "px-4 py-3 space-y-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(Target, { className: "h-3 w-3" }), _jsx("span", { children: "Consistencia" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: cn("text-lg font-bold tabular-nums", getScoreColor(data.esfuerzo)), children: [data.esfuerzo, "%"] }), _jsx("div", { className: "flex-1 h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", getScoreBg(data.esfuerzo)), style: { width: `${data.esfuerzo}%` } }) })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(Clock, { className: "h-3 w-3" }), _jsx("span", { children: "Esfuerzo" })] }), _jsxs("span", { className: cn("text-lg font-bold tabular-nums", data.minutes > 0 ? "text-foreground" : "text-muted-foreground"), children: [data.minutes, "min"] })] })] }), hasChildren && (_jsxs("button", { onClick: () => setExpanded(!expanded), className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1", children: [expanded ? (_jsx(ChevronDown, { className: "h-3.5 w-3.5" })) : (_jsx(ChevronRight, { className: "h-3.5 w-3.5" })), data.children.length, " sub-\u00E1reas"] }))] }), hasChildren && expanded && (_jsx("div", { className: "px-4 pb-4 space-y-2", children: data.children.map(child => (_jsx(SubAreaCard, { data: child, depth: depth + 1 }, child.id))) }))] }));
}
