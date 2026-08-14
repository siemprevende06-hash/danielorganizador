import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, ArrowRight, Target, AlertTriangle } from 'lucide-react';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useBlockCompletions } from '@/hooks/useBlockCompletions';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
export const DailyGuide = () => {
    const { blocks } = useRoutineBlocksDB();
    const { completions } = useBlockCompletions();
    const { objectives } = useWeeklyObjectives();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinutes;
    const weekStartStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    // Find current block
    const currentBlock = blocks.find(block => {
        const [startH, startM] = block.startTime.split(':').map(Number);
        const [endH, endM] = block.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
    });
    // Find next block
    const nextBlock = blocks.find(block => {
        const [startH, startM] = block.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        return startMinutes > currentTimeMinutes;
    });
    // Get completed blocks for today
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayCompletions = completions.filter(c => c.completion_date === today && c.completed);
    const completedBlockNames = todayCompletions.map(c => {
        const block = blocks.find(b => b.id === c.block_id);
        return block?.title || '';
    }).filter(Boolean);
    // Get current week objectives
    const weekObjectives = objectives.filter(o => o.week_start_date === weekStartStr);
    const lowProgressObjectives = weekObjectives.filter(o => {
        const percent = o.target_value ? ((o.current_value || 0) / o.target_value) * 100 : 0;
        return percent < 40;
    });
    // Calculate time remaining in current block
    const getTimeRemaining = () => {
        if (!currentBlock)
            return null;
        const [endH, endM] = currentBlock.endTime.split(':').map(Number);
        const endMinutes = endH * 60 + endM;
        const remaining = endMinutes - currentTimeMinutes;
        return remaining;
    };
    const timeRemaining = getTimeRemaining();
    // Find related weekly objective for current block
    const getRelatedObjective = () => {
        if (!currentBlock)
            return null;
        const blockTitle = currentBlock.title.toLowerCase();
        const areaMapping = {
            'universidad': ['estudio', 'study', 'universidad', 'uni', 'fisica', 'math'],
            'emprendimiento': ['emprendimiento', 'trabajo', 'project', 'siemprevende', 'business'],
            'gym': ['gym', 'ejercicio', 'workout', 'fitness', 'entreno'],
            'idiomas': ['idiomas', 'english', 'ingles', 'italiano', 'language'],
        };
        for (const [area, keywords] of Object.entries(areaMapping)) {
            if (keywords.some(kw => blockTitle.includes(kw))) {
                return weekObjectives.find(o => o.area?.toLowerCase() === area);
            }
        }
        return null;
    };
    const relatedObjective = getRelatedObjective();
    return (_jsx(Card, { className: "border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background", children: _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "text-sm font-medium text-muted-foreground", children: format(now, "h:mm a", { locale: es }) })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: "\uD83E\uDDED Gu\u00EDa del D\u00EDa" })] }), _jsx("div", { className: "space-y-2", children: currentBlock ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Est\u00E1s en:" }), _jsx("span", { className: "font-bold text-lg", children: currentBlock.title })] }), timeRemaining && (_jsx("div", { className: "flex items-center gap-2 text-sm", children: _jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["\u23F3 ", timeRemaining, " min restantes"] }) }))] })) : (_jsx("div", { className: "text-sm text-muted-foreground", children: "Sin bloque activo en este momento" })) }), relatedObjective && (_jsxs("div", { className: "flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-lg", children: [_jsx(Target, { className: "w-4 h-4 text-primary mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Objetivo semanal: " }), _jsx("span", { className: "font-medium", children: relatedObjective.title }), _jsx("span", { className: "text-muted-foreground", children: " \u2014 " }), _jsxs("span", { className: "font-mono text-xs", children: [relatedObjective.current_value || 0, "/", relatedObjective.target_value || 1, "(", Math.round(((relatedObjective.current_value || 0) / (relatedObjective.target_value || 1)) * 100), "%)"] })] })] })), completedBlockNames.length > 0 && (_jsxs("div", { className: "flex items-start gap-2 text-sm", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Ya completaste: " }), _jsxs("span", { className: "text-foreground", children: [completedBlockNames.slice(0, 3).join(', '), completedBlockNames.length > 3 && ` y ${completedBlockNames.length - 3} más`] })] })] })), nextBlock && (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(ArrowRight, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-muted-foreground", children: "Pr\u00F3ximo:" }), _jsx("span", { className: "font-medium", children: nextBlock.title }), _jsxs("span", { className: "text-muted-foreground", children: ["(", nextBlock.startTime, ")"] })] })), lowProgressObjectives.length > 0 && (_jsxs("div", { className: cn("flex items-start gap-2 p-2 rounded-lg", "bg-destructive/10 border border-destructive/20"), children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-destructive mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium text-destructive", children: "Objetivos con bajo progreso:" }), _jsx("ul", { className: "text-muted-foreground text-xs mt-1", children: lowProgressObjectives.slice(0, 2).map(o => (_jsxs("li", { children: ["\u2022 ", o.title, " (", Math.round(((o.current_value || 0) / (o.target_value || 1)) * 100), "%)"] }, o.id))) })] })] }))] }) }));
};
