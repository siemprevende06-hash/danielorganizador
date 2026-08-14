import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, ExternalLink } from 'lucide-react';
export const ClickableSecondaryGoal = ({ id, name, icon, completed, route, onToggle, }) => {
    const content = (_jsxs("div", { className: cn("p-3 rounded-lg border transition-all duration-200 text-center", "hover:shadow-md hover:border-primary/30 cursor-pointer", completed && "border-green-500/30 bg-green-500/5"), children: [_jsx("div", { className: "text-xl mb-1", children: icon }), _jsx("p", { className: "text-xs font-medium", children: name }), completed ? (_jsxs("div", { className: "mt-1 flex items-center justify-center gap-1 text-green-600", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { className: "text-xs", children: "Hecho" })] })) : (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Pendiente" })), route && (_jsx(ExternalLink, { className: "w-3 h-3 mx-auto mt-1 text-muted-foreground" }))] }));
    if (route) {
        return _jsx(Link, { to: route, className: "block", children: content });
    }
    return (_jsx("div", { onClick: onToggle, children: content }));
};
