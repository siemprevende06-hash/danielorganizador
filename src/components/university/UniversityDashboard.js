import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, } from 'recharts';
import { AlertTriangle, Award, BookOpen, CheckCircle2, ClipboardList, GraduationCap, Target, TrendingUp } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const getUrgency = (days) => days <= 1 ? 'danger' : 'warning';
export function UniversityDashboard({ subjects, gpaData, overallGPA, studyByDay }) {
    const stats = useMemo(() => {
        const allTasks = subjects.flatMap(s => s.tasks);
        const completedTasks = allTasks.filter(t => t.completed);
        const approved = subjects.filter(s => s.approved);
        const inProgress = subjects.filter(s => !s.approved);
        const avg = overallGPA;
        return {
            approved: approved.length,
            inProgress: inProgress.length,
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,
            completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
            avg,
        };
    }, [subjects, overallGPA]);
    const alerts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const list = [];
        subjects.forEach(s => {
            if (s.approved)
                return;
            s.tasks.forEach(t => {
                if (t.completed || t.task_type !== 'delivery' || !t.due_date)
                    return;
                const days = differenceInCalendarDays(parseISO(t.due_date), today);
                if (days < 0 || days <= 3) {
                    list.push({
                        id: t.id,
                        type: 'delivery',
                        title: t.title,
                        subject: s.name,
                        days,
                        urgency: getUrgency(days),
                    });
                }
            });
            s.partialExams.forEach(p => {
                if (p.grade !== null && p.grade !== undefined)
                    return;
                if (!p.exam_date)
                    return;
                const days = differenceInCalendarDays(parseISO(p.exam_date), today);
                if (days < 0 || days <= 7) {
                    list.push({
                        id: p.id,
                        type: 'exam',
                        title: p.title,
                        subject: s.name,
                        days,
                        urgency: getUrgency(days),
                    });
                }
            });
        });
        return list.sort((a, b) => a.days - b.days).slice(0, 8);
    }, [subjects]);
    const gradeData = useMemo(() => {
        return gpaData
            .filter(g => g.weightedAverage !== null)
            .map(g => ({ name: g.subjectName, promedio: Number(g.weightedAverage.toFixed(1)) }));
    }, [gpaData]);
    const taskPie = useMemo(() => {
        const pending = stats.totalTasks - stats.completedTasks;
        return [
            { name: 'Completadas', value: stats.completedTasks },
            { name: 'Pendientes', value: pending },
        ].filter(d => d.value > 0);
    }, [stats]);
    const subjectProgress = useMemo(() => {
        const inProgress = subjects.filter(s => !s.approved);
        return inProgress.length > 0
            ? inProgress.map(s => {
                const done = s.tasks.filter(t => t.completed).length;
                const total = s.tasks.length;
                return {
                    name: s.name,
                    progress: total > 0 ? Math.round((done / total) * 100) : 0,
                    done,
                    total,
                };
            }).sort((a, b) => b.progress - a.progress)
            : [];
    }, [subjects]);
    const studyTotal = studyByDay.reduce((sum, d) => sum + d.minutes, 0);
    return (_jsxs("div", { className: "space-y-4", children: [alerts.length > 0 && (_jsxs(Card, { className: "border-yellow-500/40", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-yellow-600" }), "Alertas pr\u00F3ximas", _jsx(Badge, { variant: "outline", className: "text-[10px]", children: alerts.length })] }) }), _jsx(CardContent, { className: "space-y-1.5", children: alerts.map(a => (_jsxs("div", { className: `flex items-center gap-2 p-2 rounded-lg text-sm ${a.urgency === 'danger'
                                ? 'bg-destructive/10 border border-destructive/30'
                                : 'bg-yellow-500/10 border border-yellow-500/30'}`, children: [a.type === 'delivery'
                                    ? _jsx(ClipboardList, { className: `h-3.5 w-3.5 shrink-0 ${a.urgency === 'danger' ? 'text-destructive' : 'text-yellow-600'}` })
                                    : _jsx(GraduationCap, { className: `h-3.5 w-3.5 shrink-0 ${a.urgency === 'danger' ? 'text-destructive' : 'text-yellow-600'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium truncate", children: a.title }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [a.type === 'delivery' ? 'Entrega' : 'Examen', " \u00B7 ", a.subject] })] }), _jsx(Badge, { variant: "outline", className: `shrink-0 text-[10px] ${a.days < 0
                                        ? 'border-destructive/50 text-destructive'
                                        : a.urgency === 'danger'
                                            ? 'border-destructive/40 text-destructive'
                                            : 'border-yellow-500/40 text-yellow-600'}`, children: a.days < 0 ? `${Math.abs(a.days)}d atrasado` : a.days === 0 ? 'Hoy' : `${a.days}d` })] }, a.id))) })] })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-green-500/10 rounded-lg shrink-0", children: _jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: stats.approved }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Aprobadas" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-primary/10 rounded-lg shrink-0", children: _jsx(BookOpen, { className: "h-4 w-4 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: stats.inProgress }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "En curso" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-yellow-500/10 rounded-lg shrink-0", children: _jsx(Target, { className: "h-4 w-4 text-yellow-600" }) }), _jsxs("div", { children: [_jsxs("p", { className: "text-xl font-bold leading-none", children: [Math.round(stats.completionRate), "%"] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Tareas completadas" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-500/10 rounded-lg shrink-0", children: _jsx(TrendingUp, { className: "h-4 w-4 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: stats.avg !== null ? stats.avg.toFixed(1) : '—' }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Promedio general" })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Award, { className: "h-4 w-4 text-primary" }), "Promedio por Asignatura"] }) }), _jsx(CardContent, { children: gradeData.length > 0 ? (_jsx("div", { className: "h-48", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: gradeData, layout: "vertical", margin: { top: 0, right: 16, left: 8, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: false, stroke: "rgba(0,0,0,0.06)" }), _jsx(XAxis, { type: "number", domain: [0, 100], tick: { fontSize: 9 }, axisLine: false, tickLine: false }), _jsx(YAxis, { type: "category", dataKey: "name", width: 90, tick: { fontSize: 9 }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: { fontSize: 11, borderRadius: 12 }, formatter: (v) => [`${v}`, 'Promedio'], cursor: { fill: 'rgba(0,0,0,0.03)' } }), _jsx(Bar, { dataKey: "promedio", radius: [0, 4, 4, 0], children: gradeData.map((d, i) => (_jsx(Cell, { fill: d.promedio >= 60 ? '#22c55e' : '#ef4444' }, i))) })] }) }) })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "Registra notas en tus parciales para ver tu rendimiento" })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-primary" }), "Progreso de Tareas"] }) }), _jsx(CardContent, { children: taskPie.length > 0 ? (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "h-44 w-44 shrink-0", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: taskPie, dataKey: "value", nameKey: "name", innerRadius: 48, outerRadius: 70, paddingAngle: 3, children: taskPie.map((_, i) => (_jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i))) }), _jsx(Tooltip, { contentStyle: { fontSize: 11, borderRadius: 12 } })] }) }) }), _jsxs("div", { className: "space-y-2 flex-1", children: [taskPie.map((d, i) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: PIE_COLORS[i % PIE_COLORS.length] } }), _jsx("span", { className: "flex-1 text-muted-foreground", children: d.name }), _jsx("span", { className: "font-semibold", children: d.value })] }, d.name))), _jsxs("div", { className: "pt-2 border-t text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(GraduationCap, { className: "h-3 w-3" }), stats.completedTasks, "/", stats.totalTasks, " tareas completadas"] })] })] })) : (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "Sin tareas a\u00FAn" })) })] })] }), studyByDay.some(d => d.minutes > 0) && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-primary" }), "Minutos de estudio (\u00FAltimos ", studyByDay.length, " d\u00EDas)", _jsxs(Badge, { variant: "secondary", className: "text-[10px] ml-auto", children: [Math.round(studyTotal / 60), "h total"] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-36", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: studyByDay, margin: { top: 0, right: 0, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "rgba(0,0,0,0.06)" }), _jsx(XAxis, { dataKey: "day", tick: { fontSize: 8 }, axisLine: false, tickLine: false, interval: 1 }), _jsx(YAxis, { tick: { fontSize: 8 }, axisLine: false, tickLine: false, width: 30 }), _jsx(Tooltip, { contentStyle: { fontSize: 11, borderRadius: 12 }, formatter: (v) => [`${v} min`, 'Estudio'], cursor: { fill: 'rgba(0,0,0,0.03)' } }), _jsx(Bar, { dataKey: "minutes", fill: "#3b82f6", radius: [3, 3, 0, 0] })] }) }) }) })] })), subjectProgress.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(BookOpen, { className: "h-4 w-4 text-primary" }), "Avance por Asignatura"] }) }), _jsx(CardContent, { className: "space-y-3", children: subjectProgress.map(sp => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-medium truncate", children: sp.name }), _jsxs("span", { className: "text-muted-foreground shrink-0", children: [sp.done, "/", sp.total, " \u00B7 ", sp.progress, "%"] })] }), _jsx(Progress, { value: sp.progress, className: "h-1.5" })] }, sp.name))) })] }))] }));
}
