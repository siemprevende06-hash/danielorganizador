import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusedDayRoutine } from "@/lib/data";
export default function CurrentRoutineBlock() {
    const [completedTasks, setCompletedTasks] = useState(new Set());
    const currentHour = new Date().getHours();
    const getCurrentBlock = () => {
        return focusedDayRoutine.find((block) => {
            if (!block.startTime || !block.endTime)
                return false;
            const [startHour] = block.startTime.split(":").map(Number);
            const [endHour] = block.endTime.split(":").map(Number);
            return currentHour >= startHour && currentHour < endHour;
        });
    };
    const currentBlock = getCurrentBlock();
    const toggleTask = (blockId, taskIndex) => {
        const key = `${blockId}-${taskIndex}`;
        setCompletedTasks((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            }
            else {
                newSet.add(key);
            }
            return newSet;
        });
    };
    if (!currentBlock) {
        return (_jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [_jsx(Clock, { className: "h-12 w-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "No hay bloque de rutina activo en este momento" })] }));
    }
    const totalTasks = currentBlock.tasks.length;
    const completedCount = currentBlock.tasks.filter((_, idx) => completedTasks.has(`${currentBlock.id}-${idx}`)).length;
    const progress = (completedCount / totalTasks) * 100;
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: currentBlock.title }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [currentBlock.startTime, " - ", currentBlock.endTime] })] }), _jsx(Badge, { variant: currentBlock.isFocusBlock ? "default" : "secondary", children: currentBlock.isFocusBlock ? "Foco Profundo" : "Rutina" })] }), _jsx("div", { className: "space-y-2", children: currentBlock.tasks.map((task, idx) => {
                    const key = `${currentBlock.id}-${idx}`;
                    const isCompleted = completedTasks.has(key);
                    return (_jsxs("div", { className: cn("flex items-center gap-3 p-3 rounded-md border transition-all", isCompleted && "bg-muted/50"), children: [_jsx(Checkbox, { checked: isCompleted, onCheckedChange: () => toggleTask(currentBlock.id, idx) }), _jsx("span", { className: cn(isCompleted && "line-through text-muted-foreground"), children: task }), isCompleted && _jsx(CheckCircle2, { className: "h-4 w-4 ml-auto text-success" })] }, idx));
                }) }), _jsx("div", { className: "pt-4 border-t", children: _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso" }), _jsxs("span", { className: "font-semibold", children: [Math.round(progress), "%"] })] }) })] }));
}
