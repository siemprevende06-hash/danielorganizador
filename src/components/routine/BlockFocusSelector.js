import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Briefcase, FolderKanban, Languages, Music, Book, Moon, Coffee, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
const focusConfig = {
    universidad: { label: "Universidad", icon: GraduationCap, color: "bg-blue-500 hover:bg-blue-600 text-white", borderColor: "border-blue-500" },
    emprendimiento: { label: "Emprendimiento", icon: Briefcase, color: "bg-purple-500 hover:bg-purple-600 text-white", borderColor: "border-purple-500" },
    proyectos: { label: "Proyectos", icon: FolderKanban, color: "bg-green-500 hover:bg-green-600 text-white", borderColor: "border-green-500" },
    idiomas: { label: "Idiomas", icon: Languages, color: "bg-teal-500 hover:bg-teal-600 text-white", borderColor: "border-teal-500" },
    musica: { label: "Música", icon: Music, color: "bg-pink-500 hover:bg-pink-600 text-white", borderColor: "border-pink-500" },
    lectura: { label: "Lectura", icon: Book, color: "bg-indigo-500 hover:bg-indigo-600 text-white", borderColor: "border-indigo-500" },
    descanso: { label: "Descanso", icon: Moon, color: "bg-slate-500 hover:bg-slate-600 text-white", borderColor: "border-slate-500" },
    ocio: { label: "Ocio", icon: Coffee, color: "bg-orange-500 hover:bg-orange-600 text-white", borderColor: "border-orange-500" },
    none: { label: "Sin asignar", icon: Zap, color: "bg-muted hover:bg-muted/80", borderColor: "border-muted" },
};
export const BlockFocusSelector = ({ currentFocus, defaultFocus, blockType, emergencyOnly, onFocusChange, disabled, }) => {
    const isConfigurable = blockType === "configurable" || blockType === "dinamico";
    if (!isConfigurable && blockType !== "evitar")
        return null;
    const focuses = ["universidad", "emprendimiento", "proyectos", "idiomas", "musica", "lectura", "descanso", "ocio"];
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Enfoque del Bloque" }), blockType === "dinamico" && (_jsxs(Badge, { variant: "outline", className: "text-xs bg-amber-500/10 text-amber-500 border-amber-500/30", children: [_jsx(Zap, { className: "h-3 w-3 mr-1" }), "Din\u00E1mico"] })), blockType === "evitar" && (_jsxs(Badge, { variant: "destructive", className: "text-xs", children: [_jsx(AlertTriangle, { className: "h-3 w-3 mr-1" }), "Evitar usar"] }))] }), emergencyOnly && (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs", children: [_jsx(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { children: "Solo usar en emergencias universitarias. Reduce el sue\u00F1o de 8h a 6h." })] })), _jsx("div", { className: "flex flex-wrap gap-2", children: focuses.map((focus) => {
                    const config = focusConfig[focus];
                    const Icon = config.icon;
                    const isSelected = currentFocus === focus;
                    const isDefault = defaultFocus === focus;
                    return (_jsxs(Button, { variant: isSelected ? "default" : "outline", size: "sm", disabled: disabled, onClick: () => onFocusChange(focus), className: cn("flex items-center gap-1.5 transition-all", isSelected && config.color), children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: config.label }), isDefault && !isSelected && (_jsx("span", { className: "text-xs opacity-60", children: "(default)" }))] }, focus));
                }) })] }));
};
export const BlockTypeIndicator = ({ blockType, emergencyOnly }) => {
    const config = {
        fijo: { label: "Fijo", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
        dinamico: { label: "Dinámico", className: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
        configurable: { label: "Configurable", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        evitar: { label: "Evitar", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    const typeConfig = config[blockType];
    return (_jsxs(Badge, { variant: "outline", className: cn("text-xs", typeConfig.className), children: [typeConfig.label, emergencyOnly && " ⚠️"] }));
};
export const getFocusColor = (focus) => {
    switch (focus) {
        case "universidad": return "border-blue-500";
        case "emprendimiento": return "border-purple-500";
        case "proyectos": return "border-green-500";
        case "idiomas": return "border-teal-500";
        case "musica": return "border-pink-500";
        case "lectura": return "border-indigo-500";
        case "descanso": return "border-slate-500";
        case "ocio": return "border-orange-500";
        default: return "border-border";
    }
};
