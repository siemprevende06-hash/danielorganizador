import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BadgeCheck, BookOpen, ChevronDown, ChevronRight, PlusCircle, Trash2, Clock, Play, Calendar, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AssignTaskToBlockDialog } from './AssignTaskToBlockDialog';
export function SubjectDetailCard({ subject, onDeleteSubject, onToggleApproved, onAddTopic, onDeleteTopic, onAddPartialExam, onUpdatePartialExamGrade, onDeletePartialExam, onAddTask, onToggleTask, onDeleteTask }) {
    const navigate = useNavigate();
    const [isTopicsOpen, setIsTopicsOpen] = useState(false);
    const [isExamsOpen, setIsExamsOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(true);
    // Topic dialog
    const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicDescription, setNewTopicDescription] = useState('');
    const [isForFinal, setIsForFinal] = useState(true);
    // Partial exam dialog
    const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
    const [examTitle, setExamTitle] = useState('');
    const [examDate, setExamDate] = useState('');
    const [examWeight, setExamWeight] = useState('20');
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);
    // Grade dialog
    const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
    const [currentExamForGrade, setCurrentExamForGrade] = useState(null);
    const [gradeValue, setGradeValue] = useState('');
    // Task dialog
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskType, setTaskType] = useState('delivery');
    const [taskMinutes, setTaskMinutes] = useState('30');
    const [taskTopicId, setTaskTopicId] = useState('');
    // Assign to routine block dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [taskForAssignment, setTaskForAssignment] = useState(null);
    const deliveryTasks = subject.tasks.filter(t => t.task_type === 'delivery');
    const studyTasks = subject.tasks.filter(t => t.task_type === 'study');
    const handleAddTopic = async () => {
        if (!newTopicTitle.trim())
            return;
        const success = await onAddTopic(subject.id, newTopicTitle, newTopicDescription, isForFinal);
        if (success) {
            setNewTopicTitle('');
            setNewTopicDescription('');
            setIsForFinal(true);
            setIsTopicDialogOpen(false);
        }
    };
    const handleAddExam = async () => {
        if (!examTitle.trim())
            return;
        const success = await onAddPartialExam(subject.id, {
            title: examTitle,
            exam_date: examDate || undefined,
            weight_percentage: parseInt(examWeight) || 20,
            topicIds: selectedTopicIds
        });
        if (success) {
            setExamTitle('');
            setExamDate('');
            setExamWeight('20');
            setSelectedTopicIds([]);
            setIsExamDialogOpen(false);
        }
    };
    const handleAddGrade = async () => {
        if (!currentExamForGrade || !gradeValue)
            return;
        const grade = parseFloat(gradeValue);
        if (isNaN(grade))
            return;
        const success = await onUpdatePartialExamGrade(currentExamForGrade.id, grade);
        if (success) {
            setGradeValue('');
            setCurrentExamForGrade(null);
            setIsGradeDialogOpen(false);
        }
    };
    const handleAddTask = async () => {
        if (!taskTitle.trim())
            return;
        const success = await onAddTask(subject.id, {
            title: taskTitle,
            description: taskDescription || undefined,
            due_date: taskDueDate || undefined,
            task_type: taskType,
            estimated_minutes: taskType === 'study' ? parseInt(taskMinutes) || 30 : undefined,
            topic_id: taskTopicId || undefined
        });
        if (success) {
            setTaskTitle('');
            setTaskDescription('');
            setTaskDueDate('');
            setTaskType('delivery');
            setTaskMinutes('30');
            setTaskTopicId('');
            setIsTaskDialogOpen(false);
        }
    };
    const goToFocus = (task) => {
        navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&area=universidad`);
    };
    const getExamUrgency = (exam) => {
        if (!exam.exam_date)
            return { color: 'text-muted-foreground', bg: 'bg-muted' };
        const days = differenceInDays(parseISO(exam.exam_date), new Date());
        if (days < 0)
            return { color: 'text-muted-foreground', bg: 'bg-muted', text: 'Pasado' };
        if (days <= 3)
            return { color: 'text-destructive', bg: 'bg-destructive/10', text: `${days}d` };
        if (days <= 7)
            return { color: 'text-yellow-600', bg: 'bg-yellow-500/10', text: `${days}d` };
        return { color: 'text-green-600', bg: 'bg-green-500/10', text: `${days}d` };
    };
    return (_jsxs(Card, { className: "border-l-4 border-l-primary", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(BookOpen, { className: "h-5 w-5 text-primary" }), subject.name, subject.approved && (_jsxs(Badge, { className: "bg-green-600", children: [_jsx(BadgeCheck, { className: "h-3 w-3 mr-0.5 inline" }), "Aprobada"] }))] }), _jsx(CardDescription, { className: "flex gap-2 mt-1", children: subject.code && _jsx(Badge, { variant: "outline", children: subject.code }) }), subject.professor && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Prof. ", subject.professor] })), subject.schedule && (_jsx("p", { className: "text-xs text-muted-foreground", children: subject.schedule }))] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [onToggleApproved && (_jsxs(Button, { variant: subject.approved ? "default" : "outline", size: "sm", onClick: () => onToggleApproved(), children: [_jsx(BadgeCheck, { className: "h-3.5 w-3.5 mr-1" }), subject.approved ? 'Aprobada ✓' : 'Aprobar'] })), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => onDeleteSubject(subject.id), children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs(Collapsible, { open: isTopicsOpen, onOpenChange: setIsTopicsOpen, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "p-0 h-auto", children: [isTopicsOpen ? _jsx(ChevronDown, { className: "h-4 w-4 mr-1" }) : _jsx(ChevronRight, { className: "h-4 w-4 mr-1" }), _jsxs("span", { className: "font-semibold text-sm", children: ["Temas (", subject.topics.length, ")"] })] }) }), _jsxs(Dialog, { open: isTopicDialogOpen, onOpenChange: setIsTopicDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(PlusCircle, { className: "h-3 w-3 mr-1" }), "Tema"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar Tema" }), _jsxs(DialogDescription, { children: ["A\u00F1ade un tema del contenido de ", subject.name] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "T\u00EDtulo del Tema" }), _jsx(Input, { value: newTopicTitle, onChange: (e) => setNewTopicTitle(e.target.value), placeholder: "Ej: Derivadas e Integrales" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Descripci\u00F3n (opcional)" }), _jsx(Textarea, { value: newTopicDescription, onChange: (e) => setNewTopicDescription(e.target.value), placeholder: "Subtemas, notas..." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { checked: isForFinal, onCheckedChange: (c) => setIsForFinal(c === true) }), _jsx("label", { className: "text-sm", children: "Este tema va al examen final" })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleAddTopic, children: "Agregar Tema" }) })] })] })] }), _jsxs(CollapsibleContent, { className: "mt-2 space-y-1", children: [subject.topics.map((topic, index) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-accent/50 rounded-md", children: [_jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: [index + 1, "."] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: topic.title }), topic.description && (_jsx("p", { className: "text-xs text-muted-foreground", children: topic.description }))] }), topic.is_for_final && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Final" })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => onDeleteTopic(topic.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }, topic.id))), subject.topics.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-2", children: "No hay temas agregados" }))] })] }), _jsxs(Collapsible, { open: isExamsOpen, onOpenChange: setIsExamsOpen, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "p-0 h-auto", children: [isExamsOpen ? _jsx(ChevronDown, { className: "h-4 w-4 mr-1" }) : _jsx(ChevronRight, { className: "h-4 w-4 mr-1" }), _jsxs("span", { className: "font-semibold text-sm", children: ["Parciales (", subject.partialExams.length, ")"] })] }) }), _jsxs(Dialog, { open: isExamDialogOpen, onOpenChange: setIsExamDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(PlusCircle, { className: "h-3 w-3 mr-1" }), "Parcial"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar Examen Parcial" }), _jsxs(DialogDescription, { children: ["Crea un examen parcial para ", subject.name] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Nombre del Parcial" }), _jsx(Input, { value: examTitle, onChange: (e) => setExamTitle(e.target.value), placeholder: "Ej: Primer Parcial" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Fecha" }), _jsx(Input, { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Peso (%)" }), _jsx(Input, { type: "number", value: examWeight, onChange: (e) => setExamWeight(e.target.value), min: "0", max: "100" })] })] }), subject.topics.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Temas del Parcial" }), _jsx("div", { className: "max-h-32 overflow-y-auto space-y-1 mt-1", children: subject.topics.map(topic => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { checked: selectedTopicIds.includes(topic.id), onCheckedChange: (c) => {
                                                                                        if (c) {
                                                                                            setSelectedTopicIds([...selectedTopicIds, topic.id]);
                                                                                        }
                                                                                        else {
                                                                                            setSelectedTopicIds(selectedTopicIds.filter(id => id !== topic.id));
                                                                                        }
                                                                                    } }), _jsx("span", { className: "text-sm", children: topic.title })] }, topic.id))) })] }))] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleAddExam, children: "Crear Parcial" }) })] })] })] }), _jsxs(CollapsibleContent, { className: "mt-2 space-y-2", children: [subject.partialExams.map((exam) => {
                                        const urgency = getExamUrgency(exam);
                                        const topicNames = subject.topics
                                            .filter(t => exam.topics.includes(t.id))
                                            .map(t => t.title);
                                        return (_jsx("div", { className: `p-3 rounded-md border ${urgency.bg}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-sm", children: exam.title }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [exam.weight_percentage, "%"] }), exam.exam_date && (_jsx("span", { className: `text-xs ${urgency.color}`, children: format(parseISO(exam.exam_date), "d MMM", { locale: es }) }))] }), topicNames.length > 0 && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Temas: ", topicNames.join(', ')] }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [exam.grade !== null && exam.grade !== undefined ? (_jsx(Badge, { variant: exam.grade >= 60 ? 'default' : 'destructive', children: exam.grade })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                    setCurrentExamForGrade(exam);
                                                                    setIsGradeDialogOpen(true);
                                                                }, children: [_jsx(Pencil, { className: "h-3 w-3 mr-1" }), "Nota"] })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => onDeletePartialExam(exam.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }) }, exam.id));
                                    }), subject.partialExams.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-2", children: "No hay parciales programados" }))] })] }), _jsxs(Collapsible, { open: isTasksOpen, onOpenChange: setIsTasksOpen, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "p-0 h-auto", children: [isTasksOpen ? _jsx(ChevronDown, { className: "h-4 w-4 mr-1" }) : _jsx(ChevronRight, { className: "h-4 w-4 mr-1" }), _jsxs("span", { className: "font-semibold text-sm", children: ["Tareas (", subject.tasks.length, ")"] })] }) }), _jsxs(Dialog, { open: isTaskDialogOpen, onOpenChange: setIsTaskDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(PlusCircle, { className: "h-3 w-3 mr-1" }), "Tarea"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar Tarea" }), _jsxs(DialogDescription, { children: ["A\u00F1ade una tarea a ", subject.name] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Tipo de Tarea" }), _jsxs(Select, { value: taskType, onValueChange: (v) => setTaskType(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "delivery", children: "\uD83D\uDCC4 Tarea a Entregar" }), _jsx(SelectItem, { value: "study", children: "\uD83D\uDCDA Tiempo de Estudio" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "T\u00EDtulo" }), _jsx(Input, { value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), placeholder: taskType === 'delivery' ? "Ej: Resolver ejercicios Cap. 5" : "Ej: Estudiar derivadas" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Descripci\u00F3n (opcional)" }), _jsx(Textarea, { value: taskDescription, onChange: (e) => setTaskDescription(e.target.value), placeholder: "Detalles..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: taskType === 'delivery' ? 'Fecha de Entrega' : 'Fecha' }), _jsx(Input, { type: "date", value: taskDueDate, onChange: (e) => setTaskDueDate(e.target.value) })] }), taskType === 'study' && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Duraci\u00F3n (min)" }), _jsx(Input, { type: "number", value: taskMinutes, onChange: (e) => setTaskMinutes(e.target.value), min: "5" })] }))] }), subject.topics.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Tema Relacionado (opcional)" }), _jsxs(Select, { value: taskTopicId, onValueChange: setTaskTopicId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Seleccionar tema..." }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "Ninguno" }), subject.topics.map(topic => (_jsx(SelectItem, { value: topic.id, children: topic.title }, topic.id)))] })] })] }))] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleAddTask, children: "Agregar Tarea" }) })] })] })] }), _jsxs(CollapsibleContent, { className: "mt-2 space-y-3", children: [deliveryTasks.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase", children: "Tareas a Entregar" }), deliveryTasks.map(task => (_jsxs("div", { className: "flex items-start gap-2 p-2 bg-accent/50 rounded-md", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => onToggleTask(task.id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`, children: task.title }), task.due_date && (_jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), format(parseISO(task.due_date), "d MMM", { locale: es })] }))] }), _jsxs("div", { className: "flex gap-1", children: [!task.completed && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => goToFocus(task), children: _jsx(Play, { className: "h-3 w-3 text-primary" }) })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => {
                                                                    setTaskForAssignment(task);
                                                                    setAssignDialogOpen(true);
                                                                }, children: _jsx(Calendar, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => onDeleteTask(task.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }, task.id)))] })), studyTasks.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase", children: "Tiempos de Estudio" }), studyTasks.map(task => {
                                                const relatedTopic = subject.topics.find(t => t.id === task.topic_id);
                                                return (_jsxs("div", { className: "flex items-start gap-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => onToggleTask(task.id), className: "mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`, children: task.title }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [task.estimated_minutes && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), task.estimated_minutes, " min"] })), relatedTopic && (_jsx(Badge, { variant: "outline", className: "text-xs", children: relatedTopic.title }))] })] }), _jsxs("div", { className: "flex gap-1", children: [!task.completed && (_jsxs(Button, { variant: "default", size: "sm", className: "h-7", onClick: () => goToFocus(task), children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Focus"] })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => {
                                                                        setTaskForAssignment(task);
                                                                        setAssignDialogOpen(true);
                                                                    }, children: _jsx(Calendar, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => onDeleteTask(task.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }, task.id));
                                            })] })), subject.tasks.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-2", children: "No hay tareas" }))] })] })] }), _jsx(Dialog, { open: isGradeDialogOpen, onOpenChange: setIsGradeDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Registrar Nota" }), _jsxs(DialogDescription, { children: ["Ingresa la nota de ", currentExamForGrade?.title] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Nota (0-100)" }), _jsx(Input, { type: "number", value: gradeValue, onChange: (e) => setGradeValue(e.target.value), min: "0", max: "100", placeholder: "75" })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleAddGrade, children: "Guardar Nota" }) })] }) }), _jsx(AssignTaskToBlockDialog, { open: assignDialogOpen, onOpenChange: setAssignDialogOpen, task: taskForAssignment ? {
                    id: taskForAssignment.id,
                    title: taskForAssignment.title,
                    subjectName: subject.name,
                    source: 'university',
                } : null, onAssigned: () => {
                    setTaskForAssignment(null);
                    window.dispatchEvent(new CustomEvent('taskAssignmentChanged'));
                } })] }));
}
