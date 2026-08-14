import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
const taskSchema = z.object({
    title: z.string().trim().min(1, "El título es requerido").max(200, "El título es muy largo"),
    description: z.string().max(1000).optional(),
    due_date: z.string().optional(),
    task_type: z.enum(['delivery', 'study']),
    estimated_minutes: z.number().min(5).max(600).optional()
});
export function AddSubjectTaskDialog({ open, onOpenChange, subjects, onSubmit }) {
    const [subjectId, setSubjectId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [taskType, setTaskType] = useState('delivery');
    const [minutes, setMinutes] = useState('30');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async () => {
        try {
            if (!subjectId) {
                toast({ variant: "destructive", title: "Error", description: "Selecciona una asignatura" });
                return;
            }
            const validated = taskSchema.parse({
                title,
                description: description || undefined,
                due_date: dueDate || undefined,
                task_type: taskType,
                estimated_minutes: taskType === 'study' ? parseInt(minutes) || 30 : undefined
            });
            setIsSubmitting(true);
            const success = await onSubmit({
                subject_id: subjectId,
                title: validated.title,
                description: validated.description,
                due_date: validated.due_date,
                task_type: validated.task_type,
                estimated_minutes: validated.estimated_minutes
            });
            if (success) {
                resetForm();
                onOpenChange(false);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    variant: "destructive",
                    title: "Error de validación",
                    description: error.errors[0].message
                });
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const resetForm = () => {
        setSubjectId('');
        setTitle('');
        setDescription('');
        setDueDate('');
        setTaskType('delivery');
        setMinutes('30');
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar Tarea" }), _jsx(DialogDescription, { children: "Asigna una tarea a una asignatura" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "subjectSelect", children: "Asignatura" }), _jsxs(Select, { value: subjectId, onValueChange: setSubjectId, children: [_jsx(SelectTrigger, { id: "subjectSelect", children: _jsx(SelectValue, { placeholder: "Seleccionar asignatura..." }) }), _jsx(SelectContent, { children: subjects.map(s => (_jsx(SelectItem, { value: s.id, children: s.name }, s.id))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "taskType", children: "Tipo de Tarea" }), _jsxs(Select, { value: taskType, onValueChange: (v) => setTaskType(v), children: [_jsx(SelectTrigger, { id: "taskType", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "delivery", children: "\uD83D\uDCC4 Tarea a Entregar" }), _jsx(SelectItem, { value: "study", children: "\uD83D\uDCDA Tiempo de Estudio" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "taskTitle", children: "T\u00EDtulo" }), _jsx(Input, { id: "taskTitle", value: title, onChange: (e) => setTitle(e.target.value), placeholder: taskType === 'delivery' ? "Ej: Resolver ejercicios Cap. 5" : "Ej: Estudiar derivadas" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "taskDescription", children: "Descripci\u00F3n (opcional)" }), _jsx(Textarea, { id: "taskDescription", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Detalles...", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "taskDate", children: "Fecha" }), _jsx(Input, { id: "taskDate", type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value) })] }), taskType === 'study' && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "taskMinutes", children: "Duraci\u00F3n (min)" }), _jsx(Input, { id: "taskMinutes", type: "number", value: minutes, onChange: (e) => setMinutes(e.target.value), min: "5" })] }))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? 'Creando...' : 'Agregar Tarea' })] })] }) }));
}
