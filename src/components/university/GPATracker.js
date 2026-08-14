import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, BookOpen } from 'lucide-react';
export function GPATracker({ gpaData, overallGPA }) {
    const getGradeColor = (grade) => {
        if (grade === null)
            return 'text-muted-foreground';
        if (grade >= 80)
            return 'text-green-600';
        if (grade >= 60)
            return 'text-yellow-600';
        return 'text-destructive';
    };
    const getGradeBg = (grade) => {
        if (grade === null)
            return 'bg-muted';
        if (grade >= 80)
            return 'bg-green-500/10';
        if (grade >= 60)
            return 'bg-yellow-500/10';
        return 'bg-destructive/10';
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Award, { className: "h-5 w-5 text-primary" }), "Rendimiento Acad\u00E9mico"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: `p-4 rounded-lg text-center ${getGradeBg(overallGPA)}`, children: [_jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Promedio General" }), _jsx("p", { className: `text-4xl font-bold mt-1 ${getGradeColor(overallGPA)}`, children: overallGPA !== null ? overallGPA.toFixed(1) : '—' }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [gpaData.length, " asignaturas inscritas"] })] }), _jsxs("div", { className: "space-y-3", children: [gpaData.map(subject => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0 flex-1", children: [_jsx(BookOpen, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }), _jsx("span", { className: "text-sm font-medium truncate", children: subject.subjectName })] }), _jsx("span", { className: `text-sm font-bold ${getGradeColor(subject.weightedAverage)}`, children: subject.weightedAverage !== null ? subject.weightedAverage.toFixed(1) : '—' })] }), _jsx("div", { className: "flex gap-1.5 flex-wrap ml-5", children: subject.partialGrades.map((partial, i) => (_jsxs(Badge, { variant: "outline", className: `text-[10px] ${partial.grade !== null
                                                ? partial.grade >= 60
                                                    ? 'border-green-500/30 text-green-600'
                                                    : 'border-destructive/30 text-destructive'
                                                : ''}`, children: [partial.title, ": ", partial.grade !== null ? partial.grade : '—', " (", partial.weight, "%)"] }, i))) }), subject.weightedAverage !== null && (_jsx(Progress, { value: Math.min(100, subject.weightedAverage), className: "h-1 ml-5" }))] }, subject.subjectId))), gpaData.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Agrega asignaturas para ver tu rendimiento" }))] })] })] }));
}
