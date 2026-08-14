import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, CheckCircle2, Briefcase, GraduationCap, FolderKanban, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyTaskSelector } from "./DailyTaskSelector";
const getSourceIcon = (source) => {
    switch (source) {
        case "entrepreneurship":
            return _jsx(Briefcase, { className: "h-3 w-3" });
        case "university":
            return _jsx(GraduationCap, { className: "h-3 w-3" });
        case "project":
            return _jsx(FolderKanban, { className: "h-3 w-3" });
        default:
            return _jsx(ListTodo, { className: "h-3 w-3" });
    }
};
const getSourceLabel = (source) => {
    switch (source) {
        case "entrepreneurship":
            return "Emprendimiento";
        case "university":
            return "Universidad";
        case "project":
            return "Proyecto";
        default:
            return "General";
    }
};
export const DailyPlanChecklist = ({ tasks, completedTaskIds, onTasksChange, onToggleComplete, onRemoveTask, planDate, onPlanDateChange, }) => {
    const completedCount = completedTaskIds.size;
    const totalCount = tasks.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }), "Plan del D\u00EDa"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: planDate === "today" ? "default" : "outline", size: "sm", onClick: () => onPlanDateChange("today"), children: "Hoy" }), _jsx(Button, { variant: planDate === "tomorrow" ? "default" : "outline", size: "sm", onClick: () => onPlanDateChange("tomorrow"), children: "Ma\u00F1ana" })] })] }), totalCount > 0 && (_jsxs("div", { className: "space-y-2 pt-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso" }), _jsxs("span", { className: "font-medium", children: [completedCount, "/", totalCount] })] }), _jsx(Progress, { value: progressPercentage, className: "h-2" })] }))] }), _jsxs(CardContent, { className: "space-y-3", children: [tasks.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsxs("p", { className: "mb-4", children: ["No hay tareas planificadas para ", planDate === "today" ? "hoy" : "mañana"] }), _jsx(DailyTaskSelector, { selectedTasks: tasks, onTasksChange: onTasksChange })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "space-y-2", children: tasks.map(task => (_jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg border transition-all", completedTaskIds.has(task.id)
                                        ? "bg-green-500/10 border-green-500/30"
                                        : "hover:bg-muted/50"), children: [_jsx(Checkbox, { checked: completedTaskIds.has(task.id), onCheckedChange: () => onToggleComplete(task.id), className: "mt-1" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn("font-medium text-sm", completedTaskIds.has(task.id) && "line-through text-muted-foreground"), children: task.title }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground truncate", children: task.description })), _jsx("div", { className: "flex items-center gap-2 mt-1", children: _jsxs(Badge, { variant: "outline", className: "text-xs gap-1", children: [getSourceIcon(task.source), task.sourceName || getSourceLabel(task.source)] }) })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: () => onRemoveTask(task.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, task.id))) }), _jsx("div", { className: "pt-2", children: _jsx(DailyTaskSelector, { selectedTasks: tasks, onTasksChange: onTasksChange }) })] })), totalCount > 0 && progressPercentage === 100 && (_jsxs("div", { className: "text-center py-4 bg-green-500/10 rounded-lg border border-green-500/30", children: [_jsx(CheckCircle2, { className: "h-8 w-8 text-green-500 mx-auto mb-2" }), _jsx("p", { className: "font-medium text-green-600 dark:text-green-400", children: "\u00A1Todas las tareas completadas!" })] }))] })] }));
};
