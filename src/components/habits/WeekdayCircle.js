import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { isToday } from "date-fns";
export const WeekdayCircle = ({ date, status }) => {
    const isCurrentDay = isToday(date);
    return (_jsxs("div", { className: cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all", status === "completed" &&
            "bg-green-500 text-white ring-2 ring-green-500/20", status === "failed" && "bg-destructive text-white ring-2 ring-destructive/20", !status && "bg-muted text-muted-foreground", isCurrentDay && "ring-2 ring-primary ring-offset-2"), children: [status === "completed" && _jsx(Check, { className: "h-4 w-4" }), status === "failed" && _jsx(X, { className: "h-4 w-4" }), !status && date.getDate()] }));
};
