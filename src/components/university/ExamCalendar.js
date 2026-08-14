import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
export function ExamCalendar({ subjects }) {
    const allExams = subjects.flatMap(s => s.partialExams
        .filter(p => p.exam_date && p.status === 'pending')
        .map(p => ({ ...p, subjectName: s.name }))).sort((a, b) => {
        if (!a.exam_date || !b.exam_date)
            return 0;
        return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
    });
    const getUrgency = (examDate) => {
        const days = differenceInDays(parseISO(examDate), new Date());
        if (days < 0)
            return { level: 'past', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted' };
        if (days <= 3)
            return { level: 'urgent', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' };
        if (days <= 7)
            return { level: 'soon', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
        return { level: 'later', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    };
    if (allExams.length === 0) {
        return (_jsx(Card, { children: _jsxs(CardContent, { className: "py-8 text-center", children: [_jsx(Calendar, { className: "h-10 w-10 mx-auto text-muted-foreground mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Sin ex\u00E1menes pendientes" })] }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), "Pr\u00F3ximos Ex\u00E1menes"] }) }), _jsx(CardContent, { className: "space-y-2", children: allExams.slice(0, 8).map(exam => {
                    const urgency = getUrgency(exam.exam_date);
                    const days = differenceInDays(parseISO(exam.exam_date), new Date());
                    return (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-lg border ${urgency.bg} ${urgency.border}`, children: [_jsxs("div", { className: `text-center shrink-0 w-12 ${urgency.color}`, children: [_jsx("p", { className: "text-lg font-bold leading-none", children: format(parseISO(exam.exam_date), 'd') }), _jsx("p", { className: "text-[10px] uppercase", children: format(parseISO(exam.exam_date), 'MMM', { locale: es }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm truncate", children: exam.title }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: exam.subjectName })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [exam.weight_percentage, "%"] }), days <= 3 && days >= 0 && (_jsx(AlertTriangle, { className: "h-4 w-4 text-destructive" })), _jsx("span", { className: `text-xs font-medium ${urgency.color}`, children: days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `${days}d` })] })] }, exam.id));
                }) })] }));
}
