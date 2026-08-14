import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
const OPTIONS = [
    { id: 'plan', label: 'Plan' },
    { id: 'esfuerzo', label: 'Esfuerzo' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'autocritica', label: 'Autocrítica' },
];
export function EsfuerzoResultadosToggle({ value, onChange, className }) {
    return (_jsx("div", { className: cn("inline-flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50", className), children: OPTIONS.map(o => (_jsx("button", { type: "button", onClick: () => onChange(o.id), className: cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", value === o.id
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"), children: o.label }, o.id))) }));
}
export function ResultadosPlaceholder() {
    return (_jsx("div", { className: "min-h-[50vh] rounded-2xl border border-dashed border-border/60 flex items-center justify-center text-sm text-muted-foreground", children: "Resultados \u2014 pr\u00F3ximamente" }));
}
