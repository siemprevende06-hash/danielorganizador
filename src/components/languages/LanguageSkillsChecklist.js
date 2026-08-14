import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, ExternalLink, Play } from 'lucide-react';
import { toneTextClass } from './skills';
export function LanguageSkillsChecklist({ skills, subTasks, activeSkillId, onToggle, onStartTimer, }) {
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base sm:text-lg", children: "Habilidades del d\u00EDa" }) }), _jsx(CardContent, { className: "space-y-2 sm:space-y-3", children: skills.map(skill => {
                    const sub = subTasks.find(t => t.id === skill.id);
                    const isCompleted = sub?.completed || false;
                    const isActive = activeSkillId === skill.id;
                    return (_jsxs("div", { className: cn('flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all border', isCompleted ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-transparent', isActive && 'ring-2 ring-primary'), children: [_jsx("button", { onClick: () => onToggle(skill.id), className: cn('w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0', isCompleted ? 'bg-success border-success' : 'border-muted-foreground/30'), "aria-label": isCompleted ? 'Marcar como pendiente' : 'Marcar como completada', children: isCompleted && _jsx(CheckCircle2, { className: "w-3 h-3 sm:w-4 sm:h-4 text-success-foreground" }) }), _jsx(skill.Icon, { className: cn('w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0', toneTextClass(skill.tone)) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn('font-medium text-xs sm:text-sm', isCompleted && 'line-through text-muted-foreground'), children: skill.label }), _jsxs("p", { className: "text-xs text-muted-foreground hidden sm:block", children: [sub?.durationMinutes, "min \u2022 ", skill.resource] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [skill.url && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => window.open(skill.url, '_blank'), children: _jsx(ExternalLink, { className: "w-3 h-3" }) })), !isCompleted && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: () => onStartTimer(skill.id), children: _jsx(Play, { className: "w-3 h-3" }) }))] })] }, skill.id));
                }) })] }));
}
