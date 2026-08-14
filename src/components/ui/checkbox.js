import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => {
    const isIndeterminate = props.checked === "indeterminate";
    return (_jsx(CheckboxPrimitive.Root, { ref: ref, className: cn("peer h-4 w-4 shrink-0 rounded-sm border border-muted-foreground/40 ring-offset-background data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", "data-[state=indeterminate]:bg-muted-foreground/20 data-[state=indeterminate]:text-muted-foreground", className), ...props, children: _jsx(CheckboxPrimitive.Indicator, { className: cn("flex items-center justify-center text-current"), children: isIndeterminate ? _jsx(Minus, { className: "h-4 w-4" }) : _jsx(Check, { className: "h-4 w-4" }) }) }));
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
