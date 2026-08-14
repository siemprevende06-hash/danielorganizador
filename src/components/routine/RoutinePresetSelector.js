import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sun, Moon, AlertTriangle, Check, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const PRESET_ICONS = {
    sun: Sun,
    moon: Moon,
    'alert-triangle': AlertTriangle,
};
const PRESET_COLORS = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-500' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-500' },
};
export function RoutinePresetSelector({ presets, selectedPresetId, onSelectPreset }) {
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayH}:${minutes} ${period}`;
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5" }), "Configuraci\u00F3n R\u00E1pida de Rutina"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: presets.map((preset) => {
                    const Icon = PRESET_ICONS[preset.icon || 'sun'] || Sun;
                    const colors = PRESET_COLORS[preset.color || 'blue'] || PRESET_COLORS.blue;
                    const isSelected = selectedPresetId === preset.id;
                    const excludedCount = preset.excluded_block_ids.length;
                    return (_jsxs(Card, { className: cn("p-4 cursor-pointer transition-all hover:scale-[1.02]", colors.bg, isSelected
                            ? `ring-2 ring-primary ${colors.border}`
                            : "border-border hover:border-primary/50"), onClick: () => onSelectPreset(preset.id), children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: cn("p-2 rounded-lg", colors.bg), children: _jsx(Icon, { className: cn("h-6 w-6", colors.text) }) }), isSelected && (_jsx("div", { className: "bg-primary text-primary-foreground p-1 rounded-full", children: _jsx(Check, { className: "h-4 w-4" }) }))] }), _jsx("h4", { className: "font-bold text-lg mb-1", children: preset.name }), _jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-2", children: preset.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Despertar:" }), _jsx("span", { className: "font-medium", children: formatTime(preset.wake_time) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Dormir:" }), _jsx("span", { className: "font-medium", children: formatTime(preset.sleep_time) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Sue\u00F1o:" }), _jsxs(Badge, { variant: "secondary", className: cn(colors.text), children: [preset.sleep_hours, "h"] })] })] }), _jsx("div", { className: "mt-4 pt-3 border-t border-border/50", children: excludedCount > 0 ? (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u274C ", excludedCount, " bloque", excludedCount > 1 ? 's' : '', " excluido", excludedCount > 1 ? 's' : ''] })) : (_jsx("p", { className: "text-xs text-muted-foreground", children: "\u2705 Todos los bloques activos" })) })] }, preset.id));
                }) })] }));
}
