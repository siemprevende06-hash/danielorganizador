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
const examSchema = z.object({
    title: z.string().trim().min(1, "El título es requerido").max(200, "El título es muy largo"),
    exam_date: z.string().min(1, "La fecha es requerida"),
    preparation_days: z.number().min(1).max(365),
    target_study_hours: z.number().min(0).max(1000),
    target_exercises: z.number().min(0).max(10000),
    topics: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional()
});
export function AddExamDialog({ open, onOpenChange, subjectId, subjectName, subjects, onSubmit }) {
    const [title, setTitle] = useState('');
    const [examDate, setExamDate] = useState('');
    const [preparationDays, setPreparationDays] = useState('14');
    const [targetStudyHours, setTargetStudyHours] = useState('20');
    const [targetExercises, setTargetExercises] = useState('50');
    const [topics, setTopics] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId);
    const [selectedSubjectName, setSelectedSubjectName] = useState(subjectName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async () => {
        try {
            const validated = examSchema.parse({
                title,
                exam_date: examDate,
                preparation_days: parseInt(preparationDays) || 14,
                target_study_hours: parseFloat(targetStudyHours) || 20,
                target_exercises: parseInt(targetExercises) || 50,
                topics: topics || undefined,
                notes: notes || undefined
            });
            const finalSubjectId = selectedSubjectId || subjectId;
            if (!finalSubjectId) {
                toast({ variant: "destructive", title: "Error", description: "Selecciona una asignatura" });
                return;
            }
            setIsSubmitting(true);
            const success = await onSubmit({
                subject_id: finalSubjectId,
                title: validated.title,
                exam_date: validated.exam_date,
                preparation_days: validated.preparation_days,
                target_study_hours: validated.target_study_hours,
                target_exercises: validated.target_exercises,
                topics: validated.topics,
                notes: validated.notes
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
        setTitle('');
        setExamDate('');
        setPreparationDays('14');
        setTargetStudyHours('20');
        setTargetExercises('50');
        setTopics('');
        setNotes('');
        setSelectedSubjectId(subjectId);
        setSelectedSubjectName(subjectName);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar Examen" }), _jsxs(DialogDescription, { children: ["Crea un examen ", subjectName ? `para ${subjectName}` : 'para una asignatura'] })] }), _jsxs("div", { className: "space-y-4", children: [!subjectId && subjects && subjects.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "subjectSelect", children: "Asignatura" }), _jsxs(Select, { value: selectedSubjectId, onValueChange: (v) => {
                                        setSelectedSubjectId(v);
                                        setSelectedSubjectName(subjects.find(s => s.id === v)?.name || '');
                                    }, children: [_jsx(SelectTrigger, { id: "subjectSelect", children: _jsx(SelectValue, { placeholder: "Seleccionar asignatura..." }) }), _jsx(SelectContent, { children: subjects.map(s => (_jsx(SelectItem, { value: s.id, children: s.name }, s.id))) })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "T\u00EDtulo del Examen" }), _jsx(Input, { id: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Ej: Primer Parcial" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "examDate", children: "Fecha del Examen" }), _jsx(Input, { id: "examDate", type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "prepDays", children: "D\u00EDas de prep." }), _jsx(Input, { id: "prepDays", type: "number", value: preparationDays, onChange: (e) => setPreparationDays(e.target.value), min: "1" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "studyHours", children: "Horas estudio" }), _jsx(Input, { id: "studyHours", type: "number", value: targetStudyHours, onChange: (e) => setTargetStudyHours(e.target.value), min: "0" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "exercises", children: "Ejercicios" }), _jsx(Input, { id: "exercises", type: "number", value: targetExercises, onChange: (e) => setTargetExercises(e.target.value), min: "0" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "topics", children: "Temas a estudiar" }), _jsx(Textarea, { id: "topics", value: topics, onChange: (e) => setTopics(e.target.value), placeholder: "Lista los temas del examen...", rows: 2 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "notes", children: "Notas adicionales" }), _jsx(Textarea, { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Notas personales...", rows: 2 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? 'Creando...' : 'Crear Examen' })] })] }) }));
}
