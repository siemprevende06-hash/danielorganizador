import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
export const LanguageSubTasks = ({ subTasks, onToggleTask, blockType, currentLanguage, }) => {
    const completedCount = subTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / subTasks.length) * 100);
    const totalMinutes = subTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
    const languageLabel = currentLanguage === 'english' ? '🇬🇧 Inglés' : '🇮🇹 Italiano';
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: languageLabel }), _jsx(Badge, { variant: "outline", className: "text-xs", children: blockType === 'morning' ? '90 min' : '30 min' })] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [completedCount, "/", subTasks.length, " completadas"] })] }), _jsx(Progress, { value: progress, className: "h-2" })] }), _jsx("div", { className: "space-y-2", children: subTasks.map((task, index) => {
                    const isActive = !task.completed && index === subTasks.findIndex(t => !t.completed);
                    return (_jsx(Card, { className: cn("p-3 transition-all", task.completed && "bg-muted/50 opacity-75", isActive && "ring-2 ring-primary bg-primary/5"), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => onToggleTask(task.id, blockType), className: "mt-1" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-lg", children: task.icon }), _jsx("span", { className: cn("font-medium", task.completed && "line-through text-muted-foreground"), children: task.name }), _jsxs(Badge, { variant: isActive ? "default" : "secondary", className: "text-xs", children: [task.durationMinutes, " min"] }), isActive && (_jsx(Badge, { variant: "outline", className: "text-xs bg-primary/10 text-primary border-primary/30", children: "\u25B6 Activo" }))] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: task.description }), task.resource && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["\uD83D\uDCF1 ", task.resource] }))] }), task.completed && (_jsx("span", { className: "text-green-500 text-lg", children: "\u2705" }))] }) }, task.id));
                }) }), _jsxs("div", { className: "text-center text-sm text-muted-foreground pt-2 border-t", children: ["Tiempo total: ", totalMinutes, " minutos \u2022 Progreso: ", progress, "%"] })] }));
};
