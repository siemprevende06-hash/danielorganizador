import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutRoutine {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  workout_days: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  routine_id: string;
  name: string;
  day_of_week: string;
  target_sets: number;
  target_reps: string;
  muscle_group: string | null;
  order_index: number;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  exercise_id: string;
  user_id: string | null;
  log_date: string;
  sets_completed: number | null;
  reps_per_set: number[];
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseProgress {
  exercise: WorkoutExercise;
  initialWeight: number;
  currentWeight: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  logs: ExerciseLog[];
}

const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

export const useWorkoutTracking = () => {
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoutine = useCallback(async () => {
    const { data } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (data) {
      setRoutine({
        ...data,
        workout_days: (data.workout_days as Record<string, boolean>) || {}
      });
    }
    return data;
  }, []);

  const loadExercises = useCallback(async (routineId: string) => {
    const { data } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('routine_id', routineId)
      .order('order_index');
    
    if (data) {
      setExercises(data as WorkoutExercise[]);
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
        reps_per_set: (log.reps_per_set as number[]) || []
      })));
    }
    return data;
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const routineData = await loadRoutine();
    if (routineData) {
      await loadExercises(routineData.id);
    }
    await loadLogs();
    setIsLoading(false);
  }, [loadRoutine, loadExercises, loadLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createRoutine = async (name: string, workoutDays: Record<string, boolean>, description?: string) => {
    // Deactivate existing routines
    await supabase
      .from('workout_routines')
      .update({ is_active: false })
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('workout_routines')
      .insert({
        name,
        description,
        workout_days: workoutDays,
        is_active: true
      })
      .select()
      .single();

    if (!error && data) {
      setRoutine({
        ...data,
        workout_days: (data.workout_days as Record<string, boolean>) || {}
      });
    }
    return { data, error };
  };

  const updateRoutine = async (routineId: string, updates: Partial<WorkoutRoutine>) => {
    const { error } = await supabase
      .from('workout_routines')
      .update(updates)
      .eq('id', routineId);

    if (!error) {
      await loadRoutine();
    }
    return { error };
  };

  const addExercise = async (
    routineId: string,
    name: string,
    dayOfWeek: string,
    targetSets: number = 3,
    targetReps: string = '8-12',
    muscleGroup?: string
  ) => {
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
      setExercises(prev => [...prev, data as WorkoutExercise]);
    }
    return { data, error };
  };

  const removeExercise = async (exerciseId: string) => {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);

    if (!error) {
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    }
    return { error };
  };

  const logWorkout = async (
    exerciseId: string,
    weightKg: number,
    setsCompleted: number,
    repsPerSet: number[],
    notes?: string
  ) => {
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
        reps_per_set: (data.reps_per_set as number[]) || []
      }, ...prev]);
    }
    return { data, error };
  };

  const getExerciseProgress = useCallback((exerciseId: string): ExerciseProgress | null => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

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

    let trend: 'up' | 'down' | 'stable' = 'stable';
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

  const getAllProgress = useCallback((): ExerciseProgress[] => {
    return exercises
      .map(e => getExerciseProgress(e.id))
      .filter((p): p is ExerciseProgress => p !== null && p.logs.length > 0);
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

  const getExercisesByDay = useCallback((day: string) => {
    return exercises.filter(e => e.day_of_week === day);
  }, [exercises]);

  return {
    routine,
    exercises,
    logs,
    isLoading,
    createRoutine,
    updateRoutine,
    addExercise,
    removeExercise,
    logWorkout,
    getExerciseProgress,
    getAllProgress,
    getTodayWorkout,
    getExercisesByDay,
    reload: loadAll,
    DAY_NAMES
  };
};
