import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, Code, Languages, AlertTriangle, CheckCircle2 } from "lucide-react";
const WORK_AREAS = [
    { id: "universidad", label: "Universidad", icon: GraduationCap, color: "text-purple-500" },
    { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "text-amber-500" },
    { id: "proyectos", label: "Proyectos", icon: Code, color: "text-cyan-500" },
    { id: "idiomas", label: "Idiomas", icon: Languages, color: "text-green-500" },
];
const WORK_BLOCKS = [
    { id: "work-1", time: "9:00 - 10:30" },
    { id: "work-2", time: "10:30 - 12:00" },
    { id: "work-3", time: "12:00 - 13:20" },
    { id: "work-4", time: "14:00 - 15:30" },
    { id: "work-5", time: "15:30 - 17:00" },
    { id: "work-6", time: "17:00 - 18:30" },
    { id: "work-7", time: "18:30 - 20:00" },
];
export function WorkBlocksManager({ assignments, onAssign }) {
    const assignedAreas = Object.values(assignments).filter(Boolean);
    const hasUniOrEmpOrProj = assignedAreas.some(a => ["universidad", "emprendimiento", "proyectos"].includes(a));
    const hasIdiomas = assignedAreas.some(a => a === "idiomas");
    const meetsMinimum = hasUniOrEmpOrProj && hasIdiomas;
    const areaCounts = {};
    assignedAreas.forEach(a => { areaCounts[a] = (areaCounts[a] || 0) + 1; });
    return (_jsxs(Card, { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-bold", children: "\uD83C\uDFAF Bloques de Trabajo" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "7 bloques \u00B7 Asigna cada uno a un \u00E1rea" })] }), meetsMinimum ? (_jsxs(Badge, { className: "bg-green-500/20 text-green-600 border-green-500/30 gap-1", children: [_jsx(CheckCircle2, { className: "h-3 w-3" }), " M\u00EDnimo"] })) : (_jsxs(Badge, { variant: "destructive", className: "gap-1", children: [_jsx(AlertTriangle, { className: "h-3 w-3" }), " Falta"] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-4", children: [_jsxs("div", { className: cn("p-2 rounded-lg border text-xs text-center", hasUniOrEmpOrProj ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"), children: [hasUniOrEmpOrProj ? "✅" : "❌", " Uni/Emprend/Proy"] }), _jsxs("div", { className: cn("p-2 rounded-lg border text-xs text-center", hasIdiomas ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"), children: [hasIdiomas ? "✅" : "❌", " Idiomas"] })] }), _jsx("div", { className: "space-y-2 mb-4", children: WORK_BLOCKS.map(block => (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg border bg-background", children: [_jsx("span", { className: "text-xs font-mono w-24 shrink-0 text-muted-foreground", children: block.time }), _jsxs(Select, { value: assignments[block.id] || "", onValueChange: v => onAssign(block.id, v), children: [_jsx(SelectTrigger, { className: "h-8 text-sm flex-1", children: _jsx(SelectValue, { placeholder: "Seleccionar..." }) }), _jsx(SelectContent, { children: WORK_AREAS.map(area => {
                                        const AreaIcon = area.icon;
                                        return (_jsx(SelectItem, { value: area.id, children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx(AreaIcon, { className: cn("h-4 w-4", area.color) }), area.label] }) }, area.id));
                                    }) })] })] }, block.id))) }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: WORK_AREAS.map(area => {
                    const AreaIcon = area.icon;
                    const count = areaCounts[area.id] || 0;
                    return (_jsxs("div", { className: "text-center p-2 rounded-lg bg-muted/50", children: [_jsx(AreaIcon, { className: cn("h-5 w-5 mx-auto mb-1", area.color) }), _jsx("p", { className: "text-xl font-bold", children: count }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: area.label })] }, area.id));
                }) })] }));
}
