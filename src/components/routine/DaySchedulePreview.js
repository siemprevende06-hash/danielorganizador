import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Moon, GraduationCap, Briefcase, FolderKanban, Dumbbell, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
const FOCUS_ICONS = {
    universidad: GraduationCap,
    emprendimiento: Briefcase,
    proyectos: FolderKanban,
};
const FOCUS_COLORS = {
    universidad: 'text-blue-500',
    emprendimiento: 'text-purple-500',
    proyectos: 'text-green-500',
};
export function DaySchedulePreview({ date, blocks, excludedBlockIds, wakeTime, sleepTime, sleepHours, }) {
    const activeBlocks = useMemo(() => {
        return blocks.filter(block => !excludedBlockIds.includes(block.id));
    }, [blocks, excludedBlockIds]);
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayH}:${minutes} ${period}`;
    };
    const stats = useMemo(() => {
        let deepWorkBlocks = 0;
        let productiveHours = 0;
        activeBlocks.forEach(block => {
            if (block.blockType === 'configurable' || block.blockType === 'dinamico') {
                deepWorkBlocks++;
                const [startH, startM] = block.startTime.split(':').map(Number);
                let [endH, endM] = block.endTime.split(':').map(Number);
                if (endH < startH)
                    endH += 24;
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                productiveHours += duration / 60;
            }
        });
        return { deepWorkBlocks, productiveHours, sleepHours };
    }, [activeBlocks, sleepHours]);
    const getBlockIcon = (block) => {
        const focus = block.currentFocus || block.defaultFocus;
        if (focus && FOCUS_ICONS[focus]) {
            return FOCUS_ICONS[focus];
        }
        if (block.title.includes('Gym'))
            return Dumbbell;
        if (block.title.includes('Desayuno') || block.title.includes('Almuerzo'))
            return Coffee;
        return Clock;
    };
    const getBlockColor = (block) => {
        const focus = block.currentFocus || block.defaultFocus;
        if (focus && FOCUS_COLORS[focus]) {
            return FOCUS_COLORS[focus];
        }
        return 'text-muted-foreground';
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5" }), "Vista Previa: ", format(date, "EEEE d 'de' MMMM", { locale: es })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex gap-3 mb-4", children: [_jsxs(Badge, { variant: "secondary", className: "text-blue-500", children: ["\uD83C\uDFAF ", stats.deepWorkBlocks, " bloques productivos"] }), _jsxs(Badge, { variant: "secondary", className: "text-purple-500", children: ["\u23F0 ", stats.productiveHours.toFixed(1), "h trabajo"] }), _jsxs(Badge, { variant: "secondary", className: "text-indigo-500", children: ["\uD83D\uDE34 ", stats.sleepHours, "h sue\u00F1o"] })] }), _jsx(ScrollArea, { className: "h-[300px] pr-4", children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-3 py-2 px-3 bg-amber-500/10 rounded-lg", children: [_jsx("span", { className: "text-sm font-mono text-amber-500 w-20", children: formatTime(wakeTime) }), _jsxs("div", { className: "flex-1 flex items-center gap-2", children: [_jsx("span", { className: "text-amber-500", children: "\u2600\uFE0F" }), _jsx("span", { className: "font-medium", children: "Despertar" })] })] }), activeBlocks.map((block, index) => {
                                    const Icon = getBlockIcon(block);
                                    const color = getBlockColor(block);
                                    const isExcluded = excludedBlockIds.includes(block.id);
                                    const focus = block.currentFocus || block.defaultFocus;
                                    if (isExcluded)
                                        return null;
                                    return (_jsxs("div", { className: cn("flex items-center gap-3 py-2 px-3 rounded-lg transition-colors", (block.blockType === 'configurable' || block.blockType === 'dinamico')
                                            ? 'bg-primary/5 border border-primary/20'
                                            : 'hover:bg-muted/50'), children: [_jsx("span", { className: "text-sm font-mono text-muted-foreground w-20", children: formatTime(block.startTime) }), _jsxs("div", { className: "flex-1 flex items-center gap-2", children: [_jsx(Icon, { className: cn("h-4 w-4", color) }), _jsx("span", { className: cn("font-medium", block.blockType === 'evitar' && 'text-red-500'), children: block.title }), focus && focus !== 'none' && (_jsx(Badge, { variant: "outline", className: cn("text-xs", FOCUS_COLORS[focus]), children: focus === 'universidad' ? 'UNI' : focus === 'emprendimiento' ? 'EMP' : 'PROJ' }))] }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatTime(block.endTime) })] }, block.id));
                                }), _jsxs("div", { className: "flex items-center gap-3 py-2 px-3 bg-indigo-500/10 rounded-lg", children: [_jsx("span", { className: "text-sm font-mono text-indigo-500 w-20", children: formatTime(sleepTime) }), _jsxs("div", { className: "flex-1 flex items-center gap-2", children: [_jsx(Moon, { className: "h-4 w-4 text-indigo-500" }), _jsxs("span", { className: "font-medium text-indigo-500", children: ["Sue\u00F1o (", sleepHours, "h)"] })] })] })] }) }), excludedBlockIds.length > 0 && (_jsx("div", { className: "mt-4 pt-3 border-t border-border", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: [_jsx("span", { className: "text-red-500", children: "\u274C" }), " ", excludedBlockIds.length, " bloque", excludedBlockIds.length > 1 ? 's' : '', " excluido", excludedBlockIds.length > 1 ? 's' : '', " en esta configuraci\u00F3n"] }) }))] })] }));
}
