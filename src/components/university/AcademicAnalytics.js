import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, BookOpen, CheckCircle2, TrendingUp, Target } from 'lucide-react';
export function AcademicAnalytics({ subjects, gpaData }) {
    const stats = useMemo(() => {
        const allTasks = subjects.flatMap(s => s.tasks);
        const completedTasks = allTasks.filter(t => t.completed);
        const deliveryTasks = allTasks.filter(t => t.task_type === 'delivery');
        const completedDelivery = deliveryTasks.filter(t => t.completed);
        const studyTasks = allTasks.filter(t => t.task_type === 'study');
        const completedStudy = studyTasks.filter(t => t.completed);
        const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
        const allPartials = subjects.flatMap(s => s.partialExams);
        const gradedPartials = allPartials.filter(p => p.grade !== null && p.grade !== undefined);
        const passedPartials = gradedPartials.filter(p => p.grade >= 60);
        const avgGrade = gradedPartials.length > 0
            ? gradedPartials.reduce((sum, p) => sum + p.grade, 0) / gradedPartials.length
            : null;
        return {
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,
            taskCompletionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
            deliveryTotal: deliveryTasks.length,
            deliveryDone: completedDelivery.length,
            studyTotal: studyTasks.length,
            studyDone: completedStudy.length,
            totalTopics,
            totalPartials: allPartials.length,
            gradedPartials: gradedPartials.length,
            passedPartials: passedPartials.length,
            passRate: gradedPartials.length > 0 ? (passedPartials.length / gradedPartials.length) * 100 : null,
            avgGrade,
        };
    }, [subjects]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mx-auto text-green-600 mb-1" }), _jsxs("p", { className: "text-xl font-bold", children: [stats.completedTasks, "/", stats.totalTasks] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Tareas Completadas" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(Target, { className: "h-5 w-5 mx-auto text-primary mb-1" }), _jsxs("p", { className: "text-xl font-bold", children: [Math.round(stats.taskCompletionRate), "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Tasa de Completaci\u00F3n" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(TrendingUp, { className: "h-5 w-5 mx-auto text-yellow-600 mb-1" }), _jsx("p", { className: "text-xl font-bold", children: stats.avgGrade !== null ? stats.avgGrade.toFixed(1) : '—' }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Nota Promedio" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(BarChart3, { className: "h-5 w-5 mx-auto text-green-600 mb-1" }), _jsx("p", { className: "text-xl font-bold", children: stats.passRate !== null ? `${Math.round(stats.passRate)}%` : '—' }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Tasa de Aprobaci\u00F3n" })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(BookOpen, { className: "h-4 w-4" }), "Rendimiento por Asignatura"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [subjects.map(subject => {
                                const tasks = subject.tasks;
                                const completedCount = tasks.filter(t => t.completed).length;
                                const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
                                const gpa = gpaData.find(g => g.subjectId === subject.id);
                                return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: subject.name }), _jsxs("div", { className: "flex items-center gap-2", children: [gpa?.weightedAverage !== null && gpa?.weightedAverage !== undefined && (_jsx(Badge, { variant: "outline", className: `text-xs ${gpa.weightedAverage >= 70
                                                                ? 'border-green-500/40 text-green-600'
                                                                : gpa.weightedAverage >= 50
                                                                    ? 'border-yellow-500/40 text-yellow-600'
                                                                    : 'border-destructive/40 text-destructive'}`, children: gpa.weightedAverage.toFixed(1) })), _jsxs("span", { className: "text-xs text-muted-foreground", children: [completedCount, "/", tasks.length] })] })] }), _jsx(Progress, { value: progress, className: "h-1.5" }), _jsxs("div", { className: "flex gap-3 text-[10px] text-muted-foreground", children: [_jsxs("span", { children: [subject.topics.length, " temas"] }), _jsxs("span", { children: [subject.partialExams.length, " parciales"] }), _jsxs("span", { children: [tasks.filter(t => t.task_type === 'delivery').length, " entregas"] })] })] }, subject.id));
                            }), subjects.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Sin asignaturas registradas" }))] })] })] }));
}
