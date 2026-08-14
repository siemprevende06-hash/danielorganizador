import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function MacroSectionCard({ title, subtitle, icon: Icon, gradient, borderColor, completed, total, description, children, }) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (_jsxs(Card, { className: cn("border-2 overflow-hidden", borderColor), children: [_jsxs("div", { className: cn("p-4 md:p-5 bg-gradient-to-r", gradient), children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-background/80 backdrop-blur", children: _jsx(Icon, { className: "h-6 w-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg md:text-xl font-bold", children: title }), _jsx("p", { className: "text-xs text-muted-foreground", children: subtitle })] })] }), _jsxs(Badge, { variant: "secondary", className: "text-base font-bold shrink-0", children: [percent, "%"] })] }), _jsx("p", { className: "text-xs text-muted-foreground mb-2 italic", children: description }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: percent, className: "h-2 flex-1" }), _jsxs("span", { className: "text-xs font-medium text-muted-foreground", children: [completed, "/", total] })] })] }), _jsx("div", { className: "p-3 md:p-4 space-y-3 bg-card", children: children })] }));
}
