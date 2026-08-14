import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
export function TodayWorkout() {
    const [exercises, setExercises] = useState([]);
    const [isGymDay, setIsGymDay] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        checkGymDay();
    }, []);
    const checkGymDay = async () => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        // Get active routine
        const { data: routine } = await supabase
            .from('workout_routines')
            .select('id, workout_days')
            .eq('is_active', true)
            .maybeSingle();
        if (!routine) {
            setLoading(false);
            return;
        }
        const workoutDays = routine.workout_days;
        if (!workoutDays[today]) {
            setLoading(false);
            return;
        }
        setIsGymDay(true);
        // Load exercises for today
        const { data: exercisesData } = await supabase
            .from('workout_exercises')
            .select('id, name, target_sets, target_reps, muscle_group')
            .eq('routine_id', routine.id)
            .eq('day_of_week', today)
            .order('order_index', { ascending: true });
        // Check if any were logged today
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase
            .from('exercise_logs')
            .select('exercise_id')
            .eq('log_date', todayStr);
        const loggedIds = new Set(logs?.map(l => l.exercise_id) || []);
        setExercises((exercisesData || []).map(e => ({
            ...e,
            completed: loggedIds.has(e.id)
        })));
        setLoading(false);
    };
    if (loading) {
        return _jsx("div", { className: "animate-pulse h-32 bg-muted rounded-lg" });
    }
    if (!isGymDay) {
        return null; // Don't show if not a gym day
    }
    const completedCount = exercises.filter(e => e.completed).length;
    return (_jsxs(Card, { className: "border-2 border-success/30 bg-success/5", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium uppercase tracking-wider", children: [_jsx(Dumbbell, { className: "w-4 h-4 text-success" }), _jsx("span", { children: "Hoy Toca Gym" })] }), _jsxs("span", { className: "text-sm font-mono text-success", children: [completedCount, "/", exercises.length] })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-2", children: exercises.map((exercise) => (_jsxs("div", { className: `flex items-center justify-between p-2 rounded ${exercise.completed ? 'bg-success/20' : 'bg-background'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [exercise.completed ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-success" })) : (_jsx(Circle, { className: "w-4 h-4 text-muted-foreground" })), _jsx("span", { className: exercise.completed ? 'line-through text-muted-foreground' : '', children: exercise.name })] }), _jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: [exercise.target_sets, "x", exercise.target_reps] })] }, exercise.id))) }), _jsx(Link, { to: "/vida-daniel", className: "block mt-3 text-center text-sm text-success hover:underline", children: "Registrar entrenamiento \u2192" })] })] }));
}
