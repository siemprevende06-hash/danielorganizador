import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
export const TaskCard = ({ id, title, completed, onToggle }) => {
    return (_jsx(Card, { className: cn("p-4 transition-all duration-300 hover:shadow-md card-glass", completed && "border-success"), children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Checkbox, { checked: completed, onCheckedChange: () => onToggle(id), className: "h-6 w-6" }), _jsx("div", { className: "flex-1", children: _jsx("h3", { className: cn("font-medium text-lg transition-colors", completed && "line-through text-muted-foreground"), children: title }) }), completed && (_jsx(CheckCircle2, { className: "h-5 w-5 text-success" }))] }) }));
};
