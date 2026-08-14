import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Flag, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
export function SprintHeader({ sprint, onComplete, onDelete }) {
    const isActive = sprint.status === 'active';
    const isCompleted = sprint.status === 'completed';
    const daysLeft = Math.ceil((new Date(sprint.end_date).getTime() - new Date().getTime()) / 86400000);
    const totalDays = Math.ceil((new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / 86400000);
    const daysElapsed = totalDays - daysLeft;
    const progress = Math.round((daysElapsed / totalDays) * 100);
    const focoObjectives = sprint.objectives.filter(o => o.type === 'foco');
    const mejoraObjectives = sprint.objectives.filter(o => o.type === 'mejora');
    const completedFoco = focoObjectives.filter(o => o.status === 'completed').length;
    const focoProgress = focoObjectives.length > 0 ? Math.round((completedFoco / focoObjectives.length) * 100) : 0;
    return (_jsx(Card, { className: cn("overflow-hidden border-2", isActive ? "border-primary/30" : isCompleted ? "border-green-500/30" : "border-muted"), children: _jsxs("div", { className: cn("p-4", isActive ? "bg-gradient-to-r from-primary/10 to-primary/5" :
                isCompleted ? "bg-gradient-to-r from-green-500/10 to-green-500/5" :
                    "bg-muted/30"), children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Flag, { className: cn("h-5 w-5", isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground") }), _jsx("h2", { className: "text-xl font-bold", children: sprint.name }), _jsx(Badge, { variant: isActive ? "default" : isCompleted ? "secondary" : "outline", className: "text-[10px]", children: isActive ? 'Activo' : isCompleted ? 'Completado' : 'Cancelado' })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CalendarDays, { className: "h-3 w-3" }), format(new Date(sprint.start_date), 'd MMM', { locale: es }), " \u2014 ", format(new Date(sprint.end_date), 'd MMM', { locale: es })] }), isActive && (_jsx(Badge, { variant: "outline", className: "text-[10px]", children: daysLeft > 0 ? `${daysLeft} días restantes` : 'Último día' }))] })] }), isActive && (_jsxs("div", { className: "flex gap-2", children: [onComplete && (_jsxs(Button, { size: "sm", variant: "default", className: "h-8 text-xs gap-1", onClick: onComplete, children: [_jsx(CheckCircle2, { className: "h-3 w-3" }), " Completar"] })), onDelete && (_jsx(Button, { size: "sm", variant: "ghost", className: "h-8 text-xs gap-1 text-destructive", onClick: onDelete, children: _jsx(XCircle, { className: "h-3 w-3" }) }))] }))] }), isActive && (_jsxs("div", { className: "mt-3 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground", children: [_jsxs("span", { children: ["D\u00EDa ", daysElapsed, "/", totalDays] }), _jsxs("span", { children: [progress, "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all", style: { width: `${progress}%` } }) })] })), _jsxs("div", { className: "flex gap-4 mt-3 text-xs", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: focoObjectives.length }), _jsx("span", { className: "text-muted-foreground ml-1", children: "objetivos foco" })] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: mejoraObjectives.length }), _jsx("span", { className: "text-muted-foreground ml-1", children: "objetivos mejora" })] }), focoObjectives.length > 0 && (_jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [completedFoco, "/", focoObjectives.length] }), _jsx("span", { className: "text-muted-foreground ml-1", children: "completados" })] }))] })] }) }));
}
