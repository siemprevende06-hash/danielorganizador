import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, Settings } from 'lucide-react';
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'L',
    tuesday: 'M',
    wednesday: 'X',
    thursday: 'J',
    friday: 'V',
    saturday: 'S',
    sunday: 'D'
};
export const WorkoutRoutineCard = ({ routine, exercises, todayWorkout, onConfigureClick }) => {
    if (!routine) {
        return (_jsx(Card, { className: "border-dashed border-2 border-muted-foreground/30", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-8 gap-4", children: [_jsx(Calendar, { className: "h-12 w-12 text-muted-foreground/50" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-medium text-muted-foreground", children: "Sin rutina configurada" }), _jsx("p", { className: "text-sm text-muted-foreground/70", children: "Configura tu rutina semanal de entrenamiento" })] }), _jsxs(Button, { onClick: onConfigureClick, className: "gap-2", children: [_jsx(Settings, { className: "h-4 w-4" }), "Configurar Rutina"] })] }) }));
    }
    // Group exercises by day
    const exercisesByDay = {};
    DAYS_ORDER.forEach(day => {
        exercisesByDay[day] = exercises.filter(e => e.day_of_week === day);
    });
    // Get unique muscle groups per day for labels
    const getDayLabel = (day) => {
        const dayExercises = exercisesByDay[day];
        if (dayExercises.length === 0)
            return null;
        const groups = [...new Set(dayExercises.map(e => e.muscle_group).filter(Boolean))];
        return groups.length > 0 ? groups[0] : 'Entrenamiento';
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-primary" }), routine.name] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onConfigureClick, children: _jsx(Settings, { className: "h-4 w-4" }) })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex justify-between gap-1", children: DAYS_ORDER.map(day => {
                            const isWorkoutDay = routine.workout_days[day];
                            const label = getDayLabel(day);
                            return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: DAY_LABELS[day] }), _jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${isWorkoutDay
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'}`, children: isWorkoutDay ? '🏋️' : '⚪' }), label && (_jsx("span", { className: "text-[10px] text-muted-foreground truncate max-w-[40px]", children: label }))] }, day));
                        }) }), todayWorkout.isWorkoutDay && (_jsxs("div", { className: "bg-primary/10 rounded-lg p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-4 w-4 text-primary" }), _jsxs("span", { className: "font-medium text-sm", children: ["Hoy (", todayWorkout.dayName, ")"] })] }), todayWorkout.exercises.length > 0 ? (_jsx("ul", { className: "space-y-1", children: todayWorkout.exercises.map(exercise => (_jsxs("li", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), exercise.name, " - ", exercise.target_sets, "x", exercise.target_reps] }, exercise.id))) })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No hay ejercicios configurados para hoy" }))] })), !todayWorkout.isWorkoutDay && (_jsx("div", { className: "bg-muted/50 rounded-lg p-3 text-center", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\uD83D\uDECB\uFE0F Hoy (", todayWorkout.dayName, ") es d\u00EDa de descanso"] }) }))] })] }));
};
