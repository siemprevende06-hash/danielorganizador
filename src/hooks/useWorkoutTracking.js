import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
const DAY_NAMES = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
};
export const useWorkoutTracking = () => {
    const [routine, setRoutine] = useState(null);
    const [allRoutines, setAllRoutines] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const loadRoutine = useCallback(async (tipo) => {
        let query = supabase
            .from('workout_routines')
            .select('*')
            .eq('is_active', true);
        if (tipo) {
            query = query.eq('tipo', tipo);
        }
        const { data } = await query
            .limit(1)
            .single();
        if (data) {
            setRoutine({
                ...data,
                workout_days: data.workout_days || {}
            });
        }
        else {
            setRoutine(null);
        }
        return data;
    }, []);
    const loadAllRoutines = useCallback(async (tipo) => {
        let query = supabase
            .from('workout_routines')
            .select('*')
            .order('created_at', { ascending: false });
        if (tipo) {
            query = query.eq('tipo', tipo);
        }
        const { data } = await query;
        if (data) {
            setAllRoutines(data.map(r => ({
                ...r,
                workout_days: r.workout_days || {}
            })));
        }
        return data;
    }, []);
    const loadExercises = useCallback(async (routineId) => {
        const { data } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('routine_id', routineId)
            .order('order_index');
        if (data) {
            setExercises(data);
        }
        return data;
    }, []);
    const loadLogs = useCallback(async () => {
        const { data } = await supabase
            .from('exercise_logs')
            .select('*')
            .order('log_date', { ascending: false })
            .limit(500);
        if (data) {
            setLogs(data.map(log => ({
                ...log,
                reps_per_set: log.reps_per_set || []
            })));
        }
        return data;
    }, []);
    const loadAll = useCallback(async (tipo) => {
        setIsLoading(true);
        const routineData = await loadRoutine(tipo);
        if (routineData) {
            await loadExercises(routineData.id);
        }
        await loadLogs();
        await loadAllRoutines(tipo);
        setIsLoading(false);
    }, [loadRoutine, loadExercises, loadLogs, loadAllRoutines]);
    useEffect(() => {
        loadAll();
    }, [loadAll]);
    const selectRoutine = useCallback(async (routineId) => {
        await supabase
            .from('workout_routines')
            .update({ is_active: false })
            .eq('is_active', true);
        await supabase
            .from('workout_routines')
            .update({ is_active: true })
            .eq('id', routineId);
        const { data } = await supabase
            .from('workout_routines')
            .select('*')
            .eq('id', routineId)
            .single();
        if (data) {
            setRoutine({
                ...data,
                workout_days: data.workout_days || {}
            });
            await loadExercises(data.id);
        }
    }, [loadExercises]);
    const createRoutine = async (name, workoutDays, tipo = 'gimnasio', description) => {
        // Deactivate existing routines of same type
        await supabase
            .from('workout_routines')
            .update({ is_active: false })
            .eq('is_active', true)
            .eq('tipo', tipo);
        const { data, error } = await supabase
            .from('workout_routines')
            .insert({
            name,
            description,
            workout_days: workoutDays,
            is_active: true,
            tipo
        })
            .select()
            .single();
        if (!error && data) {
            setRoutine({
                ...data,
                workout_days: data.workout_days || {}
            });
            setAllRoutines(prev => [{ ...data, workout_days: data.workout_days || {} }, ...prev]);
        }
        return { data, error };
    };
    const updateRoutine = async (routineId, updates) => {
        const { error } = await supabase
            .from('workout_routines')
            .update(updates)
            .eq('id', routineId);
        if (!error) {
            await loadRoutine();
        }
        return { error };
    };
    const addExercise = async (routineId, name, dayOfWeek, targetSets = 3, targetReps = '8-12', muscleGroup) => {
        const { data, error } = await supabase
            .from('workout_exercises')
            .insert({
            routine_id: routineId,
            name,
            day_of_week: dayOfWeek,
            target_sets: targetSets,
            target_reps: targetReps,
            muscle_group: muscleGroup,
            order_index: exercises.filter(e => e.day_of_week === dayOfWeek).length
        })
            .select()
            .single();
        if (!error && data) {
            setExercises(prev => [...prev, data]);
        }
        return { data, error };
    };
    const removeExercise = async (exerciseId) => {
        const { error } = await supabase
            .from('workout_exercises')
            .delete()
            .eq('id', exerciseId);
        if (!error) {
            setExercises(prev => prev.filter(e => e.id !== exerciseId));
        }
        return { error };
    };
    const logWorkout = async (exerciseId, weightKg, setsCompleted, repsPerSet, notes) => {
        const { data, error } = await supabase
            .from('exercise_logs')
            .insert({
            exercise_id: exerciseId,
            weight_kg: weightKg,
            sets_completed: setsCompleted,
            reps_per_set: repsPerSet,
            notes,
            log_date: new Date().toISOString().split('T')[0]
        })
            .select()
            .single();
        if (!error && data) {
            setLogs(prev => [{
                    ...data,
                    reps_per_set: data.reps_per_set || []
                }, ...prev]);
        }
        return { data, error };
    };
    const getExerciseProgress = useCallback((exerciseId) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        if (!exercise)
            return null;
        const exerciseLogs = logs
            .filter(l => l.exercise_id === exerciseId && l.weight_kg)
            .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
        if (exerciseLogs.length === 0) {
            return {
                exercise,
                initialWeight: 0,
                currentWeight: 0,
                changePercent: 0,
                trend: 'stable',
                logs: []
            };
        }
        const initialWeight = exerciseLogs[0].weight_kg || 0;
        const currentWeight = exerciseLogs[exerciseLogs.length - 1].weight_kg || 0;
        const changePercent = initialWeight > 0
            ? Math.round(((currentWeight - initialWeight) / initialWeight) * 100)
            : 0;
        let trend = 'stable';
        if (exerciseLogs.length >= 2) {
            const lastTwo = exerciseLogs.slice(-2);
            const prev = lastTwo[0].weight_kg || 0;
            const curr = lastTwo[1].weight_kg || 0;
            trend = curr > prev ? 'up' : curr < prev ? 'down' : 'stable';
        }
        return {
            exercise,
            initialWeight,
            currentWeight,
            changePercent,
            trend,
            logs: exerciseLogs
        };
    }, [exercises, logs]);
    const getAllProgress = useCallback(() => {
        return exercises
            .map(e => getExerciseProgress(e.id))
            .filter((p) => p !== null && p.logs.length > 0);
    }, [exercises, getExerciseProgress]);
    const getTodayWorkout = useCallback(() => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const isWorkoutDay = routine?.workout_days[today] || false;
        const todayExercises = exercises.filter(e => e.day_of_week === today);
        return {
            dayName: DAY_NAMES[today],
            isWorkoutDay,
            exercises: todayExercises
        };
    }, [routine, exercises]);
    const getExercisesByDay = useCallback((day) => {
        return exercises.filter(e => e.day_of_week === day);
    }, [exercises]);
    return {
        routine,
        allRoutines,
        exercises,
        logs,
        isLoading,
        createRoutine,
        updateRoutine,
        selectRoutine,
        addExercise,
        removeExercise,
        logWorkout,
        getExerciseProgress,
        getAllProgress,
        getTodayWorkout,
        getExercisesByDay,
        loadAllRoutines,
        reload: loadAll,
        DAY_NAMES
    };
};
