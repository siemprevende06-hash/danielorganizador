import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
export const ClickablePillarCard = ({ id, name, icon, progress, todayCompleted, todayTotal, route, color, }) => {
    return (_jsx(Link, { to: route, className: "block group", children: _jsx("div", { className: cn("p-3 rounded-lg border transition-all duration-200", "hover:shadow-md hover:border-primary/30 hover:scale-105", "cursor-pointer bg-background", progress >= 80 && "border-green-500/30 bg-green-500/5"), children: _jsxs("div", { className: "text-center space-y-2", children: [_jsx("div", { className: "text-2xl", children: icon }), _jsx("p", { className: "text-xs font-medium truncate", children: name }), _jsxs("div", { className: "text-lg font-bold", children: [progress, "%"] }), _jsx(Progress, { value: progress, className: "h-1.5" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [todayCompleted, "/", todayTotal, " \u2713"] })] }) }) }));
};
