import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, GraduationCap, BookOpen, Clock, Target, Calendar, AlertTriangle, CheckCircle2, Play, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversity } from '@/hooks/useUniversity';
import { useExams } from '@/hooks/useExams';
import { AddExamDialog } from '@/components/university/AddExamDialog';
import { AddSubjectTaskDialog } from '@/components/university/AddSubjectTaskDialog';
import { UpdateExamProgressDialog } from '@/components/university/UpdateExamProgressDialog';
import { SubjectDetailCard } from '@/components/university/SubjectDetailCard';
import { UniversitySettings } from '@/components/university/UniversitySettings';
import { SubjectProgressCard } from '@/components/university/SubjectProgressCard';
import { GPATracker } from '@/components/university/GPATracker';
import { ExamCalendar } from '@/components/university/ExamCalendar';
import { AcademicAnalytics } from '@/components/university/AcademicAnalytics';
import { UniversityDashboard } from '@/components/university/UniversityDashboard';
import { RoutineBlockSchedule } from '@/components/university/RoutineBlockSchedule';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { z } from 'zod';
const subjectSchema = z.object({
    name: z.string().trim().min(1, "El nombre es requerido").max(200, "El nombre es muy largo"),
    code: z.string().max(50).optional(),
    professor: z.string().max(100).optional(),
    schedule: z.string().max(200).optional()
});
export default function UniversityPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { subjects, settings, loading, gpaData, overallGPA, updateSettings, createSubject, deleteSubject, toggleApproved, addTopic, deleteTopic, addPartialExam, updatePartialExamGrade, deletePartialExam, addTask, toggleTask, deleteTask, getSubjectsByCurrentSemester, getTodayStudyTime, getStudyMinutesByDay } = useUniversity();
    const { exams, createExam, updateExamProgress, deleteExam } = useExams();
    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [professor, setProfessor] = useState('');
    const [schedule, setSchedule] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isUpdateExamProgressOpen, setIsUpdateExamProgressOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [examSubjectId, setExamSubjectId] = useState('');
    const [examSubjectName, setExamSubjectName] = useState('');
    const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);
    const [studyByDay, setStudyByDay] = useState([]);
    const { values: activeSubjectIds, toggle: toggleActiveSubject } = useActiveSelections('activeSubjects');
    useEffect(() => {
        getTodayStudyTime().then(setTodayStudyMinutes);
        getStudyMinutesByDay(14).then(setStudyByDay);
    }, []);
    const currentSemesterSubjects = getSubjectsByCurrentSemester();
    const totalTasks = subjects.flatMap(s => s.tasks);
    const pendingDeliveryTasks = totalTasks.filter(t => t.task_type === 'delivery' && !t.completed);
    const pendingStudyTasks = totalTasks.filter(t => t.task_type === 'study' && !t.completed);
    const upcomingPartials = subjects.flatMap(s => s.partialExams).filter(p => {
        if (!p.exam_date)
            return false;
        const days = differenceInDays(parseISO(p.exam_date), new Date());
        return days >= 0 && days <= 14;
    });
    const handleCreateSubject = async () => {
        try {
            const validated = subjectSchema.parse({
                name: subjectName,
                code: subjectCode || undefined,
                professor: professor || undefined,
                schedule: schedule || undefined
            });
            const success = await createSubject({
                name: validated.name,
                code: validated.code,
                professor: validated.professor,
                schedule: validated.schedule
            });
            if (success) {
                setSubjectName('');
                setSubjectCode('');
                setProfessor('');
                setSchedule('');
                setIsSubjectDialogOpen(false);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
            }
        }
    };
    const goToFocusWithTask = (taskId, title) => {
        navigate(`/focus?taskId=${taskId}&title=${encodeURIComponent(title)}&area=universidad`);
    };
    const selectedSubject = selectedSubjectId
        ? currentSemesterSubjects.find(s => s.id === selectedSubjectId) || null
        : null;
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24 flex items-center justify-center", children: _jsx("p", { className: "text-muted-foreground", children: "Cargando..." }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6 max-w-6xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4", children: [_jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(GraduationCap, { className: "h-8 w-8 text-primary" }), "Universidad"] }), _jsxs("p", { className: "text-muted-foreground text-sm", children: [settings.current_year, "\u00B0 A\u00F1o \u00B7 ", settings.current_semester, "\u00B0 Semestre"] })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(UniversitySettings, { currentYear: settings.current_year, currentSemester: settings.current_semester, academicSchedule: settings.academic_schedule, onSave: updateSettings }), _jsxs(Dialog, { open: isSubjectDialogOpen, onOpenChange: setIsSubjectDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Nueva Asignatura"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Crear Nueva Asignatura" }), _jsxs(DialogDescription, { children: ["Agrega una asignatura al ", settings.current_semester, "\u00B0 semestre de ", settings.current_year, "\u00B0 a\u00F1o"] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Nombre *" }), _jsx(Input, { value: subjectName, onChange: (e) => setSubjectName(e.target.value), placeholder: "Ej: C\u00E1lculo I" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "C\u00F3digo" }), _jsx(Input, { value: subjectCode, onChange: (e) => setSubjectCode(e.target.value), placeholder: "MAT-101" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Profesor" }), _jsx(Input, { value: professor, onChange: (e) => setProfessor(e.target.value), placeholder: "Nombre del profesor" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Horario" }), _jsx(Textarea, { value: schedule, onChange: (e) => setSchedule(e.target.value), placeholder: "Lunes y Mi\u00E9rcoles 8:00-10:00", rows: 2 })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleCreateSubject, children: "Crear Asignatura" }) })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-3", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-primary/10 rounded-lg shrink-0", children: _jsx(BookOpen, { className: "h-4 w-4 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: currentSemesterSubjects.length }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Asignaturas" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-yellow-500/10 rounded-lg shrink-0", children: _jsx(Target, { className: "h-4 w-4 text-yellow-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: pendingDeliveryTasks.length }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Entregas" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-500/10 rounded-lg shrink-0", children: _jsx(Clock, { className: "h-4 w-4 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: todayStudyMinutes }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Min Hoy" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-destructive/10 rounded-lg shrink-0", children: _jsx(AlertTriangle, { className: "h-4 w-4 text-destructive" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: upcomingPartials.length }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Pr\u00F3ximos" })] })] }) }), _jsx(Card, { className: "col-span-2 sm:col-span-1", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-green-500/10 rounded-lg shrink-0", children: _jsx(Award, { className: "h-4 w-4 text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-bold leading-none", children: overallGPA !== null ? overallGPA.toFixed(1) : '—' }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Promedio" })] })] }) })] }), _jsxs(Tabs, { defaultValue: "overview", className: "w-full", children: [_jsxs(TabsList, { className: "w-full grid grid-cols-5", children: [_jsx(TabsTrigger, { value: "overview", className: "text-xs sm:text-sm", children: "Resumen" }), _jsx(TabsTrigger, { value: "subjects", className: "text-xs sm:text-sm", children: "Materias" }), _jsx(TabsTrigger, { value: "tasks", className: "text-xs sm:text-sm", children: "Tareas" }), _jsx(TabsTrigger, { value: "exams", className: "text-xs sm:text-sm", children: "Ex\u00E1menes" }), _jsx(TabsTrigger, { value: "analytics", className: "text-xs sm:text-sm", children: "Analytics" })] }), _jsxs(TabsContent, { value: "overview", className: "mt-6", children: [_jsx(UniversityDashboard, { subjects: currentSemesterSubjects, gpaData: gpaData, overallGPA: overallGPA, studyByDay: studyByDay }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: "Mis Asignaturas" }), currentSemesterSubjects.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: currentSemesterSubjects.map(subject => {
                                                            const gpa = gpaData.find(g => g.subjectId === subject.id);
                                                            return (_jsx(SubjectProgressCard, { subject: subject, weightedAverage: gpa?.weightedAverage ?? null, onClick: () => setSelectedSubjectId(subject.id), isActive: activeSubjectIds.includes(subject.id), onToggleActive: () => toggleActiveSubject(subject.id), onToggleApproved: () => toggleApproved(subject.id) }, subject.id));
                                                        }) })) : (_jsx(Card, { children: _jsxs(CardContent, { className: "py-8 text-center", children: [_jsx(GraduationCap, { className: "h-10 w-10 mx-auto text-muted-foreground mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Sin asignaturas en este semestre" }), _jsxs(Button, { size: "sm", className: "mt-3", onClick: () => setIsSubjectDialogOpen(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Agregar"] })] }) }))] }), _jsx(ExamCalendar, { subjects: currentSemesterSubjects }), pendingDeliveryTasks.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4" }), "Entregas Pendientes"] }) }), _jsx(CardContent, { className: "space-y-2", children: pendingDeliveryTasks
                                                            .sort((a, b) => {
                                                            if (!a.due_date)
                                                                return 1;
                                                            if (!b.due_date)
                                                                return -1;
                                                            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                                                        })
                                                            .slice(0, 5)
                                                            .map(task => {
                                                            const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                                                            const daysLeft = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;
                                                            return (_jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-accent/50 rounded-lg", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: task.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(Badge, { variant: "outline", className: "text-[10px]", children: subject?.name }), task.due_date && (_jsx("span", { className: `text-[10px] ${daysLeft !== null && daysLeft <= 1 ? 'text-destructive' :
                                                                                            daysLeft !== null && daysLeft <= 3 ? 'text-yellow-600' :
                                                                                                'text-muted-foreground'}`, children: format(parseISO(task.due_date), "d MMM", { locale: es }) }))] })] }), _jsxs("div", { className: "flex gap-1.5 shrink-0", children: [_jsxs(Button, { size: "sm", variant: "default", className: "h-7 text-xs", onClick: () => goToFocusWithTask(task.id, task.title), children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Focus"] }), _jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0", onClick: () => toggleTask(task.id), children: _jsx(CheckCircle2, { className: "h-3 w-3" }) })] })] }, task.id));
                                                        }) })] }))] }), _jsx("div", { children: _jsx(GPATracker, { gpaData: gpaData, overallGPA: overallGPA }) })] }), _jsx("div", { className: "mt-6", children: _jsx(RoutineBlockSchedule, {}) })] }), _jsx(TabsContent, { value: "subjects", className: "space-y-4 mt-6", children: selectedSubject ? (_jsxs("div", { className: "space-y-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSelectedSubjectId(null), children: "\u2190 Volver a Asignaturas" }), _jsx(SubjectDetailCard, { subject: selectedSubject, onDeleteSubject: (id) => { deleteSubject(id); setSelectedSubjectId(null); }, onToggleApproved: () => toggleApproved(selectedSubject.id), onAddTopic: addTopic, onDeleteTopic: deleteTopic, onAddPartialExam: addPartialExam, onUpdatePartialExamGrade: updatePartialExamGrade, onDeletePartialExam: deletePartialExam, onAddTask: addTask, onToggleTask: toggleTask, onDeleteTask: deleteTask })] })) : (_jsx(_Fragment, { children: currentSemesterSubjects.length > 0 ? (currentSemesterSubjects.map(subject => (_jsx(SubjectDetailCard, { subject: subject, onDeleteSubject: deleteSubject, onToggleApproved: () => toggleApproved(subject.id), onAddTopic: addTopic, onDeleteTopic: deleteTopic, onAddPartialExam: addPartialExam, onUpdatePartialExamGrade: updatePartialExamGrade, onDeletePartialExam: deletePartialExam, onAddTask: addTask, onToggleTask: toggleTask, onDeleteTask: deleteTask }, subject.id)))) : (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(GraduationCap, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }), _jsx("p", { className: "text-muted-foreground", children: "Sin asignaturas en este semestre" }), _jsxs(Button, { className: "mt-4", onClick: () => setIsSubjectDialogOpen(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Agregar Primera Asignatura"] })] }) })) })) }), _jsxs(TabsContent, { value: "tasks", className: "mt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide", children: "Tareas y Estudio" }), _jsxs(Button, { size: "sm", onClick: () => setIsTaskDialogOpen(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Nueva Tarea"] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Target, { className: "h-4 w-4" }), "Tareas a Entregar"] }), _jsxs(CardDescription, { children: [pendingDeliveryTasks.length, " pendientes"] })] }), _jsx(CardContent, { children: pendingDeliveryTasks.length > 0 ? (_jsx("div", { className: "space-y-2", children: pendingDeliveryTasks
                                                        .sort((a, b) => {
                                                        if (!a.due_date)
                                                            return 1;
                                                        if (!b.due_date)
                                                            return -1;
                                                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                                                    })
                                                        .map(task => {
                                                        const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                                                        const daysLeft = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;
                                                        return (_jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-accent/50 rounded-lg", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: task.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(Badge, { variant: "outline", className: "text-[10px]", children: subject?.name }), task.due_date && (_jsxs("span", { className: `text-[10px] ${daysLeft !== null && daysLeft <= 1 ? 'text-destructive' :
                                                                                        daysLeft !== null && daysLeft <= 3 ? 'text-yellow-600' :
                                                                                            'text-muted-foreground'}`, children: [_jsx(Calendar, { className: "h-2.5 w-2.5 inline mr-0.5" }), format(parseISO(task.due_date), "d MMM", { locale: es }), daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`] }))] })] }), _jsxs("div", { className: "flex gap-1.5 shrink-0", children: [_jsxs(Button, { size: "sm", className: "h-7 text-xs", onClick: () => goToFocusWithTask(task.id, task.title), children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Focus"] }), _jsx(Button, { size: "sm", variant: "outline", className: "h-7 w-7 p-0", onClick: () => toggleTask(task.id), children: _jsx(CheckCircle2, { className: "h-3 w-3" }) })] })] }, task.id));
                                                    }) })) : (_jsx("p", { className: "text-center text-muted-foreground py-6 text-sm", children: "\u00A1Sin tareas pendientes! \uD83C\uDF89" })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Clock, { className: "h-4 w-4" }), "Sesiones de Estudio"] }), _jsxs(CardDescription, { children: [pendingStudyTasks.length, " pendientes"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xl font-bold", children: todayStudyMinutes }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "min hoy" })] })] }) }), _jsxs(CardContent, { children: [pendingStudyTasks.length > 0 ? (_jsx("div", { className: "space-y-2", children: pendingStudyTasks.map(task => {
                                                            const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                                                            return (_jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: task.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(Badge, { variant: "outline", className: "text-[10px]", children: subject?.name }), task.estimated_minutes && (_jsxs("span", { className: "text-[10px] text-muted-foreground", children: [_jsx(Clock, { className: "h-2.5 w-2.5 inline mr-0.5" }), task.estimated_minutes, " min"] }))] })] }), _jsxs(Button, { size: "sm", className: "h-7 text-xs shrink-0", onClick: () => goToFocusWithTask(task.id, task.title), children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Focus"] })] }, task.id));
                                                        }) })) : (_jsx("p", { className: "text-center text-muted-foreground py-6 text-sm", children: "Sin sesiones pendientes" })), currentSemesterSubjects.length > 0 && (_jsxs("div", { className: "mt-4 pt-4 border-t space-y-3", children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase", children: "Por Asignatura" }), currentSemesterSubjects.map(subject => {
                                                                const studyTasks = subject.tasks.filter(t => t.task_type === 'study');
                                                                const done = studyTasks.filter(t => t.completed).length;
                                                                const progress = studyTasks.length > 0 ? (done / studyTasks.length) * 100 : 0;
                                                                return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-medium", children: subject.name }), _jsxs("span", { className: "text-muted-foreground", children: [done, "/", studyTasks.length] })] }), _jsx(Progress, { value: progress, className: "h-1.5" })] }, subject.id));
                                                            })] }))] })] })] })] }), _jsxs(TabsContent, { value: "exams", className: "mt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide", children: "Ex\u00E1menes" }), _jsxs(Button, { size: "sm", onClick: () => setIsExamDialogOpen(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Nuevo Examen"] })] }), _jsx(ExamCalendar, { subjects: currentSemesterSubjects }), (() => {
                                const completedPartials = subjects.flatMap(s => s.partialExams
                                    .filter(p => p.grade !== null && p.grade !== undefined)
                                    .map(p => ({ ...p, subjectName: s.name })));
                                if (completedPartials.length === 0)
                                    return null;
                                return (_jsxs(Card, { className: "mt-4", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" }), "Ex\u00E1menes Calificados"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: completedPartials.map(exam => (_jsxs("div", { className: "flex items-center justify-between p-2.5 bg-accent/50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: exam.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: exam.subjectName })] }), _jsx(Badge, { variant: exam.grade >= 60 ? 'default' : 'destructive', className: "text-sm", children: exam.grade })] }, exam.id))) }) })] }));
                            })()] }), _jsx(TabsContent, { value: "analytics", className: "mt-6", children: _jsx(AcademicAnalytics, { subjects: currentSemesterSubjects, gpaData: gpaData }) })] }), _jsx(AddExamDialog, { open: isExamDialogOpen, onOpenChange: setIsExamDialogOpen, subjectId: examSubjectId, subjectName: examSubjectName, subjects: currentSemesterSubjects.map(s => ({ id: s.id, name: s.name })), onSubmit: createExam }), _jsx(AddSubjectTaskDialog, { open: isTaskDialogOpen, onOpenChange: setIsTaskDialogOpen, subjects: currentSemesterSubjects.map(s => ({ id: s.id, name: s.name })), onSubmit: (data) => addTask(data.subject_id, data) }), currentExam && (_jsx(UpdateExamProgressDialog, { open: isUpdateExamProgressOpen, onOpenChange: setIsUpdateExamProgressOpen, exam: currentExam, onSubmit: (examId, data) => updateExamProgress(examId, data) }))] }));
}
