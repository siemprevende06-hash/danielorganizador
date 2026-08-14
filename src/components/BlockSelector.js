import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoutineBlocks, formatTimeDisplay } from '@/hooks/useRoutineBlocks';
import { Clock } from 'lucide-react';
export function BlockSelector({ value, onValueChange, placeholder = "Selecciona un bloque" }) {
    const { blocks, isLoaded } = useRoutineBlocks();
    if (!isLoaded) {
        return (_jsx(Select, { disabled: true, children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Cargando bloques..." }) }) }));
    }
    return (_jsxs(Select, { value: value, onValueChange: onValueChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: placeholder }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Sin bloque asignado" }), blocks.map(block => (_jsx(SelectItem, { value: block.id, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { children: block.title }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", formatTimeDisplay(block.startTime), " - ", formatTimeDisplay(block.endTime), ")"] })] }) }, block.id)))] })] }));
}
