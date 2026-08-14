import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
export function DailyPillarSummary({ pillars, ratings, onRatingChange, onNotesChange }) {
    const getRating = (pillarId) => {
        return ratings.find(r => r.pillarId === pillarId)?.rating || 0;
    };
    const getNotes = (pillarId) => {
        return ratings.find(r => r.pillarId === pillarId)?.notes || '';
    };
    const getProgressColor = (percentage) => {
        if (percentage >= 80)
            return 'text-green-500';
        if (percentage >= 50)
            return 'text-yellow-500';
        if (percentage > 0)
            return 'text-orange-500';
        return 'text-muted-foreground';
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "\uD83D\uDCCA Evaluaci\u00F3n por Pilares" }), _jsx("div", { className: "space-y-4", children: pillars.map(pillar => {
                    const rating = getRating(pillar.id);
                    const notes = getNotes(pillar.id);
                    return (_jsxs("div", { className: "p-4 rounded-lg border bg-card space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: pillar.icon }), _jsx("span", { className: "font-semibold", children: pillar.name })] }), _jsxs("span", { className: cn("font-bold", getProgressColor(pillar.percentage)), children: [pillar.percentage, "%"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [_jsx("span", { children: "Progreso Objetivo" }), _jsxs("span", { children: [pillar.tasksCompleted, "/", pillar.tasksTotal, " tareas"] })] }), _jsx(Progress, { value: pillar.percentage, className: "h-2" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Mi Calificaci\u00F3n" }), _jsxs("div", { className: "flex gap-1", children: [[1, 2, 3, 4, 5].map(star => (_jsx("button", { onClick: () => onRatingChange(pillar.id, star), className: "p-1 hover:scale-110 transition-transform", children: _jsx(Star, { className: cn("w-5 h-5 transition-colors", star <= rating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-muted-foreground") }) }, star))), _jsxs("span", { className: "ml-2 text-sm text-muted-foreground", children: ["(", rating, "/5)"] })] })] }), _jsx(Textarea, { placeholder: `Notas sobre ${pillar.name}...`, value: notes, onChange: (e) => onNotesChange(pillar.id, e.target.value), className: "min-h-[60px] text-sm" })] }, pillar.id));
                }) })] }));
}
