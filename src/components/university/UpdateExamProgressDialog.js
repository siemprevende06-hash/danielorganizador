import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export function UpdateExamProgressDialog({ open, onOpenChange, exam, onSubmit }) {
    const [addHours, setAddHours] = useState('');
    const [addExercises, setAddExercises] = useState('');
    const [status, setStatus] = useState('pending');
    const [grade, setGrade] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (exam) {
            setStatus(exam.status);
            setGrade(exam.grade?.toString() || '');
            setAddHours('');
            setAddExercises('');
        }
    }, [exam]);
    const handleSubmit = async () => {
        if (!exam)
            return;
        setIsSubmitting(true);
        try {
            const hoursToAdd = parseFloat(addHours) || 0;
            const exercisesToAdd = parseInt(addExercises) || 0;
            const updateData = {};
            if (hoursToAdd > 0) {
                updateData.current_study_hours = exam.current_study_hours + hoursToAdd;
            }
            if (exercisesToAdd > 0) {
                updateData.current_exercises = exam.current_exercises + exercisesToAdd;
            }
            if (status !== exam.status) {
                updateData.status = status;
            }
            if (grade && parseFloat(grade) !== exam.grade) {
                updateData.grade = parseFloat(grade);
            }
            if (Object.keys(updateData).length > 0) {
                const success = await onSubmit(exam.id, updateData);
                if (success) {
                    onOpenChange(false);
                }
            }
            else {
                onOpenChange(false);
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!exam)
        return null;
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Actualizar Progreso" }), _jsx(DialogDescription, { children: exam.title })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "addHours", children: "+ Horas estudiadas" }), _jsx(Input, { id: "addHours", type: "number", value: addHours, onChange: (e) => setAddHours(e.target.value), placeholder: "0", min: "0", step: "0.5" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Actual: ", exam.current_study_hours, "/", exam.target_study_hours, "h"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "addExercises", children: "+ Ejercicios" }), _jsx(Input, { id: "addExercises", type: "number", value: addExercises, onChange: (e) => setAddExercises(e.target.value), placeholder: "0", min: "0" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Actual: ", exam.current_exercises, "/", exam.target_exercises] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Estado" }), _jsxs(Select, { value: status, onValueChange: setStatus, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pending", children: "Pendiente" }), _jsx(SelectItem, { value: "completed", children: "Completado" }), _jsx(SelectItem, { value: "passed", children: "Aprobado" }), _jsx(SelectItem, { value: "failed", children: "Reprobado" })] })] })] }), (status === 'passed' || status === 'failed') && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "grade", children: "Nota obtenida" }), _jsx(Input, { id: "grade", type: "number", value: grade, onChange: (e) => setGrade(e.target.value), placeholder: "0-100", min: "0", max: "100" })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? 'Guardando...' : 'Guardar' })] })] }) }));
}
