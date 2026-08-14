import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
const CATEGORY_COLORS = {
    universidad: "text-blue-600 bg-blue-500/10",
    emprendimiento: "text-purple-600 bg-purple-500/10",
    gym: "text-green-600 bg-green-500/10",
    idiomas: "text-orange-600 bg-orange-500/10",
    proyectos: "text-cyan-600 bg-cyan-500/10",
};
export function TaskWithWhy({ id, title, completed, priority, linkedGoal, onToggle }) {
    return (_jsx("div", { className: cn("group rounded-lg border p-3 transition-all", completed
            ? "bg-muted/50 border-muted"
            : priority === "high"
                ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                : "hover:bg-muted/50"), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Checkbox, { id: id, checked: completed, onCheckedChange: () => onToggle(id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("label", { htmlFor: id, className: cn("text-sm font-medium cursor-pointer", completed && "line-through text-muted-foreground"), children: title }), priority === "high" && !completed && (_jsx(Badge, { variant: "outline", className: "text-[10px] px-1.5 py-0 border-destructive/50 text-destructive", children: "ALTA PRIORIDAD" }))] }), linkedGoal && !completed && (_jsxs("div", { className: "mt-2 flex items-start gap-2 text-xs", children: [_jsx(Target, { className: cn("w-3.5 h-3.5 mt-0.5 shrink-0", CATEGORY_COLORS[linkedGoal.category]?.split(' ')[0] || "text-primary") }), _jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-muted-foreground", children: "Meta:" }), _jsx("span", { className: cn("font-medium", CATEGORY_COLORS[linkedGoal.category]?.split(' ')[0]), children: linkedGoal.title }), _jsxs("span", { className: "text-muted-foreground", children: ["(", linkedGoal.progress, "%)"] })] }), linkedGoal.contribution && (_jsxs("p", { className: "text-muted-foreground italic flex items-center gap-1", children: [_jsx(ArrowRight, { className: "w-3 h-3" }), linkedGoal.contribution] }))] })] }))] })] }) }));
}
