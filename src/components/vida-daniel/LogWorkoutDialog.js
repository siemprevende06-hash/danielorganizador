import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dumbbell, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
export const LogWorkoutDialog = ({ open, onOpenChange, exercises, onLog }) => {
    const [selectedExercise, setSelectedExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState(['']);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const handleAddSet = () => {
        setReps([...reps, '']);
    };
    const handleRemoveSet = (index) => {
        if (reps.length > 1) {
            setReps(reps.filter((_, i) => i !== index));
        }
    };
    const handleRepChange = (index, value) => {
        const newReps = [...reps];
        newReps[index] = value;
        setReps(newReps);
    };
    const handleSave = async () => {
        if (!selectedExercise) {
            toast.error('Selecciona un ejercicio');
            return;
        }
        const weightKg = parseFloat(weight);
        if (isNaN(weightKg) || weightKg <= 0) {
            toast.error('Ingresa un peso válido');
            return;
        }
        const repsPerSet = reps.map(r => parseInt(r) || 0).filter(r => r > 0);
        if (repsPerSet.length === 0) {
            toast.error('Ingresa al menos una serie con repeticiones');
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await onLog(selectedExercise, weightKg, repsPerSet.length, repsPerSet, notes || undefined);
            if (error)
                throw error;
            toast.success('Entrenamiento registrado');
            onOpenChange(false);
            // Reset form
            setSelectedExercise('');
            setWeight('');
            setReps(['']);
            setNotes('');
        }
        catch (error) {
            toast.error('Error al registrar');
        }
        finally {
            setIsSaving(false);
        }
    };
    const selectedExerciseData = exercises.find(e => e.id === selectedExercise);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-5 w-5 text-primary" }), "Registrar Entrenamiento"] }) }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Ejercicio" }), _jsxs(Select, { value: selectedExercise, onValueChange: setSelectedExercise, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona ejercicio" }) }), _jsx(SelectContent, { children: exercises.map(exercise => (_jsxs(SelectItem, { value: exercise.id, children: [exercise.name, " (", exercise.muscle_group || 'Sin grupo', ")"] }, exercise.id))) })] }), selectedExerciseData && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Objetivo: ", selectedExerciseData.target_sets, "x", selectedExerciseData.target_reps] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Peso (kg)" }), _jsx(Input, { type: "number", step: "0.5", value: weight, onChange: (e) => setWeight(e.target.value), placeholder: "Ej: 20" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { children: "Series (repeticiones por serie)" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: handleAddSet, className: "h-7 gap-1", children: [_jsx(Plus, { className: "h-3 w-3" }), "Serie"] })] }), _jsx("div", { className: "space-y-2", children: reps.map((rep, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-muted-foreground w-12", children: ["Serie ", index + 1, ":"] }), _jsx(Input, { type: "number", value: rep, onChange: (e) => handleRepChange(index, e.target.value), placeholder: "Reps", className: "flex-1" }), reps.length > 1 && (_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => handleRemoveSet(index), className: "h-8 w-8 p-0", children: _jsx(X, { className: "h-4 w-4" }) }))] }, index))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Notas (opcional)" }), _jsx(Textarea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Sensaciones, dificultad, etc.", rows: 2 })] }), _jsx(Button, { onClick: handleSave, className: "w-full", disabled: isSaving, children: isSaving ? 'Guardando...' : 'Registrar' })] })] }) }));
};
