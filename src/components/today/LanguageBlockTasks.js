import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { cn } from '@/lib/utils';
export function LanguageBlockTasks({ blockDurationMinutes, blockType }) {
    const { currentLanguage, getSubTasksForDuration, toggleSubTask, getProgress, isLoading } = useLanguageLearning();
    const subTasks = getSubTasksForDuration(blockDurationMinutes);
    const progress = getProgress();
    if (isLoading) {
        return (_jsx("div", { className: "animate-pulse space-y-2", children: [1, 2, 3, 4, 5].map(i => (_jsx("div", { className: "h-12 bg-muted rounded" }, i))) }));
    }
    const languageLabel = currentLanguage === 'english' ? '🇬🇧 Inglés' : '🇮🇹 Italiano';
    const totalMinutes = subTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "secondary", className: "gap-1", children: languageLabel }), _jsx("span", { className: "text-xs text-muted-foreground", children: blockType === 'morning' ? 'Bloque completo' : 'Bloque reducido' })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: [totalMinutes, " min"] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso de idiomas" }), _jsxs("span", { className: "font-medium", children: [progress.completed, "/", progress.total, " tareas"] })] }), _jsx(Progress, { value: progress.percentage, className: "h-1.5" })] }), _jsx("div", { className: "space-y-2", children: subTasks.map((task) => (_jsx(LanguageSubTaskItem, { task: task, onToggle: () => toggleSubTask(task.id, blockType) }, task.id))) })] }));
}
function LanguageSubTaskItem({ task, onToggle }) {
    return (_jsxs("div", { className: cn("flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer", task.completed
            ? "bg-muted/50 border-border"
            : "bg-card border-border hover:bg-muted/30"), onClick: onToggle, children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: _jsx(Checkbox, { checked: task.completed, onCheckedChange: onToggle, onClick: (e) => e.stopPropagation() }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: task.icon }), _jsx("span", { className: cn("font-medium", task.completed && "line-through text-muted-foreground"), children: task.name }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [task.durationMinutes, " min"] }), task.completed && (_jsx(CheckCircle2, { className: "w-4 h-4 text-success ml-auto" }))] }), _jsx("p", { className: cn("text-xs mt-1", task.completed ? "text-muted-foreground/60" : "text-muted-foreground"), children: task.description }), task.resource && (_jsxs("p", { className: cn("text-xs mt-1 font-medium", task.completed ? "text-muted-foreground/60" : "text-primary/80"), children: ["\uD83D\uDCF1 ", task.resource] }))] })] }));
}
