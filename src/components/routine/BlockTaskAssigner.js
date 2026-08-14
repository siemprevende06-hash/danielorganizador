import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, Briefcase, FolderKanban, ListTodo } from "lucide-react";
const getSourceIcon = (source) => {
    switch (source) {
        case "university":
            return _jsx(BookOpen, { className: "h-3 w-3" });
        case "entrepreneurship":
            return _jsx(Briefcase, { className: "h-3 w-3" });
        case "project":
            return _jsx(FolderKanban, { className: "h-3 w-3" });
        default:
            return _jsx(ListTodo, { className: "h-3 w-3" });
    }
};
const getSourceColor = (source) => {
    switch (source) {
        case "university":
            return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        case "entrepreneurship":
            return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        case "project":
            return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        default:
            return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
};
export const BlockTaskAssigner = ({ open, onOpenChange, blockId, blockTitle, dailyTasks, onAssignTasks, }) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
        const assigned = dailyTasks
            .filter((t) => t.routine_block_id === blockId)
            .map((t) => t.id);
        return new Set(assigned);
    });
    const toggleTask = (taskId) => {
        setSelectedTaskIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            }
            else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };
    const handleSave = () => {
        onAssignTasks(Array.from(selectedTaskIds));
        onOpenChange(false);
    };
    // Filter tasks that are either unassigned or assigned to this block
    const availableTasks = dailyTasks.filter((t) => !t.routine_block_id || t.routine_block_id === blockId);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-md max-h-[80vh] overflow-hidden flex flex-col", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Asignar Tareas a: ", blockTitle] }) }), _jsx("div", { className: "flex-1 overflow-y-auto space-y-2 py-4", children: availableTasks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "No hay tareas disponibles. Agrega tareas al Plan del D\u00EDa primero." })) : (availableTasks.map((task) => (_jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", selectedTaskIds.has(task.id)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted/50 border-border"), onClick: () => toggleTask(task.id), children: [_jsx(Checkbox, { checked: selectedTaskIds.has(task.id), onCheckedChange: () => toggleTask(task.id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn("text-sm font-medium truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), _jsx("div", { className: "flex items-center gap-2 mt-1", children: _jsxs(Badge, { variant: "outline", className: cn("text-xs", getSourceColor(task.source)), children: [getSourceIcon(task.source), _jsx("span", { className: "ml-1", children: task.sourceName ||
                                                        (task.source === "tasks" ? "General" : task.source) })] }) })] })] }, task.id)))) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsxs(Button, { onClick: handleSave, children: ["Guardar (", selectedTaskIds.size, " tareas)"] })] })] }) }));
};
