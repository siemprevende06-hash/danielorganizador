import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
export const StatsCard = ({ title, value, icon: Icon, iconColor = "text-primary" }) => {
    return (_jsx(Card, { className: "p-6 card-glass", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: title }), _jsx("p", { className: "text-3xl font-bold mt-2", children: value })] }), _jsx("div", { className: cn("p-3 rounded-lg bg-secondary", iconColor), children: _jsx(Icon, { className: "h-6 w-6" }) })] }) }));
};
