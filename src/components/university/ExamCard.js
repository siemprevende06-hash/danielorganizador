import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { differenceInDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Clock, BookOpen, PenTool, TrendingUp, Calendar } from 'lucide-react';
export function ExamCard({ exam, onUpdateProgress, onDelete }) {
    const examDate = parseISO(exam.exam_date);
    const daysRemaining = differenceInDays(examDate, new Date());
    const studyProgress = exam.target_study_hours > 0
        ? Math.min(100, (exam.current_study_hours / exam.target_study_hours) * 100)
        : 0;
    const exerciseProgress = exam.target_exercises > 0
        ? Math.min(100, (exam.current_exercises / exam.target_exercises) * 100)
        : 0;
    const overallProgress = (studyProgress + exerciseProgress) / 2;
    const getUrgencyColor = () => {
        if (daysRemaining < 0)
            return 'text-muted-foreground';
        if (daysRemaining <= 3)
            return 'text-destructive';
        if (daysRemaining <= 7)
            return 'text-yellow-500';
        return 'text-green-500';
    };
    const getUrgencyBg = () => {
        if (daysRemaining < 0)
            return 'bg-muted';
        if (daysRemaining <= 3)
            return 'bg-destructive/10';
        if (daysRemaining <= 7)
            return 'bg-yellow-500/10';
        return 'bg-green-500/10';
    };
    const getStatusText = () => {
        if (exam.status === 'completed')
            return 'Completado';
        if (exam.status === 'passed')
            return `Aprobado: ${exam.grade}`;
        if (exam.status === 'failed')
            return `Reprobado: ${exam.grade}`;
        if (daysRemaining < 0)
            return 'Examen pasado';
        if (daysRemaining === 0)
            return '¡Hoy es el examen!';
        if (daysRemaining === 1)
            return 'Mañana';
        return `${daysRemaining} días restantes`;
    };
    return (_jsx(Card, { className: `${getUrgencyBg()} border-l-4 ${daysRemaining <= 3 && daysRemaining >= 0 ? 'border-l-destructive' : daysRemaining <= 7 && daysRemaining >= 0 ? 'border-l-yellow-500' : 'border-l-green-500'}`, children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h4", { className: "font-semibold flex items-center gap-2", children: [_jsx(PenTool, { className: "h-4 w-4" }), exam.title] }), _jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-1 mt-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), format(examDate, "d 'de' MMMM, yyyy", { locale: es })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-sm font-medium ${getUrgencyColor()}`, children: getStatusText() }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => onDelete(exam.id), children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] })] }), exam.status === 'pending' && daysRemaining >= 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { children: [_jsx("span", { className: "font-medium", children: exam.current_study_hours }), _jsxs("span", { className: "text-muted-foreground", children: ["/", exam.target_study_hours, "h"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BookOpen, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { children: [_jsx("span", { className: "font-medium", children: exam.current_exercises }), _jsxs("span", { className: "text-muted-foreground", children: ["/", exam.target_exercises, " ejercicios"] })] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(TrendingUp, { className: "h-3 w-3" }), "Progreso"] }), _jsxs("span", { className: "font-medium", children: [Math.round(overallProgress), "%"] })] }), _jsx(Progress, { value: overallProgress, className: "h-2" })] }), exam.topics && (_jsxs("p", { className: "text-xs text-muted-foreground", children: [_jsx("span", { className: "font-medium", children: "Temas:" }), " ", exam.topics] })), _jsx(Button, { variant: "outline", size: "sm", className: "w-full", onClick: () => onUpdateProgress(exam), children: "Actualizar Progreso" })] })), exam.grade !== null && (_jsxs("div", { className: "text-center py-2", children: [_jsx("span", { className: "text-2xl font-bold", children: exam.grade }), _jsx("span", { className: "text-muted-foreground", children: "/100" })] }))] }) }));
}
