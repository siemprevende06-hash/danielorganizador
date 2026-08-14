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
export const computeSessionSummary = (session, exercises) => {
    const exerciseNameById = new Map(exercises.map(e => [e.id, e.name]));
    const byExercise = new Map();
    let totalReps = 0;
    let setCount = 0;
    let totalVolumeKg = 0;
    for (const log of session.exercise_logs || []) {
        const reps = Array.isArray(log.reps_per_set) ? log.reps_per_set.filter(r => typeof r === 'number' && !isNaN(r)) : [];
        const weights = Array.isArray(log.weights_per_set) && log.weights_per_set.length === reps.length && reps.length > 0
            ? log.weights_per_set
            : reps.map(() => Number(log.weight_kg) || 0);
        const volume = reps.reduce((sum, r, i) => sum + r * (weights[i] || 0), 0);
        totalVolumeKg += volume;
        setCount += reps.length;
        totalReps += reps.reduce((a, b) => a + b, 0);
        const name = exerciseNameById.get(log.exercise_id) || 'Ejercicio';
        const entry = byExercise.get(log.exercise_id) || { name, sets: 0, reps: [], volumeKg: 0 };
        entry.sets += reps.length;
        entry.reps = [...entry.reps, ...reps];
        entry.volumeKg += volume;
        byExercise.set(log.exercise_id, entry);
    }
    return {
        id: session.id,
        started_at: session.started_at,
        duration_minutes: session.duration_minutes,
        tipo: session.tipo,
        exerciseCount: byExercise.size,
        setCount,
        totalReps,
        totalVolumeKg,
        exercises: Array.from(byExercise.values())
    };
};
export const useWorkoutTracking = () => {
    const [routine, setRoutine] = useState(null);
    const [allRoutines, setAllRoutines] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
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
                reps_per_set: log.reps_per_set || [],
                weights_per_set: log.weights_per_set || []
            })));
        }
        return data;
    }, []);
    const loadSessions = useCallback(async () => {
        const { data } = await supabase
            .from('workout_sessions')
            .select('*, exercise_logs(*)')
            .order('started_at', { ascending: false })
            .limit(60);
        if (data) {
            setSessions(data.map(s => ({
                ...s,
                exercise_logs: (s.exercise_logs || []).map(l => ({
                    ...l,
                    reps_per_set: l.reps_per_set || [],
                    weights_per_set: l.weights_per_set || []
                }))
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
        await loadSessions();
        await loadAllRoutines(tipo);
        setIsLoading(false);
    }, [loadRoutine, loadExercises, loadLogs, loadSessions, loadAllRoutines]);
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
    const logWorkout = async (exerciseId, weightKg, setsCompleted, repsPerSet, notes, sessionId, weightsPerSet) => {
        const { data, error } = await supabase
            .from('exercise_logs')
            .insert({
            exercise_id: exerciseId,
            weight_kg: weightKg,
            sets_completed: setsCompleted,
            reps_per_set: repsPerSet,
            weights_per_set: weightsPerSet || [],
            notes,
            session_id: sessionId || null,
            log_date: new Date().toISOString().split('T')[0]
        })
            .select()
            .single();
        if (!error && data) {
            setLogs(prev => [{
                    ...data,
                    reps_per_set: data.reps_per_set || [],
                    weights_per_set: data.weights_per_set || []
                }, ...prev]);
        }
        return { data, error };
    };
    const startSession = async (routineId, tipo = 'gimnasio') => {
        const { data, error } = await supabase
            .from('workout_sessions')
            .insert({
            routine_id: routineId,
            tipo,
            started_at: new Date().toISOString()
        })
            .select()
            .single();
        if (!error && data) {
            setSessions(prev => [{
                    ...data,
                    exercise_logs: []
                }, ...prev]);
        }
        return { data, error };
    };
    const finishSession = async (sessionId, durationMinutes) => {
        const { error } = await supabase
            .from('workout_sessions')
            .update({
            ended_at: new Date().toISOString(),
            duration_minutes: Math.max(1, Math.round(durationMinutes))
        })
            .eq('id', sessionId);
        if (!error) {
            setSessions(prev => prev.map(s => s.id === sessionId
                ? { ...s, ended_at: new Date().toISOString(), duration_minutes: Math.max(1, Math.round(durationMinutes)) }
                : s));
        }
        return { error };
    };
    const syncWorkoutDuration = async (minutes) => {
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('daily_systems_tracking')
            .select('*')
            .eq('tracking_date', today)
            .maybeSingle();
        const base = existing || {
            tracking_date: today,
            completions: {},
            time_data: {},
            count_data: {},
            water_data: {},
            block_completions: {},
            skipped: {},
            active_focus_areas: ['universidad', 'emprendimiento', 'proyectos']
        };
        await supabase
            .from('daily_systems_tracking')
            .upsert({
            ...base,
            workout_duration: minutes,
            workout_intensity: base.workout_intensity || 'moderate',
            completions: { ...(base.completions || {}), 'entrenamiento-fisico': true },
            time_data: { ...(base.time_data || {}), 'entrenamiento-fisico': minutes }
        }, { onConflict: 'tracking_date' });
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
        sessions,
        isLoading,
        createRoutine,
        updateRoutine,
        selectRoutine,
        addExercise,
        removeExercise,
        logWorkout,
        startSession,
        finishSession,
        syncWorkoutDuration,
        loadSessions,
        getExerciseProgress,
        getAllProgress,
        getTodayWorkout,
        getExercisesByDay,
        loadAllRoutines,
        reload: loadAll,
        DAY_NAMES
    };
};