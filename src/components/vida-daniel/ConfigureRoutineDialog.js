import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Calendar, Plus, Trash2, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
const DAYS = [
    { key: 'monday', label: 'Lunes', short: 'L' },
    { key: 'tuesday', label: 'Martes', short: 'M' },
    { key: 'wednesday', label: 'Miércoles', short: 'X' },
    { key: 'thursday', label: 'Jueves', short: 'J' },
    { key: 'friday', label: 'Viernes', short: 'V' },
    { key: 'saturday', label: 'Sábado', short: 'S' },
    { key: 'sunday', label: 'Domingo', short: 'D' }
];
const MUSCLE_GROUPS = [
    'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps',
    'Core', 'Glúteos', 'Cuádriceps', 'Isquiotibiales', 'Full Body'
];
export const ConfigureRoutineDialog = ({ open, onOpenChange, currentRoutine, currentExercises, onCreateRoutine, onAddExercise, onRemoveExercise }) => {
    const [routineName, setRoutineName] = useState(currentRoutine?.name || 'Mi Rutina');
    const [workoutDays, setWorkoutDays] = useState(currentRoutine?.workout_days || {});
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);
    // New exercise form
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseDay, setNewExerciseDay] = useState('');
    const [newExerciseSets, setNewExerciseSets] = useState('3');
    const [newExerciseReps, setNewExerciseReps] = useState('8-12');
    const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    useEffect(() => {
        if (currentRoutine) {
            setRoutineName(currentRoutine.name);
            setWorkoutDays(currentRoutine.workout_days);
        }
    }, [currentRoutine]);
    const toggleDay = (day) => {
        setWorkoutDays(prev => ({
            ...prev,
            [day]: !prev[day]
        }));
    };
    const handleSaveRoutine = async () => {
        if (!routineName.trim()) {
            toast.error('Ingresa un nombre para la rutina');
            return;
        }
        setIsSavingRoutine(true);
        try {
            const { error } = await onCreateRoutine(routineName, workoutDays);
            if (error)
                throw error;
            toast.success('Rutina guardada');
        }
        catch (error) {
            toast.error('Error al guardar rutina');
        }
        finally {
            setIsSavingRoutine(false);
        }
    };
    const handleAddExercise = async () => {
        if (!currentRoutine) {
            toast.error('Primero guarda la rutina');
            return;
        }
        if (!newExerciseName.trim() || !newExerciseDay) {
            toast.error('Completa nombre y día del ejercicio');
            return;
        }
        setIsAddingExercise(true);
        try {
            const { error } = await onAddExercise(currentRoutine.id, newExerciseName, newExerciseDay, parseInt(newExerciseSets) || 3, newExerciseReps || '8-12', newExerciseMuscle || undefined);
            if (error)
                throw error;
            toast.success('Ejercicio agregado');
            setNewExerciseName('');
            setNewExerciseDay('');
            setNewExerciseSets('3');
            setNewExerciseReps('8-12');
            setNewExerciseMuscle('');
        }
        catch (error) {
            toast.error('Error al agregar ejercicio');
        }
        finally {
            setIsAddingExercise(false);
        }
    };
    const handleRemoveExercise = async (exerciseId) => {
        try {
            const { error } = await onRemoveExercise(exerciseId);
            if (error)
                throw error;
            toast.success('Ejercicio eliminado');
        }
        catch (error) {
            toast.error('Error al eliminar');
        }
    };
    // Group exercises by day
    const exercisesByDay = {};
    DAYS.forEach(day => {
        exercisesByDay[day.key] = currentExercises.filter(e => e.day_of_week === day.key);
    });
    const activeDays = DAYS.filter(d => workoutDays[d.key]);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), "Configurar Rutina"] }) }), _jsxs("div", { className: "space-y-6 pt-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Nombre de la Rutina" }), _jsx(Input, { value: routineName, onChange: (e) => setRoutineName(e.target.value), placeholder: "Ej: Push/Pull/Legs" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "D\u00EDas de Entrenamiento" }), _jsx("div", { className: "flex gap-2 flex-wrap", children: DAYS.map(day => (_jsx(Button, { type: "button", variant: workoutDays[day.key] ? 'default' : 'outline', size: "sm", onClick: () => toggleDay(day.key), className: "w-10 h-10", children: day.short }, day.key))) })] }), _jsx(Button, { onClick: handleSaveRoutine, disabled: isSavingRoutine, className: "w-full", children: isSavingRoutine ? 'Guardando...' : currentRoutine ? 'Actualizar Rutina' : 'Crear Rutina' }), currentRoutine && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "border-t pt-4", children: [_jsxs("h3", { className: "font-medium mb-3 flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-4 w-4" }), "Agregar Ejercicio"] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("div", { className: "col-span-2", children: _jsx(Input, { value: newExerciseName, onChange: (e) => setNewExerciseName(e.target.value), placeholder: "Nombre del ejercicio" }) }), _jsxs(Select, { value: newExerciseDay, onValueChange: setNewExerciseDay, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "D\u00EDa" }) }), _jsx(SelectContent, { children: activeDays.map(day => (_jsx(SelectItem, { value: day.key, children: day.label }, day.key))) })] }), _jsxs(Select, { value: newExerciseMuscle, onValueChange: setNewExerciseMuscle, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "M\u00FAsculo" }) }), _jsx(SelectContent, { children: MUSCLE_GROUPS.map(group => (_jsx(SelectItem, { value: group, children: group }, group))) })] }), _jsx(Input, { value: newExerciseSets, onChange: (e) => setNewExerciseSets(e.target.value), placeholder: "Series", type: "number" }), _jsx(Input, { value: newExerciseReps, onChange: (e) => setNewExerciseReps(e.target.value), placeholder: "Reps (ej: 8-12)" })] }), _jsxs(Button, { onClick: handleAddExercise, disabled: isAddingExercise, className: "w-full mt-3 gap-2", variant: "outline", children: [_jsx(Plus, { className: "h-4 w-4" }), "Agregar Ejercicio"] })] }), activeDays.map(day => {
                                    const dayExercises = exercisesByDay[day.key];
                                    if (dayExercises.length === 0)
                                        return null;
                                    return (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground", children: day.label }), _jsx("div", { className: "space-y-1", children: dayExercises.map(exercise => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: exercise.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [exercise.target_sets, "x", exercise.target_reps, " \u2022 ", exercise.muscle_group || 'Sin grupo'] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleRemoveExercise(exercise.id), className: "h-8 w-8 p-0 text-destructive hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, exercise.id))) })] }, day.key));
                                })] }))] })] }) }));
};
