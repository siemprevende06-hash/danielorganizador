import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import danielFlaco from '@/assets/daniel-flaco.jpg';
import danielFuerte from '@/assets/daniel-fuerte.jpg';
import { usePhysicalTracking } from '@/hooks/usePhysicalTracking';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { AddMeasurementDialog } from './AddMeasurementDialog';
import { PhysicalProgressChart } from './PhysicalProgressChart';
import { SetPhysicalGoalDialog } from './SetPhysicalGoalDialog';
import { WorkoutRoutineCard } from './WorkoutRoutineCard';
import { ExerciseProgressCard } from './ExerciseProgressCard';
import { LogWorkoutDialog } from './LogWorkoutDialog';
import { ConfigureRoutineDialog } from './ConfigureRoutineDialog';
export const PhysicalTransformation = () => {
    const { goal, measurements, isLoading, addMeasurement, createOrUpdateGoal, getStats } = usePhysicalTracking();
    const { routine, exercises, isLoading: isLoadingWorkout, createRoutine, addExercise, removeExercise, logWorkout, getAllProgress, getTodayWorkout } = useWorkoutTracking();
    const [stats, setStats] = useState({
        startWeight: 50,
        currentWeight: 50,
        targetWeight: 70,
        muscleGainTarget: 20,
        currentMuscleGain: 0,
        gymDaysThisMonth: 0,
        gymDaysTarget: 16,
        currentStreak: 0,
        trend: 'stable',
        startPhotoUrl: null,
        targetPhotoUrl: null
    });
    const [showConfigureRoutine, setShowConfigureRoutine] = useState(false);
    const [showLogWorkout, setShowLogWorkout] = useState(false);
    useEffect(() => {
        const loadStats = async () => {
            const newStats = await getStats();
            setStats(newStats);
        };
        if (!isLoading) {
            loadStats();
        }
    }, [isLoading, getStats]);
    const progress = stats.muscleGainTarget > 0
        ? Math.min(100, Math.max(0, Math.round((stats.currentMuscleGain / stats.muscleGainTarget) * 100)))
        : 0;
    const handleSaveGoal = async (goalData) => {
        await createOrUpdateGoal({
            start_weight: goalData.start_weight,
            target_weight: goalData.target_weight,
            gym_days_target: goalData.gym_days_target,
            target_date: goalData.target_date
        });
    };
    const todayWorkout = getTodayWorkout();
    const exerciseProgress = getAllProgress();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "bg-gradient-to-r from-orange-500/10 to-red-500/10", children: _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-5 w-5 text-orange-500" }), "Transformaci\u00F3n F\u00EDsica"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(SetPhysicalGoalDialog, { onSave: handleSaveGoal, currentGoal: goal ? {
                                                start_weight: goal.start_weight,
                                                target_weight: goal.target_weight,
                                                gym_days_target: goal.gym_days_target,
                                                target_date: goal.target_date || undefined
                                            } : null }), _jsx(AddMeasurementDialog, { onSave: addMeasurement })] })] }) }), _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8", children: [_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsxs("div", { className: "relative w-32 h-48 md:w-40 md:h-56 rounded-lg overflow-hidden border-2 border-muted shadow-lg", children: [_jsx("img", { src: stats.startPhotoUrl || danielFlaco, alt: "Daniel - Inicio", className: "w-full h-full object-cover object-top" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2", children: _jsx("span", { className: "text-white text-xs font-medium", children: "Inicio" }) })] }), _jsxs("span", { className: "font-medium text-muted-foreground", children: [stats.startWeight, " kg"] })] }), _jsxs("div", { className: "flex flex-col items-center gap-3 py-4 md:py-0", children: [_jsxs("div", { className: "text-3xl font-bold text-primary", children: [progress, "%"] }), _jsxs("div", { className: "relative flex items-center", children: [_jsx("div", { className: "w-24 md:w-32 h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000 ease-out", style: { width: `${progress}%` } }) }), _jsxs("div", { className: "flex items-center ml-1", children: [_jsx(ChevronRight, { className: "h-6 w-6 text-orange-500 animate-pulse", style: { animationDelay: '0ms' } }), _jsx(ChevronRight, { className: "h-6 w-6 -ml-3 text-yellow-500 animate-pulse", style: { animationDelay: '200ms' } }), _jsx(ChevronRight, { className: "h-6 w-6 -ml-3 text-green-500 animate-pulse", style: { animationDelay: '400ms' } })] })] }), _jsxs("div", { className: "text-center text-sm", children: [_jsxs("p", { className: "text-muted-foreground", children: ["Meta: +", stats.muscleGainTarget, "kg m\u00FAsculo"] }), _jsxs("p", { className: "text-primary font-semibold", children: ["Actual: +", stats.currentMuscleGain.toFixed(1), "kg"] })] })] }), _jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsxs("div", { className: "relative w-32 h-48 md:w-40 md:h-56 rounded-lg overflow-hidden border-2 border-primary shadow-lg shadow-primary/20", children: [_jsx("img", { src: stats.targetPhotoUrl || danielFuerte, alt: "Daniel - Meta", className: "w-full h-full object-cover object-top" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2", children: _jsx("span", { className: "text-white text-xs font-medium", children: "Meta \uD83C\uDFAF" }) })] }), _jsxs("span", { className: "font-medium text-primary", children: [stats.targetWeight, " kg"] })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t", children: [_jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsx(Dumbbell, { className: "h-5 w-5 mx-auto mb-1 text-orange-500" }), _jsxs("p", { className: "text-2xl font-bold", children: [stats.gymDaysThisMonth, "/", stats.gymDaysTarget] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Entrenamientos este mes" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsx(Flame, { className: "h-5 w-5 mx-auto mb-1 text-red-500" }), _jsx("p", { className: "text-2xl font-bold", children: stats.currentStreak }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Racha actual (d\u00EDas)" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsx(TrendingUp, { className: "h-5 w-5 mx-auto mb-1 text-green-500" }), _jsxs("p", { className: "text-2xl font-bold", children: [stats.currentWeight, " kg"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Peso actual" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-muted/50", children: [_jsx("div", { className: "text-lg mb-1", children: "\uD83D\uDCC8" }), _jsx("p", { className: "text-2xl font-bold", children: stats.trend === 'up' ? '↗️' : stats.trend === 'down' ? '↘️' : '➡️' }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tendencia" })] })] }), measurements.length > 0 && (_jsx("div", { className: "mt-6", children: _jsx(PhysicalProgressChart, { measurements: measurements, targetWeight: stats.targetWeight, startWeight: stats.startWeight }) }))] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsx(WorkoutRoutineCard, { routine: routine, exercises: exercises, todayWorkout: todayWorkout, onConfigureClick: () => setShowConfigureRoutine(true) }), _jsx(ExerciseProgressCard, { progress: exerciseProgress, onLogClick: () => setShowLogWorkout(true) })] }), _jsx(ConfigureRoutineDialog, { open: showConfigureRoutine, onOpenChange: setShowConfigureRoutine, currentRoutine: routine, currentExercises: exercises, onCreateRoutine: createRoutine, onAddExercise: addExercise, onRemoveExercise: removeExercise }), _jsx(LogWorkoutDialog, { open: showLogWorkout, onOpenChange: setShowLogWorkout, exercises: exercises, onLog: logWorkout })] }));
};
