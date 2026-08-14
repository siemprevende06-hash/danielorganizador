import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SplitSquareVertical, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
export const SubBlockDivider = ({ canSubdivide, subBlocks, totalDuration, onSubBlocksChange, onToggleSubBlockComplete, }) => {
    const [isExpanded, setIsExpanded] = useState(subBlocks.length > 0);
    if (!canSubdivide)
        return null;
    const generateSubBlocks = (count) => {
        const durationPerBlock = Math.floor(totalDuration / count);
        const newSubBlocks = [];
        for (let i = 0; i < count; i++) {
            newSubBlocks.push({
                id: `sub-${Date.now()}-${i}`,
                title: `Pomodoro ${i + 1}`,
                duration: durationPerBlock,
                completed: false,
            });
        }
        onSubBlocksChange(newSubBlocks);
    };
    const updateSubBlockTitle = (id, title) => {
        onSubBlocksChange(subBlocks.map((sb) => (sb.id === id ? { ...sb, title } : sb)));
    };
    const removeSubBlock = (id) => {
        onSubBlocksChange(subBlocks.filter((sb) => sb.id !== id));
    };
    const completedCount = subBlocks.filter((sb) => sb.completed).length;
    const progress = subBlocks.length > 0 ? (completedCount / subBlocks.length) * 100 : 0;
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(SplitSquareVertical, { className: "h-4 w-4 text-muted-foreground" }), _jsx("label", { className: "text-sm font-medium", children: "Sub-bloques (30 min c/u)" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setIsExpanded(!isExpanded), children: isExpanded ? "Ocultar" : "Mostrar" })] }), isExpanded && (_jsx("div", { className: "space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50", children: subBlocks.length === 0 ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Divide este bloque en intervalos de 30 minutos" }), _jsx("div", { className: "flex flex-wrap gap-2", children: [2, 3, 4].map((count) => (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => generateSubBlocks(count), disabled: totalDuration < count * 30, children: [count, "x ", Math.floor(totalDuration / count), " min"] }, count))) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("div", { className: "flex-1 h-1.5 bg-secondary rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all", style: { width: `${progress}%` } }) }), _jsxs("span", { children: [completedCount, "/", subBlocks.length] })] }), _jsx("div", { className: "space-y-2", children: subBlocks.map((subBlock, index) => (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md border transition-all", subBlock.completed
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-background border-border/50 hover:bg-muted/50"), children: [_jsx(Checkbox, { checked: subBlock.completed, onCheckedChange: () => onToggleSubBlockComplete?.(subBlock.id) }), _jsx(Input, { value: subBlock.title, onChange: (e) => updateSubBlockTitle(subBlock.id, e.target.value), className: cn("flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0", subBlock.completed && "line-through text-muted-foreground") }), _jsxs(Badge, { variant: "outline", className: "text-xs gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), subBlock.duration, "m"] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 text-muted-foreground hover:text-destructive", onClick: () => removeSubBlock(subBlock.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }, subBlock.id))) }), _jsx(Button, { variant: "ghost", size: "sm", className: "w-full text-muted-foreground", onClick: () => onSubBlocksChange([]), children: "Eliminar divisi\u00F3n" })] })) }))] }));
};
